
import React, { useRef, useState } from 'react';
import { WorkspaceSettings, Task, Program, Editor } from '../types';
import { Building, ShieldCheck, Database, FileJson, FileText, UploadCloud, AlertCircle, Github, Server, CheckCircle2, Table, RefreshCw, ExternalLink } from 'lucide-react';

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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  const escapeCSV = (str: string | undefined) => {
    const text = str ? String(str) : "";
    return `"${text.replace(/"/g, '""')}"`;
  };

  const exportData = (format: 'json' | 'csv') => {
    const data = { tasks, programs, editors, settings };
    if (format === 'json') {
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `editflow_backup_${settings.id}.json`; a.click();
    } else {
      // 針對 Google Sheets 優化的 CSV 欄位順序
      const headers = ['ID', 'Show', 'Episode', 'Editor', 'StartDate', 'EndDate', 'Notes'].map(escapeCSV).join(',');
      const rows = tasks.map(t => [
        t.id, t.show, t.episode, t.editor, t.startDate, t.endDate, t.notes || ''
      ].map(escapeCSV).join(','));
      const csvContent = '\uFEFF' + [headers, ...rows].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `google_sheets_import_${Date.now()}.csv`; a.click();
    }
  };

  const handleGoogleSync = async () => {
    if (!settings.googleSheetId) return alert("請先輸入 Google Sheet ID");
    setIsSyncing(true);
    const success = await onSyncGoogleSheets(settings.googleSheetId);
    setIsSyncing(false);
    if (success) alert("✅ 同步完成！");
  };

  return (
    <div className="p-8 md:p-12 h-full overflow-y-auto bg-slate-50/30 custom-scrollbar flex flex-col max-w-6xl mx-auto">
      <div className="mb-12 flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-slate-800 tracking-tight">外部資料與系統設定</h2>
          <p className="text-slate-500 text-sm mt-1">串接外部 Google Sheets 作為資料來源，實現雲端排程管理</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
        
        {/* Google Sheets 整合面板 */}
        <section className="bg-emerald-50/50 p-8 rounded-3xl border border-emerald-100 shadow-sm flex flex-col relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <Table size={120} className="text-emerald-900" />
          </div>
          
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-2 bg-emerald-600 text-white rounded-lg shadow-lg"><Table size={20} /></div>
            <h3 className="text-lg font-bold text-emerald-900">Google Sheets 外部整合</h3>
          </div>

          <div className="space-y-6 flex-1 relative z-10">
            <div>
              <label className="block text-[10px] font-black text-emerald-600/60 uppercase mb-2 tracking-widest flex items-center justify-between">
                <span>試算表 ID (Spreadsheet ID)</span>
                {settings.googleSheetId && (
                  <a href={`https://docs.google.com/spreadsheets/d/${settings.googleSheetId}`} target="_blank" rel="noreferrer" className="flex items-center hover:underline">
                    查看表單 <ExternalLink size={10} className="ml-1"/>
                  </a>
                )}
              </label>
              <input 
                placeholder="例如: 1FWZXvZjghfOjT8JkW..."
                className="w-full bg-white border border-emerald-200 rounded-2xl px-5 py-3 text-sm font-bold outline-none focus:ring-4 ring-emerald-500/10 focus:border-emerald-500 transition-all"
                value={settings.googleSheetId || ''}
                onChange={e => setSettings({...settings, googleSheetId: e.target.value})}
              />
            </div>

            <div className="bg-white p-5 rounded-2xl border border-emerald-100 space-y-3">
              <p className="text-[11px] text-emerald-700 leading-relaxed">
                <b>同步原理：</b>系統會從指定試算表的第一個工作表抓取資料。請確保試算表已開啟「知道連結的使用者即可檢視」權限。
              </p>
              <button 
                onClick={handleGoogleSync}
                disabled={isSyncing}
                className="w-full flex items-center justify-center space-x-2 py-4 bg-emerald-600 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-emerald-700 active:scale-95 transition-all shadow-lg disabled:opacity-50"
              >
                {isSyncing ? <RefreshCw size={16} className="animate-spin" /> : <RefreshCw size={16} />}
                <span>從 Google Sheets 拉取資料</span>
              </button>
            </div>
          </div>
        </section>

        {/* 本地資料備份 */}
        <section className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm flex flex-col">
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg"><Database size={20} /></div>
            <h3 className="text-lg font-bold text-slate-800">資料手動備份</h3>
          </div>
          
          <div className="space-y-4 flex-1">
            <div className="flex gap-4">
              <button 
                onClick={() => exportData('csv')}
                className="flex-1 flex flex-col items-center justify-center p-6 bg-slate-50 rounded-2xl hover:bg-slate-100 transition-all border border-slate-200 group"
              >
                <FileText className="text-slate-400 group-hover:text-emerald-500 mb-2" size={24} />
                <span className="text-xs font-bold text-slate-700">下載表單 CSV</span>
                <span className="text-[9px] text-slate-400 mt-1">匯出後可上傳至 Google Sheet</span>
              </button>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
               <p className="text-[10px] text-slate-400 font-medium leading-relaxed">
                 若要將此 App 的資料導入 Google Sheet，請下載 CSV 後，在試算表中選擇「檔案 > 匯入 > 上傳」，並選擇此 CSV 檔案。
               </p>
            </div>
          </div>
        </section>
      </div>

      <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm mb-12">
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-2 bg-slate-100 text-slate-600 rounded-lg"><Building size={20} /></div>
          <h3 className="text-lg font-bold text-slate-800">基本空間設定</h3>
        </div>
        <div>
          <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest">組織顯示名稱</label>
          <input 
            className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3 text-lg font-semibold outline-none focus:ring-2 ring-indigo-500/20 focus:border-indigo-500 transition-all"
            value={settings.companyName}
            onChange={e => setSettings({...settings, companyName: e.target.value})}
          />
        </div>
      </div>

      <div className="mt-auto flex items-center justify-between opacity-30 py-8 border-t border-slate-100">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em]">Build v2.5.0 - Sheets Sync Active</span>
        <button onClick={onReset} className="text-[10px] font-bold text-red-400 uppercase tracking-widest hover:text-red-600">重置所有資料</button>
      </div>
    </div>
  );
};

export default SettingsView;
