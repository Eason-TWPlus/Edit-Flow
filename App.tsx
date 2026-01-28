
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

const V6_KEY = "EDITFLOW_V6_MASTER";
const LEGACY_KEYS = ["EDITFLOW_V5_SURE_FIRE", "EDITFLOW_V4_FINAL_STABLE", "db_tasks_TWP_PRO_01"];

const normalizeDateStr = (str: string): string => {
  if (!str) return new Date().toISOString().split('T')[0];
  const clean = str.trim().split(' ')[0];
  const parts = clean.split(/[/.-]/);
  if (parts.length === 3) {
    let y = parts[0], m = parts[1], d = parts[2];
    if (y.length <= 2 && d.length === 4) [y, m, d] = [d, y, m];
    if (y.length === 2) y = "20" + y;
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }
  return /^\d{4}-\d{2}-\d{2}$/.test(clean) ? clean : new Date().toISOString().split('T')[0];
};

const App: React.FC = () => {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [isPushing, setIsPushing] = useState(false);
  const isResetting = useRef(false);

  const [appState, setAppState] = useState(() => {
    const v6Raw = localStorage.getItem(V6_KEY);
    let baseData = v6Raw ? JSON.parse(v6Raw) : null;
    if (!baseData || !baseData.tasks) {
      let rescuedTasks: Task[] = [];
      for (const key of LEGACY_KEYS) {
        try {
          const raw = localStorage.getItem(key);
          if (raw) {
            const p = JSON.parse(raw);
            const t = Array.isArray(p) ? p : (p.tasks || []);
            if (t.length > rescuedTasks.length) rescuedTasks = t;
          }
        } catch(e) {}
      }
      baseData = { tasks: rescuedTasks };
    }

    return {
      tasks: baseData.tasks || [],
      activities: baseData.activities || [],
      programs: baseData.programs || SHOWS.map(s => ({ 
        id: s.toLowerCase().replace(/\s+/g, '-'), name: s, updatedAt: new Date().toISOString(), priority: 'Medium', duration: '24:00', description: '' 
      })),
      editors: baseData.editors || EDITORS.map(e => ({ 
        id: e.toLowerCase(), name: e, color: EDITOR_COLORS[e] || '#cbd5e1', updatedAt: new Date().toISOString(), role: 'Editor', notes: '' 
      })),
      settings: baseData.settings || { 
        id: "TWP_PRO_01", companyName: 'TaiwanPlus', workingDays: [1,2,3,4,5], syncStatus: 'synced', lastSyncedAt: new Date().toISOString(), 
        googleSheetId: "1FWZXvZjghfOjT8JkW-SGZMrLCP3oyI7K3I71kEUmc1w",
        googleSheetWriteUrl: ""
      }
    };
  });

  const updateAppState = useCallback((updater: (prev: typeof appState) => typeof appState, markPending = true) => {
    setAppState(prev => {
      const next = updater(prev);
      if (prev.tasks.length > 0 && next.tasks.length === 0 && !isResetting.current) return prev;
      
      // 如果有資料異動且非同步動作，標記為 pending (需要 push)
      if (markPending) {
        next.settings.syncStatus = 'pending';
      }

      localStorage.setItem(V6_KEY, JSON.stringify(next));
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
      return next;
    });
  }, []);

  // --- 回傳資料到 Google Sheets ---
  const pushToGoogleSheets = async () => {
    if (!appState.settings.googleSheetWriteUrl) {
      alert("尚未設定『寫入代理 URL』。請至系統設定配置 Google Apps Script 橋樑。");
      return;
    }

    setIsPushing(true);
    try {
      const response = await fetch(appState.settings.googleSheetWriteUrl, {
        method: 'POST',
        mode: 'no-cors', // Apps Script 通常需要 no-cors
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'sync_tasks',
          tasks: appState.tasks
        })
      });

      // 因為 no-cors 無法讀取 response.ok，我們假定發出即成功，或請用戶觀察試算表
      updateAppState(prev => ({
        ...prev,
        settings: { ...prev.settings, syncStatus: 'synced', lastSyncedAt: new Date().toISOString() },
        activities: [{ id: `p_${Date.now()}`, type: 'push', userName: '系統', timestamp: new Date().toISOString(), details: '已將最新排程推送至 Google Sheets' }, ...prev.activities].slice(0, 50)
      }), false);
      
      alert("同步請求已發出！請檢查試算表是否已更新。\n(註：Apps Script 回傳可能有數秒延遲)");
    } catch (e) {
      alert("推送失敗：" + e.message);
    } finally {
      setIsPushing(false);
    }
  };

  const importFromGoogleSheets = async (sheetId: string) => {
    if (!sheetId) return alert("請輸入 ID");
    try {
      const url = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=0&t=${Date.now()}`;
      const res = await fetch(url);
      const csv = await res.text();
      const lines = csv.split(/\r?\n/).filter(l => l.trim());
      if (lines.length < 2) throw new Error("無效資料");

      const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim().toLowerCase());
      const findCol = (keywords: string[]) => headers.findIndex(h => keywords.some(k => h.includes(k)));
      const idxShow = findCol(['節目', 'show', 'program', 'name']);
      const idxEp = findCol(['集數', 'ep', 'episode', 'no']);
      const idxEd = findCol(['剪輯', 'editor', '負責', 'owner']);
      const idxStart = findCol(['開始', 'start', '日期', 'date']);
      const idxEnd = findCol(['交播', '結束', 'end', 'due', '完成', '交付']);

      const newTasks: Task[] = lines.slice(1).map((line, i) => {
        const cols = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g)?.map(c => c.replace(/"/g, '').trim()) || line.split(',');
        return {
          id: `gs_${Date.now()}_${i}`,
          show: cols[idxShow] || '未分類',
          episode: cols[idxEp] || 'N/A',
          editor: cols[idxEd] || 'James',
          startDate: normalizeDateStr(cols[idxStart] || ""),
          endDate: normalizeDateStr(cols[idxEnd] || cols[idxStart] || ""),
          lastEditedAt: new Date().toISOString(),
          version: 1
        };
      });

      updateAppState(prev => ({
        ...prev,
        tasks: newTasks,
        activities: [{ id: `s_${Date.now()}`, type: 'sync', userName: '系統', timestamp: new Date().toISOString(), details: `雲端同步成功：帶入 ${newTasks.length} 筆排程` }, ...prev.activities].slice(0, 50),
        settings: { ...prev.settings, syncStatus: 'synced', lastSyncedAt: new Date().toISOString() }
      }), false); // 下載資料後不需要 markPending
      return true;
    } catch (e) {
      alert("同步失敗：" + e.message);
      return false;
    }
  };

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
          onRefresh={() => importFromGoogleSheets(appState.settings.googleSheetId || '')}
          onPush={pushToGoogleSheets}
          isPushing={isPushing}
        />
        <div className={`${isMobile ? 'px-2 pb-20' : 'px-8 pb-8'} flex-1 overflow-hidden flex flex-col`}>
          {currentView === 'calendar' && <FilterBar filters={filters} setFilters={setFilters} programs={appState.programs} editors={appState.editors} isMobile={isMobile} />}
          <div className={`flex-1 bg-white ${isMobile ? 'rounded-xl' : 'rounded-[32px]'} border border-slate-200 overflow-hidden shadow-sm relative`}>
            {(() => {
              switch(currentView) {
                case 'calendar': return <CalendarView tasks={filteredTasks} onEditTask={(t) => { setEditingTask(t); setIsModalOpen(true); }} editors={appState.editors} isMobile={isMobile} />;
                case 'stats': return <StatsView tasks={appState.tasks} editors={appState.editors} programs={appState.programs} />;
                case 'team': return <MemberManager editors={appState.editors} setEditors={(e: any) => updateAppState(p => ({...p, editors: typeof e === 'function' ? e(p.editors) : e}))} tasks={appState.tasks} setTasks={(t: any) => updateAppState(p => ({...p, tasks: typeof t === 'function' ? t(p.tasks) : t}))} />;
                case 'programs': return <ProgramManager programs={appState.programs} setPrograms={(pr: any) => updateAppState(p => ({...p, programs: typeof pr === 'function' ? pr(p.programs) : pr}))} tasks={appState.tasks} setTasks={(t: any) => updateAppState(p => ({...p, tasks: typeof t === 'function' ? t(p.tasks) : t}))} />;
                case 'settings': return <SettingsView settings={appState.settings} setSettings={(s) => updateAppState(p => ({...p, settings: s}))} tasks={appState.tasks} setTasks={(t: any) => updateAppState(p => ({...p, tasks: t}))} programs={appState.programs} setPrograms={(pr: any) => updateAppState(p => ({...p, programs: pr}))} editors={appState.editors} setEditors={(e: any) => updateAppState(p => ({...p, editors: e}))} onReset={() => { if(confirm('確定要清除本地所有快取並重新載入？')){ isResetting.current = true; localStorage.clear(); window.location.reload(); } }} onSyncGoogleSheets={importFromGoogleSheets} />;
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
            updateAppState(prev => {
              const isUp = prev.tasks.some(x => x.id === t.id);
              return {
                ...prev,
                tasks: isUp ? prev.tasks.map(x => x.id === t.id ? t : x) : [...prev.tasks, t],
                activities: [{ id: `a_${Date.now()}`, type: isUp ? 'update' : 'create', userName: '您', timestamp: new Date().toISOString(), details: `${isUp ? '變更' : '新增'}: ${t.show} ${t.episode}` }, ...prev.activities].slice(0, 50)
              };
            });
            setIsModalOpen(false);
          }}
          onDelete={(id) => {
            updateAppState(prev => ({
              ...prev,
              tasks: prev.tasks.filter(x => x.id !== id),
              activities: [{ id: `a_${Date.now()}`, type: 'delete', userName: '您', timestamp: new Date().toISOString(), details: '移除排程' }, ...prev.activities].slice(0, 50)
            }));
            setIsModalOpen(false);
          }}
        />
      )}
    </div>
  );
};

export default App;
