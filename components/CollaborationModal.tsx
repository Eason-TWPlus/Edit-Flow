
import React, { useState } from 'react';
import { X, Copy, Check, Users, Shield, Smartphone, Monitor, Zap, MessageSquare, Download, Share2, Info, ChevronRight } from 'lucide-react';

interface Props {
  workspaceId: string;
  onClose: () => void;
  onJoinWorkspace: (id: string) => void;
}

const CollaborationModal: React.FC<Props> = ({ workspaceId, onClose, onJoinWorkspace }) => {
  const [copied, setCopied] = useState(false);
  const [snapshotCopied, setSnapshotCopied] = useState(false);
  const [importString, setImportString] = useState('');

  const generateSnapshot = () => {
    const cloudKey = `cloud_db_${workspaceId}`;
    const data = localStorage.getItem(cloudKey);
    if (data) {
      const base64 = btoa(unescape(encodeURIComponent(data)));
      navigator.clipboard.writeText(base64);
      setSnapshotCopied(true);
      setTimeout(() => setSnapshotCopied(false), 2000);
    }
  };

  const handleImportSnapshot = () => {
    try {
      const decoded = decodeURIComponent(escape(atob(importString)));
      const parsed = JSON.parse(decoded);
      if (parsed.tasks && parsed.programs) {
        const cloudKey = `cloud_db_${workspaceId}`;
        localStorage.setItem(cloudKey, JSON.stringify(parsed));
        alert('✨ 資料導入成功！');
        window.location.reload();
      }
    } catch (e) {
      alert('❌ 無效的代碼。');
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/90 backdrop-blur-xl animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-5xl rounded-[40px] shadow-2xl overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-300 flex flex-col md:flex-row max-h-[90vh]">
        
        {/* 左側：跨裝置編輯同步 */}
        <div className="flex-[1.2] p-8 md:p-12 flex flex-col overflow-y-auto custom-scrollbar">
          <div className="flex items-center space-x-3 mb-10">
            <div className="w-12 h-12 bg-indigo-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-600/20">
              <Share2 size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-black tracking-tighter uppercase italic text-slate-800">跨裝置編輯同步</h2>
              <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Cross-Device Freedom</p>
            </div>
          </div>
          
          <div className="space-y-10">
            {/* 核心功能：傳送門 */}
            <div className="bg-slate-50 p-6 rounded-[32px] border border-slate-200">
              <div className="flex items-center space-x-3 mb-4 text-indigo-600">
                <Smartphone size={18} />
                <span className="text-sm font-black uppercase italic">電腦 ⇄ 手機 同步流</span>
              </div>
              <p className="text-[11px] text-slate-500 mb-6 leading-relaxed font-medium">
                要在不同裝置編輯嗎？在電腦完成排程後點擊「複製代碼」，在手機開啟此頁面貼上即可。
              </p>
              
              <div className="flex flex-col space-y-3">
                <button 
                  onClick={generateSnapshot}
                  className={`w-full py-4 rounded-2xl font-black text-sm transition-all flex items-center justify-center space-x-3 shadow-xl ${
                    snapshotCopied ? 'bg-emerald-600 text-white' : 'bg-slate-900 text-white hover:scale-[1.02]'
                  }`}
                >
                  {snapshotCopied ? <Check size={18} /> : <Copy size={18} />}
                  <span className="uppercase tracking-widest">{snapshotCopied ? '代碼已複製' : '產生並複製同步代碼'}</span>
                </button>
                
                <div className="flex space-x-2">
                  <input 
                    type="text"
                    placeholder="在此貼上來自另一裝置的代碼..."
                    className="flex-1 bg-white border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold outline-none"
                    value={importString}
                    onChange={(e) => setImportString(e.target.value)}
                  />
                  <button 
                    onClick={handleImportSnapshot}
                    className="px-6 bg-indigo-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-700 transition-all"
                  >
                    載入
                  </button>
                </div>
              </div>
            </div>

            {/* APP 安裝指引 */}
            <div className="space-y-4">
               <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">如何安裝為手機 APP？</h4>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div className="p-5 bg-white border border-slate-100 rounded-3xl shadow-sm">
                    <p className="text-[11px] font-black text-slate-800 mb-2 flex items-center">
                      <ChevronRight size={14} className="text-indigo-500 mr-1" /> iOS (iPhone)
                    </p>
                    <p className="text-[10px] text-slate-400 font-medium">使用 Safari 開啟此網頁，點擊「分享」按鈕，選擇「加入主畫面」。</p>
                 </div>
                 <div className="p-5 bg-white border border-slate-100 rounded-3xl shadow-sm">
                    <p className="text-[11px] font-black text-slate-800 mb-2 flex items-center">
                      <ChevronRight size={14} className="text-indigo-500 mr-1" /> Android
                    </p>
                    <p className="text-[10px] text-slate-400 font-medium">使用 Chrome 開啟，點擊右上角「...」，選擇「安裝應用程式」。</p>
                 </div>
               </div>
            </div>
          </div>
          
          <button 
            onClick={onClose}
            className="mt-12 py-4 text-slate-400 font-bold text-xs uppercase tracking-widest hover:text-slate-900 transition-colors border-t border-slate-100"
          >
            ← 返回排程中心
          </button>
        </div>

        {/* 右側：原理與安全性 */}
        <div className="flex-1 bg-slate-900 p-8 md:p-12 flex flex-col text-white">
          <div className="flex items-center space-x-2 mb-10 opacity-50">
            <Monitor size={20} className="text-indigo-400" />
            <h3 className="text-xs font-black uppercase tracking-widest">Hybrid Workspace</h3>
          </div>

          <div className="space-y-10 flex-1">
            <div className="space-y-4">
              <h4 className="text-sm font-black uppercase tracking-widest text-indigo-400">為什麼這樣能編輯？</h4>
              <p className="text-xs text-slate-400 leading-relaxed font-medium">
                本系統採用 **Local-First** 技術，你的資料存放在瀏覽器的「保險箱」裡。當你將它安裝為手機 APP 後，它會擁有獨立的保險箱。
              </p>
              <div className="bg-white/5 p-6 rounded-3xl border border-white/10 mt-6">
                <div className="flex items-center space-x-3 mb-3">
                  <Info size={16} className="text-indigo-400" />
                  <span className="text-[11px] font-bold text-slate-200">重要提示</span>
                </div>
                <p className="text-[10px] text-slate-500 leading-relaxed">
                  因為資料不經過雲端伺服器（免費方案），編輯完後請務必使用「同步代碼」來確保兩邊資料一致。這也是保護資料不外洩到公網的最佳方式。
                </p>
              </div>
            </div>
          </div>

          <div className="mt-12 pt-6 border-t border-white/5 flex items-center justify-between">
               <span className="text-[9px] font-black text-slate-500 uppercase tracking-[0.3em]">Standalone Mode v1.2</span>
               <div className="flex items-center space-x-2">
                 <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse"></div>
                 <span className="text-[9px] font-black text-indigo-500 uppercase">PWA Ready</span>
               </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default CollaborationModal;
