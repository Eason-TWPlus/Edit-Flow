
import React, { useRef, useState } from 'react';
import { WorkspaceSettings, Task, Program, Editor } from '../types';
import { Building, ShieldCheck, Database, FileJson, FileText, UploadCloud, AlertCircle, Github, Server, CheckCircle2, Table, RefreshCw, ExternalLink, Code2, Link2, Send } from 'lucide-react';

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
  editors, setEditors, onReset, onSyncGoogleSheets, onPushToGoogleSheets, isPushing 
}) => {
  const [isSyncing, setIsSyncing] = useState(false);

  const handleGoogleSync = async () => {
    if (!settings.googleSheetId) return alert("請先輸入 Google Sheet ID");
    setIsSyncing(true);
    const success = await onSyncGoogleSheets(settings.googleSheetId);
    setIsSyncing(false);
    if (success) alert("✅ 下載同步完成！");
  };

  const appsScriptTemplate = `function doPost(e) {
  var data = JSON.parse(e.postData.contents);
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
  
  if (data.action === 'sync_tasks') {
    // 1. 清空舊資料 (保留第一行 Header)
    if (sheet.getLastRow() > 1) {
      sheet.getRange(2, 1, sheet.getLastRow() - 1, sheet.getLastColumn()).clearContent();
    }
    
    // 2. 轉換資料格式回試算表欄位 (對應: 節目, 集數, 剪輯, 開始, 結束, 備註)
    var rows = data.tasks.map(function(t) {
      return [t.show, t.episode, t.editor, t.startDate, t.endDate, t.notes || ''];
    });
    
    // 3. 寫入新資料
    if (rows.length > 0) {
      sheet.getRange(2, 1, rows.length, 6).setValues(rows);
    }
    
    return ContentService.createTextOutput("Success").setMimeType(ContentService.MimeType.TEXT);
  }
}`;

  return (
    <div className="p-8 md:p-12 h-full overflow-y-auto bg-slate-50/30 custom-scrollbar flex flex-col max-w-6xl mx-auto">
      <div className="mb-12">
        <h2 className="text-3xl font-bold text-slate-800 tracking-tight">雲端同步中心</h2>
        <p className="text-slate-500 text-sm mt-1">確保您的試算表與 App 資料始終同步</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
        
        {/* 左側：設定 */}
        <section className="bg-white p-8 rounded-[40px] border border-slate-200 shadow-sm space-y-8 flex flex-col">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-indigo-600 text-white rounded-xl shadow-lg shadow-indigo-500/20"><Link2 size={20} /></div>
            <h3 className="text-lg font-bold text-slate-800 tracking-tight">連線設定</h3>
          </div>

          <div className="space-y-6 flex-1">
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest">
                Google Sheet ID (唯讀來源)
              </label>
              <input 
                placeholder="1FWZXvZjghfOjT8JkW-SGZMrLCP3oyI7K3I71kEUmc1w"
                className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-3 text-xs font-bold outline-none focus:ring-4 ring-indigo-500/10 focus:border-indigo-500 transition-all"
                value={settings.googleSheetId || ''}
                onChange={e => setSettings({...settings, googleSheetId: e.target.value})}
              />
            </div>

            <div className="pt-4 border-t border-slate-100">
              <label className="block text-[10px] font-black text-orange-500 uppercase mb-2 tracking-widest flex items-center justify-between">
                <span>Apps Script 網頁應用程式 URL</span>
                {!settings.googleSheetWriteUrl && <span className="animate-pulse text-red-500">尚未填寫</span>}
              </label>
              <input 
                placeholder="https://script.google.com/macros/s/.../exec"
                className={`w-full bg-orange-50/30 border rounded-2xl px-5 py-3 text-xs font-bold outline-none focus:ring-4 ring-orange-500/10 focus:border-orange-500 transition-all ${!settings.googleSheetWriteUrl ? 'border-orange-200' : 'border-slate-100'}`}
                value={settings.googleSheetWriteUrl || ''}
                onChange={e => setSettings({...settings, googleSheetWriteUrl: e.target.value})}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3">
            <button 
              onClick={handleGoogleSync}
              disabled={isSyncing}
              className="w-full py-4 bg-slate-100 text-slate-600 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-200 transition-all flex items-center justify-center space-x-2"
            >
              <RefreshCw size={16} className={isSyncing ? 'animate-spin' : ''} />
              <span>從雲端「下載」最新資料</span>
            </button>
            <button 
              onClick={onPushToGoogleSheets}
              disabled={isPushing || !settings.googleSheetWriteUrl}
              className={`w-full py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center space-x-2 shadow-xl ${isPushing ? 'bg-orange-400' : 'bg-orange-500 hover:bg-orange-600'} text-white`}
            >
              {isPushing ? <RefreshCw size={16} className="animate-spin" /> : <Send size={16} />}
              <span>強制全數同步回雲端 (Force Push)</span>
            </button>
          </div>
        </section>

        {/* 右側：Apps Script 代碼與指南 */}
        <section className="bg-slate-900 p-8 rounded-[40px] text-white space-y-6 flex flex-col">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-indigo-500 text-white rounded-xl"><Code2 size={20} /></div>
            <h3 className="text-lg font-black tracking-tight italic">雙向同步：後端設定</h3>
          </div>

          <div className="space-y-4 text-xs leading-relaxed text-slate-400">
            <p><span className="text-indigo-400 font-black">Step 1:</span> 在 Google Sheets 中點選「擴充功能 &gt; Apps Script」。</p>
            <p><span className="text-indigo-400 font-black">Step 2:</span> 清除原本內容，貼入下方藍色區塊代碼。</p>
            <p><span className="text-indigo-400 font-black">Step 3:</span> 點選右上角「部署 &gt; 新部署」。類型選「網頁應用程式」。</p>
            <p><span className="text-indigo-400 font-black">Step 4:</span> 誰可以存取設為「任何人 (Anyone)」，複製生成的網址貼到左邊。</p>
          </div>

          <div className="bg-white/5 rounded-2xl p-4 font-mono text-[9px] text-indigo-300 border border-white/10 overflow-x-auto relative group">
             <button 
               onClick={() => { navigator.clipboard.writeText(appsScriptTemplate); alert("代碼已複製！"); }}
               className="absolute top-2 right-2 bg-white/10 hover:bg-white/20 text-white p-2 rounded-lg transition-all opacity-0 group-hover:opacity-100"
             >
               複製代碼
             </button>
             <pre>{appsScriptTemplate}</pre>
          </div>
        </section>
      </div>

      <div className="mt-auto opacity-30 py-8 border-t border-slate-200 flex items-center justify-between">
        <span className="text-[10px] font-black uppercase tracking-[0.3em]">Build v7.1.0 - Resync Engine</span>
        <button onClick={onReset} className="text-[10px] font-black text-red-400 uppercase tracking-widest hover:text-red-600">清除快取並重啟</button>
      </div>
    </div>
  );
};

export default SettingsView;
