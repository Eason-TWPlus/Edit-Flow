
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
    if (!formState.name.trim()) {
      alert('請輸入節目名稱');
      return;
    }

    if (editingId) {
      // 修改現有節目
      const oldProg = programs.find(p => p.id === editingId);
      if (oldProg && oldProg.name !== formState.name) {
        // 同步更新所有關聯任務的節目名稱
        setTasks(prev => prev.map(t => t.show === oldProg.name ? { ...t, show: formState.name } : t));
      }
      setPrograms(prev => prev.map(p => p.id === editingId ? { 
        ...p, 
        ...formState, 
        updatedAt: new Date().toISOString() 
      } : p));
    } else {
      // 新增節目
      const newProgram: Program = { 
        id: 'p' + Date.now(), 
        ...formState, 
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
          <h2 className="text-2xl font-black text-slate-800 tracking-tight uppercase italic">節目規範資產庫</h2>
          <p className="text-slate-500 text-[10px] mt-1 uppercase tracking-widest font-black opacity-40">Program Master List & Specifications</p>
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
        <div className="mb-8 p-8 bg-white rounded-[32px] border border-slate-200 shadow-2xl shadow-slate-200/50 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-sm font-black uppercase tracking-[0.2em] text-indigo-600">
              {editingId ? '✎ 修改節目資產規格' : '✦ 初始化新節目資產'}
            </h3>
            <button onClick={resetForm} className="text-slate-300 hover:text-slate-900 transition-colors"><X size={24}/></button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-2 space-y-2">
              <label className="text-[10px] font-black text-slate-400 ml-1 uppercase tracking-widest">節目名稱 (必填)</label>
              <input 
                placeholder="例如: TaiwanPlus News" 
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
                <Type size={12}/> <span>製作/錄影日</span>
              </label>
              <input 
                placeholder="例如: 每週一、三 14:00"
                className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 outline-none focus:ring-4 ring-indigo-500/10 focus:border-indigo-500 transition-all font-bold text-sm"
                value={formState.productionDate}
                onChange={e => setFormState({...formState, productionDate: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <label className="flex items-center space-x-2 text-[10px] font-black text-slate-400 ml-1 uppercase tracking-widest">
                <Truck size={12}/> <span>交播限時</span>
              </label>
              <input 
                placeholder="例如: 首播前 24 小時"
                className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 outline-none focus:ring-4 ring-indigo-500/10 focus:border-indigo-500 transition-all font-bold text-sm"
                value={formState.deliveryDate}
                onChange={e => setFormState({...formState, deliveryDate: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <label className="flex items-center space-x-2 text-[10px] font-black text-slate-400 ml-1 uppercase tracking-widest">
                <PlayCircle size={12}/> <span>固定播出時段</span>
              </label>
              <input 
                placeholder="例如: 每週五 20:00"
                className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 outline-none focus:ring-4 ring-indigo-500/10 focus:border-indigo-500 transition-all font-bold text-sm"
                value={formState.premiereDate}
                onChange={e => setFormState({...formState, premiereDate: e.target.value})}
              />
            </div>

            <div className="md:col-span-3 space-y-2">
              <label className="text-[10px] font-black text-slate-400 ml-1 uppercase tracking-widest">製作備註 / 剪輯規範</label>
              <textarea 
                placeholder="在此填寫字體要求、調色規範、素材存放路徑等..." 
                className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-5 outline-none focus:ring-4 ring-indigo-500/10 focus:border-indigo-500 transition-all font-medium h-32 resize-none leading-relaxed"
                value={formState.description}
                onChange={e => setFormState({...formState, description: e.target.value})}
              />
            </div>
          </div>
          
          <div className="mt-10 flex justify-end items-center space-x-4">
             <button onClick={resetForm} className="px-6 py-3 font-bold text-slate-400 hover:text-slate-600 transition-all text-xs uppercase tracking-widest">放棄變更</button>
             <button onClick={handleSave} className="bg-slate-900 text-white px-12 py-4 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-black transition-all shadow-xl active:scale-95">
                {editingId ? '儲存並同步資產' : '完成資產初始化'}
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
              className="group bg-white border border-slate-100 rounded-[40px] p-10 hover:border-indigo-500 hover:shadow-2xl hover:shadow-indigo-500/5 transition-all flex flex-col relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-10 opacity-[0.02] group-hover:scale-110 transition-transform">
                <LayoutList size={160} className="text-slate-900" />
              </div>

              <div className="flex items-start justify-between mb-8 relative z-10">
                <div className="flex items-center space-x-5">
                  <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center text-slate-300 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-all shadow-inner">
                    <MonitorPlay size={40} />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-slate-900 tracking-tight">{prog.name}</h3>
                    <div className="flex items-center space-x-3 mt-2">
                       <span className="flex items-center space-x-1.5 text-[10px] text-slate-400 font-black uppercase tracking-widest">
                          <Clock size={12} className="text-indigo-500" /> <span>{prog.duration || '時長未定'}</span>
                       </span>
                       <span className="w-1 h-1 bg-slate-200 rounded-full"></span>
                       <span className="text-[10px] text-indigo-500 font-black uppercase tracking-widest bg-indigo-50 px-3 py-1 rounded-full">
                          已製作 {totalEps} 集
                       </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button 
                    onClick={() => startEdit(prog)}
                    className="w-10 h-10 flex items-center justify-center text-slate-300 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                    title="編輯規範"
                  >
                    <Edit3 size={18} />
                  </button>
                  <button 
                    onClick={(e) => { e.stopPropagation(); if(confirm(`確定刪除節目「${prog.name}」？此操作僅刪除規格紀錄，不影響現有排程。`)) setPrograms(prev => prev.filter(x => x.id !== prog.id)); }}
                    className="w-10 h-10 flex items-center justify-center text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                    title="移除資產"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 mb-8 relative z-10">
                <SpecTag icon={<Type size={12}/>} label="週期" value={prog.productionDate} />
                <SpecTag icon={<Truck size={12}/>} label="交播日" value={prog.deliveryDate} />
                <SpecTag icon={<PlayCircle size={12}/>} label="首播" value={prog.premiereDate} />
              </div>

              {prog.description && (
                <div className="mb-8 p-6 bg-slate-50/50 rounded-[24px] border border-slate-100 text-[12px] text-slate-500 leading-relaxed font-medium line-clamp-3 group-hover:line-clamp-none transition-all">
                   {prog.description}
                </div>
              )}

              <div className="mt-auto pt-8 border-t border-slate-50 flex items-center justify-between relative z-10 opacity-40 group-hover:opacity-100 transition-opacity">
                <div className="flex items-center space-x-2">
                   <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
                   <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">資產已同步至雲端</span>
                </div>
                <span className="text-[10px] font-bold text-slate-300 uppercase tracking-[0.2em] font-mono">SPEC_ID: {prog.id.slice(-6)}</span>
              </div>
            </div>
          );
        })}

        {programs.length === 0 && !showAdd && (
          <div className="col-span-full py-32 flex flex-col items-center justify-center bg-white rounded-[56px] border-4 border-dashed border-slate-50 text-slate-300">
            <MonitorPlay size={80} className="mb-8 opacity-5" />
            <p className="font-black uppercase tracking-[0.4em] text-sm italic">NO PROGRAM SPECIFICATIONS FOUND</p>
            <button onClick={() => setShowAdd(true)} className="mt-8 bg-slate-900 text-white px-10 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-black transition-all shadow-xl">立即初始化首個節目</button>
          </div>
        )}
      </div>
    </div>
  );
};

const SpecTag: React.FC<{ icon: React.ReactNode, label: string, value?: string }> = ({ icon, label, value }) => (
  <div className="bg-white rounded-2xl p-4 border border-slate-100 flex flex-col space-y-1.5 shadow-sm group-hover:border-indigo-100 transition-all">
    <div className="flex items-center space-x-1.5 text-[9px] font-black text-slate-300 uppercase tracking-widest">
      {icon} <span className="opacity-60">{label}</span>
    </div>
    <div className="text-[11px] font-black text-slate-800 truncate">
      {value || <span className="text-slate-200 font-normal">N/A</span>}
    </div>
  </div>
);

export default ProgramManager;
