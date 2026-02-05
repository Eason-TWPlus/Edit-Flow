
import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { Task, Program, Editor, FilterState, WorkspaceSettings, Activity, FirebaseConfig } from './types.ts';
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

// Firebase Imports
import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getFirestore, collection, doc, setDoc, deleteDoc, onSnapshot, query, writeBatch, Firestore } from 'firebase/firestore';

const V8_KEY = "EDITFLOW_V8_FIREBASE_PRO";

const App: React.FC = () => {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [isSyncing, setIsSyncing] = useState(false);
  const isResetting = useRef(false);
  const dbRef = useRef<Firestore | null>(null);

  // 1. 初始化狀態 (優先讀取 LocalStorage 以防離線)
  const [appState, setAppState] = useState(() => {
    const raw = localStorage.getItem(V8_KEY);
    const baseData = raw ? JSON.parse(raw) : null;

    return {
      tasks: baseData?.tasks || [],
      activities: baseData?.activities || [],
      programs: baseData?.programs || SHOWS.map(s => ({ 
        id: s.toLowerCase().replace(/\s+/g, '-'), name: s, updatedAt: new Date().toISOString(), priority: 'Medium', duration: '24:00', description: '' 
      })),
      editors: baseData?.editors || EDITORS.map(e => ({ 
        id: e.toLowerCase(), name: e, color: EDITOR_COLORS[e] || '#cbd5e1', updatedAt: new Date().toISOString(), role: 'Editor', notes: '' 
      })),
      settings: baseData?.settings || { 
        id: "TWP_PRO_01", companyName: 'TaiwanPlus', workingDays: [1,2,3,4,5], syncStatus: 'offline', lastSyncedAt: new Date().toISOString(), 
        useFirebase: false
      }
    };
  });

  // 2. Firebase 全域同步引擎
  useEffect(() => {
    const config = appState.settings.firebaseConfig;
    if (appState.settings.useFirebase && config?.apiKey) {
      try {
        const app = getApps().length === 0 ? initializeApp(config) : getApps()[0];
        const db = getFirestore(app);
        dbRef.current = db;

        console.log("🔥 Firebase Firestore 已啟動...");

        // 同時監聽三個主要的集合
        const unsubTasks = onSnapshot(query(collection(db, "tasks")), (snap) => {
          const items: Task[] = [];
          snap.forEach(d => items.push(d.data() as Task));
          if (items.length > 0) setAppState(p => ({ ...p, tasks: items, settings: { ...p.settings, syncStatus: 'synced' } }));
        });

        const unsubProgs = onSnapshot(query(collection(db, "programs")), (snap) => {
          const items: Program[] = [];
          snap.forEach(d => items.push(d.data() as Program));
          if (items.length > 0) setAppState(p => ({ ...p, programs: items }));
        });

        const unsubEditors = onSnapshot(query(collection(db, "editors")), (snap) => {
          const items: Editor[] = [];
          snap.forEach(d => items.push(d.data() as Editor));
          if (items.length > 0) setAppState(p => ({ ...p, editors: items }));
        });

        return () => { unsubTasks(); unsubProgs(); unsubEditors(); };
      } catch (e) {
        console.error("Firebase 連線錯誤:", e);
        setAppState(p => ({ ...p, settings: { ...p.settings, syncStatus: 'error' } }));
      }
    }
  }, [appState.settings.useFirebase, appState.settings.firebaseConfig]);

  // 3. 自動持久化至 LocalStorage (Local-First 策略)
  useEffect(() => {
    if (!isResetting.current) {
      localStorage.setItem(V8_KEY, JSON.stringify(appState));
    }
  }, [appState]);

  // 4. Firestore 雲端寫入操作
  const syncToCloud = async (collectionName: string, id: string, data: any) => {
    if (!dbRef.current || !appState.settings.useFirebase) return;
    try {
      await setDoc(doc(dbRef.current, collectionName, id), data);
    } catch (e) { console.error(`雲端儲存失敗 (${collectionName}):`, e); }
  };

  const deleteFromCloud = async (collectionName: string, id: string) => {
    if (!dbRef.current || !appState.settings.useFirebase) return;
    try {
      await deleteDoc(doc(dbRef.current, collectionName, id));
    } catch (e) { console.error(`雲端刪除失敗 (${collectionName}):`, e); }
  };

  // 一鍵初始化雲端資料庫
  const pushAllToCloud = async () => {
    if (!dbRef.current) return alert("請先正確配置 Firebase 並開啟連線");
    setIsSyncing(true);
    try {
      const batch = writeBatch(dbRef.current);
      appState.tasks.forEach(t => batch.set(doc(dbRef.current!, "tasks", t.id), t));
      appState.programs.forEach(p => batch.set(doc(dbRef.current!, "programs", p.id), p));
      appState.editors.forEach(e => batch.set(doc(dbRef.current!, "editors", e.id), e));
      await batch.commit();
      alert("✅ 已成功將本地資料同步至雲端庫");
    } catch (e) {
      alert("❌ 同步失敗: " + e.message);
    } finally {
      setIsSyncing(false);
    }
  };

  const [currentView, setCurrentView] = useState('calendar');
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<FilterState>({ shows: [], editors: [] });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const filteredTasks = useMemo(() => {
    return appState.tasks.filter(t => {
      const sMatch = filters.shows.length === 0 || filters.shows.includes(t.show);
      const eMatch = filters.editors.length === 0 || filters.editors.includes(t.editor);
      const search = `${t.show} ${t.episode} ${t.editor}`.toLowerCase();
      return sMatch && eMatch && (!searchTerm || search.includes(searchTerm.toLowerCase()));
    });
  }, [appState.tasks, filters, searchTerm]);

  return (
    <div className={`flex ${isMobile ? 'flex-col' : 'flex-row'} h-full bg-slate-50 text-slate-800 overflow-hidden`}>
      {!isMobile && <Sidebar onAddTask={() => { setEditingTask(null); setIsModalOpen(true); }} insights="" currentView={currentView} setCurrentView={setCurrentView} />}
      <main className="flex-1 flex flex-col min-w-0 h-full relative overflow-hidden">
        <Header 
          companyName={appState.settings.companyName} isMobile={isMobile} searchTerm={searchTerm} setSearchTerm={setSearchTerm}
          activities={appState.activities} onAddTask={() => { setEditingTask(null); setIsModalOpen(true); }}
          editors={appState.editors} syncStatus={appState.settings.syncStatus} lastSyncedAt={appState.settings.lastSyncedAt}
          onPush={pushAllToCloud} isPushing={isSyncing}
          googleSheetWriteUrl={appState.settings.useFirebase ? "FIREBASE_ACTIVE" : ""}
          onGoToSettings={() => setCurrentView('settings')}
        />
        <div className={`${isMobile ? 'px-2 pb-20' : 'px-8 pb-8'} flex-1 overflow-hidden flex flex-col`}>
          {currentView === 'calendar' && <FilterBar filters={filters} setFilters={setFilters} programs={appState.programs} editors={appState.editors} isMobile={isMobile} />}
          <div className={`flex-1 bg-white ${isMobile ? 'rounded-xl' : 'rounded-[32px]'} border border-slate-200 overflow-hidden shadow-sm relative`}>
            {(() => {
              switch(currentView) {
                case 'calendar': return <CalendarView tasks={filteredTasks} onEditTask={(t) => { setEditingTask(t); setIsModalOpen(true); }} editors={appState.editors} isMobile={isMobile} />;
                case 'stats': return <StatsView tasks={appState.tasks} editors={appState.editors} programs={appState.programs} />;
                case 'team': return <MemberManager editors={appState.editors} tasks={appState.tasks} 
                  setEditors={(e: any) => {
                    const next = typeof e === 'function' ? e(appState.editors) : e;
                    setAppState(p => ({ ...p, editors: next }));
                    next.forEach((ed: any) => syncToCloud("editors", ed.id, ed));
                  }} 
                  setTasks={(t: any) => {
                    const next = typeof t === 'function' ? t(appState.tasks) : t;
                    setAppState(p => ({ ...p, tasks: next }));
                  }} 
                />;
                case 'programs': return <ProgramManager programs={appState.programs} tasks={appState.tasks}
                  setPrograms={(pr: any) => {
                    const next = typeof pr === 'function' ? pr(appState.programs) : pr;
                    setAppState(p => ({ ...p, programs: next }));
                    next.forEach((pgr: any) => syncToCloud("programs", pgr.id, pgr));
                  }} 
                  setTasks={(t: any) => {
                    const next = typeof t === 'function' ? t(appState.tasks) : t;
                    setAppState(p => ({ ...p, tasks: next }));
                  }} 
                />;
                case 'settings': return <SettingsView settings={appState.settings} setSettings={(s) => setAppState(p => ({...p, settings: s}))} tasks={appState.tasks} setTasks={(t: any) => setAppState(p => ({...p, tasks: t}))} programs={appState.programs} setPrograms={(pr: any) => setAppState(p => ({...p, programs: pr}))} editors={appState.editors} setEditors={(e: any) => setAppState(p => ({...p, editors: e}))} onReset={() => { if(confirm('確定要清空所有資料？')){ isResetting.current = true; localStorage.clear(); window.location.reload(); } }} onSyncGoogleSheets={async () => true} onPushToGoogleSheets={pushAllToCloud} isPushing={isSyncing} />;
                default: return null;
              }
            })()}
          </div>
        </div>
        {isMobile && <MobileNav currentView={currentView} setCurrentView={setCurrentView} />}
      </main>
      {isModalOpen && (
        <TaskModal
          task={editingTask} programs={appState.programs} editors={appState.editors} isMobile={isMobile}
          onClose={() => { setEditingTask(null); setIsModalOpen(false); }}
          onSave={(t) => {
            const isUp = appState.tasks.some(x => x.id === t.id);
            setAppState(prev => ({
              ...prev,
              tasks: isUp ? prev.tasks.map(x => x.id === t.id ? t : x) : [...prev.tasks, t],
              activities: [{ id: `a_${Date.now()}`, type: isUp ? 'update' : 'create', userName: '您', timestamp: new Date().toISOString(), details: `${isUp ? '變更' : '新增'}: ${t.show} ${t.episode}` }, ...prev.activities].slice(0, 50)
            }));
            syncToCloud("tasks", t.id, t);
            setIsModalOpen(false);
          }}
          onDelete={(id) => {
            setAppState(prev => ({
              ...prev,
              tasks: prev.tasks.filter(x => x.id !== id),
              activities: [{ id: `a_${Date.now()}`, type: 'delete', userName: '您', timestamp: new Date().toISOString(), details: '移除排程' }, ...prev.activities].slice(0, 50)
            }));
            deleteFromCloud("tasks", id);
            setIsModalOpen(false);
          }}
        />
      )}
    </div>
  );
};

export default App;
