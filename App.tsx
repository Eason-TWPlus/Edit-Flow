
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

// 最新的全域金鑰
const MASTER_KEY = "EDITFLOW_MASTER_V3_STABLE";
// 歷史遺留金鑰清單（用於救援資料）
const LEGACY_KEYS = [
  "EDITFLOW_STORAGE_V3_MASTER",
  "db_tasks_TWP_PRO_01",
  "cloud_db_TWP_PRO_01",
  "tasks_db_TWP_PRO_01"
];

const App: React.FC = () => {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [isDataLoaded, setIsDataLoaded] = useState(false);

  // --- 1. 資料救援與初始化函數 ---
  const initializeWorkspace = () => {
    // 優先嘗試讀取最新金鑰
    const currentRaw = localStorage.getItem(MASTER_KEY);
    let currentData = null;
    try { currentData = currentRaw ? JSON.parse(currentRaw) : null; } catch(e) {}

    // 如果最新金鑰沒資料，開始執行救援
    if (!currentData || !currentData.tasks || currentData.tasks.length === 0) {
      console.log("偵測到新環境或資料遺失，啟動救援機制...");
      let rescuedTasks: Task[] = [];
      let rescuedActivities: Activity[] = [];
      
      // 掃描所有可能的歷史位置
      for (const key of LEGACY_KEYS) {
        const raw = localStorage.getItem(key);
        if (!raw) continue;
        try {
          const parsed = JSON.parse(raw);
          // 處理不同時期的資料格式
          const foundTasks = Array.isArray(parsed) ? parsed : (parsed.tasks || []);
          if (foundTasks.length > rescuedTasks.length) {
            rescuedTasks = foundTasks;
            console.log(`從 ${key} 救回了 ${foundTasks.length} 筆任務`);
          }
          const foundAct = Array.isArray(parsed.activities) ? parsed.activities : (Array.isArray(parsed) ? [] : []);
          if (foundAct.length > rescuedActivities.length) rescuedActivities = foundAct;
        } catch(e) {}
      }

      if (rescuedTasks.length > 0) {
        return {
          tasks: rescuedTasks,
          activities: rescuedActivities,
          programs: currentData?.programs || null,
          editors: currentData?.editors || null,
          settings: currentData?.settings || null
        };
      }
    }
    return currentData;
  };

  const initialData = useMemo(() => initializeWorkspace(), []);

  // --- 狀態定義 ---
  const [tasks, setTasks] = useState<Task[]>(initialData?.tasks || []);
  const [activities, setActivities] = useState<Activity[]>(initialData?.activities || []);
  const [programs, setPrograms] = useState<Program[]>(initialData?.programs || SHOWS.map(s => ({ 
    id: s.toLowerCase().replace(/\s+/g, '-'), name: s, updatedAt: new Date().toISOString(), priority: 'Medium', duration: '24:00', description: '' 
  })));
  const [editors, setEditors] = useState<Editor[]>(initialData?.editors || EDITORS.map(e => ({ 
    id: e.toLowerCase(), name: e, color: EDITOR_COLORS[e] || '#cbd5e1', updatedAt: new Date().toISOString(), role: 'Editor', notes: '' 
  })));
  const [settings, setSettings] = useState<WorkspaceSettings>(initialData?.settings || { 
    id: "TWP_PRO_01", companyName: 'TaiwanPlus', workingDays: [1,2,3,4,5], syncStatus: 'synced', lastSyncedAt: new Date().toISOString(), googleSheetId: '1FWZXvZjghfOjT8JkW-SGZMrLCP3oyI7K3I71kEUmc1w' 
  });

  const [importCount, setImportCount] = useState<number | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);
  const isSyncing = useRef(false);

  // --- 2. 存檔鎖機制：防止初始化未完成前覆蓋 ---
  useEffect(() => {
    // 只有在組件掛載後一秒，或是確認資料已初始化才允許寫入
    const timer = setTimeout(() => setIsDataLoaded(true), 500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!isDataLoaded) return; // 沒讀取完之前，絕對不寫入 LocalStorage

    const bundle = {
      tasks,
      activities,
      programs,
      editors,
      settings,
      lastSaved: new Date().toISOString(),
      version: "3.1"
    };
    localStorage.setItem(MASTER_KEY, JSON.stringify(bundle));
  }, [tasks, activities, programs, editors, settings, isDataLoaded]);

  // --- 3. 動作邏輯 ---
  const addActivity = useCallback((type: Activity['type'], details: string) => {
    setActivities(prev => [{
      id: `act_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      type, userName: '您', timestamp: new Date().toISOString(), details
    }, ...prev].slice(0, 100));
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
      if (!response.ok) throw new Error("同步失敗，請確認 ID 與分享權限。");
      
      const csvData = await response.text();
      const lines = csvData.split(/\r?\n/).filter(line => line.trim());
      if (lines.length < 2) throw new Error("試算表無資料。");

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
      addActivity('sync', `手動同步成功：載入 ${mappedTasks.length} 筆資料`);
      return true;
    } catch (e: any) {
      setSyncError(e.message);
      setSettings(prev => ({ ...prev, syncStatus: 'error' }));
      addActivity('sync', `同步失敗：${e.message}`);
      return false;
    } finally {
      isSyncing.current = false;
    }
  }, [addActivity]);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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
            {!isDataLoaded ? (
              <div className="flex flex-col items-center justify-center h-full space-y-4 opacity-50">
                <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-xs font-black uppercase tracking-widest">系統正在安全啟動中...</p>
              </div>
            ) : (() => {
              switch(currentView) {
                case 'calendar': return <CalendarView tasks={filteredTasks} onEditTask={(t) => { setEditingTask(t); setIsModalOpen(true); }} editors={editors} isMobile={isMobile} />;
                case 'stats': return <StatsView tasks={tasks} editors={editors} programs={programs} />;
                case 'team': return <MemberManager editors={editors} setEditors={setEditors} tasks={tasks} setTasks={setTasks} />;
                case 'programs': return <ProgramManager programs={programs} setPrograms={setPrograms} tasks={tasks} setTasks={setTasks} />;
                case 'settings': return <SettingsView settings={settings} setSettings={setSettings} tasks={tasks} setTasks={setTasks} programs={programs} setPrograms={setPrograms} editors={editors} setEditors={setEditors} onReset={() => { if(confirm('確定要清除所有資料？')){ localStorage.removeItem(MASTER_KEY); window.location.reload(); }}} onSyncGoogleSheets={importFromGoogleSheets} />;
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
            const isUpdate = tasks.some(x => x.id === t.id);
            if (isUpdate) {
              setTasks(prev => prev.map(x => x.id === t.id ? t : x));
              addActivity('update', `異動確認：${t.show} ${t.episode}`);
            } else {
              setTasks(prev => [...prev, t]);
              addActivity('create', `新增排程：${t.show} ${t.episode}`);
            }
            setIsModalOpen(false);
          }}
          onDelete={(id) => {
            const target = tasks.find(t => t.id === id);
            setTasks(prev => prev.filter(t => t.id !== id));
            if (target) addActivity('delete', `移除項目：${target.show} ${target.episode}`);
            setIsModalOpen(false);
          }}
        />
      )}
    </div>
  );
};

export default App;
