
import React, { useState } from 'react';
import { WorkspaceSettings, Task, Program, Editor } from '../types';
import { ShieldCheck, ExternalLink, Send, Download, Upload, Flame, ToggleLeft, ToggleRight, Database, HelpCircle, Code2 } from 'lucide-react';

interface Props {
  settings: WorkspaceSettings;
  setSettings: (s: WorkspaceSettings) => void;
  tasks: Task[];
  setTasks: (t: Task[]) => void;
  programs: Program[];
  setPrograms: (p: Program[]) => void;
  editors: Editor[];
  setEditors: (e: Editor[]) => void;
  onReset: () => void;
  onSyncGoogleSheets: (id: string) => Promise<boolean>;
  onPushToGoogleSheets: () => Promise<void>;
  isPushing: boolean;
}

const SettingsView: React.FC<Props> = ({ 
  settings, setSettings, tasks, setTasks, programs, setPrograms, 
  editors, setEditors, onReset, onPushToGoogleSheets, isPushing 
}) => {
  const [jsonBackup, setJsonBackup] = useState('');
  const [fbConfigText, setFbConfigText] = useState(() => 
    settings.firebaseConfig ? JSON.stringify(settings.firebaseConfig, null, 2) : 
    `{
  "apiKey": "您的 API Key",
  "authDomain": "您的-專案-id.firebaseapp.com",
  "projectId": "您的-專案-id",
  "storageBucket": "您的-專案-id.appspot.com",
  "messagingSenderId": "145259527920",
  "appId": "1:145259527920:web:您的APP編號"
}`
  );

  const handleApplyFirebase = () => {
    try {
      const parsed = JSON.parse(fbConfigText);
      const required = ['apiKey', 'projectId', 'appId'];
      if (!required.every(k => k in parsed)) throw new Error("缺少必要欄位");
      
      setSettings({
        ...settings,
        firebaseConfig: parsed,
        useFirebase: true,
        syncStatus: 'syncing'
      });
      alert("✅ 配置已套用！系統正嘗試連線至 Firebase...");
    } catch (e) {
      alert("❌ 無效的 JSON 格式。請確認您貼入的是完整的 Firebase Config 對象。");
    }
  };

  const exportToJson = () => {
    const data = { tasks, programs, editors, settings };
    const str = btoa(unescape(encodeURIComponent(JSON.stringify(data))));
    setJsonBackup(str);
    navigator.clipboard.writeText(str);
    alert("✅ 物理備份代碼已複製！");
  };

  return (
    <div className="p-8 md:p-12 h-full overflow-y-auto bg-slate-50/30 custom-scrollbar flex flex-col max-w-6xl mx-auto pb-32">
      <div className="mb-10">
        <h2 className="text-3xl font-bold text-slate-800 tracking-tight flex items-center gap-3">
          系統中心 v8.0 <span className="text-orange-500 bg-orange-50 px-2 py-1 rounded-lg text-xs font-black">FIREBASE</span>
        </h2>
        <p className="text-slate-500 text-sm mt-1">即時同步、跨裝置協作與資料庫配置</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Firebase Panel */}
        <section className="bg-white p-8 rounded-[40px] border border-slate-200 shadow-sm space-y-8 flex flex-col">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 text-orange-600">
              <Flame size={24} />
              <h3 className="text-xl font-bold tracking-tight">雲端資料庫</h3>
            </div>
            <button 
              onClick={() => setSettings({...settings, useFirebase: !settings.useFirebase})}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-black uppercase transition-all ${settings.useFirebase ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}
            >
              {settings.useFirebase ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
              {settings.useFirebase ? '已啟動雲端' : '目前僅本地'}
            </button>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
               <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Firebase 配置 (JSON)</label>
               <a href="https://console.firebase.google.com/" target="_blank" className="text-[10px] font-black text-indigo-500 flex items-center gap-1 hover:underline">
                 前往控制台 <ExternalLink size={10} />
               </a>
            </div>
            
            <div className="relative group">
              <textarea 
                className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-5 text-[10px] font-mono h-56 outline-none focus:ring-4 ring-orange-500/10 transition-all text-slate-600"
                value={fbConfigText}
                onChange={e => setFbConfigText(e.target.value)}
              />
              <div className="absolute right-4 bottom-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm flex items-center gap-2">
                   <Code2 size={12} className="text-indigo-500" />
                   <span className="text-[9px] font-black text-slate-400 uppercase">JSON 格式</span>
                </div>
              </div>
            </div>

            <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100 space-y-2">
              <div className="flex items-center gap-2 text-amber-600">
                <HelpCircle size={14} />
                <span className="text-[10px] font-black uppercase tracking-widest">如何取得配置？</span>
              </div>
              <p className="text-[10px] text-amber-800 leading-relaxed font-medium">
                1. 進入 Firebase Console 專案設定。<br/>
                2. 找到「您的應用程式」並新增 Web APP。<br/>
                3. 複製 `firebaseConfig` 變數中的對象並貼於上方。
              </p>
            </div>
          </div>

          <div className="space-y-3 pt-4 border-t border-slate-100">
            <button onClick={handleApplyFirebase} className="w-full py-4 bg-orange-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-orange-600 transition-all shadow-lg shadow-orange-500/20">
              儲存並啟動連線
            </button>
            <button onClick={onPushToGoogleSheets} disabled={isPushing} className="w-full py-4 bg-slate-800 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-black transition-all flex items-center justify-center space-x-2">
              <Database size={16} className={isPushing ? 'animate-spin' : ''} />
              <span>將現有資料推送到 Firebase</span>
            </button>
          </div>
        </section>

        {/* Recovery Panel */}
        <section className="bg-slate-900 p-8 rounded-[40px] text-white space-y-8 flex flex-col">
          <div className="flex items-center space-x-3 text-emerald-400">
            <ShieldCheck size={24} />
            <h3 className="text-xl font-bold tracking-tight">物理救援防線</h3>
          </div>

          <div className="space-y-6 flex-1">
             <div className="bg-white/5 p-5 rounded-2xl border border-white/10">
                <p className="text-xs text-slate-400 leading-relaxed">
                  不論雲端發生什麼事，物理代碼是您最後的保險。建議每週將此代碼存入 Line 記事本。
                </p>
             </div>

             <div className="space-y-3">
               <button onClick={exportToJson} className="w-full py-4 bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-emerald-600/30 transition-all flex items-center justify-center gap-2">
                 <Download size={16} /> 匯出物理代碼
               </button>
               <textarea 
                 placeholder="貼上代碼..."
                 className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-[10px] font-mono h-32 outline-none focus:border-indigo-500 transition-all text-slate-300"
                 value={jsonBackup}
                 onChange={e => setJsonBackup(e.target.value)}
               />
               <button onClick={() => {
                  try {
                    const d = JSON.parse(decodeURIComponent(escape(atob(jsonBackup))));
                    if (confirm("確認覆蓋所有資料？")) {
                       setTasks(d.tasks || []);
                       setPrograms(d.programs || []);
                       setEditors(d.editors || []);
                       alert("✨ 物理恢復成功！");
                    }
                  } catch(e) { alert("代碼無效"); }
               }} className="w-full py-4 bg-indigo-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-600 transition-all">
                 <Upload size={16} className="inline mr-2" /> 從代碼恢復
               </button>
             </div>
          </div>
        </section>
      </div>

      <div className="mt-20 pt-8 border-t border-slate-200 flex items-center justify-between opacity-30">
        <span className="text-[10px] font-black uppercase tracking-[0.3em]">Firebase Engine v8.0 Ready</span>
        <button onClick={onReset} className="text-[10px] font-black text-red-400 uppercase tracking-widest hover:text-red-600">重置所有資料</button>
      </div>
    </div>
  );
};

export default SettingsView;
