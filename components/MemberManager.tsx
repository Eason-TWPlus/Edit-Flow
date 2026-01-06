
import React, { useState, useMemo } from 'react';
import { Editor, Task } from '../types';
import { UserPlus, Trash2, Award, Check, X, BarChart2 } from 'lucide-react';
// Fix: split date-fns imports to use direct paths for members reported as missing from the main index
import { endOfMonth, isWithinInterval } from 'date-fns';
import startOfMonth from 'date-fns/startOfMonth';
import parseISO from 'date-fns/parseISO';

interface Props {
  editors: Editor[];
  setEditors: React.Dispatch<React.SetStateAction<Editor[]>>;
  tasks: Task[];
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
}

const MemberManager: React.FC<Props> = ({ editors, setEditors, tasks, setTasks }) => {
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formState, setFormState] = useState({ name: '', role: '', color: '#000000', notes: '' });

  const currentMonth = { start: startOfMonth(new Date()), end: endOfMonth(new Date()) };

  const handleSave = () => {
    if (!formState.name) return;

    if (editingId) {
      const oldEditor = editors.find(e => e.id === editingId);
      if (oldEditor && oldEditor.name !== formState.name) {
        // 同步更新所有相關排程的剪輯師名稱
        setTasks(prev => prev.map(t => t.editor === oldEditor.name ? { ...t, editor: formState.name } : t));
      }
      setEditors(prev => prev.map(e => e.id === editingId ? { ...e, ...formState } : e));
    } else {
      setEditors(prev => [...prev, { id: 'e' + Date.now(), ...formState }]);
    }

    resetForm();
  };

  const resetForm = () => {
    setFormState({ name: '', role: '', color: '#000000', notes: '' });
    setEditingId(null);
    setShowAdd(false);
  };

  const startEdit = (editor: Editor) => {
    setFormState({ name: editor.name, role: editor.role, color: editor.color, notes: editor.notes });
    setEditingId(editor.id);
    setShowAdd(true);
  };

  return (
    <div className="p-10 h-full overflow-y-auto custom-scrollbar">
      <div className="flex items-center justify-between mb-10">
        <div>
          <h2 className="text-4xl font-black tracking-tighter uppercase italic">團隊成員</h2>
          <p className="text-zinc-400 text-sm font-bold mt-1 uppercase tracking-widest">Editor Capacity & Statistics</p>
        </div>
        <button 
          onClick={() => { resetForm(); setShowAdd(true); }}
          className="bg-black text-white px-8 py-4 rounded-2xl font-black flex items-center space-x-2 hover:bg-zinc-800 transition-all shadow-xl shadow-black/10"
        >
          <UserPlus size={20} />
          <span>新增成員</span>
        </button>
      </div>

      {showAdd && (
        <div className="mb-12 p-10 bg-zinc-50 rounded-[48px] border-2 border-black/5 animate-in slide-in-from-top-4">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-black uppercase tracking-widest">{editingId ? '編輯成員資料' : '建立新成員檔案'}</h3>
            <button onClick={resetForm} className="text-zinc-300 hover:text-black"><X size={24}/></button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-zinc-400 ml-2">成員姓名</label>
              <input 
                placeholder="例如: James Chen" 
                className="w-full bg-white border border-zinc-200 rounded-2xl px-6 py-4 outline-none focus:ring-2 ring-black font-bold text-lg"
                value={formState.name}
                onChange={e => setFormState({...formState, name: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-zinc-400 ml-2">職位名稱</label>
              <input 
                placeholder="例如: Senior Editor" 
                className="w-full bg-white border border-zinc-200 rounded-2xl px-6 py-4 outline-none focus:ring-2 ring-black font-bold text-lg"
                value={formState.role}
                onChange={e => setFormState({...formState, role: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-zinc-400 ml-2">識別顏色</label>
              <div className="flex space-x-4">
                <input 
                  type="color" 
                  className="w-16 h-16 rounded-2xl cursor-pointer border border-zinc-200 p-1 bg-white"
                  value={formState.color}
                  onChange={e => setFormState({...formState, color: e.target.value})}
                />
                <button onClick={handleSave} className="flex-1 bg-black text-white rounded-2xl font-black uppercase tracking-widest flex items-center justify-center space-x-2 shadow-lg hover:scale-[1.02] transition-all">
                  <Check size={20}/> <span>儲存設定</span>
                </button>
              </div>
            </div>
            <div className="col-span-1 md:col-span-3 space-y-2">
              <label className="text-[10px] font-black uppercase text-zinc-400 ml-2">個人註記 / 專長描述</label>
              <textarea 
                placeholder="輸入成員的專長項目或是負責的特定節目規範..." 
                className="w-full bg-white border border-zinc-200 rounded-2xl px-6 py-4 outline-none focus:ring-2 ring-black font-medium h-32"
                value={formState.notes}
                onChange={e => setFormState({...formState, notes: e.target.value})}
              />
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {editors.map(editor => {
          const monthTasks = tasks.filter(t => t.editor === editor.name && isWithinInterval(parseISO(t.startDate), currentMonth));
          return (
            <div 
              key={editor.id} 
              onClick={() => startEdit(editor)}
              className="group bg-white border border-zinc-100 rounded-[48px] p-10 hover:border-black hover:shadow-2xl transition-all cursor-pointer relative overflow-hidden"
            >
              <div className="flex items-start justify-between mb-8">
                <div 
                  className="w-20 h-20 rounded-[32px] flex items-center justify-center text-4xl font-black text-white shadow-xl rotate-3 group-hover:rotate-0 transition-all"
                  style={{ backgroundColor: editor.color }}
                >
                  {editor.name[0]}
                </div>
                <button 
                  onClick={(e) => { e.stopPropagation(); if(confirm('刪除成員？')) setEditors(prev => prev.filter(x => x.id !== editor.id)); }}
                  className="p-3 text-zinc-100 hover:text-red-500 transition-colors"
                >
                  <Trash2 size={20} />
                </button>
              </div>
              
              <h3 className="text-2xl font-black mb-1 group-hover:tracking-tight transition-all">{editor.name}</h3>
              <p className="text-[10px] text-zinc-400 font-black uppercase tracking-widest mb-6">{editor.role}</p>
              
              <div className="mb-8 p-5 bg-zinc-50 rounded-[24px] text-xs text-zinc-500 leading-relaxed min-h-[80px]">
                <Award size={14} className="inline mr-2 text-zinc-300" />
                {editor.notes || '尚未填寫個人註記...'}
              </div>

              <div className="pt-8 border-t border-zinc-50 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-black uppercase text-zinc-300 tracking-widest mb-1">本月總產出</p>
                  <div className="flex items-center space-x-2">
                    <BarChart2 size={16} className="text-black" />
                    <span className="text-xl font-black">{monthTasks.length} <span className="text-[10px] text-zinc-400">EP</span></span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-black uppercase text-zinc-300 tracking-widest mb-1">歷史累計</p>
                  <span className="text-sm font-black text-zinc-400">{tasks.filter(t => t.editor === editor.name).length} EP</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MemberManager;
