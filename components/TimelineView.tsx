
import React, { useMemo, useState } from 'react';
import { Task } from '../types';
// Fix: split date-fns imports to use direct paths for members reported as missing from the main index
import { format, endOfMonth, eachDayOfInterval, isSameDay, addMonths, isToday } from 'date-fns';
import startOfMonth from 'date-fns/startOfMonth';
import subMonths from 'date-fns/subMonths';
import parseISO from 'date-fns/parseISO';
// Fix: Import locale from specific path to avoid missing member error
import zhTW from 'date-fns/locale/zh-TW';
import { ChevronLeft, ChevronRight, User } from 'lucide-react';

interface TimelineViewProps {
  tasks: Task[];
  onEditTask: (task: Task) => void;
}

const TimelineView: React.FC<TimelineViewProps> = ({ tasks, onEditTask }) => {
  const [currentDate, setCurrentDate] = useState(new Date());

  const days = useMemo(() => {
    return eachDayOfInterval({
      start: startOfMonth(currentDate),
      end: endOfMonth(currentDate)
    });
  }, [currentDate]);

  const handlePrevMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const handleNextMonth = () => setCurrentDate(addMonths(currentDate, 1));

  // 取得該月分的任務並過濾
  const monthTasks = useMemo(() => {
    const start = startOfMonth(currentDate);
    const end = endOfMonth(currentDate);
    return tasks.filter(t => {
      const ts = parseISO(t.startDate);
      const te = parseISO(t.endDate);
      return (ts <= end && te >= start);
    });
  }, [tasks, currentDate]);

  const getTaskStyle = (task: Task, daysInView: Date[]) => {
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
      gridColumnEnd: endIndex + 3 // span covers columns
    };
  };

  return (
    <div className="flex flex-col h-full overflow-hidden bg-white">
      <div className="p-8 border-b border-zinc-100 flex items-center justify-between">
        <h3 className="text-2xl font-black uppercase tracking-tight italic">
          {format(currentDate, 'yyyy / MMMM', { locale: zhTW })}
        </h3>
        <div className="flex items-center bg-zinc-100 p-1.5 rounded-2xl">
          <button onClick={handlePrevMonth} className="p-2 hover:bg-white rounded-xl transition-all"><ChevronLeft size={18} /></button>
          <button onClick={() => setCurrentDate(new Date())} className="px-6 text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:text-black">Current</button>
          <button onClick={handleNextMonth} className="p-2 hover:bg-white rounded-xl transition-all"><ChevronRight size={18} /></button>
        </div>
      </div>

      <div className="flex-1 overflow-auto custom-scrollbar">
        <div 
          className="min-w-max grid"
          style={{ gridTemplateColumns: `280px repeat(${days.length}, 64px)` }}
        >
          {/* Header */}
          <div className="sticky top-0 z-30 bg-white border-b border-r border-zinc-100 h-16 flex items-center px-8 shadow-sm">
            <span className="text-[10px] font-black text-zinc-300 uppercase tracking-widest">任務與剪輯項目</span>
          </div>
          {days.map(day => (
            <div 
              key={day.toISOString()} 
              className={`sticky top-0 z-20 h-16 border-b border-zinc-100 flex flex-col items-center justify-center ${isToday(day) ? 'bg-zinc-50' : 'bg-white'}`}
            >
              <span className="text-[10px] font-black text-zinc-200 uppercase tracking-tighter">{format(day, 'EEE')}</span>
              <span className={`text-sm font-black mt-1 ${isToday(day) ? 'text-black' : 'text-zinc-600'}`}>{format(day, 'd')}</span>
            </div>
          ))}

          {/* Rows */}
          {monthTasks.length === 0 ? (
            <div className="col-span-full h-96 flex flex-col items-center justify-center border-b border-zinc-50 opacity-30">
               <p className="text-sm font-black uppercase tracking-[0.3em]">No tasks scheduled this month</p>
            </div>
          ) : (
            monthTasks.map((task, idx) => {
              const style = getTaskStyle(task, days);
              return (
                <React.Fragment key={task.id}>
                  <div className="h-20 border-r border-b border-zinc-50 flex items-center px-8 group cursor-pointer hover:bg-zinc-50/50 transition-colors" onClick={() => onEditTask(task)}>
                    <div className="w-10 h-10 rounded-xl bg-zinc-50 flex items-center justify-center mr-4 text-zinc-300 group-hover:bg-black group-hover:text-white transition-all">
                      <User size={18} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-black truncate uppercase tracking-tighter text-zinc-800">{task.show}</p>
                      <p className="text-[10px] text-zinc-400 font-bold uppercase mt-1 tracking-widest">{task.episode} • {task.editor}</p>
                    </div>
                  </div>

                  {days.map(day => (
                    <div key={day.toISOString()} className={`h-20 border-b border-zinc-50/50 ${isToday(day) ? 'bg-zinc-50/30' : ''}`} />
                  ))}

                  {style && (
                    <div 
                      className="relative z-10" 
                      style={{ 
                        gridColumn: `${style.gridColumnStart} / ${style.gridColumnEnd}`,
                        gridRow: idx + 2
                      }}
                    >
                      <div 
                        onClick={() => onEditTask(task)}
                        className="absolute inset-x-1 top-4 bottom-4 rounded-xl bg-black flex items-center px-4 cursor-pointer shadow-xl hover:scale-[1.02] transition-all overflow-hidden border border-white/10"
                      >
                        <span className="text-[10px] font-black text-white truncate uppercase tracking-widest">{task.episode}</span>
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
