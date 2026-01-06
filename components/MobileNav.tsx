
import React from 'react';
import { LayoutGrid, BarChart3, Settings, MonitorPlay, Users } from 'lucide-react';

interface Props {
  currentView: string;
  setCurrentView: (view: string) => void;
}

const MobileNav: React.FC<Props> = ({ currentView, setCurrentView }) => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-slate-900 border-t border-slate-800 flex items-center justify-around h-16 px-2 safe-area-bottom z-40">
      <NavItem icon={<LayoutGrid size={20} />} active={currentView === 'calendar'} onClick={() => setCurrentView('calendar')} />
      <NavItem icon={<MonitorPlay size={20} />} active={currentView === 'programs'} onClick={() => setCurrentView('programs')} />
      <NavItem icon={<Users size={20} />} active={currentView === 'team'} onClick={() => setCurrentView('team')} />
      <NavItem icon={<BarChart3 size={20} />} active={currentView === 'stats'} onClick={() => setCurrentView('stats')} />
      <NavItem icon={<Settings size={20} />} active={currentView === 'settings'} onClick={() => setCurrentView('settings')} />
    </nav>
  );
};

const NavItem: React.FC<{ icon: React.ReactNode, active?: boolean, onClick: () => void }> = ({ icon, active, onClick }) => (
  <button 
    onClick={onClick}
    className={`flex flex-col items-center justify-center w-12 h-12 rounded-xl transition-all ${
      active ? 'text-indigo-400 bg-slate-800 shadow-inner' : 'text-slate-500'
    }`}
  >
    {icon}
  </button>
);

export default MobileNav;
