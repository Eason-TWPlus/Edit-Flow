
import React, { useState, useEffect } from 'react';
import { Task, Program, Editor } from '../types.ts';
import { X, Trash2, Calendar, Layout, User, ChevronLeft, Clock, Activity, Layers } from 'lucide-react';
import { format } from 'date-fns';
import zhTW from 'date-fns/locale/zh-TW';

interface TaskModalProps {
  task: Task | null;
  programs: Program[];
  editors: Editor[];
  onClose: () => void;
  onSave: (task: Task) => void;
  onDelete: (id: string) => void;
  isMobile?: boolean;
}

const TaskModal: React.FC<TaskModalProps> = ({ task, programs, editors, onClose, onSave, onDelete, isMobile }) => {
  const [formData, setFormData] = useState<Omit<Task, 'id' | 'lastEditedAt' | 'version'>>({
    show: programs[0]?.name || '',
    episode: '',
    editor: editors[0]?.name || '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    notes: ''
  });

  useEffect(() => {
    if (task) {
      setFormData({
        show: task.show,
        episode: task.episode,
        editor: task.editor,
        startDate: task.startDate,
        endDate: task.endDate,
        notes: task.notes || ''
      });
    }
  }, [task]);

  const containerClasses = isMobile 
    ? "fixed inset-0 z-50 bg-white flex flex-col" 
    : "fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm";
    
  const contentClasses = isMobile 
    ? "flex-1 overflow-y-auto" 
    : "bg-white w-full max-w-xl rounded-[40px] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 border border-slate-200";

  return (
    <div className={containerClasses}>
      <div className={contentClasses}>
        <div className={`${isMobile ? 'px-6 py-4' : 'p-8'} border-b border-slate-100 bg-white sticky top-0 z-10`}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-3">
              {isMobile && <button onClick={onClose} className="p-1"><ChevronLeft size={24} /></button>}
              <h2 className={`${isMobile ? 'text-xl' : 'text-2xl'} font-black tracking-tighter uppercase italic text-slate-800`}>
                {task ? '編輯排程項目' : '建立新製作任務'}
              </h2>
            </div>
            {!isMobile && (
              <button onClick={onClose} className="w-10 h-10 bg-slate-50 flex items-center justify-center rounded-2xl hover:bg-slate-100 transition-all text-slate-400">
                <X size={20} />
              </button>
            )}
          </div>
          <div className="flex items-center space-x-4">
             <div className="flex items-center space-x-1.5">
               <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
               <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">正在進行雲端同步</span>
             </div>
             {task?.lastEditedAt && (
               <div className="flex items-center space-x-1.5 text-slate-300">
                 <Clock size={12} />
                 <span className="text-[10px] font-bold">最後更新：{format(new Date(task.lastEditedAt), 'HH:mm', { locale: zhTW })}</span>
               </div>
             )}
          </div>
        </div>

        <form onSubmit={(e) => { e.preventDefault(); onSave({ id: task?.id || '', ...formData, lastEditedAt: new Date().toISOString(), version: (task?.version || 0) + 1 }); }} className={`${isMobile ? 'p-6 pb-24' : 'p-10'} space-y-8`}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="md:col-span-2">
              <label className="flex items-center space-x-2 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">
                <Layout size={12} /> <span>節目資產項目</span>
              </label>
              <select 
                value={formData.show}
                onChange={e => setFormData({ ...formData, show: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 px-5 focus:ring-4 ring-indigo-500/10 focus:border-indigo-500 outline-none font-bold text-slate-700 transition-all appearance-none"
              >
                {programs.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">集數識別 (Episode)</label>
              <input 
                type="text" required value={formData.episode}
                onChange={e => setFormData({ ...formData, episode: e.target.value })}
                placeholder="例如: EP201"
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 px-5 focus:ring-4 ring-indigo-500/10 focus:border-indigo-500 outline-none font-bold transition-all"
              />
            </div>

            <div className="md:col-span-2">
              <label className="flex items-center space-x-2 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">
                <User size={12} /> <span>指派剪輯師</span>
              </label>
              <select 
                value={formData.editor}
                onChange={e => setFormData({ ...formData, editor: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 px-5 focus:ring-4 ring-indigo-500/10 focus:border-indigo-500 outline-none font-bold transition-all appearance-none"
              >
                {editors.map(e => <option key={e.id} value={e.name}>{e.name}</option>)}
              </select>
            </div>

            <div>
              <label className="flex items-center space-x-2 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">
                <Calendar size={12} /> <span>製作開始日</span>
              </label>
              <input 
                type="date" required value={formData.startDate}
                onChange={e => setFormData({ ...formData, startDate: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 px-5 focus:ring-4 ring-indigo-500/10 focus:border-indigo-500 outline-none font-bold transition-all"
              />
            </div>

            <div>
              <label className="flex items-center space-x-2 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">
                <Calendar size={12} /> <span>交播日期</span>
              </label>
              <input 
                type="date" required value={formData.endDate}
                onChange={e => setFormData({ ...formData, endDate: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 px-5 focus:ring-4 ring-indigo-500/10 focus:border-indigo-500 outline-none font-bold transition-all"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">製作備註 (Notes)</label>
              <textarea 
                value={formData.notes}
                onChange={e => setFormData({ ...formData, notes: e.target.value })}
                placeholder="輸入給團隊的特別指示、素材位置或製作重點..."
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 px-5 h-32 outline-none focus:ring-4 ring-indigo-500/10 focus:border-indigo-500 transition-all font-medium"
              />
            </div>
          </div>

          <div className={`flex items-center space-x-4 pt-4 ${isMobile ? 'fixed bottom-0 left-0 right-0 p-6 bg-white border-t border-slate-100 safe-area-bottom' : ''}`}>
            <button type="submit" className="flex-1 py-5 bg-slate-900 text-white rounded-2xl font-black shadow-2xl hover:bg-black transition-all uppercase tracking-[0.2em] text-sm active:scale-95">
              {task ? '儲存異動並同步' : '發佈製作任務'}
            </button>
            {task && (
              <button 
                type="button" 
                onClick={() => { if(confirm('確定要移除此製作項目？')) onDelete(task.id); }} 
                className="w-16 h-16 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center hover:bg-red-500 hover:text-white transition-all shrink-0 active:scale-95"
              >
                <Trash2 size={24} />
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default TaskModal;
