'use client';

import { useState, useEffect } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, addMonths, subMonths, isSameMonth, isSameDay, startOfWeek, endOfWeek, addWeeks, subWeeks, addDays, subDays, eachHourOfInterval, startOfDay, endOfDay, isSameHour, setHours, setMinutes, parseISO } from 'date-fns';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, LayoutGrid, List, X } from 'lucide-react';

interface Event {
  id: number;
  title: string;
  date: Date | string;
  time?: string;
  duration?: number;
  description?: string;
  color: string;
}

type ViewType = 'month' | 'week' | 'day';

export default function Calendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<ViewType>('month');
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showEventForm, setShowEventForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [eventForm, setEventForm] = useState({
    title: '',
    time: '',
    duration: 60,
    description: '',
    color: '#3B82F6'
  });
  
  const today = new Date();

  // Fetch events from the database
  const fetchEvents = async () => {
    try {
      const response = await fetch('/api/events');
      if (response.ok) {
        const data = await response.json();
        // Convert date strings to Date objects
        const formattedEvents = data.map((event: Event) => ({
          ...event,
          date: typeof event.date === 'string' ? parseISO(event.date) : event.date
        }));
        setEvents(formattedEvents);
      }
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setLoading(false);
    }
  };

  // Load events on component mount
  useEffect(() => {
    fetchEvents();
  }, []);

  // Navigation functions
  const navigateNext = () => {
    switch (view) {
      case 'month':
        setCurrentDate(addMonths(currentDate, 1));
        break;
      case 'week':
        setCurrentDate(addWeeks(currentDate, 1));
        break;
      case 'day':
        setCurrentDate(addDays(currentDate, 1));
        break;
    }
  };

  const navigatePrev = () => {
    switch (view) {
      case 'month':
        setCurrentDate(subMonths(currentDate, 1));
        break;
      case 'week':
        setCurrentDate(subWeeks(currentDate, 1));
        break;
      case 'day':
        setCurrentDate(subDays(currentDate, 1));
        break;
    }
  };

  const getNavigationTitle = () => {
    switch (view) {
      case 'month':
        return format(currentDate, 'MMMM yyyy');
      case 'week':
        const weekStart = startOfWeek(currentDate);
        const weekEnd = endOfWeek(currentDate);
        return `${format(weekStart, 'MMM d')} - ${format(weekEnd, 'MMM d, yyyy')}`;
      case 'day':
        return format(currentDate, 'EEEE, MMMM d, yyyy');
    }
  };

  // Event functions
  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    setShowEventForm(true);
  };

  const handleTimeClick = (date: Date, hour: number) => {
    const clickedDate = setHours(setMinutes(date, 0), hour);
    setSelectedDate(clickedDate);
    setEventForm({ ...eventForm, time: format(clickedDate, 'HH:mm') });
    setShowEventForm(true);
  };

  const handleSubmitEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (eventForm.title && selectedDate) {
      try {
        const eventData = {
          title: eventForm.title,
          date: format(selectedDate, 'yyyy-MM-dd'),
          time: eventForm.time || null,
          duration: eventForm.duration,
          description: eventForm.description || null,
          color: eventForm.color
        };

        if (editingEvent) {
          // Update existing event
          const response = await fetch(`/api/events/${editingEvent.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(eventData)
          });

          if (response.ok) {
            await fetchEvents(); // Refresh events from database
            setEditingEvent(null);
          }
        } else {
          // Create new event
          const response = await fetch('/api/events', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(eventData)
          });

          if (response.ok) {
            await fetchEvents(); // Refresh events from database
          }
        }
        
        setEventForm({ title: '', time: '', duration: 60, description: '', color: '#3B82F6' });
        setShowEventForm(false);
      } catch (error) {
        console.error('Error saving event:', error);
      }
    }
  };

  const getEventsForDate = (date: Date) => {
    return events.filter(event => 
      isSameDay(event.date, date)
    );
  };

  const getEventsForHour = (date: Date, hour: number) => {
    return events.filter(event => {
      if (!isSameDay(event.date, date)) return false;
      if (!event.time) return false;
      const eventHour = parseInt(event.time.split(':')[0]);
      return eventHour === hour;
    });
  };

  const deleteEvent = async (eventId: number) => {
    try {
      const response = await fetch(`/api/events/${eventId}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        await fetchEvents(); // Refresh events from database
      }
    } catch (error) {
      console.error('Error deleting event:', error);
    }
  };

  const editEvent = (event: Event) => {
    setEditingEvent(event);
    const eventDate = typeof event.date === 'string' ? parseISO(event.date) : event.date;
    setSelectedDate(eventDate);
    setEventForm({
      title: event.title,
      time: event.time || '',
      duration: event.duration || 60,
      description: event.description || '',
      color: event.color
    });
    setShowEventForm(true);
  };

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const hours = Array.from({ length: 24 }, (_, i) => i);

  // Month View
  const renderMonthView = () => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const calendarStart = startOfWeek(monthStart);
    const calendarEnd = endOfWeek(monthEnd);
    const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

    return (
      <>
        <div className="grid grid-cols-7 gap-2 mb-2">
          {weekDays.map((day) => (
            <div
              key={day}
              className="text-center text-sm font-medium text-gray-700 py-2"
            >
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-2">
          {days.map((day) => {
            const isCurrentMonth = isSameMonth(day, currentDate);
            const isToday = isSameDay(day, today);
            const dayEvents = getEventsForDate(day);

            return (
              <div
                key={day.toISOString()}
                onClick={() => handleDateClick(day)}
                className={`
                  min-h-[100px] p-2 cursor-pointer rounded-lg border
                  ${!isCurrentMonth ? 'text-gray-400 bg-gray-50' : 'text-gray-900 bg-white'}
                  ${isToday ? 'border-blue-500 border-2' : 'border-gray-200'}
                  hover:bg-gray-50 transition-colors
                `}
              >
                <div className={`text-sm font-medium ${isToday ? 'text-blue-500' : ''}`}>
                  {format(day, 'd')}
                </div>
                <div className="mt-1 space-y-1">
                  {dayEvents.slice(0, 3).map((event) => (
                    <div
                      key={event.id}
                      className="text-xs p-1 rounded truncate cursor-pointer hover:opacity-80"
                      style={{ backgroundColor: event.color + '20', color: event.color }}
                      onClick={(e) => {
                        e.stopPropagation();
                        editEvent(event);
                      }}
                    >
                      {event.time && <span className="font-medium">{event.time} </span>}
                      {event.title}
                    </div>
                  ))}
                  {dayEvents.length > 3 && (
                    <div className="text-xs text-gray-500">
                      +{dayEvents.length - 3} more
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </>
    );
  };

  // Week View
  const renderWeekView = () => {
    const weekStart = startOfWeek(currentDate);
    const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

    // Get all events for the week and calculate their positions
    const getEventPosition = (event: Event) => {
      if (!event.time) return null;
      const [hourStr, minuteStr] = event.time.split(':');
      const hour = parseInt(hourStr);
      const minute = parseInt(minuteStr);
      const duration = event.duration || 60;
      
      // Calculate total minutes from start of day
      const totalMinutes = hour * 60 + minute;
      // Convert to pixels (60px per hour = 1px per minute)
      const topPosition = totalMinutes; // This gives us the exact pixel position
      const height = duration; // Duration in minutes = pixels
      
      return { topPosition, height };
    };

    return (
      <div className="overflow-x-auto">
        <div className="min-w-[800px]">
          <div className="grid grid-cols-8 border-b">
            <div className="p-2 text-xs text-gray-500"></div>
            {weekDays.map((day) => (
              <div
                key={day.toISOString()}
                className={`p-2 text-center border-l ${
                  isSameDay(day, today) ? 'bg-blue-50' : ''
                }`}
              >
                <div className="text-sm font-medium">{format(day, 'EEE')}</div>
                <div className={`text-lg ${isSameDay(day, today) ? 'text-blue-500 font-bold' : ''}`}>
                  {format(day, 'd')}
                </div>
              </div>
            ))}
          </div>

          <div className="relative">
            <div className="grid grid-cols-8">
              <div></div>
              {weekDays.map((day) => (
                <div key={day.toISOString()} className="relative">
                  {/* Events container for each day */}
                  {getEventsForDate(day).map((event) => {
                    const position = getEventPosition(event);
                    if (!position) return null;
                    
                    return (
                      <div
                        key={event.id}
                        className="absolute left-0 right-0 mx-1 p-1 rounded text-xs overflow-hidden cursor-pointer z-10"
                        style={{
                          backgroundColor: event.color + '20',
                          borderLeft: `3px solid ${event.color}`,
                          color: event.color,
                          top: `${position.topPosition + 2}px`,
                          height: `${position.height - 4}px`,
                          minHeight: '20px'
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          editEvent(event);
                        }}
                      >
                        <div className="font-medium truncate">{event.title}</div>
                        {position.height > 30 && event.time && (
                          <div className="text-xs opacity-75">{event.time}</div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
            
            {/* Hour grid lines */}
            {hours.map((hour) => (
              <div key={hour} className="grid grid-cols-8 border-b">
                <div className="p-2 text-xs text-gray-500 text-right">
                  {format(setHours(new Date(), hour), 'ha')}
                </div>
                {weekDays.map((day) => {
                  return (
                    <div
                      key={`${day.toISOString()}-${hour}`}
                      onClick={() => handleTimeClick(day, hour)}
                      className="min-h-[60px] border-l cursor-pointer hover:bg-gray-50"
                    >
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // Day View
  const renderDayView = () => {
    const dayStart = startOfDay(currentDate);
    const dayEvents = getEventsForDate(currentDate);

    // Get event position for day view
    const getEventPosition = (event: Event) => {
      if (!event.time) return null;
      const [hourStr, minuteStr] = event.time.split(':');
      const hour = parseInt(hourStr);
      const minute = parseInt(minuteStr);
      const duration = event.duration || 60;
      
      // Calculate total minutes from start of day
      const totalMinutes = hour * 60 + minute;
      // Convert to pixels (80px per hour = 1.333px per minute)
      const topPosition = (totalMinutes * 80) / 60;
      const height = (duration * 80) / 60;
      
      return { topPosition, height };
    };

    return (
      <div className="overflow-y-auto max-h-[600px] relative">
        <div className="min-w-full">
          {hours.map((hour) => (
            <div
              key={hour}
              className="flex border-b"
            >
              <div className="w-20 p-2 text-sm text-gray-500 text-right">
                {format(setHours(new Date(), hour), 'ha')}
              </div>
              <div
                onClick={() => handleTimeClick(currentDate, hour)}
                className="flex-1 min-h-[80px] border-l cursor-pointer hover:bg-gray-50 relative"
              >
              </div>
            </div>
          ))}
          
          {/* Render events as absolute positioned elements */}
          <div className="absolute top-0 left-20 right-0">
            {dayEvents.map((event) => {
              const position = getEventPosition(event);
              if (!position) return null;
              
              return (
                <div
                  key={event.id}
                  className="absolute left-2 right-2 p-2 rounded-lg cursor-pointer"
                  style={{
                    backgroundColor: event.color + '20',
                    borderLeft: `4px solid ${event.color}`,
                    top: `${position.topPosition + 2}px`,
                    height: `${position.height - 4}px`,
                    minHeight: '30px'
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    editEvent(event);
                  }}
                >
                  <div className="font-medium text-sm">{event.title}</div>
                  {position.height > 40 && event.time && (
                    <div className="text-xs text-gray-600">{event.time}</div>
                  )}
                  {position.height > 60 && event.description && (
                    <div className="text-xs text-gray-600 mt-1">{event.description}</div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto bg-white rounded-lg shadow-lg p-6">
        <div className="text-center py-12">
          <div className="text-gray-500">Loading events...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto bg-white rounded-lg shadow-lg p-6">
      {/* Header with navigation and view switcher */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={navigatePrev}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h2 className="text-xl font-semibold min-w-[200px] text-center">
            {getNavigationTitle()}
          </h2>
          <button
            onClick={navigateNext}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* View Switcher */}
        <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
          <button
            onClick={() => setView('month')}
            className={`px-3 py-1 rounded flex items-center gap-2 transition-colors ${
              view === 'month' ? 'bg-white shadow-sm' : 'hover:bg-gray-200'
            }`}
          >
            <LayoutGrid className="w-4 h-4" />
            Month
          </button>
          <button
            onClick={() => setView('week')}
            className={`px-3 py-1 rounded flex items-center gap-2 transition-colors ${
              view === 'week' ? 'bg-white shadow-sm' : 'hover:bg-gray-200'
            }`}
          >
            <CalendarIcon className="w-4 h-4" />
            Week
          </button>
          <button
            onClick={() => setView('day')}
            className={`px-3 py-1 rounded flex items-center gap-2 transition-colors ${
              view === 'day' ? 'bg-white shadow-sm' : 'hover:bg-gray-200'
            }`}
          >
            <List className="w-4 h-4" />
            Day
          </button>
        </div>
      </div>

      {/* Calendar Views */}
      <div className="mb-6">
        {view === 'month' && renderMonthView()}
        {view === 'week' && renderWeekView()}
        {view === 'day' && renderDayView()}
      </div>

      {/* Event Form Modal */}
      {showEventForm && selectedDate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">
                {editingEvent ? 'Edit' : 'Add'} Event - {format(selectedDate, 'MMM d, yyyy')}
              </h3>
              <button
                onClick={() => {
                  setShowEventForm(false);
                  setEditingEvent(null);
                  setEventForm({ title: '', time: '', duration: 60, description: '', color: '#3B82F6' });
                }}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitEvent}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Event Title *
                  </label>
                  <input
                    type="text"
                    value={eventForm.title}
                    onChange={(e) => setEventForm({...eventForm, title: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Time
                    </label>
                    <input
                      type="time"
                      value={eventForm.time}
                      onChange={(e) => setEventForm({...eventForm, time: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Duration (minutes)
                    </label>
                    <select
                      value={eventForm.duration}
                      onChange={(e) => setEventForm({...eventForm, duration: parseInt(e.target.value)})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="15">15 min</option>
                      <option value="30">30 min</option>
                      <option value="45">45 min</option>
                      <option value="60">1 hour</option>
                      <option value="90">1.5 hours</option>
                      <option value="120">2 hours</option>
                      <option value="180">3 hours</option>
                      <option value="240">4 hours</option>
                      <option value="480">All day</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={eventForm.description}
                    onChange={(e) => setEventForm({...eventForm, description: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={3}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Color
                  </label>
                  <div className="flex gap-2">
                    {['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'].map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setEventForm({...eventForm, color})}
                        className={`w-8 h-8 rounded-full border-2 ${
                          eventForm.color === color ? 'border-gray-800' : 'border-gray-300'
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex gap-2 mt-6">
                <button
                  type="submit"
                  className="flex-1 bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-colors"
                >
                  {editingEvent ? 'Update' : 'Add'} Event
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowEventForm(false);
                    setEditingEvent(null);
                    setEventForm({ title: '', time: '', duration: 60, description: '', color: '#3B82F6' });
                  }}
                  className="flex-1 bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Events List */}
      <div className="mt-8">
        <h3 className="text-lg font-semibold mb-4">All Events</h3>
        {events.length === 0 ? (
          <p className="text-gray-500 text-center py-4">No events yet. Click on a date to add an event.</p>
        ) : (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {events.sort((a, b) => {
              // Convert dates to Date objects if they're strings
              const dateA = typeof a.date === 'string' ? parseISO(a.date) : a.date;
              const dateB = typeof b.date === 'string' ? parseISO(b.date) : b.date;
              
              // Sort by date first
              const dateCompare = dateA.getTime() - dateB.getTime();
              if (dateCompare !== 0) return dateCompare;
              
              // If same date, sort by time
              if (a.time && b.time) {
                return a.time.localeCompare(b.time);
              }
              return 0;
            }).map((event) => {
              const formatDuration = (minutes?: number) => {
                if (!minutes) return '';
                if (minutes === 480) return 'All day';
                if (minutes < 60) return `${minutes} min`;
                const hours = Math.floor(minutes / 60);
                const mins = minutes % 60;
                if (mins === 0) return `${hours} hour${hours > 1 ? 's' : ''}`;
                return `${hours}h ${mins}m`;
              };

              return (
                <div
                  key={event.id}
                  className="flex items-center justify-between p-3 rounded-lg border border-gray-200 cursor-pointer hover:bg-gray-50"
                  style={{ borderLeftColor: event.color, borderLeftWidth: '4px' }}
                  onClick={() => editEvent(event)}
                >
                  <div>
                    <div className="font-medium">{event.title}</div>
                    <div className="text-sm text-gray-600">
                      {format(event.date, 'MMM d, yyyy')}
                      {event.time && ` at ${event.time}`}
                      {event.duration && ` • ${formatDuration(event.duration)}`}
                    </div>
                    {event.description && (
                      <div className="text-sm text-gray-500 mt-1">{event.description}</div>
                    )}
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteEvent(event.id);
                    }}
                    className="p-1 hover:bg-gray-100 rounded"
                  >
                    <X className="w-4 h-4 text-gray-500" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}