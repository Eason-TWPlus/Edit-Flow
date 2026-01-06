
import React from 'react';
import { Plus, LayoutGrid, Users, Settings, BarChart3, MonitorPlay, Sparkles, Tv2, CalendarDays } from 'lucide-react';

interface SidebarProps {
  onAddTask: () => void;
  insights: string;
  currentView: string;
  setCurrentView: (view: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ onAddTask, insights, currentView, setCurrentView }) => {
  return (
    <aside className="w-64 bg-slate-900 flex flex-col p-6 space-y-8 text-slate-300 border-r border-white/5">
      <div className="flex items-center space-x-3 px-2">
        <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-indigo-700 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
          <Tv2 size={24} className="text-white" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-white tracking-tight leading-none">EditFlow</h1>
          <p className="text-[10px] font-medium text-slate-500 mt-1 uppercase tracking-wider">Cloud Workspace</p>
        </div>
      </div>

      <button 
        onClick={onAddTask}
        className="w-full py-3.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black flex items-center justify-center space-x-2 transition-all active:scale-95 shadow-lg shadow-indigo-600/30 text-sm uppercase tracking-widest"
      >
        <Plus size={18} />
        <span>建立新排程</span>
      </button>

      <nav className="flex-1 space-y-1">
        <div className="pb-2 px-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest opacity-50">工作視圖</div>
        <NavItem icon={<LayoutGrid size={18} />} label="排程月曆" active={currentView === 'calendar'} onClick={() => setCurrentView('calendar')} />
        <NavItem icon={<BarChart3 size={18} />} label="數據報表" active={currentView === 'stats'} onClick={() => setCurrentView('stats')} />
        
        <div className="pt-6 pb-2 px-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest opacity-50">資源管理</div>
        <NavItem icon={<MonitorPlay size={18} />} label="節目設定" active={currentView === 'programs'} onClick={() => setCurrentView('programs')} />
        <NavItem icon={<Users size={18} />} label="團隊成員" active={currentView === 'team'} onClick={() => setCurrentView('team')} />
        <NavItem icon={<Settings size={18} />} label="系統設定" active={currentView === 'settings'} onClick={() => setCurrentView('settings')} />
      </nav>

      {insights && (
        <div className="bg-gradient-to-br from-indigo-500/10 to-transparent p-5 rounded-[24px] border border-indigo-500/20 relative overflow-hidden group">
          <Sparkles className="absolute -right-2 -top-2 text-indigo-500/20 group-hover:rotate-12 transition-all" size={60} />
          <p className="text-[10px] font-black text-indigo-400 mb-2 uppercase tracking-widest flex items-center">
            <Sparkles size={12} className="mr-1.5" />
            AI 團隊調度建議
          </p>
          <p className="text-[11px] leading-relaxed text-slate-300 font-bold italic relative z-10">{insights}</p>
        </div>
      )}
    </aside>
  );
};

const NavItem: React.FC<{ icon: React.ReactNode, label: string, active?: boolean, onClick: () => void }> = ({ icon, label, active, onClick }) => (
  <div 
    onClick={onClick} 
    className={`flex items-center space-x-3 px-3 py-3 rounded-xl cursor-pointer transition-all ${
      active 
        ? 'bg-slate-800 text-white font-black shadow-inner shadow-black/20' 
        : 'text-slate-500 hover:text-slate-100 hover:bg-slate-800/50'
    }`}
  >
    <span className={active ? 'text-indigo-500' : 'text-slate-600'}>{icon}</span>
    <span className="text-xs uppercase tracking-wider">{label}</span>
  </div>
);

export default Sidebar;
