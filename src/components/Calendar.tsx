'use client';

import { useState } from 'react';
import { 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  format, 
  isSameMonth, 
  isSameDay,
  addMonths,
  subMonths
} from 'date-fns';

interface Schedule {
  id: number;
  facility_id: number;
  facility_name?: string;
  home_team_id: number;
  home_team_name?: string;
  away_team_id: number | null;
  away_team_name?: string;
  event_type: string;
  title: string;
  start_time: number;
  end_time: number;
  is_published: number;
  has_conflict: number;
  conflict_reason?: string | null;
}

interface CalendarProps {
  schedules: Schedule[];
  onEventClick?: (schedule: Schedule) => void;
}

export default function Calendar({ schedules, onEventClick }: CalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthStart);
  
  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  function getEventsForDay(day: Date): Schedule[] {
    return schedules.filter(s => {
      const eventDate = new Date(s.start_time);
      return isSameDay(eventDate, day);
    }).sort((a, b) => a.start_time - b.start_time);
  }

  function formatEventTime(timestamp: number): string {
    return format(new Date(timestamp), 'h:mm a');
  }

  function getEventTypeStyle(type: string): React.CSSProperties {
    switch (type) {
      case 'game':
        return { background: '#dbeafe', color: '#1e40af' };
      case 'practice':
        return { background: '#fce7f3', color: '#9d174d' };
      default:
        return { background: '#e5e7eb', color: '#374151' };
    }
  }

  return (
    <div className="calendar-container">
      {/* Calendar Header */}
      <div className="calendar-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <button 
          className="btn btn-ghost" 
          style={{ padding: '0.375rem 0.75rem' }}
          onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
        >
          ← Prev
        </button>
        <h3 style={{ fontSize: '1.125rem', fontWeight: 600, minWidth: '180px', textAlign: 'center', margin: 0 }}>
          {format(currentMonth, 'MMMM yyyy')}
        </h3>
        <button 
          className="btn btn-ghost" 
          style={{ padding: '0.375rem 0.75rem' }}
          onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
        >
          Next →
        </button>
      </div>

      {/* Day Headers */}
      <div className="calendar-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '1px', background: 'var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden' }}>
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} style={{ 
            padding: '0.5rem', 
            background: 'var(--surface)', 
            textAlign: 'center', 
            fontWeight: 600,
            fontSize: '0.75rem',
            color: 'var(--secondary)'
          }}>
            {day}
          </div>
        ))}
        
        {/* Calendar Days */}
        {days.map((day, idx) => {
          const dayEvents = getEventsForDay(day);
          const isCurrentMonth = isSameMonth(day, currentMonth);
          const isToday = isSameDay(day, new Date());
          
          return (
            <div 
              key={idx} 
              style={{ 
                minHeight: '100px',
                padding: '0.5rem',
                background: isCurrentMonth ? 'var(--surface)' : 'var(--surface-alt)',
                opacity: isCurrentMonth ? 1 : 0.5
              }}
            >
              <div style={{ 
                fontSize: '0.875rem', 
                fontWeight: isToday ? 700 : 500,
                color: isToday ? 'var(--primary)' : 'var(--text)',
                marginBottom: '0.5rem'
              }}>
                {format(day, 'd')}
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                {dayEvents.slice(0, 3).map(event => {
                  const eventStyle = getEventTypeStyle(event.event_type);
                  return (
                    <div 
                      key={event.id}
                      onClick={() => onEventClick?.(event)}
                      style={{
                        fontSize: '0.6875rem',
                        padding: '0.25rem 0.375rem',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        ...eventStyle
                      }}
                      title={event.title}
                    >
                      <div style={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {formatEventTime(event.start_time)}
                      </div>
                      <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {event.home_team_name || 'TBD'}
                      </div>
                    </div>
                  );
                })}
                {dayEvents.length > 3 && (
                  <div style={{ fontSize: '0.625rem', color: 'var(--secondary)', textAlign: 'center' }}>
                    +{dayEvents.length - 3} more
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', justifyContent: 'center' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem' }}>
          <span style={{ width: '12px', height: '12px', borderRadius: '2px', background: '#dbeafe' }}></span>
          Game
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem' }}>
          <span style={{ width: '12px', height: '12px', borderRadius: '2px', background: '#fce7f3' }}></span>
          Practice
        </span>
      </div>
    </div>
  );
}
