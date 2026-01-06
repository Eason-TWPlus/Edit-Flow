
import React, { useState } from 'react';
import { Program, Task } from '../types';
import { Plus, Trash2, LayoutList, Clock, Info, Check, X, BarChart3, Edit3, Type, Truck, PlayCircle, MonitorPlay } from 'lucide-react';
import { endOfMonth, isWithinInterval } from 'date-fns';
import startOfMonth from 'date-fns/startOfMonth';
import parseISO from 'date-fns/parseISO';

interface Props {
  programs: Program[];
  setPrograms: React.Dispatch<React.SetStateAction<Program[]>>;
  tasks: Task[];
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
}

const ProgramManager: React.FC<Props> = ({ programs, setPrograms, tasks, setTasks }) => {
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formState, setFormState] = useState({ 
    name: '', 
    description: '', 
    duration: '', 
    priority: 'Medium' as const,
    productionDate: '',
    deliveryDate: '',
    premiereDate: ''
  });

  const currentMonth = { start: startOfMonth(new Date()), end: endOfMonth(new Date()) };

  const handleSave = () => {
    if (!formState.name) return;

    if (editingId) {
      const oldProg = programs.find(p => p.id === editingId);
      if (oldProg && oldProg.name !== formState.name) {
        // 同步更新所有已存在任務的節目名稱
        setTasks(prev => prev.map(t => t.show === oldProg.name ? { ...t, show: formState.name } : t));
      }
      setPrograms(prev => prev.map(p => p.id === editingId ? { ...p, ...formState, updatedAt: new Date().toISOString() } : p));
    } else {
      setPrograms(prev => [...prev, { id: 'p' + Date.now(), ...formState, updatedAt: new Date().toISOString() }]);
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
          <h2 className="text-2xl font-bold text-slate-800">節目資產管理</h2>
          <p className="text-slate-500 text-sm mt-1">管理節目基本資訊、產出規範與關鍵節點</p>
        </div>
        <button 
          onClick={() => { resetForm(); setShowAdd(true); }}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-xl font-semibold flex items-center space-x-2 transition-all shadow-md shadow-indigo-600/10"
        >
          <Plus size={18} />
          <span>建立新節目</span>
        </button>
      </div>

      {showAdd && (
        <div className="mb-8 p-8 bg-white rounded-2xl border border-slate-200 shadow-xl shadow-slate-200/50 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-slate-800 flex items-center space-x-2">
              <Edit3 size={18} className="text-indigo-500" />
              <span>{editingId ? '編輯節目資訊' : '初始化新節目'}</span>
            </h3>
            <button onClick={resetForm} className="text-slate-400 hover:text-slate-600 transition-colors"><X size={20}/></button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-1.5">
              <label className="text-xs font-semibold text-slate-500 ml-1 uppercase tracking-wider">節目全名</label>
              <input 
                placeholder="例如: TaiwanPlus News Tonight" 
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium"
                value={formState.name}
                onChange={e => setFormState({...formState, name: e.target.value})}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-500 ml-1 uppercase tracking-wider">預計時長</label>
              <input 
                placeholder="24'00\" 
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium"
                value={formState.duration}
                onChange={e => setFormState({...formState, duration: e.target.value})}
              />
            </div>
            
            <div className="space-y-1.5">
              <label className="flex items-center space-x-1.5 text-xs font-semibold text-slate-500 ml-1 uppercase tracking-wider">
                <Type size={14} className="text-slate-400"/> <span>製作日 (文字填寫)</span>
              </label>
              <input 
                placeholder="例如: 每週一二 或 10/12"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium"
                value={formState.productionDate}
                onChange={e => setFormState({...formState, productionDate: e.target.value})}
              />
            </div>
            <div className="space-y-1.5">
              <label className="flex items-center space-x-1.5 text-xs font-semibold text-slate-500 ml-1 uppercase tracking-wider">
                <Truck size={14} className="text-slate-400"/> <span>交播日 (文字填寫)</span>
              </label>
              <input 
                placeholder="例如: 隔週三 或 10/15"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium"
                value={formState.deliveryDate}
                onChange={e => setFormState({...formState, deliveryDate: e.target.value})}
              />
            </div>
            <div className="space-y-1.5">
              <label className="flex items-center space-x-1.5 text-xs font-semibold text-slate-500 ml-1 uppercase tracking-wider">
                <PlayCircle size={14} className="text-slate-400"/> <span>首播日 (文字填寫)</span>
              </label>
              <input 
                placeholder="例如: 每週五晚間"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium"
                value={formState.premiereDate}
                onChange={e => setFormState({...formState, premiereDate: e.target.value})}
              />
            </div>

            <div className="md:col-span-3 space-y-1.5">
              <label className="text-xs font-semibold text-slate-500 ml-1 uppercase tracking-wider">節目描述與製作規範</label>
              <textarea 
                placeholder="輸入該節目的視覺風格、剪輯要求或特殊備註..." 
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium h-24 resize-none"
                value={formState.description}
                onChange={e => setFormState({...formState, description: e.target.value})}
              />
            </div>
          </div>
          
          <div className="mt-8 flex justify-end space-x-3">
             <button onClick={resetForm} className="px-6 py-2.5 rounded-xl font-semibold text-slate-500 hover:bg-slate-100 transition-all">取消</button>
             <button onClick={handleSave} className="bg-slate-900 text-white px-8 py-2.5 rounded-xl font-semibold hover:bg-black transition-all shadow-lg">
                儲存節目
             </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {programs.map(prog => {
          const monthTasks = tasks.filter(t => t.show === prog.name && isWithinInterval(parseISO(t.startDate), currentMonth));
          return (
            <div 
              key={prog.id} 
              className="group bg-white border border-slate-200 rounded-2xl p-6 hover:border-indigo-300 hover:shadow-xl hover:shadow-indigo-500/5 transition-all flex flex-col relative"
            >
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center text-slate-600 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-all">
                    <LayoutList size={24} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-800">{prog.name}</h3>
                    <div className="flex items-center space-x-3 mt-1">
                       <span className="flex items-center space-x-1 text-[11px] text-slate-400 font-medium">
                          <Clock size={12} /> <span>{prog.duration || '無時長資訊'}</span>
                       </span>
                       <span className="w-1 h-1 bg-slate-200 rounded-full"></span>
                       <span className="text-[11px] text-indigo-500 font-semibold uppercase tracking-wider">
                          累計產出 {tasks.filter(t => t.show === prog.name).length} 集
                       </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-all">
                  <button 
                    onClick={() => startEdit(prog)}
                    className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                    title="編輯"
                  >
                    <Edit3 size={18} />
                  </button>
                  <button 
                    onClick={(e) => { e.stopPropagation(); if(confirm('確定刪除節目？')) setPrograms(prev => prev.filter(x => x.id !== prog.id)); }}
                    className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                    title="刪除"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 mb-6">
                <DateTag icon={<Type size={12}/>} label="製作日" value={prog.productionDate} />
                <DateTag icon={<Truck size={12}/>} label="交播日" value={prog.deliveryDate} />
                <DateTag icon={<PlayCircle size={12}/>} label="首播日" value={prog.premiereDate} />
              </div>

              <div className="mt-auto pt-4 border-t border-slate-100 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                   <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                   <span className="text-xs font-medium text-slate-500">本月進度: {monthTasks.length} 集</span>
                </div>
                <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">ID: {prog.id.slice(-4)}</span>
              </div>
            </div>
          );
        })}

        {programs.length === 0 && !showAdd && (
          <div className="col-span-full py-20 flex flex-col items-center justify-center bg-white rounded-2xl border border-dashed border-slate-300 text-slate-400">
            <MonitorPlay size={48} className="mb-4 opacity-20" />
            <p className="font-medium">尚未建立任何節目，點擊上方按鈕開始</p>
          </div>
        )}
      </div>
    </div>
  );
};

const DateTag: React.FC<{ icon: React.ReactNode, label: string, value?: string }> = ({ icon, label, value }) => (
  <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 flex flex-col space-y-1">
    <div className="flex items-center space-x-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
      {icon} <span>{label}</span>
    </div>
    <div className="text-xs font-bold text-slate-700 truncate">
      {value || <span className="text-slate-300 font-normal">未設定</span>}
    </div>
  </div>
);

export default ProgramManager;
