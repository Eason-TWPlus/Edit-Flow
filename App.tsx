
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
  
  // 儲存金鑰定義
  const KEY_TASKS = `cloud_db_${workspaceId}`;
  const KEY_ACTIVITY = `activity_db_${workspaceId}`;
  const KEY_SETTINGS = `settings_${workspaceId}`;
  const KEY_PROGRAMS = `programs_${workspaceId}`;
  const KEY_EDITORS = `editors_${workspaceId}`;

  // --- 1. 核心狀態初始化 (僅從本地讀取一次) ---
  const [tasks, setTasks] = useState<Task[]>(() => {
    const saved = localStorage.getItem(KEY_TASKS);
    if (!saved) return [];
    try {
      const parsed = JSON.parse(saved);
      return Array.isArray(parsed.tasks) ? parsed.tasks : (Array.isArray(parsed) ? parsed : []);
    } catch { return []; }
  });

  const [programs, setPrograms] = useState<Program[]>(() => {
    const saved = localStorage.getItem(KEY_PROGRAMS);
    return saved ? JSON.parse(saved) : SHOWS.map(s => ({ id: s.toLowerCase().replace(/\s+/g, '-'), name: s, updatedAt: new Date().toISOString(), priority: 'Medium', duration: '24:00', description: '' }));
  });

  const [editors, setEditors] = useState<Editor[]>(() => {
    const saved = localStorage.getItem(KEY_EDITORS);
    return saved ? JSON.parse(saved) : EDITORS.map(e => ({ id: e.toLowerCase(), name: e, color: EDITOR_COLORS[e] || '#cbd5e1', updatedAt: new Date().toISOString(), role: 'Editor', notes: '' }));
  });

  const [activities, setActivities] = useState<Activity[]>(() => {
    const saved = localStorage.getItem(KEY_ACTIVITY);
    return saved ? JSON.parse(saved) : [];
  });

  const [settings, setSettings] = useState<WorkspaceSettings>(() => {
    const saved = localStorage.getItem(KEY_SETTINGS);
    return saved ? JSON.parse(saved) : { id: workspaceId, companyName: 'TaiwanPlus', workingDays: [1,2,3,4,5], syncStatus: 'synced', lastSyncedAt: new Date().toISOString(), googleSheetId: '1FWZXvZjghfOjT8JkW-SGZMrLCP3oyI7K3I71kEUmc1w' };
  });

  const [importCount, setImportCount] = useState<number | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);
  const isSyncing = useRef(false);

  // --- 2. 統一存檔 Effect (集中處理避免衝突) ---
  useEffect(() => {
    localStorage.setItem(KEY_TASKS, JSON.stringify({ tasks }));
    localStorage.setItem(KEY_ACTIVITY, JSON.stringify(activities));
    localStorage.setItem(KEY_PROGRAMS, JSON.stringify(programs));
    localStorage.setItem(KEY_EDITORS, JSON.stringify(editors));
    localStorage.setItem(KEY_SETTINGS, JSON.stringify(settings));
  }, [tasks, activities, programs, editors, settings]);

  // --- 3. 核心功能邏輯 ---
  const addActivity = useCallback((type: Activity['type'], details: string) => {
    const newActivity: Activity = {
      id: `act_${Date.now()}`,
      type,
      userName: '您',
      timestamp: new Date().toISOString(),
      details
    };
    setActivities(prev => [newActivity, ...prev].slice(0, 50));
  }, []);

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
      if (!response.ok) throw new Error("同步失敗，請確認試算表 ID。");
      
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
          notes: getCol(['備註', 'Notes', '說明']) || '',
          lastEditedAt: new Date().toISOString(),
          version: 1
        };
      });

      setTasks(mappedTasks);
      setImportCount(mappedTasks.length);
      setSettings(prev => ({ ...prev, syncStatus: 'synced', lastSyncedAt: new Date().toISOString() }));
      addActivity('sync', `同步雲端：已載入 ${mappedTasks.length} 筆資料`);
      return true;
    } catch (e: any) {
      setSyncError(e.message);
      setSettings(prev => ({ ...prev, syncStatus: 'error' }));
      addActivity('sync', `同步出錯：${e.message}`);
      return false;
    } finally {
      isSyncing.current = false;
    }
  }, [addActivity]);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    
    // 重要：只有當「完全沒有本地資料」且「有 Sheet ID」時才自動拉取一次
    // 防止每次重新整理都回溯到 Sheet 的舊版本
    const saved = localStorage.getItem(KEY_TASKS);
    if (!saved && settings.googleSheetId) {
      importFromGoogleSheets(settings.googleSheetId);
    }
    
    return () => window.removeEventListener('resize', handleResize);
  }, [settings.googleSheetId, importFromGoogleSheets, KEY_TASKS]);

  const [currentView, setCurrentView] = useState('calendar');
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<FilterState>({ shows: [], editors: [] });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      const showMatch = filters.shows.length === 0 || filters.shows.includes(task.show);
      const editorMatch = filters.editors.length === 0 || filters.editors.includes(task.editor);
      const searchStr = `${task.show} ${task.episode} ${task.editor}`.toLowerCase();
      return showMatch && editorMatch && (!searchTerm || searchStr.includes(searchTerm.toLowerCase()));
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
            setTasks(prev => {
              const exists = prev.some(x => x.id === t.id);
              let next;
              if (exists) {
                next = prev.map(x => x.id === t.id ? t : x);
                addActivity('update', `變更：${t.show} ${t.episode}`);
              } else {
                next = [...prev, t];
                addActivity('create', `新增：${t.show} ${t.episode}`);
              }
              // 手動立即存檔一次作為雙保險
              localStorage.setItem(KEY_TASKS, JSON.stringify({ tasks: next }));
              return next;
            });
            setIsModalOpen(false);
          }}
          onDelete={(id) => {
            setTasks(prev => {
              const taskToDelete = prev.find(t => t.id === id);
              const next = prev.filter(t => t.id !== id);
              if (taskToDelete) addActivity('delete', `刪除：${taskToDelete.show} ${taskToDelete.episode}`);
              localStorage.setItem(KEY_TASKS, JSON.stringify({ tasks: next }));
              return next;
            });
            setIsModalOpen(false);
          }}
        />
      )}
    </div>
  );
};

export default App;
