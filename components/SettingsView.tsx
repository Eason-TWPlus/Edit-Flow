
import React, { useRef, useState } from 'react';
import { WorkspaceSettings, Task, Program, Editor } from '../types';
import { Building, ShieldCheck, Database, FileJson, FileText, UploadCloud, AlertCircle, Github, Server, CheckCircle2, Table, RefreshCw, ExternalLink, Code2, Link2 } from 'lucide-react';

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
}

const SettingsView: React.FC<Props> = ({ settings, setSettings, tasks, setTasks, programs, setPrograms, editors, setEditors, onReset, onSyncGoogleSheets }) => {
  const [isSyncing, setIsSyncing] = useState(false);

  const handleGoogleSync = async () => {
    if (!settings.googleSheetId) return alert("請先輸入 Google Sheet ID");
    setIsSyncing(true);
    const success = await onSyncGoogleSheets(settings.googleSheetId);
    setIsSyncing(false);
    if (success) alert("✅ 同步完成！");
  };

  const appsScriptTemplate = `function doPost(e) {
  var data = JSON.parse(e.postData.contents);
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
  
  if (data.action === 'sync_tasks') {
    // 1. 清空舊資料 (保留第一行 Header)
    if (sheet.getLastRow() > 1) {
      sheet.getRange(2, 1, sheet.getLastRow() - 1, sheet.getLastColumn()).clearContent();
    }
    
    // 2. 轉換資料格式回試算表欄位
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
        <h2 className="text-3xl font-bold text-slate-800 tracking-tight">雲端同步與系統設定</h2>
        <p className="text-slate-500 text-sm mt-1">建立 App 與 Google Sheets 之間的雙向橋樑</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
        
        {/* 左側：雙向同步設定 */}
        <section className="bg-white p-8 rounded-[40px] border border-slate-200 shadow-sm space-y-8 flex flex-col">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-indigo-600 text-white rounded-xl shadow-lg shadow-indigo-500/20"><Link2 size={20} /></div>
            <h3 className="text-lg font-bold text-slate-800 tracking-tight">雙向同步 (雲端回傳)</h3>
          </div>

          <div className="space-y-6 flex-1">
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest">
                1. 試算表 ID (唯讀來源)
              </label>
              <input 
                placeholder="例如: 1FWZXvZjghfOjT8JkW..."
                className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-3 text-xs font-bold outline-none focus:ring-4 ring-indigo-500/10 focus:border-indigo-500 transition-all"
                value={settings.googleSheetId || ''}
                onChange={e => setSettings({...settings, googleSheetId: e.target.value})}
              />
            </div>

            <div className="pt-4 border-t border-slate-100">
              <label className="block text-[10px] font-black text-orange-500 uppercase mb-2 tracking-widest flex items-center justify-between">
                <span>2. 寫入代理 URL (Webhook URL)</span>
                <span className="text-[8px] bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full">高階功能</span>
              </label>
              <input 
                placeholder="https://script.google.com/macros/s/.../exec"
                className="w-full bg-orange-50/30 border border-orange-100 rounded-2xl px-5 py-3 text-xs font-bold outline-none focus:ring-4 ring-orange-500/10 focus:border-orange-500 transition-all"
                value={settings.googleSheetWriteUrl || ''}
                onChange={e => setSettings({...settings, googleSheetWriteUrl: e.target.value})}
              />
              <p className="text-[10px] text-slate-400 mt-2 leading-relaxed">
                填入此 URL 後，當您在 App 修改排程時，Header 會出現橘色同步按鈕，將異動推回 Google Sheets。
              </p>
            </div>
          </div>

          <button 
            onClick={handleGoogleSync}
            disabled={isSyncing}
            className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-black transition-all flex items-center justify-center space-x-2 shadow-xl"
          >
            {isSyncing ? <RefreshCw size={16} className="animate-spin" /> : <RefreshCw size={16} />}
            <span>僅執行「下載」同步 (Pull)</span>
          </button>
        </section>

        {/* 右側：Apps Script 代碼與指南 */}
        <section className="bg-slate-900 p-8 rounded-[40px] text-white space-y-6 flex flex-col">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-indigo-500 text-white rounded-xl"><Code2 size={20} /></div>
            <h3 className="text-lg font-black tracking-tight italic">雙向同步指南</h3>
          </div>

          <div className="space-y-4 text-xs leading-relaxed text-slate-400">
            <p><span className="text-indigo-400 font-black">Step 1:</span> 開啟試算表，點擊「擴充功能 &gt; Apps Script」。</p>
            <p><span className="text-indigo-400 font-black">Step 2:</span> 貼入下方代碼並點擊儲存。</p>
            <p><span className="text-indigo-400 font-black">Step 3:</span> 點擊「部署 &gt; 新部署」，選「網頁應用程式」，並設為「任何人」可存取。</p>
            <p><span className="text-indigo-400 font-black">Step 4:</span> 複製部署後的網址，貼回左側欄位。</p>
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
        <span className="text-[10px] font-black uppercase tracking-[0.3em]">Build v2.7.5 - Bidirectional Alpha</span>
        <button onClick={onReset} className="text-[10px] font-black text-red-400 uppercase tracking-widest hover:text-red-600">重置本地快取</button>
      </div>
    </div>
  );
};

export default SettingsView;
