
import React, { useState } from 'react';
import { Program, Task } from '../types.ts';
import { Plus, Trash2, LayoutList, Clock, Check, X, Edit3, Type, Truck, PlayCircle, MonitorPlay } from 'lucide-react';

interface Props {
  programs: Program[];
  setPrograms: React.Dispatch<React.SetStateAction<Program[]>>;
  tasks: Task[];
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
}

const ProgramManager: React.FC<Props> = ({ programs, setPrograms, tasks, setTasks }) => {
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formState, setFormState] = useState<Omit<Program, 'id' | 'updatedAt'>>({ 
    name: '', 
    description: '', 
    duration: '', 
    priority: 'Medium',
    productionDate: '',
    deliveryDate: '',
    premiereDate: ''
  });

  const handleSave = () => {
    const trimmedName = formState.name.trim();
    if (!trimmedName) {
      alert('節目名稱不能為空');
      return;
    }

    if (editingId) {
      // 修改模式
      const oldProg = programs.find(p => p.id === editingId);
      if (oldProg && oldProg.name !== trimmedName) {
        // 重要：當節目改名時，所有排程上的任務名稱也要連動更新，否則會找不到對應
        setTasks(prev => prev.map(t => t.show === oldProg.name ? { ...t, show: trimmedName } : t));
      }
      
      setPrograms(prev => prev.map(p => p.id === editingId ? { 
        ...p, 
        ...formState, 
        name: trimmedName,
        updatedAt: new Date().toISOString() 
      } : p));
    } else {
      // 新增模式
      const newProgram: Program = { 
        id: 'p' + Date.now(), 
        ...formState, 
        name: trimmedName,
        updatedAt: new Date().toISOString() 
      };
      setPrograms(prev => [...prev, newProgram]);
    }

    resetForm();
  };

  const resetForm = () => {
    setFormState({ 
      name: '', 
      description: '', 
      duration: '', 
      priority: 'Medium',
      productionDate: '',
      deliveryDate: '',
      premiereDate: ''
    });
    setEditingId(null);
    setShowAdd(false);
  };

  const startEdit = (prog: Program) => {
    setFormState({ 
      name: prog.name, 
      description: prog.description || '', 
      duration: prog.duration || '', 
      priority: prog.priority || 'Medium',
      productionDate: prog.productionDate || '',
      deliveryDate: prog.deliveryDate || '',
      premiereDate: prog.premiereDate || ''
    });
    setEditingId(prog.id);
    setShowAdd(true);
  };

  return (
    <div className="p-8 h-full overflow-y-auto custom-scrollbar bg-slate-50/50">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight uppercase italic">節目規範庫</h2>
          <p className="text-slate-500 text-[10px] mt-1 uppercase tracking-widest font-black opacity-40">Program Master Specs</p>
        </div>
        {!showAdd && (
          <button 
            onClick={() => { resetForm(); setShowAdd(true); }}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-2xl font-black flex items-center space-x-2 transition-all shadow-xl shadow-indigo-500/20 active:scale-95 text-xs uppercase tracking-widest"
          >
            <Plus size={18} />
            <span>建立新節目規範</span>
          </button>
        )}
      </div>

      {showAdd && (
        <div className="mb-8 p-8 bg-white rounded-[32px] border border-slate-200 shadow-2xl shadow-slate-200/40 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-indigo-600">
              {editingId ? '✎ 修改節目規範' : '✦ 初始化新節目'}
            </h3>
            <button onClick={resetForm} className="text-slate-300 hover:text-slate-900"><X size={24}/></button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-2 space-y-2">
              <label className="text-[10px] font-black text-slate-400 ml-1 uppercase tracking-widest">節目名稱</label>
              <input 
                placeholder="例如: Finding Formosa" 
                className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 outline-none focus:ring-4 ring-indigo-500/10 focus:border-indigo-500 transition-all font-bold text-lg"
                value={formState.name}
                onChange={e => setFormState({...formState, name: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 ml-1 uppercase tracking-widest">單集時長</label>
              <input 
                placeholder="24'00\" 
                className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 outline-none focus:ring-4 ring-indigo-500/10 focus:border-indigo-500 transition-all font-bold text-lg"
                value={formState.duration}
                onChange={e => setFormState({...formState, duration: e.target.value})}
              />
            </div>
            
            <div className="space-y-2">
              <label className="flex items-center space-x-2 text-[10px] font-black text-slate-400 ml-1 uppercase tracking-widest">
                <Type size={12}/> <span>製作日週期</span>
              </label>
              <input 
                placeholder="例如: 每週一 14:00"
                className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 outline-none focus:ring-4 ring-indigo-500/10 focus:border-indigo-500 transition-all font-bold text-sm"
                value={formState.productionDate}
                onChange={e => setFormState({...formState, productionDate: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <label className="flex items-center space-x-2 text-[10px] font-black text-slate-400 ml-1 uppercase tracking-widest">
                <Truck size={12}/> <span>交播期限</span>
              </label>
              <input 
                placeholder="例如: 播出前 48h"
                className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 outline-none focus:ring-4 ring-indigo-500/10 focus:border-indigo-500 transition-all font-bold text-sm"
                value={formState.deliveryDate}
                onChange={e => setFormState({...formState, deliveryDate: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <label className="flex items-center space-x-2 text-[10px] font-black text-slate-400 ml-1 uppercase tracking-widest">
                <PlayCircle size={12}/> <span>首播時段</span>
              </label>
              <input 
                placeholder="例如: 每週五 21:00"
                className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 outline-none focus:ring-4 ring-indigo-500/10 focus:border-indigo-500 transition-all font-bold text-sm"
                value={formState.premiereDate}
                onChange={e => setFormState({...formState, premiereDate: e.target.value})}
              />
            </div>

            <div className="md:col-span-3 space-y-2">
              <label className="text-[10px] font-black text-slate-400 ml-1 uppercase tracking-widest">剪輯規範備註</label>
              <textarea 
                className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-5 outline-none focus:ring-4 ring-indigo-500/10 focus:border-indigo-500 transition-all font-medium h-32 resize-none leading-relaxed"
                value={formState.description}
                onChange={e => setFormState({...formState, description: e.target.value})}
              />
            </div>
          </div>
          
          <div className="mt-8 flex justify-end space-x-4">
             <button onClick={resetForm} className="px-6 py-3 font-bold text-slate-400 hover:text-slate-600 transition-all text-xs uppercase tracking-widest">放棄變更</button>
             <button onClick={handleSave} className="bg-slate-900 text-white px-10 py-4 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-black transition-all shadow-xl active:scale-95">
                {editingId ? '儲存修改' : '確認新增'}
             </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pb-32">
        {programs.map(prog => {
          const totalEps = tasks.filter(t => t.show === prog.name).length;
          return (
            <div 
              key={prog.id} 
              className="group bg-white border border-slate-100 rounded-[32px] p-8 hover:border-indigo-500 hover:shadow-2xl hover:shadow-indigo-500/5 transition-all flex flex-col relative overflow-hidden"
            >
              <div className="flex items-start justify-between mb-8 relative z-10">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-300 group-hover:text-indigo-600 transition-all">
                    <MonitorPlay size={32} />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-slate-900 tracking-tight">{prog.name}</h3>
                    <p className="text-[10px] text-indigo-500 font-black uppercase tracking-widest mt-1">累積製作 {totalEps} 集</p>
                  </div>
                </div>
                <div className="flex items-center space-x-1">
                  <button 
                    onClick={() => startEdit(prog)}
                    className="p-3 text-slate-300 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                    title="編輯節目資產"
                  >
                    <Edit3 size={18} />
                  </button>
                  <button 
                    onClick={(e) => { if(confirm(`確定刪除「${prog.name}」？此操作不影響已存在的排程項目，但未來新增排程時將無法選擇此節目。`)) setPrograms(prev => prev.filter(x => x.id !== prog.id)); }}
                    className="p-3 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                    title="移除節目"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 mb-6 relative z-10">
                <SpecItem icon={<Type size={12}/>} label="製作日" value={prog.productionDate} />
                <SpecItem icon={<Truck size={12}/>} label="交播日" value={prog.deliveryDate} />
                <SpecItem icon={<PlayCircle size={12}/>} label="首播日" value={prog.premiereDate} />
              </div>

              {prog.description && (
                <div className="p-5 bg-slate-50/50 rounded-2xl border border-slate-100 text-[11px] text-slate-400 leading-relaxed font-medium line-clamp-2 group-hover:line-clamp-none transition-all">
                   {prog.description}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

const SpecItem: React.FC<{ icon: React.ReactNode, label: string, value?: string }> = ({ icon, label, value }) => (
  <div className="bg-white rounded-xl p-3 border border-slate-100 flex flex-col space-y-1">
    <div className="flex items-center space-x-1 text-[8px] font-black text-slate-300 uppercase tracking-widest">
      {icon} <span>{label}</span>
    </div>
    <div className="text-[10px] font-black text-slate-700 truncate">{value || '--'}</div>
  </div>
);

export default ProgramManager;
