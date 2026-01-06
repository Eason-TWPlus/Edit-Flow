
import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { Task, Program, Editor, FilterState, WorkspaceSettings, Activity } from './types.ts';
import Sidebar from './components/Sidebar.tsx';
import MobileNav from './components/MobileNav.tsx';
import Header from './components/Header.tsx';
import CalendarView from './components/CalendarView.tsx';
import TaskModal from './components/TaskModal.tsx';
import FilterBar from './components/FilterBar.tsx';
import MemberManager from './components/MemberManager.tsx';
import ProgramManager from './components/ProgramManager.tsx';
import SettingsView from './components/SettingsView.tsx';
import StatsView from './components/StatsView.tsx';
import { SHOWS, EDITORS, EDITOR_COLORS } from './constants.tsx';

const App: React.FC = () => {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const workspaceId = "TWP_PRO_01";
  
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

  const normalizeDate = (dateStr: string): string => {
    if (!dateStr) return '';
    const pureDate = dateStr.trim().split(/\s+/)[0];
    const parts = pureDate.split(/[\/\-.]/);
    if (parts.length === 3) {
      let y = parts[0], m = parts[1], d = parts[2];
      if (y.length === 2) y = "20" + y;
      if (y.length !== 4 && d.length === 4) [y, d] = [d, y];
      if (y.length === 4) return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
    }
    return dateStr;
  };

  const importFromGoogleSheets = useCallback(async (sheetId: string) => {
    if (!sheetId || isSyncing.current) return;
    isSyncing.current = true;
    setSyncError(null);
    setSettings(prev => ({ ...prev, syncStatus: 'syncing' }));
    
    try {
      const url = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=0&t=${Date.now()}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error("同步失敗，請確認試算表 ID 並設為「發佈到網路」。");
      
      const csvData = await response.text();
      const lines = csvData.split(/\r?\n/).filter(line => line.trim());
      if (lines.length < 2) throw new Error("試算表內無有效資料。");

      const splitLine = (text: string) => {
        const result = [];
        let cur = '', inQuotes = false;
        for (let i = 0; i < text.length; i++) {
          const char = text[i];
          if (char === '"') inQuotes = !inQuotes;
          else if (char === ',' && !inQuotes) { result.push(cur.trim()); cur = ''; }
          else cur += char;
        }
        result.push(cur.trim());
        return result.map(v => v.replace(/^"|"$/g, '').replace(/""/g, '"'));
      };

      const headers = splitLine(lines[0]).map(h => h.trim().replace(/^\uFEFF/, ''));
      const rawRows = lines.slice(1).map(line => {
        const values = splitLine(line);
        const obj: any = {};
        headers.forEach((header, i) => { if (header) obj[header] = values[i] || ''; });
        return obj;
      });
      
      const mappedTasks: Task[] = rawRows.map((row, idx) => {
        const getCol = (names: string[]) => {
          const key = Object.keys(row).find(k => names.some(n => k.trim().toLowerCase() === n.toLowerCase()));
          return key ? row[key] : null;
        };
        return {
          id: getCol(['ID', 'id']) || `gs_${idx}_${Date.now()}`,
          show: getCol(['節目', 'Show', '節目名稱']) || 'Unknown',
          episode: getCol(['集數', 'Episode', '集數識別']) || 'N/A',
          editor: getCol(['剪輯師', 'Editor', '負責人']) || 'James',
          startDate: normalizeDate(getCol(['開始日', 'StartDate', '開始日期', '日期']) || ''),
          endDate: normalizeDate(getCol(['交播日', 'EndDate', '交播日期', '完成日期']) || ''),
          status: (getCol(['狀態', 'Status']) || 'Todo') as any,
          phase: (getCol(['階段', 'Phase']) || 'RoughCut') as any,
          notes: getCol(['備註', 'Notes', '說明']) || '',
          lastEditedAt: new Date().toISOString(),
          version: 1
        };
      });

      setTasks(mappedTasks);
      setImportCount(mappedTasks.length);
      setSettings(prev => ({ ...prev, syncStatus: 'synced', lastSyncedAt: new Date().toISOString() }));
      localStorage.setItem(`cloud_db_${workspaceId}`, JSON.stringify({ tasks: mappedTasks }));
      return true;
    } catch (e: any) {
      setSyncError(e.message);
      setSettings(prev => ({ ...prev, syncStatus: 'error' }));
      return false;
    } finally {
      isSyncing.current = false;
    }
  }, [workspaceId]);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    
    // 初始化資源資料
    const savedPrograms = localStorage.getItem(`programs_${workspaceId}`);
    if (savedPrograms) {
      setPrograms(JSON.parse(savedPrograms));
    } else {
      setPrograms(SHOWS.map(s => ({ 
        id: s.toLowerCase().replace(/\s+/g, '-'), 
        name: s, 
        updatedAt: new Date().toISOString(), 
        priority: 'Medium', 
        duration: '24:00', 
        description: '' 
      })));
    }

    const savedEditors = localStorage.getItem(`editors_${workspaceId}`);
    if (savedEditors) {
      setEditors(JSON.parse(savedEditors));
    } else {
      setEditors(EDITORS.map(e => ({ 
        id: e.toLowerCase(), 
        name: e, 
        color: EDITOR_COLORS[e] || '#cbd5e1', 
        updatedAt: new Date().toISOString(), 
        role: 'Editor', 
        notes: '' 
      })));
    }
    
    const savedData = localStorage.getItem(`cloud_db_${workspaceId}`);
    if (savedData) {
      const parsed = JSON.parse(savedData);
      if (parsed.tasks && parsed.tasks.length > 0) {
        setTasks(parsed.tasks);
        setImportCount(parsed.tasks.length);
      }
    } else if (settings.googleSheetId) {
      importFromGoogleSheets(settings.googleSheetId);
    }
    
    return () => window.removeEventListener('resize', handleResize);
  }, [workspaceId, importFromGoogleSheets, settings.googleSheetId]);

  // 當 programs 或 editors 改變時儲存
  useEffect(() => {
    if (programs.length > 0) localStorage.setItem(`programs_${workspaceId}`, JSON.stringify(programs));
    if (editors.length > 0) localStorage.setItem(`editors_${workspaceId}`, JSON.stringify(editors));
  }, [programs, editors, workspaceId]);

  const [currentView, setCurrentView] = useState('calendar');
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<FilterState>({ shows: [], editors: [], statuses: [] });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      const showMatch = filters.shows.length === 0 || filters.shows.includes(task.show);
      const editorMatch = filters.editors.length === 0 || filters.editors.includes(task.editor);
      const statusMatch = filters.statuses.length === 0 || filters.statuses.includes(task.status);
      const searchStr = `${task.show} ${task.episode} ${task.editor}`.toLowerCase();
      return showMatch && editorMatch && statusMatch && (!searchTerm || searchStr.includes(searchTerm.toLowerCase()));
    });
  }, [tasks, filters, searchTerm]);

  return (
    <div className={`flex ${isMobile ? 'flex-col' : 'flex-row'} h-full bg-slate-50 text-slate-800 overflow-hidden`}>
      {!isMobile && <Sidebar onAddTask={() => { setEditingTask(null); setIsModalOpen(true); }} insights="" currentView={currentView} setCurrentView={setCurrentView} />}
      <main className="flex-1 flex flex-col min-w-0 h-full relative overflow-hidden">
        <Header 
          companyName={settings.companyName} isMobile={isMobile} searchTerm={searchTerm} setSearchTerm={setSearchTerm}
          activities={activities} onAddTask={() => { setEditingTask(null); setIsModalOpen(true); }}
          editors={editors} syncStatus={settings.syncStatus} lastSyncedAt={settings.lastSyncedAt}
          onRefresh={() => importFromGoogleSheets(settings.googleSheetId || '')}
          importCount={importCount} syncError={syncError}
        />
        <div className={`${isMobile ? 'px-2 pb-20' : 'px-8 pb-8'} flex-1 overflow-hidden flex flex-col`}>
          {currentView === 'calendar' && <FilterBar filters={filters} setFilters={setFilters} programs={programs} editors={editors} isMobile={isMobile} />}
          <div className={`flex-1 bg-white ${isMobile ? 'rounded-xl' : 'rounded-[32px]'} border border-slate-200 overflow-hidden shadow-sm relative`}>
            {(() => {
              switch(currentView) {
                case 'calendar': return <CalendarView tasks={filteredTasks} onEditTask={(t) => { setEditingTask(t); setIsModalOpen(true); }} editors={editors} isMobile={isMobile} />;
                case 'stats': return <StatsView tasks={tasks} editors={editors} programs={programs} />;
                case 'team': return <MemberManager editors={editors} setEditors={setEditors} tasks={tasks} setTasks={setTasks} />;
                case 'programs': return <ProgramManager programs={programs} setPrograms={setPrograms} tasks={tasks} setTasks={setTasks} />;
                case 'settings': return <SettingsView settings={settings} setSettings={setSettings} tasks={tasks} setTasks={setTasks} programs={programs} setPrograms={setPrograms} editors={editors} setEditors={setEditors} onReset={() => {localStorage.clear(); window.location.reload();}} onSyncGoogleSheets={importFromGoogleSheets} />;
                default: return null;
              }
            })()}
          </div>
        </div>
        {isMobile && <MobileNav currentView={currentView} setCurrentView={setCurrentView} />}
      </main>
      {isModalOpen && (
        <TaskModal
          task={editingTask} programs={programs} editors={editors} isMobile={isMobile}
          onClose={() => { setEditingTask(null); setIsModalOpen(false); }}
          onSave={(t) => {
            const next = t.id && !t.id.startsWith('gs_') ? tasks.map(x => x.id === t.id ? t : x) : [...tasks, { ...t, id: Date.now().toString() }];
            setTasks(next);
            localStorage.setItem(`cloud_db_${workspaceId}`, JSON.stringify({ tasks: next }));
            setIsModalOpen(false);
          }}
          onDelete={(id) => {
            const next = tasks.filter(t => t.id !== id);
            setTasks(next);
            localStorage.setItem(`cloud_db_${workspaceId}`, JSON.stringify({ tasks: next }));
            setIsModalOpen(false);
          }}
        />
      )}
    </div>
  );
};

export default App;
