
import React, { useState, useMemo } from 'react';
import { Editor, Task } from '../types.ts';
import { UserPlus, Trash2, Award, Check, X, BarChart2 } from 'lucide-react';
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
          </div>
        </div>
      )}
    </div>
  );
};

export default MemberManager;
