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

  return (
    <div className={`${isMobile ? 'py-3' : 'py-4'} space-y-3 shrink-0`}>
      <div className="flex items-center justify-between">
        <h2 className={`${isMobile ? 'text-xl' : 'text-3xl'} font-black tracking-tighter uppercase italic`}>製作排程總覽</h2>
        {(filters.shows.length > 0 || filters.editors.length > 0 || filters.statuses.length > 0) && (
          <button onClick={() => setFilters({ shows: [], editors: [], statuses: [] })} className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">清除篩選</button>
        )}
      </div>

      <div className="flex flex-col space-y-2">
        <div className="flex items-center bg-white p-1 rounded-xl border border-slate-200 overflow-hidden shadow-sm">
          <span className="text-[8px] font-bold text-slate-300 px-3 uppercase tracking-tighter shrink-0 border-r border-slate-100 mr-2">人員</span>
          <div className="flex space-x-1 overflow-x-auto no-scrollbar py-0.5">
            {editors.map(e => (
              <button 
                key={e.id} 
                onClick={() => toggleEditor(e.name)} 
                className={`px-3 py-1 text-[10px] font-bold rounded-lg whitespace-nowrap transition-all ${filters.editors.includes(e.name) ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
              >
                {e.name}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center bg-white p-1 rounded-xl border border-slate-200 overflow-hidden shadow-sm">
          <span className="text-[8px] font-bold text-slate-300 px-3 uppercase tracking-tighter shrink-0 border-r border-slate-100 mr-2">節目</span>
          <div className="flex space-x-1 overflow-x-auto no-scrollbar py-0.5">
            {programs.map(p => (
              <button 
                key={p.id} 
                onClick={() => toggleShow(p.name)} 
                className={`px-3 py-1 text-[10px] font-bold rounded-lg whitespace-nowrap transition-all ${filters.shows.includes(p.name) ? 'bg-slate-800 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
              >
                {p.name}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FilterBar;