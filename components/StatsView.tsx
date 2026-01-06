
import React, { useMemo, useState } from 'react';
import { Task, Editor, Program } from '../types';
// Fix: split date-fns imports to use direct paths for members reported as missing from the main index
import { format, endOfMonth, isWithinInterval, getYear, getMonth } from 'date-fns';
import startOfMonth from 'date-fns/startOfMonth';
import parseISO from 'date-fns/parseISO';
// Fix: Import locale from specific path to avoid missing member error
import zhTW from 'date-fns/locale/zh-TW';
import { ListChecks, Users2, LayoutDashboard, Target, TrendingUp, CalendarDays, ChevronDown } from 'lucide-react';

interface Props {
  tasks: Task[];
  editors: Editor[];
  programs: Program[];
}

const StatsView: React.FC<Props> = ({ tasks, editors, programs }) => {
  // --- State for selected period ---
  // 'all' or 'YYYY-MM'
  const [selectedPeriod, setSelectedPeriod] = useState<string>(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  // --- Calculate available months from tasks ---
  const availablePeriods = useMemo(() => {
    const periods = new Set<string>();
    tasks.forEach(task => {
      const date = parseISO(task.startDate);
      periods.add(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`);
    });
    return Array.from(periods).sort((a, b) => b.localeCompare(a));
  }, [tasks]);

  // --- Filtering Logic ---
  const filteredTasks = useMemo(() => {
    if (selectedPeriod === 'all') return tasks;
    
    const [year, month] = selectedPeriod.split('-').map(Number);
    const start = startOfMonth(new Date(year, month - 1));
    const end = endOfMonth(new Date(year, month - 1));
    
    return tasks.filter(t => {
      const taskDate = parseISO(t.startDate);
      return isWithinInterval(taskDate, { start, end });
    });
  }, [tasks, selectedPeriod]);

  // --- Stats Calculations ---
  const editorStats = useMemo(() => {
    return editors.map(e => ({
      name: e.name,
      color: e.color,
      count: filteredTasks.filter(t => t.editor === e.name).length
    })).sort((a, b) => b.count - a.count);
  }, [editors, filteredTasks]);

  const programStats = useMemo(() => {
    return programs.map(p => ({
      name: p.name,
      count: filteredTasks.filter(t => t.show === p.name).length
    })).sort((a, b) => b.count - a.count);
  }, [programs, filteredTasks]);

  const activeEditorsCount = useMemo(() => {
    const activeNames = new Set(filteredTasks.map(t => t.editor));
    return activeNames.size;
  }, [filteredTasks]);

  const displayTitle = useMemo(() => {
    if (selectedPeriod === 'all') return "全時期歷史數據";
    const [year, month] = selectedPeriod.split('-');
    return `${year}年 ${month}月 數據報表`;
  }, [selectedPeriod]);

  return (
    <div className="p-8 md:p-12 h-full overflow-y-auto custom-scrollbar bg-white">
      {/* Header with Selector */}
      <div className="mb-12 md:mb-16 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
        <div>
          <div className="flex items-center space-x-4 mb-3">
            <h2 className="text-3xl md:text-5xl font-black tracking-tighter uppercase italic">{displayTitle}</h2>
            <div className="relative group">
              <select 
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="appearance-none bg-slate-900 text-white pl-4 pr-10 py-2 rounded-xl text-xs font-bold uppercase tracking-widest cursor-pointer hover:bg-black transition-all outline-none"
              >
                <option value="all">所有時間 (All Time)</option>
                {availablePeriods.map(p => {
                  const [y, m] = p.split('-');
                  return <option key={p} value={p}>{y} / {m}</option>;
                })}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={14} />
            </div>
          </div>
          <p className="text-zinc-400 text-[10px] md:text-sm font-bold uppercase tracking-[0.3em] md:tracking-[0.5em]">Executive Summary & Performance Analytics</p>
        </div>
        
        <div className="flex flex-wrap gap-4">
          <StatBox label="區間完成集數" value={filteredTasks.length} unit="EPISODES" icon={<Target size={20} />} />
          <StatBox label="投入剪輯師" value={activeEditorsCount} unit="PEOPLE" icon={<TrendingUp size={20} />} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12 mb-16">
        {/* 人力分佈 */}
        <div className="bg-[#111] text-white p-8 md:p-12 rounded-[32px] md:rounded-[56px] shadow-2xl">
          <div className="flex items-center space-x-3 mb-12">
            <Users2 size={24} className="text-zinc-400" />
            <h3 className="text-lg font-black uppercase tracking-widest italic">人力負載分佈</h3>
          </div>
          <div className="space-y-8">
            {editorStats.map(e => (
              <div key={e.name} className="space-y-3">
                <div className="flex justify-between items-end">
                  <span className="text-sm font-black uppercase tracking-widest">{e.name}</span>
                  <span className="text-2xl font-black">{e.count} <span className="text-[10px] text-zinc-500">EP</span></span>
                </div>
                <div className="h-2 w-full bg-zinc-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full transition-all duration-1000 ease-out" 
                    style={{ 
                      width: `${filteredTasks.length ? (e.count / filteredTasks.length) * 100 : 0}%`,
                      backgroundColor: e.color
                    }} 
                  />
                </div>
              </div>
            ))}
            {editorStats.filter(e => e.count > 0).length === 0 && (
              <p className="text-zinc-600 font-bold uppercase text-xs tracking-widest py-10 text-center">該期間無產出紀錄</p>
            )}
          </div>
        </div>

        {/* 節目配比 */}
        <div className="bg-zinc-50 p-8 md:p-12 rounded-[32px] md:rounded-[56px] border border-zinc-100">
          <div className="flex items-center space-x-3 mb-12">
            <LayoutDashboard size={24} className="text-black" />
            <h3 className="text-lg font-black uppercase tracking-widest italic">節目產出配比</h3>
          </div>
          <div className="grid grid-cols-1 gap-4">
            {programStats.filter(p => p.count > 0).map(p => (
              <div key={p.name} className="bg-white p-6 rounded-[24px] md:rounded-[32px] flex items-center justify-between border border-zinc-100 shadow-sm hover:shadow-md transition-all">
                <span className="text-sm font-black uppercase tracking-tight">{p.name}</span>
                <span className="px-6 py-2 bg-black text-white rounded-2xl text-xs font-black tracking-widest">{p.count} 集</span>
              </div>
            ))}
            {programStats.filter(p => p.count > 0).length === 0 && (
              <p className="text-zinc-300 font-bold uppercase text-xs tracking-widest py-10 text-center">該期間無產出紀錄</p>
            )}
          </div>
        </div>
      </div>

      {/* 產出矩陣表 */}
      <div className="bg-white p-8 md:p-12 rounded-[32px] md:rounded-[56px] border-2 border-zinc-50 shadow-sm overflow-hidden flex flex-col">
        <div className="flex items-center space-x-3 mb-12">
          <ListChecks size={24} className="text-black" />
          <h3 className="text-lg font-black uppercase tracking-widest italic">產出明細矩陣</h3>
        </div>
        <div className="overflow-x-auto no-scrollbar">
          <table className="w-full text-left min-w-[800px]">
            <thead>
              <tr className="border-b-4 border-black">
                <th className="py-6 text-[11px] font-black text-zinc-400 uppercase tracking-[0.2em]">剪輯師 / 節目</th>
                {programs.map(p => (
                  <th key={p.id} className="py-6 px-4 text-[11px] font-black text-zinc-400 uppercase tracking-[0.2em] text-center">{p.name}</th>
                ))}
                <th className="py-6 text-[11px] font-black text-black uppercase tracking-[0.2em] text-right">總計</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {editors.map(e => (
                <tr key={e.id} className="group hover:bg-zinc-50/50 transition-colors">
                  <td className="py-8 flex items-center space-x-4">
                    <div className="w-4 h-4 rounded-lg shadow-sm" style={{ backgroundColor: e.color }} />
                    <span className="text-base font-black uppercase">{e.name}</span>
                  </td>
                  {programs.map(p => {
                    const count = filteredTasks.filter(t => t.editor === e.name && t.show === p.name).length;
                    return (
                      <td key={p.id} className={`py-8 px-4 text-center font-black text-lg ${count > 0 ? 'text-black' : 'text-zinc-100'}`}>
                        {count || '-'}
                      </td>
                    );
                  })}
                  <td className="py-8 text-right font-black text-xl text-black">
                    {filteredTasks.filter(t => t.editor === e.name).length}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-zinc-50/50">
                <td className="py-10 font-black text-[11px] uppercase tracking-[0.2em] px-4">區間總計</td>
                {programs.map(p => (
                  <td key={p.id} className="py-10 px-4 text-center font-black text-xl">
                    {filteredTasks.filter(t => t.show === p.name).length}
                  </td>
                ))}
                <td className="py-10 text-right font-black text-3xl underline decoration-zinc-200 underline-offset-[12px]">
                  {filteredTasks.length}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
};

const StatBox: React.FC<{ label: string, value: number, unit: string, icon: React.ReactNode }> = ({ label, value, unit, icon }) => (
  <div className="bg-zinc-50 px-6 md:px-8 py-5 rounded-[24px] md:rounded-[32px] border border-zinc-100 min-w-[160px] md:min-w-[200px] flex items-center space-x-4 md:space-x-6">
    <div className="w-10 h-10 md:w-12 md:h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm text-black shrink-0">
      {icon}
    </div>
    <div>
      <span className="text-[8px] md:text-[10px] font-black text-zinc-300 uppercase tracking-widest block mb-1">{label}</span>
      <span className="text-xl md:text-3xl font-black leading-none">{value} <span className="text-[9px] md:text-[10px] text-zinc-400">{unit}</span></span>
    </div>
  </div>
);

export default StatsView;
