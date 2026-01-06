
import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { Task, Program, Editor, FilterState, WorkspaceSettings, Activity } from './types';
import Sidebar from './components/Sidebar';
import MobileNav from './components/MobileNav';
import Header from './components/Header';
import CalendarView from './components/CalendarView';
import TaskModal from './components/TaskModal';
import FilterBar from './components/FilterBar';
import MemberManager from './components/MemberManager';
import ProgramManager from './components/ProgramManager';
import SettingsView from './components/SettingsView';
import StatsView from './components/StatsView';
import CollaborationModal from './components/CollaborationModal';
import { SHOWS, EDITORS, EDITOR_COLORS } from './constants';

const App: React.FC = () => {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [workspaceId, setWorkspaceId] = useState(() => localStorage.getItem('tp_workspace_id') || "TWP_DEV_01");
  
  const [tasks, setTasks] = useState<Task[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [editors, setEditors] = useState<Editor[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [importCount, setImportCount] = useState<number | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);

  const [settings, setSettings] = useState<WorkspaceSettings>(() => {
    const saved = localStorage.getItem(`settings_${workspaceId}`);
    return saved ? JSON.parse(saved) : {
      id: workspaceId,
      companyName: 'TaiwanPlus',
      workingDays: [1,2,3,4,5],
      syncStatus: 'synced',
      lastSyncedAt: new Date().toISOString(),
      googleSheetId: '1FWZXvZjghfOjT8JkW-SGZMrLCP3oyI7K3I71kEUmc1w'
    };
  });

  const isSyncing = useRef(false);

  // --- 超強日期正規化：支援 2026/1/1, 26/1/1, 2026.01.01 等 ---
  const normalizeDate = (dateStr: string): string => {
    if (!dateStr) return '';
    const pureDate = dateStr.trim().split(/\s+/)[0];
    const parts = pureDate.split(/[\/\-.]/);
    
    if (parts.length === 3) {
      let y = parts[0];
      let m = parts[1];
      let d = parts[2];
      
      // 處理年份只有兩位數的情況 (例如 26/1/1 -> 2026/1/1)
      if (y.length === 2) y = "20" + y;
      
      // 處理 DD/MM/YYYY 的情況
      if (y.length !== 4 && d.length === 4) {
        [y, d] = [d, y];
      }
      
      if (y.length === 4) {
        return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
      }
    }
    return dateStr;
  };

  const parseCSV = (csv: string): any[] => {
    const lines = csv.split(/\r?\n/).filter(line => line.trim());
    if (lines.length < 2) return [];

    const splitLine = (text: string) => {
      const result = [];
      let cur = '';
      let inQuotes = false;
      for (let i = 0; i < text.length; i++) {
        const char = text[i];
        if (char === '"') inQuotes = !inQuotes;
        else if (char === ',' && !inQuotes) {
          result.push(cur.trim());
          cur = '';
        } else cur += char;
      }
      result.push(cur.trim());
      return result.map(v => v.replace(/^"|"$/g, '').replace(/""/g, '"'));
    };

    const headers = splitLine(lines[0]).map(h => h.trim().replace(/^\uFEFF/, ''));
    return lines.slice(1).map(line => {
      const values = splitLine(line);
      const obj: any = {};
      headers.forEach((header, i) => {
        if (header) obj[header] = values[i] || '';
      });
      return obj;
    });
  };

  const importFromGoogleSheets = useCallback(async (sheetId: string) => {
    if (!sheetId || isSyncing.current) return;
    isSyncing.current = true;
    setSyncError(null);
    setSettings(prev => ({ ...prev, syncStatus: 'syncing' }));
    
    try {
      const url = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=0&t=${Date.now()}`;
      const response = await fetch(url);
      
      if (response.status === 404) {
        throw new Error("找不到試算表。請確認 ID 是否正確，且該表單已執行「發佈到網路」。");
      }
      if (!response.ok) throw new Error("同步失敗，請檢查網路連線。");
      
      const csvData = await response.text();
      const rawRows = parseCSV(csvData);
      
      if (rawRows.length === 0) {
        setImportCount(0);
        setSettings(prev => ({ ...prev, syncStatus: 'synced', lastSyncedAt: new Date().toISOString() }));
        return false;
      }

      const mappedTasks: Task[] = rawRows.map((row, idx) => {
        const getCol = (names: string[]) => {
          const key = Object.keys(row).find(k => names.some(n => k.trim().toLowerCase() === n.toLowerCase()));
          return key ? row[key] : null;
        };

        const id = getCol(['ID', 'id']) || `gs_${idx}_${Date.now()}`;
        const show = getCol(['節目', 'Show', '節目名稱']) || 'Unknown';
        const episode = getCol(['集數', 'Episode', '集數識別']) || 'N/A';
        const editor = getCol(['剪輯師', 'Editor', '負責人']) || 'James';
        const startDateRaw = getCol(['開始日', 'StartDate', '開始日期', '日期']) || '';
        const endDateRaw = getCol(['交播日', 'EndDate', '交播日期', '完成日期']) || '';
        const notes = getCol(['備註', 'Notes', '說明']) || '';

        return {
          id,
          show,
          episode,
          editor,
          startDate: normalizeDate(startDateRaw),
          endDate: normalizeDate(endDateRaw),
          notes,
          lastEditedAt: new Date().toISOString(),
          version: 1
        };
      });

      setTasks(mappedTasks);
      setImportCount(mappedTasks.length);
      setSettings(prev => ({ ...prev, syncStatus: 'synced', lastSyncedAt: new Date().toISOString() }));
      
      const cloudKey = `cloud_db_${workspaceId}`;
      localStorage.setItem(cloudKey, JSON.stringify({
        tasks: mappedTasks,
        lastSyncedAt: new Date().toISOString()
      }));

      return true;
    } catch (e: any) {
      console.error("Sheet Sync Failed", e);
      setSyncError(e.message);
      setSettings(prev => ({ ...prev, syncStatus: 'error' }));
      return false;
    } finally {
      isSyncing.current = false;
    }
  }, [workspaceId]);

  useEffect(() => {
    const cloudKey = `cloud_db_${workspaceId}`;
    const savedData = localStorage.getItem(cloudKey);
    setPrograms(SHOWS.map(s => ({ id: s, name: s, updatedAt: new Date().toISOString(), priority: 'Medium', duration: '24:00', description: '' })));
    setEditors(EDITORS.map(e => ({ id: e, name: e, color: EDITOR_COLORS[e], updatedAt: new Date().toISOString(), role: 'Editor', notes: '' })));

    if (savedData) {
      const parsed = JSON.parse(savedData);
      setTasks(parsed.tasks || []);
      if (parsed.tasks) setImportCount(parsed.tasks.length);
    }

    if (settings.googleSheetId) {
      importFromGoogleSheets(settings.googleSheetId);
    }
  }, [workspaceId]);

  useEffect(() => {
    localStorage.setItem(`settings_${workspaceId}`, JSON.stringify(settings));
  }, [settings, workspaceId]);

  const [currentView, setCurrentView] = useState('calendar');
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<FilterState>({ shows: [], editors: [] });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCollabOpen, setIsCollabOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      const showMatch = filters.shows.length === 0 || filters.shows.includes(task.show);
      const editorMatch = filters.editors.length === 0 || filters.editors.includes(task.editor);
      const searchStr = `${task.show} ${task.episode} ${task.editor}`.toLowerCase();
      const searchMatch = !searchTerm || searchStr.includes(searchTerm.toLowerCase());
      return showMatch && editorMatch && searchMatch;
    });
  }, [tasks, filters, searchTerm]);

  return (
    <div className={`flex ${isMobile ? 'flex-col' : 'flex-row'} h-full bg-slate-50 text-slate-800 overflow-hidden`}>
      {!isMobile && (
        <Sidebar 
          onAddTask={() => { setEditingTask(null); setIsModalOpen(true); }} 
          insights=""
          currentView={currentView}
          setCurrentView={setCurrentView}
        />
      )}
      
      <main className="flex-1 flex flex-col min-w-0 h-full relative overflow-hidden">
        <Header 
          companyName={settings.companyName} 
          isMobile={isMobile} 
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          activities={activities}
          onAddTask={() => { setEditingTask(null); setIsModalOpen(true); }}
          onOpenCollab={() => setIsCollabOpen(true)}
          editors={editors}
          syncStatus={settings.syncStatus}
          lastSyncedAt={settings.lastSyncedAt}
          onRefresh={() => importFromGoogleSheets(settings.googleSheetId || '')}
          importCount={importCount}
          syncError={syncError}
        />
        
        <div className={`${isMobile ? 'px-2 pb-20' : 'px-8 pb-8'} flex-1 overflow-hidden flex flex-col`}>
          {currentView === 'calendar' && (
            <FilterBar filters={filters} setFilters={setFilters} programs={programs} editors={editors} isMobile={isMobile} />
          )}
          <div className={`flex-1 bg-white ${isMobile ? 'rounded-xl' : 'rounded-[32px]'} border border-slate-200 overflow-hidden flex flex-col shadow-sm relative`}>
            {(() => {
              switch(currentView) {
                case 'calendar': return <CalendarView tasks={filteredTasks} onEditTask={(t) => { setEditingTask(t); setIsModalOpen(true); }} editors={editors} isMobile={isMobile} />;
                case 'stats': return <StatsView tasks={tasks} editors={editors} programs={programs} />;
                case 'team': return <MemberManager editors={editors} setEditors={setEditors} tasks={tasks} setTasks={setTasks} />;
                case 'programs': return <ProgramManager programs={programs} setPrograms={setPrograms} tasks={tasks} setTasks={setTasks} />;
                case 'settings': return (
                  <SettingsView 
                    settings={settings} 
                    setSettings={setSettings} 
                    tasks={tasks} 
                    setTasks={setTasks} 
                    programs={programs} 
                    setPrograms={setPrograms} 
                    editors={editors} 
                    setEditors={setEditors} 
                    onReset={() => { localStorage.clear(); window.location.reload(); }}
                    onSyncGoogleSheets={importFromGoogleSheets}
                  />
                );
                default: return null;
              }
            })()}
          </div>
        </div>
        
        {isMobile && <MobileNav currentView={currentView} setCurrentView={setCurrentView} />}
      </main>

      {isModalOpen && (
        <TaskModal
          task={editingTask}
          programs={programs}
          editors={editors}
          isMobile={isMobile}
          onClose={() => { setEditingTask(null); setIsModalOpen(false); }}
          onSave={(t) => {
            const next = t.id && !t.id.startsWith('gs_') ? tasks.map(x => x.id === t.id ? t : x) : [...tasks, { ...t, id: Date.now().toString() }];
            setTasks(next);
            const cloudKey = `cloud_db_${workspaceId}`;
            localStorage.setItem(cloudKey, JSON.stringify({ tasks: next }));
            setIsModalOpen(false);
          }}
          onDelete={(id) => {
            const next = tasks.filter(t => t.id !== id);
            setTasks(next);
            const cloudKey = `cloud_db_${workspaceId}`;
            localStorage.setItem(cloudKey, JSON.stringify({ tasks: next }));
            setIsModalOpen(false);
          }}
        />
      )}

      {isCollabOpen && (
        <CollaborationModal 
          workspaceId={workspaceId} 
          onClose={() => setIsCollabOpen(false)} 
          onJoinWorkspace={(id) => { 
            setWorkspaceId(id); 
            localStorage.setItem('tp_workspace_id', id);
            window.location.reload(); 
          }}
        />
      )}
    </div>
  );
};

export default App;
