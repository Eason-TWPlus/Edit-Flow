
import React, { useRef } from 'react';
import { WorkspaceSettings, Task, Program, Editor } from '../types';
import { Building, ShieldCheck, Database, FileJson, FileText, UploadCloud, AlertCircle, Github, Server, CheckCircle2 } from 'lucide-react';

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
}

const SettingsView: React.FC<Props> = ({ settings, setSettings, tasks, setTasks, programs, setPrograms, editors, setEditors, onReset }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      const headers = ['ID', '節目', '集數', '剪輯師', '開始日', '結束日', '備註'].map(escapeCSV).join(',');
      const rows = tasks.map(t => [
        t.id, t.show, t.episode, t.editor, t.startDate, t.endDate, t.notes || ''
      ].map(escapeCSV).join(','));
      const csvContent = '\uFEFF' + [headers, ...rows].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `tp_report_${Date.now()}.csv`; a.click();
    }
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        if (data.tasks && data.programs && data.editors) {
          if (confirm('確定要導入備份嗎？這將會覆蓋掉目前瀏覽器中的所有排程資料！')) {
            setTasks(data.tasks);
            setPrograms(data.programs);
            setEditors(data.editors);
            if (data.settings) setSettings({ ...data.settings, syncStatus: 'synced' });
            alert('資料還原成功！');
          }
        } else {
          alert('無效的備份檔案格式');
        }
      } catch (err) {
        alert('檔案讀取失敗，請確保上傳的是正確的 JSON 備份檔。');
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="p-8 md:p-12 h-full overflow-y-auto bg-slate-50/30 custom-scrollbar flex flex-col max-w-6xl mx-auto">
      <div className="mb-12 flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-slate-800 tracking-tight">系統與開發者設定</h2>
          <p className="text-slate-500 text-sm mt-1">管理工作空間、團隊同步與 GitHub 協作狀態</p>
        </div>
        <div className="hidden md:flex items-center space-x-2 px-4 py-2 bg-slate-900 text-white rounded-full">
          <Github size={14} />
          <span className="text-[10px] font-bold uppercase tracking-widest">Linked to GitHub Main</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
        {/* 基本設定 */}
        <section className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm flex flex-col">
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg"><Building size={20} /></div>
            <h3 className="text-lg font-bold text-slate-800">工作空間識別</h3>
          </div>
          <div className="space-y-6 flex-1">
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest">組織名稱</label>
              <input 
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3 text-lg font-semibold outline-none focus:ring-2 ring-indigo-500/20 focus:border-indigo-500 transition-all"
                value={settings.companyName}
                onChange={e => setSettings({...settings, companyName: e.target.value})}
              />
            </div>
            
            <div className="p-5 bg-slate-900 rounded-2xl text-white">
              <div className="flex items-center space-x-2 mb-3">
                <CheckCircle2 size={16} className="text-emerald-400" />
                <span className="text-xs font-bold uppercase tracking-widest">GitHub 同步狀態：已啟動</span>
              </div>
              <p className="text-[10px] text-slate-400 leading-relaxed font-medium">
                此應用的程式碼已託管於 GitHub。同事對程式碼的任何修改（例如 UI 色彩調整）將在 <code>git pull</code> 後生效。
              </p>
            </div>
          </div>
        </section>

        {/* 雲端資料同步專區 */}
        <section className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm flex flex-col">
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg"><Server size={20} /></div>
            <h3 className="text-lg font-bold text-slate-800">真實雲端資料庫 (Enterprise)</h3>
          </div>
          
          <div className="space-y-4 flex-1">
            <div className="p-5 bg-amber-50 rounded-2xl border border-amber-100 flex items-start space-x-3">
              <AlertCircle className="text-amber-500 mt-0.5 shrink-0" size={18} />
              <div className="text-xs text-amber-700 leading-relaxed">
                <p className="font-bold mb-1">目前處於「虛擬雲端同步」模式</p>
                <p>GitHub 僅同步程式碼。排程資料目前透過本地緩存同步，如需自動化同步，請連動 Firebase 服務。</p>
              </div>
            </div>

            <div className="flex gap-4">
              <button 
                onClick={() => exportData('json')}
                className="flex-1 flex flex-col items-center justify-center p-6 bg-slate-50 rounded-2xl hover:bg-slate-100 transition-all border border-slate-200 group"
              >
                <FileJson className="text-slate-400 group-hover:text-indigo-500 mb-2" size={24} />
                <span className="text-xs font-bold text-slate-700">下載備份檔</span>
              </button>
              
              <button 
                onClick={() => exportData('csv')}
                className="flex-1 flex flex-col items-center justify-center p-6 bg-slate-50 rounded-2xl hover:bg-slate-100 transition-all border border-slate-200 group"
              >
                <FileText className="text-slate-400 group-hover:text-emerald-500 mb-2" size={24} />
                <span className="text-xs font-bold text-slate-700">下載報表 (CSV)</span>
              </button>
            </div>

            <input type="file" ref={fileInputRef} onChange={handleImport} accept=".json" className="hidden" />
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="w-full flex items-center justify-center space-x-3 p-5 bg-indigo-600 rounded-2xl hover:bg-indigo-700 transition-all text-white shadow-lg shadow-indigo-600/20"
            >
              <UploadCloud size={20} />
              <span className="font-bold uppercase tracking-widest text-xs">手動還原同事的備份</span>
            </button>
          </div>
        </section>
      </div>

      <div className="mt-auto flex items-center justify-between opacity-30 py-8 border-t border-slate-100">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em]">Build v2.4.0 - Production</span>
        <button onClick={onReset} className="text-[10px] font-bold text-red-400 uppercase tracking-widest hover:text-red-600">重置所有雲端快取資料</button>
      </div>
    </div>
  );
};

export default SettingsView;
