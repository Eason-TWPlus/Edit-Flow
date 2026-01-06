
import React, { useState, useRef, useEffect } from 'react';
import { Search, Bell, ChevronDown, Plus, Users, Cloud, X, Clock, Zap, Wifi, WifiOff, RefreshCw } from 'lucide-react';
import { Editor, Activity } from '../types';
import { formatDistanceToNow, format } from 'date-fns';
import zhTW from 'date-fns/locale/zh-TW';

interface Props {
  companyName: string;
  isMobile?: boolean;
  searchTerm: string;
  setSearchTerm: (s: string) => void;
  activities: Activity[];
  onAddTask?: () => void;
  onOpenCollab?: () => void;
  editors: Editor[];
  syncStatus: 'synced' | 'syncing' | 'offline' | 'error';
  lastSyncedAt?: string;
  onRefresh?: () => void;
}

const Header: React.FC<Props> = ({ 
  companyName, 
  isMobile, 
  searchTerm, 
  setSearchTerm, 
  activities,
  onAddTask, 
  onOpenCollab, 
  editors, 
  syncStatus,
  lastSyncedAt,
  onRefresh
}) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const notificationRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getSyncUI = () => {
    switch(syncStatus) {
      case 'syncing': 
        return { 
          icon: <RefreshCw size={12} className="text-amber-500 animate-spin" />, 
          text: '同步中...',
          color: 'bg-amber-500'
        };
      case 'error': 
        return { 
          icon: <WifiOff size={12} className="text-red-500" />, 
          text: '連線異常',
          color: 'bg-red-500'
        };
      default: 
        return { 
          icon: <Wifi size={12} className="text-emerald-500" />, 
          text: 'Google Sheet 連動中',
          color: 'bg-emerald-500'
        };
    }
  };

  const syncUI = getSyncUI();

  return (
    <header className={`${isMobile ? 'h-14 px-4' : 'h-16 px-8'} flex items-center justify-between bg-white border-b border-slate-200 shrink-0 z-30 relative`}>
      <div className="flex-1 max-w-lg mr-4 flex items-center space-x-2">
        <div className="relative group flex-1">
          <Search className={`absolute left-3 top-1/2 -translate-y-1/2 transition-colors ${searchTerm ? 'text-indigo-500' : 'text-slate-400'}`} size={isMobile ? 14 : 16} />
          <input 
            type="text" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={isMobile ? "搜尋任務..." : "搜尋節目、集數、剪輯師..."}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg py-1.5 pl-8 pr-8 focus:ring-2 ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all text-xs font-medium"
          />
        </div>
      </div>
      
      <div className="flex items-center space-x-2 md:space-x-4">
        <button 
          onClick={onRefresh}
          className={`p-2 rounded-xl border border-slate-100 bg-slate-50 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition-all ${syncStatus === 'syncing' ? 'opacity-50 cursor-not-allowed' : ''}`}
          title="重新整理資料"
        >
          <RefreshCw size={18} className={syncStatus === 'syncing' ? 'animate-spin' : ''} />
        </button>

        {!isMobile && (
          <div className="flex flex-col items-end mr-2">
            <div className="flex items-center space-x-2 px-3 py-1 bg-slate-50 rounded-full border border-slate-100">
              <div className={`w-1.5 h-1.5 rounded-full ${syncStatus === 'syncing' ? 'animate-pulse' : ''} ${syncUI.color}`}></div>
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-tighter">
                {syncUI.text}
              </span>
            </div>
          </div>
        )}

        <div className="relative" ref={notificationRef}>
          <button 
            onClick={() => setShowNotifications(!showNotifications)}
            className={`relative p-2 rounded-xl transition-all ${showNotifications ? 'bg-indigo-50 text-indigo-600' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'}`}
          >
            <Bell size={20} />
            {activities.length > 0 && <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 border-2 border-white rounded-full"></span>}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-3 w-80 bg-white border border-slate-200 rounded-[24px] shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 z-[100]">
              <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center">
                  <Zap size={12} className="mr-1.5 text-amber-500" /> 即時異動紀錄
                </span>
              </div>
              <div className="max-h-[300px] overflow-y-auto custom-scrollbar">
                {activities.length === 0 ? (
                  <div className="p-8 text-center text-slate-300 text-[10px] font-bold uppercase tracking-widest">無最新動態</div>
                ) : (
                  activities.map(activity => (
                    <div key={activity.id} className="p-4 border-b border-slate-50 last:border-0">
                      <p className="text-xs font-bold text-slate-800 leading-tight">{activity.details}</p>
                      <span className="text-[9px] text-slate-300 uppercase font-black mt-1 block">
                        {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true, locale: zhTW })}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
