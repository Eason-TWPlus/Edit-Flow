
import React, { useMemo, useState } from 'react';
import { Task, Editor } from '../types.ts';
import { 
  format, endOfMonth, eachDayOfInterval, 
  isSameDay, addMonths, isToday, 
  endOfWeek, isWithinInterval, differenceInDays,
  setYear, getYear, isAfter, startOfYear
} from 'date-fns';
import startOfMonth from 'date-fns/startOfMonth';
import subMonths from 'date-fns/subMonths';
import parseISO from 'date-fns/parseISO';
import startOfWeek from 'date-fns/startOfWeek';
import { ChevronLeft, ChevronRight, Clock, Calendar as CalendarIcon, ArrowRight } from 'lucide-react';

interface CalendarViewProps {
  tasks: Task[];
  onEditTask: (task: Task) => void;
  editors: Editor[];
  isMobile?: boolean;
}

const CalendarView: React.FC<CalendarViewProps> = ({ tasks, onEditTask, editors, isMobile }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(new Date());

  const handlePrevMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const handleNextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  
  const jumpToYear = (year: number) => {
    setCurrentDate(setYear(currentDate, year));
  };

  const weeks = useMemo(() => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });
    return eachDayOfInterval({ start: startDate, end: endDate });
  }, [currentDate]);

  const weekRows = useMemo(() => {
    const rows = [];
    for (let i = 0; i < weeks.length; i += 7) rows.push(weeks.slice(i, i + 7));
    return rows;
  }, [weeks]);

  const currentMonthTasks = useMemo(() => {
    const start = startOfMonth(currentDate);
    const end = endOfMonth(currentDate);
    return tasks.filter(t => {
      try {
        const tStart = parseISO(t.startDate);
        const tEnd = parseISO(t.endDate);
        return (tStart <= end && tEnd >= start);
      } catch (e) { return false; }
    });
  }, [tasks, currentDate]);

  const hasFutureTasks = useMemo(() => {
    const nextYear = startOfYear(setYear(new Date(), 2026));
    return tasks.some(t => {
      try {
        const tStart = parseISO(t.startDate);
        return isAfter(tStart, nextYear) || getYear(tStart) === 2026;
      } catch(e) { return false; }
    });
  }, [tasks]);

  const tasksForSelectedDay = useMemo(() => {
    return tasks.filter(t => {
      try {
        const start = parseISO(t.startDate);
        const end = parseISO(t.endDate);
        return isWithinInterval(selectedDay, { start, end });
      } catch (e) { return false; }
    });
  }, [tasks, selectedDay]);

  const renderWeekTasks = (weekDays: Date[]) => {
    const weekStart = weekDays[0];
    const weekEnd = weekDays[6];

    return tasks
      .filter(task => {
        try {
          const start = parseISO(task.startDate);
          const end = parseISO(task.endDate);
          return (start <= weekEnd && end >= weekStart);
        } catch (e) { return false; }
      })
      .map(task => {
        const tStart = parseISO(task.startDate);
        const tEnd = parseISO(task.endDate);
        const start = tStart < weekStart ? weekStart : tStart;
        const end = tEnd > weekEnd ? weekEnd : tEnd;
        const startCol = differenceInDays(start, weekStart);
        const span = differenceInDays(end, start) + 1;
        
        const editorData = editors.find(e => e.name === task.editor);
        const bgColor = editorData?.color || '#DBD7D7';

        return (
          <div
            key={`${task.id}-${weekStart.toISOString()}`}
            onClick={(e) => { e.stopPropagation(); onEditTask(task); }}
            style={{ gridColumnStart: startCol + 1, gridColumnEnd: `span ${span}`, backgroundColor: bgColor }}
            className="h-3 md:h-5 mx-0.5 rounded px-1 flex items-center shadow-sm cursor-pointer hover:brightness-95 transition-all overflow-hidden border border-black/5 z-20 pointer-events-auto mb-1"
          >
            {!isMobile && <span className="text-[9px] font-black text-black/80 truncate">{task.show} - {task.episode}</span>}
          </div>
        );
      });
  };

  const currentYear = getYear(currentDate);

  return (
    <div className="flex flex-col h-full bg-white overflow-hidden relative">
      <div className={`${isMobile ? 'px-4 py-3' : 'px-10 py-6'} border-b border-slate-100 flex items-center justify-between bg-white z-30 shrink-0`}>
        <div className="flex items-center space-x-4">
          <h3 className={`${isMobile ? 'text-lg' : 'text-3xl'} font-black tracking-tighter uppercase italic text-slate-900`}>
            {format(currentDate, 'yyyy / MM')}
          </h3>
        </div>

        <div className="flex bg-slate-100 p-0.5 rounded-xl">
          <button onClick={handlePrevMonth} className="p-1.5 hover:bg-white rounded-lg transition-all"><ChevronLeft size={16} /></button>
          <button onClick={() => {setCurrentDate(new Date()); setSelectedDay(new Date());}} className="px-3 text-[9px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-900">Today</button>
          <button onClick={handleNextMonth} className="p-1.5 hover:bg-white rounded-lg transition-all"><ChevronRight size={16} /></button>
        </div>
      </div>

      <div className="grid grid-cols-7 bg-slate-50 border-b border-slate-200 shrink-0">
        {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, i) => (
          <div key={i} className="py-2 text-center text-[8px] font-black text-slate-300 uppercase tracking-widest">{day}</div>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col">
        <div className="flex flex-col shrink-0 min-h-max">
          {weekRows.map((week, weekIdx) => (
            <div key={weekIdx} className={`relative border-b border-slate-100 ${isMobile ? 'h-[80px]' : 'min-h-[120px] flex-1'}`}>
              <div className="absolute inset-0 grid grid-cols-7 pointer-events-none">
                {week.map((day, dayIdx) => {
                  const isCurMonth = isWithinInterval(day, { start: startOfMonth(currentDate), end: endOfMonth(currentDate) });
                  const isSel = isSameDay(day, selectedDay);
                  return (
                    <div 
                      key={dayIdx} 
                      onClick={() => setSelectedDay(day)}
                      className={`border-r border-slate-50 p-1 md:p-4 pointer-events-auto cursor-pointer transition-colors ${!isCurMonth ? 'bg-slate-50/10' : 'hover:bg-indigo-50/30'} ${isSel ? 'bg-indigo-50/50' : ''}`}
                    >
                      <span className={`text-[10px] md:text-sm font-black flex items-center justify-center w-6 h-6 md:w-7 md:h-7 ${isToday(day) ? 'bg-slate-900 text-white rounded-lg' : isSel ? 'text-indigo-600' : 'text-slate-800'}`}>
                        {format(day, 'd')}
                      </span>
                    </div>
                  );
                })}
              </div>
              <div className={`grid grid-cols-7 grid-flow-row-dense w-full h-full relative z-10 ${isMobile ? 'pt-8 pb-1 px-0.5' : 'pt-12 pb-2 px-1'} pointer-events-none`}>
                {renderWeekTasks(week)}
              </div>
            </div>
          ))}
        </div>

        {isMobile && (
          <div className="border-t border-slate-100 p-6 bg-slate-50/50 min-h-[200px]">
            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-4 flex items-center">
              <Clock size={12} className="mr-2" /> 
              {format(selectedDay, 'MMM d日')} 排程清單
            </h4>
            <div className="space-y-3">
              {tasksForSelectedDay.length > 0 ? (
                tasksForSelectedDay.map(t => (
                  <div 
                    key={t.id} 
                    onClick={() => onEditTask(t)}
                    className="bg-white p-4 rounded-2xl border border-slate-200 flex items-center justify-between shadow-sm active:scale-[0.98] transition-all"
                  >
                    <div className="flex items-center space-x-4">
                      <div 
                        className="w-2.5 h-10 rounded-full" 
                        style={{ backgroundColor: editors.find(e => e.name === t.editor)?.color || '#ccc' }} 
                      />
                      <div className="min-w-0">
                        <p className="text-sm font-black text-slate-800 truncate">{t.show}</p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1">{t.episode} • {t.editor}</p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12 bg-white/50 rounded-2xl border border-dashed border-slate-200">
                  <p className="text-slate-300 font-bold uppercase text-[10px] tracking-widest">本日無製作排程</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CalendarView;
