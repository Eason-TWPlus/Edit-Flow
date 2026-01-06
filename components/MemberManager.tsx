
import React, { useState, useMemo } from 'react';
import { Editor, Task } from '../types.ts';
// Fixed: Added 'Users' to the imports from lucide-react to resolve the 'Cannot find name Users' error.
import { UserPlus, Trash2, Award, Check, X, BarChart2, Edit3, User, Mail, ShieldCheck, Users } from 'lucide-react';
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
  const [formState, setFormState] = useState({ name: '', role: '', color: '#4f46e5', notes: '' });

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
      setEditors(prev => [...prev, { id: 'e' + Date.now(), ...formState, updatedAt: new Date().toISOString() }]);
    }

    resetForm();
  };

  const resetForm = () => {
    setFormState({ name: '', role: '', color: '#4f46e5', notes: '' });
    setEditingId(null);
    setShowAdd(false);
  };

  const startEdit = (editor: Editor) => {
    setFormState({ name: editor.name, role: editor.role, color: editor.color, notes: editor.notes });
    setEditingId(editor.id);
    setShowAdd(true);
  };

  const handleDelete = (editor: Editor) => {
    if (confirm(`確定要移除「${editor.name}」？此操作不會刪除排程，但該成員將不再出現在選擇清單中。`)) {
      setEditors(prev => prev.filter(e => e.id !== editor.id));
    }
  };

  return (
    <div className="p-6 md:p-10 h-full overflow-y-auto custom-scrollbar bg-white">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-4">
        <div>
          <h2 className="text-3xl md:text-4xl font-black tracking-tighter uppercase italic text-slate-900">團隊成員管理</h2>
          <p className="text-slate-400 text-[10px] font-bold mt-1 uppercase tracking-widest">Editor Capacity & Statistics</p>
        </div>
        {!showAdd && (
          <button 
            onClick={() => { resetForm(); setShowAdd(true); }}
            className="bg-indigo-600 text-white px-8 py-4 rounded-2xl font-black flex items-center justify-center space-x-2 hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-600/20 active:scale-95 text-xs uppercase tracking-widest"
          >
            <UserPlus size={18} />
            <span>新增團隊成員</span>
          </button>
        )}
      </div>

      {showAdd && (
        <div className="mb-12 p-8 bg-slate-50 rounded-[40px] border border-slate-200 animate-in fade-in slide-in-from-top-4">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-indigo-600">
              {editingId ? '✎ 編輯成員資料' : '✦ 建立新成員檔案'}
            </h3>
            <button onClick={resetForm} className="text-slate-300 hover:text-slate-900"><X size={24}/></button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-slate-400 ml-1 tracking-widest">成員姓名</label>
              <input 
                placeholder="例如: James Chen" 
                className="w-full bg-white border border-slate-200 rounded-2xl px-6 py-4 outline-none focus:ring-4 ring-indigo-500/10 font-bold text-lg"
                value={formState.name}
                onChange={e => setFormState({...formState, name: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-slate-400 ml-1 tracking-widest">職位名稱</label>
              <input 
                placeholder="例如: Senior Editor" 
                className="w-full bg-white border border-slate-200 rounded-2xl px-6 py-4 outline-none focus:ring-4 ring-indigo-500/10 font-bold text-lg"
                value={formState.role}
                onChange={e => setFormState({...formState, role: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-slate-400 ml-1 tracking-widest">識別顏色</label>
              <div className="flex space-x-3">
                <input 
                  type="color" 
                  className="w-16 h-16 rounded-2xl cursor-pointer border border-slate-200 p-1 bg-white"
                  value={formState.color}
                  onChange={e => setFormState({...formState, color: e.target.value})}
                />
                <button onClick={handleSave} className="flex-1 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest flex items-center justify-center space-x-2 shadow-lg hover:bg-black transition-all">
                  <Check size={20}/> <span>儲存</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8 pb-32">
        {editors.map(editor => {
          const editorTasksCount = tasks.filter(t => t.editor === editor.name).length;
          
          return (
            <div key={editor.id} className="group bg-white border border-slate-100 rounded-[32px] p-8 hover:border-indigo-500 hover:shadow-2xl hover:shadow-indigo-500/5 transition-all flex flex-col">
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center space-x-4">
                  <div 
                    className="w-16 h-16 rounded-[20px] flex items-center justify-center text-white shadow-lg rotate-3 group-hover:rotate-0 transition-transform"
                    style={{ backgroundColor: editor.color }}
                  >
                    <User size={32} />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-slate-900 tracking-tight">{editor.name}</h3>
                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">{editor.role || '剪輯團隊成員'}</p>
                  </div>
                </div>
                <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => startEdit(editor)} className="p-2 text-slate-300 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all">
                    <Edit3 size={16} />
                  </button>
                  <button onClick={() => handleDelete(editor)} className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 rounded-2xl p-4">
                  <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-1">累積承接</span>
                  <span className="text-2xl font-black text-slate-900">{editorTasksCount} <span className="text-[10px] text-slate-400">集</span></span>
                </div>
                <div className="bg-slate-50 rounded-2xl p-4">
                  <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-1">本月負載</span>
                  <div className="flex items-center space-x-2 mt-2">
                    <div className="h-1.5 flex-1 bg-slate-200 rounded-full overflow-hidden">
                       <div className="h-full bg-indigo-500" style={{ width: `${Math.min(editorTasksCount * 10, 100)}%` }} />
                    </div>
                  </div>
                </div>
              </div>

              {editor.notes && (
                <div className="mt-6 p-4 bg-slate-50/50 rounded-2xl border border-slate-100 text-[11px] text-slate-400 leading-relaxed font-medium">
                  {editor.notes}
                </div>
              )}
            </div>
          );
        })}

        {editors.length === 0 && !showAdd && (
          <div className="col-span-full py-32 flex flex-col items-center justify-center border-2 border-dashed border-slate-100 rounded-[48px]">
            <div className="w-16 h-16 bg-slate-50 text-slate-200 rounded-full flex items-center justify-center mb-4">
              <Users size={32} />
            </div>
            <p className="text-sm font-black text-slate-300 uppercase tracking-widest">尚無團隊成員資料</p>
            <button 
              onClick={() => setShowAdd(true)}
              className="mt-6 text-indigo-500 font-black text-xs uppercase tracking-widest hover:underline"
            >
              點此建立第一位成員
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default MemberManager;
