
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
    if (!formState.name) return;

    if (editingId) {
      // 修改現有節目
      const oldProg = programs.find(p => p.id === editingId);
      if (oldProg && oldProg.name !== formState.name) {
        // 同步更新所有已存在任務的節目名稱，確保排程不會消失
        setTasks(prev => prev.map(t => t.show === oldProg.name ? { ...t, show: formState.name } : t));
      }
      setPrograms(prev => prev.map(p => p.id === editingId ? { ...p, ...formState, updatedAt: new Date().toISOString() } : p));
    } else {
      // 新增節目
      setPrograms(prev => [...prev, { 
        id: 'p' + Date.now(), 
        ...formState, 
        updatedAt: new Date().toISOString() 
      }]);
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
      description: prog.description, 
      duration: prog.duration, 
      priority: prog.priority,
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
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight">節目與製作資產管理</h2>
          <p className="text-slate-500 text-sm mt-1 uppercase tracking-widest font-medium opacity-70">Program Production Specs</p>
        </div>
        {!showAdd && (
          <button 
            onClick={() => { resetForm(); setShowAdd(true); }}
            className="bg-slate-900 hover:bg-black text-white px-6 py-2.5 rounded-xl font-bold flex items-center space-x-2 transition-all shadow-lg"
          >
            <Plus size={18} />
            <span>建立新節目</span>
          </button>
        )}
      </div>

      {showAdd && (
        <div className="mb-8 p-8 bg-white rounded-3xl border border-slate-200 shadow-xl shadow-slate-200/20 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-black uppercase tracking-widest text-slate-800">
              {editingId ? '編輯節目規範' : '初始化新節目資產'}
            </h3>
            <button onClick={resetForm} className="text-slate-400 hover:text-slate-600 transition-colors"><X size={24}/></button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 ml-1 uppercase tracking-widest">節目正式名稱</label>
              <input 
                placeholder="例如: TaiwanPlus News" 
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-4 ring-indigo-500/10 focus:border-indigo-500 transition-all font-bold"
                value={formState.name}
                onChange={e => setFormState({...formState, name: e.target.value})}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 ml-1 uppercase tracking-widest">單集長度</label>
              <input 
                placeholder="24'00\" 
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-4 ring-indigo-500/10 focus:border-indigo-500 transition-all font-bold"
                value={formState.duration}
                onChange={e => setFormState({...formState, duration: e.target.value})}
              />
            </div>
            
            <div className="space-y-1.5">
              <label className="flex items-center space-x-1.5 text-[10px] font-black text-slate-400 ml-1 uppercase tracking-widest">
                <Type size={12}/> <span>製作週期</span>
              </label>
              <input 
                placeholder="例如: 每週一二"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-4 ring-indigo-500/10 focus:border-indigo-500 transition-all font-bold text-sm"
                value={formState.productionDate}
                onChange={e => setFormState({...formState, productionDate: e.target.value})}
              />
            </div>
            <div className="space-y-1.5">
              <label className="flex items-center space-x-1.5 text-[10px] font-black text-slate-400 ml-1 uppercase tracking-widest">
                <Truck size={12}/> <span>交播規範</span>
              </label>
              <input 
                placeholder="例如: 隔週三 12:00"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-4 ring-indigo-500/10 focus:border-indigo-500 transition-all font-bold text-sm"
                value={formState.deliveryDate}
                onChange={e => setFormState({...formState, deliveryDate: e.target.value})}
              />
            </div>
            <div className="space-y-1.5">
              <label className="flex items-center space-x-1.5 text-[10px] font-black text-slate-400 ml-1 uppercase tracking-widest">
                <PlayCircle size={12}/> <span>首播時間</span>
              </label>
              <input 
                placeholder="例如: 每週五 20:00"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-4 ring-indigo-500/10 focus:border-indigo-500 transition-all font-bold text-sm"
                value={formState.premiereDate}
                onChange={e => setFormState({...formState, premiereDate: e.target.value})}
              />
            </div>

            <div className="md:col-span-3 space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 ml-1 uppercase tracking-widest">製作描述與剪輯規範</label>
              <textarea 
                placeholder="輸入關於視覺包裝、轉檔格式、素材位置等重要資訊..." 
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-4 ring-indigo-500/10 focus:border-indigo-500 transition-all font-medium h-32 resize-none"
                value={formState.description}
                onChange={e => setFormState({...formState, description: e.target.value})}
              />
            </div>
          </div>
          
          <div className="mt-8 flex justify-end space-x-3">
             <button onClick={resetForm} className="px-6 py-2.5 rounded-xl font-bold text-slate-400 hover:text-slate-600 transition-all">取消</button>
             <button onClick={handleSave} className="bg-indigo-600 text-white px-10 py-2.5 rounded-xl font-black uppercase tracking-widest text-xs hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/20">
                {editingId ? '儲存變更' : '初始化節目'}
             </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-20">
        {programs.map(prog => {
          const totalEps = tasks.filter(t => t.show === prog.name).length;
          return (
            <div 
              key={prog.id} 
              className="group bg-white border border-slate-200 rounded-[32px] p-8 hover:border-indigo-400 hover:shadow-2xl hover:shadow-indigo-500/5 transition-all flex flex-col relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:scale-110 transition-transform">
                <LayoutList size={120} className="text-slate-900" />
              </div>

              <div className="flex items-start justify-between mb-8 relative z-10">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-all">
                    <MonitorPlay size={32} />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-slate-900 tracking-tight">{prog.name}</h3>
                    <div className="flex items-center space-x-3 mt-1.5">
                       <span className="flex items-center space-x-1 text-[10px] text-slate-400 font-black uppercase tracking-widest">
                          <Clock size={12} /> <span>{prog.duration}</span>
                       </span>
                       <span className="w-1 h-1 bg-slate-200 rounded-full"></span>
                       <span className="text-[10px] text-indigo-500 font-black uppercase tracking-widest">
                          累計產出 {totalEps} 集
                       </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-1">
                  <button 
                    onClick={() => startEdit(prog)}
                    className="p-3 text-slate-300 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                    title="編輯節目"
                  >
                    <Edit3 size={18} />
                  </button>
                  <button 
                    onClick={(e) => { e.stopPropagation(); if(confirm('確定刪除此節目資產？這不會刪除排程，但會失去規格紀錄。')) setPrograms(prev => prev.filter(x => x.id !== prog.id)); }}
                    className="p-3 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                    title="刪除節目"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 mb-8 relative z-10">
                <DateTag icon={<Type size={12}/>} label="製作週期" value={prog.productionDate} />
                <DateTag icon={<Truck size={12}/>} label="交播日" value={prog.deliveryDate} />
                <DateTag icon={<PlayCircle size={12}/>} label="首播時段" value={prog.premiereDate} />
              </div>

              {prog.description && (
                <div className="mb-8 p-5 bg-slate-50 rounded-2xl border border-slate-100 text-[11px] text-slate-500 leading-relaxed font-medium line-clamp-3 group-hover:line-clamp-none transition-all">
                   {prog.description}
                </div>
              )}

              <div className="mt-auto pt-6 border-t border-slate-100 flex items-center justify-between relative z-10">
                <div className="flex items-center space-x-2">
                   <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
                   <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">規格同步中</span>
                </div>
                <span className="text-[10px] font-black text-slate-200 uppercase tracking-[0.3em] font-mono">{prog.id.slice(-8)}</span>
              </div>
            </div>
          );
        })}

        {programs.length === 0 && !showAdd && (
          <div className="col-span-full py-24 flex flex-col items-center justify-center bg-white rounded-[40px] border-2 border-dashed border-slate-100 text-slate-400">
            <MonitorPlay size={64} className="mb-6 opacity-10" />
            <p className="font-black uppercase tracking-[0.3em] text-sm italic">尚未建立節目製作資產</p>
            <button onClick={() => setShowAdd(true)} className="mt-6 text-indigo-500 font-black uppercase tracking-widest text-[10px] hover:underline">點擊此處開始初始化</button>
          </div>
        )}
      </div>
    </div>
  );
};

const DateTag: React.FC<{ icon: React.ReactNode, label: string, value?: string }> = ({ icon, label, value }) => (
  <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 flex flex-col space-y-1 hover:bg-white hover:shadow-sm transition-all">
    <div className="flex items-center space-x-1.5 text-[9px] font-black text-slate-300 uppercase tracking-widest">
      {icon} <span>{label}</span>
    </div>
    <div className="text-[11px] font-black text-slate-700 truncate">
      {value || <span className="text-slate-200 font-normal">--</span>}
    </div>
  </div>
);

export default ProgramManager;
