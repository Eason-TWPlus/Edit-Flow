
import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { Task, Program, Editor, FilterState, WorkspaceSettings, Activity } from './types';
import { INITIAL_TASKS } from './initialData';
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
import { SHOWS, EDITORS, EDITOR_COLORS, EDITOR_AVATARS } from './constants';
import { GoogleGenAI } from "@google/genai";
import { Plus } from 'lucide-react';

const App: React.FC = () => {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [workspaceId, setWorkspaceId] = useState(() => localStorage.getItem('tp_workspace_id') || "TWP_DEV_01");
  
  // --- Data States ---
  const [tasks, setTasks] = useState<Task[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [editors, setEditors] = useState<Editor[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [settings, setSettings] = useState<WorkspaceSettings>({
    id: workspaceId,
    companyName: 'TaiwanPlus',
    workingDays: [1,2,3,4,5],
    syncStatus: 'syncing',
    lastSyncedAt: new Date().toISOString()
  });

  const [currentView, setCurrentView] = useState('calendar');
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<FilterState>({ shows: [], editors: [] });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCollabOpen, setIsCollabOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [aiInsight, setAiInsight] = useState<string>("");

  const pollTimer = useRef<number | null>(null);
  const isSyncing = useRef(false);

  // --- 資料救援：從舊版格式遷移 ---
  const migrateLegacyData = useCallback(() => {
    const legacyKeys = ['tasks', 'editflow_tasks', 'tp_tasks'];
    let migratedTasks: Task[] = [];
    
    legacyKeys.forEach(key => {
      const data = localStorage.getItem(key);
      if (data) {
        try {
          const parsed = JSON.parse(data);
          if (Array.isArray(parsed)) migratedTasks = [...migratedTasks, ...parsed];
          localStorage.removeItem(key); // 遷移後移除舊 Key
        } catch(e) {}
      }
    });

    return migratedTasks;
  }, []);

  // --- 智慧合併邏輯 ---
  const mergeEntities = useCallback(<T extends { id: string, updatedAt?: string, lastEditedAt?: string }>(remote: T[], local: T[]): T[] => {
    const map = new Map<string, T>();
    remote.forEach(t => map.set(t.id, t));
    local.forEach(l => {
      const r = map.get(l.id);
      const lTime = new Date(l.updatedAt || l.lastEditedAt || 0).getTime();
      const rTime = new Date(r?.updatedAt || r?.lastEditedAt || 0).getTime();
      if (!r || lTime > rTime) map.set(l.id, l);
    });
    return Array.from(map.values());
  }, []);

  // --- 全實體雲端同步 ---
  const fetchAndSync = useCallback(async (overrides?: { tasks?: Task[], programs?: Program[], editors?: Editor[] }) => {
    if (isSyncing.current) return;
    isSyncing.current = true;
    setSettings(prev => ({ ...prev, syncStatus: 'syncing' }));

    try {
      const cloudKey = `cloud_db_${workspaceId}`;
      const savedData = localStorage.getItem(cloudKey);
      
      let remoteData = savedData ? JSON.parse(savedData) : null;
      
      if (!remoteData) {
        const legacyTasks = migrateLegacyData();
        remoteData = { 
          tasks: legacyTasks.length > 0 ? legacyTasks : INITIAL_TASKS, 
          programs: SHOWS.map(s => ({ id: s, name: s, updatedAt: new Date().toISOString(), priority: 'Medium', duration: '24:00', description: '' })), 
          editors: EDITORS.map(e => ({ id: e, name: e, color: EDITOR_COLORS[e], updatedAt: new Date().toISOString(), role: 'Editor', notes: '' })) 
        };
      }

      const mergedTasks = mergeEntities(remoteData.tasks || [], overrides?.tasks || tasks);
      const mergedPrograms = mergeEntities(remoteData.programs || [], overrides?.programs || programs);
      const mergedEditors = mergeEntities(remoteData.editors || [], overrides?.editors || editors);
      
      setTasks(mergedTasks);
      setPrograms(mergedPrograms);
      setEditors(mergedEditors);
      
      localStorage.setItem(cloudKey, JSON.stringify({
        tasks: mergedTasks,
        programs: mergedPrograms,
        editors: mergedEditors,
        lastSyncedAt: new Date().toISOString()
      }));

      setSettings(prev => ({ 
        ...prev, 
        syncStatus: 'synced', 
        lastSyncedAt: new Date().toISOString() 
      }));
    } catch (e) {
      console.error("Sync Failed:", e);
      setSettings(prev => ({ ...prev, syncStatus: 'error' }));
    } finally {
      isSyncing.current = false;
    }
  }, [workspaceId, tasks, programs, editors, mergeEntities, migrateLegacyData]);

  useEffect(() => {
    fetchAndSync();
    pollTimer.current = window.setInterval(() => fetchAndSync(), 10000);
    return () => { if (pollTimer.current) clearInterval(pollTimer.current); };
  }, [fetchAndSync]);

  const handleSaveTask = async (updatedTask: Task) => {
    const timestamp = new Date().toISOString();
    const taskWithMeta = { 
      ...updatedTask, 
      lastEditedAt: timestamp,
      version: (updatedTask.version || 0) + 1 
    };

    const newTasks = taskWithMeta.id 
      ? tasks.map(t => t.id === taskWithMeta.id ? taskWithMeta : t)
      : [...tasks, { ...taskWithMeta, id: Math.random().toString(36).substr(2, 9) }];
    
    setTasks(newTasks);
    setIsModalOpen(false);
    await fetchAndSync({ tasks: newTasks });
  };

  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      const showMatch = filters.shows.length === 0 || filters.shows.includes(task.show);
      const editorMatch = filters.editors.length === 0 || filters.editors.includes(task.editor);
      const searchStr = `${task.show} ${task.episode} ${task.editor} ${task.notes || ''}`.toLowerCase();
      const searchMatch = !searchTerm || searchStr.includes(searchTerm.toLowerCase());
      return showMatch && editorMatch && searchMatch;
    });
  }, [tasks, filters, searchTerm]);

  return (
    <div className={`flex ${isMobile ? 'flex-col' : 'flex-row'} h-full bg-slate-50 text-slate-800 overflow-hidden font-sans`}>
      {!isMobile && (
        <Sidebar 
          onAddTask={() => { setEditingTask(null); setIsModalOpen(true); }} 
          insights={aiInsight}
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
                case 'team': return <MemberManager editors={editors} setEditors={(e) => { const next = typeof e === 'function' ? e(editors) : e; setEditors(next); fetchAndSync({ editors: next }); }} tasks={tasks} setTasks={setTasks} />;
                case 'programs': return <ProgramManager programs={programs} setPrograms={(p) => { const next = typeof p === 'function' ? p(programs) : p; setPrograms(next); fetchAndSync({ programs: next }); }} tasks={tasks} setTasks={setTasks} />;
                case 'settings': return <SettingsView settings={settings} setSettings={setSettings} tasks={tasks} setTasks={setTasks} programs={programs} setPrograms={setPrograms} editors={editors} setEditors={setEditors} onReset={() => { localStorage.clear(); window.location.reload(); }} />;
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
          onSave={handleSaveTask}
          onDelete={(id) => {
            const newTasks = tasks.filter(t => t.id !== id);
            setTasks(newTasks);
            fetchAndSync({ tasks: newTasks });
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
