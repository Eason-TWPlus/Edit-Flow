
import React, { useMemo, useState } from 'react';
import { Task, Editor } from '../types';
import { format, endOfMonth, eachDayOfInterval, isSameDay, addMonths, isToday } from 'date-fns';
import startOfMonth from 'date-fns/startOfMonth';
import subMonths from 'date-fns/subMonths';
import parseISO from 'date-fns/parseISO';
import zhTW from 'date-fns/locale/zh-TW';
import { ChevronLeft, ChevronRight, User, CheckCircle2, Clock, Play } from 'lucide-react';

interface TimelineViewProps {
  tasks: Task[];
  onEditTask: (task: Task) => void;
  editors: Editor[];
}

const TimelineView: React.FC<TimelineViewProps> = ({ tasks, onEditTask, editors }) => {
  const [currentDate, setCurrentDate] = useState(new Date());

  const days = useMemo(() => {
    return eachDayOfInterval({
      start: startOfMonth(currentDate),
      end: endOfMonth(currentDate)
    });
  }, [currentDate]);

  const handlePrevMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const handleNextMonth = () => setCurrentDate(addMonths(currentDate, 1));

  const monthTasks = useMemo(() => {
    const start = startOfMonth(currentDate);
    const end = endOfMonth(currentDate);
    return tasks.filter(t => {
      try {
        const ts = parseISO(t.startDate);
        const te = parseISO(t.endDate);
        return (ts <= end && te >= start);
      } catch (e) { return false; }
    }).sort((a, b) => a.editor.localeCompare(b.editor));
  }, [tasks, currentDate]);

  const getTaskStyle = (task: Task, daysInView: Date[]) => {
    try {
      const start = parseISO(task.startDate);
      const end = parseISO(task.endDate);
      const firstDay = daysInView[0];
      const lastDay = daysInView[daysInView.length - 1];

      const visibleStart = start < firstDay ? firstDay : start;
      const visibleEnd = end > lastDay ? lastDay : end;

      const startIndex = daysInView.findIndex(d => isSameDay(d, visibleStart));
      const endIndex = daysInView.findIndex(d => isSameDay(d, visibleEnd));
      
      if (startIndex === -1 || endIndex === -1) return null;

      return {
        gridColumnStart: startIndex + 2,
        gridColumnEnd: endIndex + 3
      };
    } catch (e) { return null; }
  };

  const getStatusInfo = (status: string) => {
    switch(status) {
      case 'Completed': return { color: 'bg-emerald-500', label: '已完成' };
      case 'Review': return { color: 'bg-amber-500', label: '審核中' };
      case 'InProgress': return { color: 'bg-indigo-500', label: '剪輯中' };
      default: return { color: 'bg-slate-400', label: '待處理' };
    }
  };

  return (
    <div className="flex flex-col h-full overflow-hidden bg-white">
      <div className="p-6 md:p-8 border-b border-zinc-100 flex items-center justify-between shrink-0">
        <h3 className="text-xl md:text-2xl font-black uppercase tracking-tight italic">
          甘特圖軸 {format(currentDate, 'yyyy / MM', { locale: zhTW })}
        </h3>
        <div className="flex items-center bg-zinc-100 p-1 rounded-xl">
          <button onClick={handlePrevMonth} className="p-2 hover:bg-white rounded-lg transition-all"><ChevronLeft size={16} /></button>
          <button onClick={() => setCurrentDate(new Date())} className="px-4 text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:text-black">Today</button>
          <button onClick={handleNextMonth} className="p-2 hover:bg-white rounded-lg transition-all"><ChevronRight size={16} /></button>
        </div>
      </div>

      <div className="flex-1 overflow-auto custom-scrollbar">
        <div 
          className="min-w-max grid"
          style={{ gridTemplateColumns: `260px repeat(${days.length}, 48px)` }}
        >
          {/* Header Row */}
          <div className="sticky top-0 z-30 bg-white border-b border-r border-zinc-100 h-14 flex items-center px-6 shadow-sm">
            <span className="text-[10px] font-black text-zinc-300 uppercase tracking-widest">節目製作項目 / 剪輯師</span>
          </div>
          {days.map(day => (
            <div 
              key={day.toISOString()} 
              className={`sticky top-0 z-20 h-14 border-b border-zinc-100 flex flex-col items-center justify-center ${isToday(day) ? 'bg-indigo-50/50' : 'bg-white'}`}
            >
              <span className="text-[9px] font-black text-zinc-200 uppercase tracking-tighter">{format(day, 'EEE')}</span>
              <span className={`text-xs font-black mt-0.5 ${isToday(day) ? 'text-indigo-600 underline decoration-2' : 'text-zinc-500'}`}>{format(day, 'd')}</span>
            </div>
          ))}

          {/* Task Rows */}
          {monthTasks.length === 0 ? (
            <div className="col-span-full h-64 flex flex-col items-center justify-center border-b border-zinc-50 opacity-20">
               <p className="text-sm font-black uppercase tracking-[0.3em]">本月無製作排程</p>
            </div>
          ) : (
            monthTasks.map((task, idx) => {
              const style = getTaskStyle(task, days);
              const editorData = editors.find(e => e.name === task.editor);
              const statusInfo = getStatusInfo(task.status);
              
              return (
                <React.Fragment key={task.id}>
                  <div className="h-16 border-r border-b border-zinc-50 flex items-center px-6 group cursor-pointer hover:bg-slate-50 transition-colors" onClick={() => onEditTask(task)}>
                    <div className="min-w-0">
                      <p className="text-[11px] font-black truncate uppercase tracking-tighter text-slate-800">{task.show}</p>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className={`w-1.5 h-1.5 rounded-full ${statusInfo.color}`}></span>
                        <p className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider truncate">{task.episode} • {task.editor}</p>
                      </div>
                    </div>
                  </div>

                  {days.map(day => (
                    <div key={day.toISOString()} className={`h-16 border-b border-zinc-50/30 ${isToday(day) ? 'bg-indigo-50/10' : ''}`} />
                  ))}

                  {style && (
                    <div 
                      className="relative z-10 pointer-events-none" 
                      style={{ 
                        gridColumn: `${style.gridColumnStart} / ${style.gridColumnEnd}`,
                        gridRow: idx + 2
                      }}
                    >
                      <div 
                        onClick={(e) => { e.stopPropagation(); onEditTask(task); }}
                        style={{ backgroundColor: editorData?.color || '#cbd5e1' }}
                        className="absolute inset-x-1 top-3 bottom-3 rounded-lg flex items-center px-3 cursor-pointer shadow-sm hover:scale-[1.01] transition-all overflow-hidden border border-black/5 pointer-events-auto"
                      >
                        <div className={`w-1.5 h-1.5 rounded-full mr-2 ${statusInfo.color} shadow-sm border border-white/20`}></div>
                        <span className="text-[10px] font-black text-black/70 truncate uppercase tracking-widest">{task.episode}</span>
                      </div>
                    </div>
                  )}
                </React.Fragment>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default TimelineView;
