
import React, { useState, useRef, useEffect } from 'react';
import { Search, Bell, ChevronDown, Plus, Users, Cloud, X, Clock, Zap, Wifi, WifiOff, RefreshCw, AlertCircle, UploadCloud, Settings, Flame } from 'lucide-react';
import { Editor, Activity } from '../types.ts';
import { formatDistanceToNow, format } from 'date-fns';
import zhTW from 'date-fns/locale/zh-TW';

interface Props {
  companyName: string;
  isMobile?: boolean;
  searchTerm: string;
  setSearchTerm: (s: string) => void;
  activities: Activity[];
  onAddTask: () => void;
  editors: Editor[];
  syncStatus: 'synced' | 'syncing' | 'offline' | 'error' | 'pending';
  lastSyncedAt?: string;
  onRefresh?: () => void;
  onPush?: () => void;
  isPushing?: boolean;
  googleSheetWriteUrl?: string; 
  onGoToSettings?: () => void;
}

const Header: React.FC<Props> = ({ 
  companyName, isMobile, searchTerm, setSearchTerm, activities,
  onAddTask, editors, syncStatus, lastSyncedAt, onRefresh, onPush, isPushing, googleSheetWriteUrl, onGoToSettings
}) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const notificationRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) setShowNotifications(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isFirebase = googleSheetWriteUrl === "FIREBASE_ACTIVE";

  return (
    <header className={`${isMobile ? 'px-4 py-4 pt-12 shadow-sm' : 'h-16 px-8'} flex items-center justify-between bg-white border-b border-slate-200 shrink-0 z-30 relative transition-all`}>
      <div className="flex-1 max-w-lg mr-2 flex items-center space-x-2">
        <div className="relative group flex-1">
          <Search className={`absolute left-3 top-1/2 -translate-y-1/2 transition-colors ${searchTerm ? 'text-indigo-500' : 'text-slate-400'}`} size={isMobile ? 14 : 16} />
          <input 
            type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={isMobile ? "搜尋內容..." : "搜尋項目..."}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg py-1.5 pl-8 pr-8 focus:ring-2 ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all text-xs font-medium"
          />
        </div>
      </div>
      
      <div className="flex items-center space-x-2">
        {isFirebase ? (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-orange-50 text-orange-600 rounded-lg border border-orange-100 animate-in fade-in">
             <Flame size={14} className="animate-pulse" />
             <span className="text-[10px] font-black uppercase tracking-widest hidden md:inline">Firebase 即時雲端</span>
          </div>
        ) : (
          <button 
            onClick={onGoToSettings}
            className="flex items-center space-x-2 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest bg-slate-100 text-slate-400 border border-dashed border-slate-300"
          >
            <AlertCircle size={12} className="text-orange-400" />
            {!isMobile && <span>切換為 Firebase 同步</span>}
          </button>
        )}

        <div className="relative" ref={notificationRef}>
          <button 
            onClick={() => setShowNotifications(!showNotifications)}
            className={`relative p-2 rounded-xl transition-all ${showNotifications ? 'bg-indigo-50 text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
          >
            <Bell size={20} />
            {activities.length > 0 && <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 border-2 border-white rounded-full"></span>}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-3 w-80 bg-white border border-slate-200 rounded-[24px] shadow-2xl overflow-hidden z-[100]">
              <div className="p-4 border-b border-slate-100 bg-slate-50/50">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">異動紀錄</span>
              </div>
              <div className="max-h-[350px] overflow-y-auto">
                {activities.map(activity => (
                  <div key={activity.id} className="p-4 border-b border-slate-50 last:border-0 hover:bg-slate-50/50">
                    <p className="text-xs font-bold text-slate-800">{activity.details}</p>
                    <span className="text-[9px] text-slate-300 uppercase font-black">{formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true, locale: zhTW })}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
