
import React from 'react';
import { FilterState, Program, Editor, TaskStatus } from '../types.ts';

interface FilterBarProps {
  filters: FilterState;
  setFilters: React.Dispatch<React.SetStateAction<FilterState>>;
  programs: Program[];
  editors: Editor[];
  isMobile?: boolean;
}

const FilterBar: React.FC<FilterBarProps> = ({ filters, setFilters, programs, editors, isMobile }) => {
  const toggleShow = (show: string) => {
    setFilters(prev => ({ ...prev, shows: prev.shows.includes(show) ? prev.shows.filter(s => s !== show) : [...prev.shows, show] }));
  };

  const toggleEditor = (editor: string) => {
    setFilters(prev => ({ ...prev, editors: prev.editors.includes(editor) ? prev.editors.filter(e => e !== editor) : [...prev.editors, editor] }));
  };

  const toggleStatus = (status: TaskStatus) => {
    setFilters(prev => ({ ...prev, statuses: prev.statuses.includes(status) ? prev.statuses.filter(s => s !== status) : [...prev.statuses, status] }));
  };

  const statusMap: Record<TaskStatus, { label: string, color: string }> = {
    'Todo': { label: '待處理', color: 'bg-slate-400' },
    'InProgress': { label: '剪輯中', color: 'bg-indigo-500' },
    'Review': { label: '審核中', color: 'bg-amber-500' },
    'Completed': { label: '已完成', color: 'bg-emerald-500' }
  };

  return (
    <div className={`${isMobile ? 'py-3' : 'py-4'} space-y-3 shrink-0`}>
      <div className="flex items-center justify-between">
        <h2 className={`${isMobile ? 'text-xl' : 'text-3xl'} font-black tracking-tighter uppercase italic`}>製作排程總覽</h2>
        {(filters.shows.length > 0 || filters.editors.length > 0 || filters.statuses.length > 0) && (
          <button onClick={() => setFilters({ shows: [], editors: [], statuses: [] })} className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">清除篩選</button>
        )}
      </div>

      <div className="flex flex-col space-y-2">
        <div className="flex items-center bg-white p-1 rounded-xl border border-slate-200 overflow-hidden">
          <span className="text-[8px] font-bold text-slate-300 px-2 uppercase tracking-tighter shrink-0">人員</span>
          <div className="flex space-x-1 overflow-x-auto no-scrollbar py-0.5">
            {editors.map(e => (
              <button key={e.id} onClick={() => toggleEditor(e.name)} className={`px-3 py-1 text-[10px] font-bold rounded-lg whitespace-nowrap transition-all ${filters.editors.includes(e.name) ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}>{e.name}</button>
            ))}
          </div>
        </div>

        <div className="flex items-center bg-white p-1 rounded-xl border border-slate-200 overflow-hidden">
          <span className="text-[8px] font-bold text-slate-300 px-2 uppercase tracking-tighter shrink-0">狀態</span>
          <div className="flex space-x-1 overflow-x-auto no-scrollbar py-0.5">
            {(Object.keys(statusMap) as TaskStatus[]).map(s => (
              <button key={s} onClick={() => toggleStatus(s)} className={`px-3 py-1 text-[10px] font-bold rounded-lg whitespace-nowrap transition-all flex items-center space-x-1.5 ${filters.statuses.includes(s) ? 'bg-slate-800 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}>
                <div className={`w-1.5 h-1.5 rounded-full ${statusMap[s].color}`}></div>
                <span>{statusMap[s].label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FilterBar;
