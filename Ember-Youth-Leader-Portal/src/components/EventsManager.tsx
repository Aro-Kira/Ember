import { useState, FormEvent } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  PlusCircle, 
  UserCheck, 
  DollarSign, 
  BarChart2, 
  Mail, 
  Download, 
  MoreVertical, 
  Edit, 
  Users, 
  Send,
  X,
  Check,
  Trash2,
  Eye,
  GripVertical
} from 'lucide-react';
import { PortalEvent, RegistrationField } from '../types';

interface EventsManagerProps {
  events: PortalEvent[];
  onAddEvent: (event: Omit<PortalEvent, 'id' | 'checkedIn'>) => void;
  onUpdateEvent: (event: PortalEvent) => void;
  onDeleteEvent: (id: string) => void;
}

const MOCK_REGISTERED_MEMBERS = [
  { id: '1', name: 'Maya Thompson', level: 'Inferno' as const, avatar: 'MT' },
  { id: '2', name: 'Elijah Reyes', level: 'Blaze' as const, avatar: 'ER' },
  { id: '3', name: 'Zara Patel', level: 'Ignition' as const, avatar: 'ZP' },
  { id: '4', name: 'Caleb Washington', level: 'Inferno' as const, avatar: 'CW' },
  { id: '5', name: 'Lily Nakamura', level: 'Blaze' as const, avatar: 'LN' },
];

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 1).getDay();
}

function formatEventDate(dateKey: string, time: string): string {
  const monthAbbrs: { [key: string]: string } = {
    '01': 'JAN', '02': 'FEB', '03': 'MAR', '04': 'APR', '05': 'MAY', '06': 'JUN',
    '07': 'JUL', '08': 'AUG', '09': 'SEP', '10': 'OCT', '11': 'NOV', '12': 'DEC'
  };
  const parts = dateKey.split('-');
  const mKey = parts[1] || '10';
  const dayVal = parts[2] || '15';
  return `${monthAbbrs[mKey] || 'OCT'} ${dayVal} • ${time}`;
}

const DEFAULT_CAPACITY_COLORS = {
  live: 'bg-tertiary-container/20 text-tertiary border-tertiary-container',
  summit: 'bg-primary-container/20 text-primary border-primary-container',
  meet: 'bg-secondary-container/20 text-secondary border-secondary',
  cleanup: 'bg-secondary-container/20 text-secondary border-secondary',
};

export default function EventsManager({ 
  events, 
  onAddEvent,
  onUpdateEvent,
  onDeleteEvent
}: EventsManagerProps) {
  const [viewType, setViewType] = useState<'MONTH' | 'WEEK' | 'LIST'>('MONTH');

  // Calendar navigation state
  const [currentMonth, setCurrentMonth] = useState(9); // October (0-indexed)
  const [currentYear, setCurrentYear] = useState(2024);

  // Event modal form state
  const [showAddModal, setShowAddModal] = useState(false);
  const [eventName, setEventName] = useState('');
  const [eventDate, setEventDate] = useState('2024-10-18'); // default day
  const [eventTime, setEventTime] = useState('7:00 PM');
  const [eventCapacity, setEventCapacity] = useState(150);
  const [eventType, setEventType] = useState<'live' | 'meet' | 'summit' | 'cleanup'>('live');

  // Edit modal state
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState<PortalEvent | null>(null);
  const [editName, setEditName] = useState('');
  const [editDate, setEditDate] = useState('');
  const [editTime, setEditTime] = useState('');
  const [editCapacity, setEditCapacity] = useState(150);
  const [editType, setEditType] = useState<'live' | 'meet' | 'summit' | 'cleanup'>('live');

  // Registration fields state for create modal
  const [createRegFields, setCreateRegFields] = useState<RegistrationField[]>([]);
  const [newFieldType, setNewFieldType] = useState<RegistrationField['type']>('text');
  const [newFieldLabel, setNewFieldLabel] = useState('');
  const [newFieldRequired, setNewFieldRequired] = useState(false);
  const [newFieldOptions, setNewFieldOptions] = useState('');

  // Registration fields state for edit modal
  const [editRegFields, setEditRegFields] = useState<RegistrationField[]>([]);

  // Delete confirmation state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingEventId, setDeletingEventId] = useState<string | null>(null);

  // Detail view state
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [detailEvent, setDetailEvent] = useState<PortalEvent | null>(null);

  const handleCreateEvent = (e: FormEvent) => {
    e.preventDefault();
    const errors: string[] = [];
    
    if (!eventName) {
      errors.push('Event Name is required');
    }
    
    if (!eventDate) {
      errors.push('Event Date is required');
    }
    
    if (errors.length > 0) {
      toast.error(errors.join(', '));
      return;
    }

    const displayDate = formatEventDate(eventDate, eventTime);

    onAddEvent({
      title: eventName,
      dateTime: displayDate,
      registered: 0,
      totalCapacity: eventCapacity,
      type: eventType,
      dateKey: eventDate,
      revenue: eventType === 'summit' ? 1500 : eventType === 'live' ? 100 : 0,
      registrationFields: createRegFields
    });

    // Reset Form
    setEventName('');
    setEventCapacity(150);
    setEventType('live');
    setCreateRegFields([]);
    setShowAddModal(false);
    toast.success('Event created and rendered on the portal calendar grid.');
  };

  const handleOpenEditModal = (event: PortalEvent) => {
    setEditingEvent(event);
    setEditName(event.title);
    setEditDate(event.dateKey);
    const timeMatch = event.dateTime.match(/•\s*(.+)/);
    setEditTime(timeMatch ? timeMatch[1].trim() : '7:00 PM');
    setEditCapacity(event.totalCapacity);
    setEditType(event.type);
    setEditRegFields(event.registrationFields || []);
    setShowEditModal(true);
    toast.info(`Editing event: ${event.title}`);
  };

  const handleSaveEdit = (e: FormEvent) => {
    e.preventDefault();
    const errors: string[] = [];
    
    if (!editingEvent || !editName) {
      errors.push('Event Name is required');
    }
    
    if (!editDate) {
      errors.push('Event Date is required');
    }
    
    if (errors.length > 0) {
      toast.error(errors.join(', '));
      return;
    }

    const displayDate = formatEventDate(editDate, editTime);

    onUpdateEvent({
      ...editingEvent,
      title: editName,
      dateTime: displayDate,
      dateKey: editDate,
      totalCapacity: editCapacity,
      type: editType,
      revenue: editType === 'summit' ? 1500 : editType === 'live' ? 100 : 0,
      registrationFields: editRegFields
    });

    setShowEditModal(false);
    setEditingEvent(null);
    toast.success('Event updated successfully!');
  };

  const handleDeleteClick = (id: string) => {
    setDeletingEventId(id);
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = () => {
    if (deletingEventId) {
      onDeleteEvent(deletingEventId);
      setShowDeleteConfirm(false);
      setDeletingEventId(null);
    }
  };

  const handleOpenDetail = (event: PortalEvent) => {
    setDetailEvent(event);
    setShowDetailModal(true);
  };

  const addRegField = (target: 'create' | 'edit') => {
    if (!newFieldLabel.trim()) return;
    
    const field: RegistrationField = {
      id: `field_${Date.now()}`,
      label: newFieldLabel.trim(),
      type: newFieldType,
      required: newFieldRequired,
      options: newFieldType === 'select' ? newFieldOptions.split(',').map(o => o.trim()).filter(Boolean) : undefined
    };

    if (target === 'create') {
      setCreateRegFields([...createRegFields, field]);
    } else {
      setEditRegFields([...editRegFields, field]);
    }

    setNewFieldLabel('');
    setNewFieldType('text');
    setNewFieldRequired(false);
    setNewFieldOptions('');
  };

  const removeRegField = (fieldId: string, target: 'create' | 'edit') => {
    if (target === 'create') {
      setCreateRegFields(createRegFields.filter(f => f.id !== fieldId));
    } else {
      setEditRegFields(editRegFields.filter(f => f.id !== fieldId));
    }
  };

  const handleSimulateCheckIn = (event: PortalEvent) => {
    if (event.checkedIn >= event.registered) {
      toast.warning('All registered members already checked in!');
      return;
    }
    const newCheckedIn = Math.min(event.checkedIn + 10, event.registered);
    onUpdateEvent({
      ...event,
      checkedIn: newCheckedIn
    });
    // Also update the detail event if open
    if (detailEvent && detailEvent.id === event.id) {
      setDetailEvent({ ...event, checkedIn: newCheckedIn });
    }
    toast.success(`Simulated 10 check-ins for ${event.title}! Current checked-in: ${newCheckedIn}/${event.registered}`);
  };

  // Calendar navigation
  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  // Dynamic calendar calculations
  const daysInCurrentMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDayOfMonth = getFirstDayOfMonth(currentYear, currentMonth);
  const daysInPrevMonth = currentMonth === 0
    ? getDaysInMonth(currentYear - 1, 11)
    : getDaysInMonth(currentYear, currentMonth - 1);

  const daysArray = Array.from({ length: daysInCurrentMonth }, (_, i) => i + 1);
  const prevMonthFillers = Array.from({ length: firstDayOfMonth }, (_, i) => daysInPrevMonth - firstDayOfMonth + i + 1);
  const totalCells = firstDayOfMonth + daysInCurrentMonth;
  const remainingCells = totalCells % 7 === 0 ? 0 : 7 - (totalCells % 7);
  const nextMonthFillers = Array.from({ length: remainingCells }, (_, i) => i + 1);

  // Helper to find calendar event on a specific dateKey
  const getEventsForDay = (dayNum: number) => {
    const formattedDay = dayNum < 10 ? `0${dayNum}` : `${dayNum}`;
    const formattedMonth = (currentMonth + 1) < 10 ? `0${currentMonth + 1}` : `${currentMonth + 1}`;
    const dateStr = `${currentYear}-${formattedMonth}-${formattedDay}`;
    return events.filter(e => e.dateKey === dateStr);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-12 gap-6 max-w-[1400px] mx-auto items-start">
        
        {/* Left Side: Monthly Calendar Grid & Stats (Span 8) */}
        <div className="col-span-12 lg:col-span-8 space-y-6">
          
          {/* Calendar Controller Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-surface-container-low p-4 rounded-xl border border-surface-variant gap-4">
            <div className="flex items-center gap-4">
              <button 
                onClick={handlePrevMonth}
                className="p-2 rounded-lg hover:bg-surface-container-high text-on-surface transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <h3 className="font-sans text-md font-bold text-on-surface">
                {MONTH_NAMES[currentMonth]} {currentYear}
              </h3>
              <button 
                onClick={handleNextMonth}
                className="p-2 rounded-lg hover:bg-surface-container-high text-on-surface transition-colors cursor-pointer"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex gap-1.5 font-sans">
              {(['MONTH', 'WEEK', 'LIST'] as const).map((vt) => (
                <button
                  key={vt}
                  onClick={() => setViewType(vt)}
                  className={`px-4 py-2 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                    viewType === vt 
                      ? 'bg-surface-container-high text-on-surface border-surface-variant shadow-sm' 
                      : 'text-on-surface-variant hover:text-on-surface border-transparent'
                  }`}
                >
                  {vt}
                </button>
              ))}
            </div>
          </div>

          {/* Monthly View Grid */}
          {viewType === 'MONTH' ? (
            <div className="bg-surface-container-low rounded-xl border border-surface-variant overflow-hidden">
              {/* Header: Days of Week */}
              <div className="grid grid-cols-7 border-b border-surface-variant bg-surface-container-high font-sans">
                {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map((day) => (
                  <div key={day} className="p-3 text-center text-xs text-on-surface-variant font-bold">
                    {day}
                  </div>
                ))}
              </div>

              {/* Monthly Cells */}
              <div className="grid grid-cols-7 min-h-[420px] divide-x divide-y divide-surface-variant">
                
                {/* Previous month fillers */}
                {prevMonthFillers.map((num) => (
                  <div key={`prev-${num}`} className="p-2 text-xs text-on-surface-variant/30 font-mono select-none bg-surface-container-low/20">
                    {num}
                  </div>
                ))}

                {/* Days of current month */}
                {daysArray.map((day) => {
                  const dayEvents = getEventsForDay(day);
                  const today = new Date();
                  const isToday = day === today.getDate() && currentMonth === today.getMonth() && currentYear === today.getFullYear();
                  
                  return (
                    <div 
                      key={`day-${day}`} 
                      className={`p-2 text-xs font-sans h-24 flex flex-col justify-between transition-colors ${
                        isToday ? 'bg-primary-container/5' : 'hover:bg-surface-container-highest/20'
                      }`}
                    >
                      <span className={`font-mono font-medium ${isToday ? 'text-primary font-bold' : 'text-on-surface-variant'}`}>
                        {day}
                      </span>
                      
                      {/* Events for this specific calendar day */}
                      <div className="space-y-1 overflow-hidden">
                        {dayEvents.map((ev) => (
                          <div 
                            key={ev.id}
                            title={`${ev.title} - ${ev.dateTime}`}
                            onClick={() => handleOpenDetail(ev)}
                            className={`p-1 rounded-sm text-[9px] font-bold leading-tight truncate border-l-2 cursor-pointer hover:brightness-110 transition-all ${
                              ev.type === 'summit' 
                                ? 'bg-primary-container/20 text-primary border-primary-container' 
                                : ev.type === 'live'
                                  ? 'bg-tertiary-container/20 text-tertiary border-tertiary-container'
                                  : 'bg-secondary-container/20 text-secondary border-secondary'
                            }`}
                          >
                            {ev.title}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}

                {/* Next month fillers */}
                {nextMonthFillers.map((num) => (
                  <div key={`next-${num}`} className="p-2 text-xs text-on-surface-variant/30 font-mono select-none bg-surface-container-low/20 border-t border-surface-variant">
                    {num}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* Fallback simple listing view for WEEK/LIST views */
            <div className="bg-surface-container-low rounded-xl border border-surface-variant p-6 space-y-4">
              <h4 className="text-sm font-sans font-bold text-on-surface uppercase tracking-wider">
                Event Listing for {MONTH_NAMES[currentMonth]}
              </h4>
              <div className="space-y-3">
                {events.map((ev) => (
                  <div 
                    key={ev.id} 
                    className="p-4 bg-surface-container-high rounded-lg border border-outline-variant/30 flex items-center justify-between cursor-pointer hover:border-primary/50 transition-colors"
                    onClick={() => handleOpenDetail(ev)}
                  >
                    <div>
                      <p className="font-sans font-bold text-on-surface">{ev.title}</p>
                      <p className="text-xs text-on-surface-variant font-mono">{ev.dateTime}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-primary uppercase">{ev.type}</span>
                      <Eye className="w-3.5 h-3.5 text-on-surface-variant" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quick Stats Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-surface-container-high p-4 rounded-xl border border-surface-variant">
              <p className="text-mono text-[9px] text-on-surface-variant mb-1 uppercase tracking-wider">MONTHLY ATTENDANCE</p>
              <h4 className="text-2xl font-black text-primary">1,240</h4>
              <div className="mt-2 flex items-center text-emerald-400 text-xs font-bold gap-1">
                <UserCheck className="w-3.5 h-3.5" /> +12% from last month
              </div>
            </div>

            <div className="bg-surface-container-high p-4 rounded-xl border border-surface-variant">
              <p className="text-mono text-[9px] text-on-surface-variant mb-1 uppercase tracking-wider">ACTIVE VOLUNTEERS</p>
              <h4 className="text-2xl font-black text-on-surface">42</h4>
              <div className="mt-2 flex items-center text-on-surface-variant text-xs gap-1">
                <Users className="w-3.5 h-3.5" /> 8 on standby folders
              </div>
            </div>

            <div className="bg-surface-container-high p-4 rounded-xl border border-surface-variant">
              <p className="text-mono text-[9px] text-on-surface-variant mb-1 uppercase tracking-wider">REVENUE TRACKER</p>
              <h4 className="text-2xl font-black text-tertiary">$4,120</h4>
              <div className="mt-2 flex items-center text-on-surface-variant text-xs gap-1">
                <DollarSign className="w-3.5 h-3.5" /> 85% camp goal reached
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Upcoming Events & Quick Actions Sidebar (Span 4) */}
        <div className="col-span-12 lg:col-span-4 space-y-6">
          <button 
            onClick={() => setShowAddModal(true)}
            className="w-full bg-primary-container text-on-primary-container font-black py-4 rounded-xl text-md flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-98 transition-all shadow-lg shadow-primary/10 cursor-pointer"
          >
            <PlusCircle className="w-5 h-5 text-on-primary-container" />
            <span>CREATE NEW EVENT</span>
          </button>

          <div className="bg-surface-container-low rounded-xl border border-surface-variant flex flex-col min-h-[480px]">
            <div className="p-5 border-b border-surface-variant flex justify-between items-center bg-surface-container-high/40">
              <h3 className="font-sans text-sm font-bold text-on-surface">Upcoming Events</h3>
              <span className="bg-surface-container-high text-primary px-2.5 py-0.5 rounded text-[10px] font-bold font-mono">
                {events.length} TOTAL
              </span>
            </div>

            {/* Event list scrolling */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar max-h-[380px]">
              {events.map((ev) => {
                const percentage = ev.totalCapacity > 0 ? Math.round((ev.registered / ev.totalCapacity) * 100) : 0;
                const checkedInPercentage = ev.registered > 0 ? Math.round((ev.checkedIn / ev.registered) * 100) : 0;

                return (
                  <div key={ev.id} className="bg-surface-container-high rounded-xl border border-surface-variant p-4 hover:border-primary/50 transition-colors group">
                    <div 
                      className="flex justify-between items-start mb-3 cursor-pointer"
                      onClick={() => handleOpenDetail(ev)}
                    >
                      <div>
                        <div className="text-mono text-[9px] text-primary font-bold mb-0.5 uppercase tracking-wider">{ev.dateTime}</div>
                        <h4 className="text-sm font-bold text-on-surface group-hover:text-primary transition-colors">{ev.title}</h4>
                      </div>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenDetail(ev);
                        }}
                        className="text-on-surface-variant hover:text-on-surface"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Registration progress bar inside cards */}
                    <div className="flex gap-4 mb-4">
                      <div className="flex-1">
                        <p className="text-[9px] text-on-surface-variant uppercase font-mono font-bold tracking-wider mb-1">REGISTERED</p>
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 flex-1 bg-background rounded-full overflow-hidden">
                            <div className="bg-primary h-full rounded-full" style={{ width: `${percentage}%` }}></div>
                          </div>
                          <span className="text-[10px] font-mono font-bold text-on-surface">{ev.registered}/{ev.totalCapacity}</span>
                        </div>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="text-[9px] text-on-surface-variant uppercase font-mono font-bold tracking-wider mb-1">CHECKED IN</p>
                        <span className="text-[10px] font-mono font-bold text-tertiary">{checkedInPercentage}%</span>
                      </div>
                    </div>

                    {/* Functional Buttons for roster, check in simulation, or edits */}
                    <div className="flex gap-2 font-sans">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenEditModal(ev);
                        }}
                        className="flex-1 py-1.5 bg-background border border-surface-variant rounded-lg text-[10px] font-bold text-on-surface hover:bg-surface-variant transition-colors flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <Edit className="w-3 h-3" /> Edit
                      </button>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSimulateCheckIn(ev);
                        }}
                        className="flex-1 py-1.5 bg-background border border-surface-variant rounded-lg text-[10px] font-bold text-on-surface hover:bg-surface-variant transition-colors flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <Users className="w-3 h-3" /> Check In
                      </button>
                       <button 
                         onClick={(e) => {
                           e.stopPropagation();
                           toast.success(`Sent broadcast text to registered members for ${ev.title}.`);
                         }}
                         className="py-1.5 px-2.5 bg-secondary-container/30 border border-secondary-container rounded-lg text-secondary hover:bg-secondary-container/50 transition-colors cursor-pointer"
                         title="Broadcast Notification"
                       >
                         <Send className="w-3 h-3" />
                       </button>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteClick(ev.id);
                        }}
                        className="py-1.5 px-2.5 bg-red-container/30 border border-red-500/30 rounded-lg text-red-400 hover:bg-red-500/20 transition-colors cursor-pointer"
                        title="Delete Event"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Quick Actions Footer inside Event card list */}
            <div className="p-4 bg-surface-container-high mt-auto rounded-b-xl border-t border-surface-variant">
              <h4 className="font-mono text-[9px] uppercase tracking-widest text-on-surface-variant mb-2.5">Quick Global Actions</h4>
              <div className="grid grid-cols-2 gap-2">
                <button 
                  onClick={() => toast.success('Sent email invite to all 127 active youth members.')}
                  className="p-2 bg-background border border-surface-variant rounded-lg flex flex-col items-center gap-1 hover:border-primary transition-all cursor-pointer text-center text-[10px]"
                >
                  <Mail className="w-4 h-4 text-primary" />
                  <span className="font-bold uppercase tracking-wider">EMAIL ALL</span>
                </button>
                <button 
                  onClick={() => toast.info('Exporting all registration list as CSV...')}
                  className="p-2 bg-background border border-surface-variant rounded-lg flex flex-col items-center gap-1 hover:border-primary transition-all cursor-pointer text-center text-[10px]"
                >
                  <Download className="w-4 h-4 text-primary" />
                  <span className="font-bold uppercase tracking-wider">EXPORT DATA</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Create Event Modal Dialog */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-surface-container border border-outline-variant w-full max-w-md rounded-2xl overflow-hidden shadow-2xl font-sans">
            <div className="p-6 border-b border-outline-variant flex justify-between items-center bg-surface-container-high">
              <h3 className="font-sans text-md font-bold text-on-surface">Create New Portal Event</h3>
              <button 
                onClick={() => setShowAddModal(false)}
                className="p-1 rounded-lg hover:bg-surface-container-low text-on-surface-variant hover:text-on-surface transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <form onSubmit={handleCreateEvent} className="p-6 space-y-4 text-sm">
              <div>
                <label className="block text-xs font-semibold text-on-surface-variant uppercase mb-1">Event Name</label>
                <input 
                  type="text" 
                  value={eventName}
                  onChange={(e) => setEventName(e.target.value)}
                  placeholder="e.g. Fuel Night Conference"
                  className="w-full bg-background border border-outline-variant rounded-lg px-3 py-2 text-on-surface focus:outline-none focus:border-primary transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-on-surface-variant uppercase mb-1">Date</label>
                  <input 
                    type="date" 
                    value={eventDate}
                    onChange={(e) => setEventDate(e.target.value)}
                    className="w-full bg-background border border-outline-variant rounded-lg px-3 py-2 text-on-surface focus:outline-none focus:border-primary text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-on-surface-variant uppercase mb-1">Time</label>
                  <input 
                    type="text" 
                    value={eventTime}
                    onChange={(e) => setEventTime(e.target.value)}
                    placeholder="e.g. 7:00 PM"
                    className="w-full bg-background border border-outline-variant rounded-lg px-3 py-2 text-on-surface focus:outline-none focus:border-primary text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-on-surface-variant uppercase mb-1">Capacity</label>
                  <input 
                    type="number" 
                    value={eventCapacity}
                    onChange={(e) => setEventCapacity(Number(e.target.value))}
                    className="w-full bg-background border border-outline-variant rounded-lg px-3 py-2 text-on-surface focus:outline-none focus:border-primary text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-on-surface-variant uppercase mb-1">Event Type</label>
                  <select 
                    value={eventType}
                    onChange={(e) => setEventType(e.target.value as any)}
                    className="w-full bg-background border border-outline-variant rounded-lg px-3 py-2 text-on-surface focus:outline-none focus:border-primary text-xs"
                  >
                    <option value="live">Live Program / Conference</option>
                    <option value="summit">Summit / Retreat</option>
                    <option value="meet">Leadership Meeting</option>
                    <option value="cleanup">Community Service</option>
                  </select>
                </div>
              </div>

              {/* Registration Fields Builder */}
              <div className="border-t border-outline-variant pt-4">
                <label className="block text-xs font-semibold text-on-surface-variant uppercase mb-3">Registration Fields</label>
                
                {createRegFields.length > 0 && (
                  <div className="space-y-2 mb-3">
                    {createRegFields.map((field) => (
                      <div key={field.id} className="flex items-center gap-2 bg-background border border-outline-variant rounded-lg px-3 py-2 text-xs">
                        <GripVertical className="w-3.5 h-3.5 text-on-surface-variant/50" />
                        <span className="flex-1 text-on-surface font-medium">{field.label}</span>
                        <span className="text-[10px] font-mono text-on-surface-variant uppercase bg-surface-container-high px-1.5 py-0.5 rounded">{field.type.replace('_', ' ')}</span>
                        {field.required && <span className="text-[10px] text-primary font-bold">REQ</span>}
                        <button type="button" onClick={() => removeRegField(field.id, 'create')} className="p-1 hover:text-error transition-colors">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="bg-background border border-outline-variant rounded-lg p-3 space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <input 
                      type="text"
                      value={newFieldLabel}
                      onChange={(e) => setNewFieldLabel(e.target.value)}
                      placeholder="Field label"
                      className="bg-surface-container border border-outline-variant rounded-lg px-2.5 py-1.5 text-xs text-on-surface focus:outline-none focus:border-primary"
                    />
                    <select 
                      value={newFieldType}
                      onChange={(e) => setNewFieldType(e.target.value as RegistrationField['type'])}
                      className="bg-surface-container border border-outline-variant rounded-lg px-2.5 py-1.5 text-xs text-on-surface focus:outline-none focus:border-primary"
                    >
                      <option value="text">Text</option>
                      <option value="textarea">Text Area</option>
                      <option value="number">Number</option>
                      <option value="select">Select</option>
                      <option value="contact_number">Contact Number</option>
                    </select>
                  </div>
                  {newFieldType === 'select' && (
                    <input 
                      type="text"
                      value={newFieldOptions}
                      onChange={(e) => setNewFieldOptions(e.target.value)}
                      placeholder="Options (comma-separated)"
                      className="w-full bg-surface-container border border-outline-variant rounded-lg px-2.5 py-1.5 text-xs text-on-surface focus:outline-none focus:border-primary"
                    />
                  )}
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 text-xs text-on-surface-variant cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={newFieldRequired}
                        onChange={(e) => setNewFieldRequired(e.target.checked)}
                        className="rounded border-outline-variant text-primary focus:ring-primary"
                      />
                      Required
                    </label>
                    <button 
                      type="button" 
                      onClick={() => addRegField('create')}
                      disabled={!newFieldLabel.trim()}
                      className="px-3 py-1 bg-primary/10 text-primary text-xs font-semibold rounded-lg hover:bg-primary/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                    >
                      <PlusCircle className="w-3.5 h-3.5" /> Add
                    </button>
                  </div>
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button 
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-surface-container-high hover:bg-surface-container border border-outline-variant text-on-surface text-xs font-semibold rounded-lg transition-all"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-5 py-2 bg-primary text-background font-bold text-xs rounded-lg hover:opacity-90 transition-all flex items-center gap-1"
                >
                  <Check className="w-4 h-4" /> Create Event
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Event Modal Dialog */}
      {showEditModal && editingEvent && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-surface-container border border-outline-variant w-full max-w-md rounded-2xl overflow-hidden shadow-2xl font-sans">
            <div className="p-6 border-b border-outline-variant flex justify-between items-center bg-surface-container-high">
              <h3 className="font-sans text-md font-bold text-on-surface">Edit Event</h3>
              <button 
                onClick={() => {
                  setShowEditModal(false);
                  setEditingEvent(null);
                }}
                className="p-1 rounded-lg hover:bg-surface-container-low text-on-surface-variant hover:text-on-surface transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <form onSubmit={handleSaveEdit} className="p-6 space-y-4 text-sm">
              <div>
                <label className="block text-xs font-semibold text-on-surface-variant uppercase mb-1">Event Name</label>
                <input 
                  type="text" 
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="e.g. Fuel Night Conference"
                  className="w-full bg-background border border-outline-variant rounded-lg px-3 py-2 text-on-surface focus:outline-none focus:border-primary transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-on-surface-variant uppercase mb-1">Date</label>
                  <input 
                    type="date" 
                    value={editDate}
                    onChange={(e) => setEditDate(e.target.value)}
                    className="w-full bg-background border border-outline-variant rounded-lg px-3 py-2 text-on-surface focus:outline-none focus:border-primary text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-on-surface-variant uppercase mb-1">Time</label>
                  <input 
                    type="text" 
                    value={editTime}
                    onChange={(e) => setEditTime(e.target.value)}
                    placeholder="e.g. 7:00 PM"
                    className="w-full bg-background border border-outline-variant rounded-lg px-3 py-2 text-on-surface focus:outline-none focus:border-primary text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-on-surface-variant uppercase mb-1">Capacity</label>
                  <input 
                    type="number" 
                    value={editCapacity}
                    onChange={(e) => setEditCapacity(Number(e.target.value))}
                    className="w-full bg-background border border-outline-variant rounded-lg px-3 py-2 text-on-surface focus:outline-none focus:border-primary text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-on-surface-variant uppercase mb-1">Event Type</label>
                  <select 
                    value={editType}
                    onChange={(e) => setEditType(e.target.value as any)}
                    className="w-full bg-background border border-outline-variant rounded-lg px-3 py-2 text-on-surface focus:outline-none focus:border-primary text-xs"
                  >
                    <option value="live">Live Program / Conference</option>
                    <option value="summit">Summit / Retreat</option>
                    <option value="meet">Leadership Meeting</option>
                    <option value="cleanup">Community Service</option>
                  </select>
                </div>
              </div>

              {/* Registration Fields Builder */}
              <div className="border-t border-outline-variant pt-4">
                <label className="block text-xs font-semibold text-on-surface-variant uppercase mb-3">Registration Fields</label>
                
                {editRegFields.length > 0 && (
                  <div className="space-y-2 mb-3">
                    {editRegFields.map((field) => (
                      <div key={field.id} className="flex items-center gap-2 bg-background border border-outline-variant rounded-lg px-3 py-2 text-xs">
                        <GripVertical className="w-3.5 h-3.5 text-on-surface-variant/50" />
                        <span className="flex-1 text-on-surface font-medium">{field.label}</span>
                        <span className="text-[10px] font-mono text-on-surface-variant uppercase bg-surface-container-high px-1.5 py-0.5 rounded">{field.type.replace('_', ' ')}</span>
                        {field.required && <span className="text-[10px] text-primary font-bold">REQ</span>}
                        <button type="button" onClick={() => removeRegField(field.id, 'edit')} className="p-1 hover:text-error transition-colors">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="bg-background border border-outline-variant rounded-lg p-3 space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <input 
                      type="text"
                      value={newFieldLabel}
                      onChange={(e) => setNewFieldLabel(e.target.value)}
                      placeholder="Field label"
                      className="bg-surface-container border border-outline-variant rounded-lg px-2.5 py-1.5 text-xs text-on-surface focus:outline-none focus:border-primary"
                    />
                    <select 
                      value={newFieldType}
                      onChange={(e) => setNewFieldType(e.target.value as RegistrationField['type'])}
                      className="bg-surface-container border border-outline-variant rounded-lg px-2.5 py-1.5 text-xs text-on-surface focus:outline-none focus:border-primary"
                    >
                      <option value="text">Text</option>
                      <option value="textarea">Text Area</option>
                      <option value="number">Number</option>
                      <option value="select">Select</option>
                      <option value="contact_number">Contact Number</option>
                    </select>
                  </div>
                  {newFieldType === 'select' && (
                    <input 
                      type="text"
                      value={newFieldOptions}
                      onChange={(e) => setNewFieldOptions(e.target.value)}
                      placeholder="Options (comma-separated)"
                      className="w-full bg-surface-container border border-outline-variant rounded-lg px-2.5 py-1.5 text-xs text-on-surface focus:outline-none focus:border-primary"
                    />
                  )}
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 text-xs text-on-surface-variant cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={newFieldRequired}
                        onChange={(e) => setNewFieldRequired(e.target.checked)}
                        className="rounded border-outline-variant text-primary focus:ring-primary"
                      />
                      Required
                    </label>
                    <button 
                      type="button" 
                      onClick={() => addRegField('edit')}
                      disabled={!newFieldLabel.trim()}
                      className="px-3 py-1 bg-primary/10 text-primary text-xs font-semibold rounded-lg hover:bg-primary/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                    >
                      <PlusCircle className="w-3.5 h-3.5" /> Add
                    </button>
                  </div>
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button 
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingEvent(null);
                  }}
                  className="px-4 py-2 bg-surface-container-high hover:bg-surface-container border border-outline-variant text-on-surface text-xs font-semibold rounded-lg transition-all"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-5 py-2 bg-primary text-background font-bold text-xs rounded-lg hover:opacity-90 transition-all flex items-center gap-1"
                >
                  <Check className="w-4 h-4" /> Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => {
            setShowDeleteConfirm(false);
            setDeletingEventId(null);
          }}
          role="dialog"
          aria-labelledby="delete-event-title"
          aria-describedby="delete-event-desc"
        >
          <div 
            className="bg-surface-container border border-outline-variant w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl font-sans animate-slide-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-outline-variant flex justify-between items-center bg-surface-container-high">
              <h3 id="delete-event-title" className="font-sans text-md font-bold text-on-surface">Delete Event</h3>
              <button 
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setDeletingEventId(null);
                }}
                className="p-1 rounded-lg hover:bg-surface-container-low text-on-surface-variant hover:text-on-surface transition-all"
                aria-label="Close delete confirmation"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-6 text-sm">
              <p className="text-on-surface-variant mb-1">Are you sure you want to delete this event?</p>
              <p className="text-on-surface font-semibold">
                {events.find(e => e.id === deletingEventId)?.title || 'Unknown Event'}
              </p>
              <p id="delete-event-desc" className="text-on-surface-variant/60 text-xs mt-2">This action cannot be undone.</p>
            </div>
            <div className="p-4 border-t border-outline-variant bg-surface-container-high flex justify-end gap-3">
              <button 
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setDeletingEventId(null);
                }}
                className="px-4 py-2 bg-surface-container-high hover:bg-surface-container border border-outline-variant text-on-surface text-xs font-semibold rounded-lg transition-all active:scale-95 cursor-pointer"
                type="button"
              >
                Cancel
              </button>

              <button 
                onClick={handleConfirmDelete}
                className="px-5 py-2 bg-error text-white font-bold text-xs rounded-lg hover:opacity-90 active:scale-95 transition-all cursor-pointer flex items-center gap-1"
                type="button"
              >
                <Trash2 className="w-4 h-4" /> Delete Event
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Event Detail Modal */}
      {showDetailModal && detailEvent && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-surface-container border border-outline-variant w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl font-sans">
            <div className="p-6 border-b border-outline-variant flex justify-between items-center bg-surface-container-high">
              <div>
                <h3 className="font-sans text-lg font-bold text-on-surface">{detailEvent.title}</h3>
                <p className="text-xs text-primary font-mono font-bold uppercase mt-0.5">{detailEvent.type}</p>
              </div>
              <button 
                onClick={() => {
                  setShowDetailModal(false);
                  setDetailEvent(null);
                }}
                className="p-1 rounded-lg hover:bg-surface-container-low text-on-surface-variant hover:text-on-surface transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="p-6 space-y-5">
              {/* Event Info Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-surface-container-high p-3 rounded-lg border border-outline-variant/30">
                  <p className="text-[9px] text-on-surface-variant uppercase font-mono font-bold tracking-wider mb-1">DATE & TIME</p>
                  <p className="text-sm font-bold text-on-surface">{detailEvent.dateTime}</p>
                </div>
                <div className="bg-surface-container-high p-3 rounded-lg border border-outline-variant/30">
                  <p className="text-[9px] text-on-surface-variant uppercase font-mono font-bold tracking-wider mb-1">EVENT TYPE</p>
                  <p className="text-sm font-bold text-on-surface capitalize">{detailEvent.type}</p>
                </div>
                <div className="bg-surface-container-high p-3 rounded-lg border border-outline-variant/30">
                  <p className="text-[9px] text-on-surface-variant uppercase font-mono font-bold tracking-wider mb-1">CAPACITY</p>
                  <p className="text-sm font-bold text-on-surface">{detailEvent.totalCapacity}</p>
                </div>
                <div className="bg-surface-container-high p-3 rounded-lg border border-outline-variant/30">
                  <p className="text-[9px] text-on-surface-variant uppercase font-mono font-bold tracking-wider mb-1">REGISTERED</p>
                  <p className="text-sm font-bold text-on-surface">{detailEvent.registered}</p>
                </div>
              </div>

              {/* Capacity Progress Bar */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <p className="text-[9px] text-on-surface-variant uppercase font-mono font-bold tracking-wider">CAPACITY FILL</p>
                  <p className="text-xs font-mono font-bold text-on-surface">
                    {detailEvent.registered}/{detailEvent.totalCapacity}
                  </p>
                </div>
                <div className="h-3 bg-background rounded-full overflow-hidden">
                  <div 
                    className="bg-primary h-full rounded-full transition-all" 
                    style={{ width: `${detailEvent.totalCapacity > 0 ? Math.round((detailEvent.registered / detailEvent.totalCapacity) * 100) : 0}%` }}
                  ></div>
                </div>
                <p className="text-[10px] font-mono font-bold text-on-surface-variant mt-1">
                  {detailEvent.totalCapacity > 0 ? Math.round((detailEvent.registered / detailEvent.totalCapacity) * 100) : 0}% filled
                </p>
              </div>

              {/* Check-in Percentage Bar */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <p className="text-[9px] text-on-surface-variant uppercase font-mono font-bold tracking-wider">CHECK-IN RATE</p>
                  <p className="text-xs font-mono font-bold text-tertiary">
                    {detailEvent.registered > 0 ? Math.round((detailEvent.checkedIn / detailEvent.registered) * 100) : 0}%
                  </p>
                </div>
                <div className="h-3 bg-background rounded-full overflow-hidden">
                  <div 
                    className="bg-tertiary h-full rounded-full transition-all" 
                    style={{ width: `${detailEvent.registered > 0 ? Math.round((detailEvent.checkedIn / detailEvent.registered) * 100) : 0}%` }}
                  ></div>
                </div>
                <p className="text-[10px] font-mono font-bold text-on-surface-variant mt-1">
                  {detailEvent.checkedIn}/{detailEvent.registered} checked in
                </p>
              </div>

              {/* Mock Registered Members List */}
              <div>
                <p className="text-[9px] text-on-surface-variant uppercase font-mono font-bold tracking-wider mb-2">REGISTERED MEMBERS (SAMPLE)</p>
                <div className="space-y-2 max-h-40 overflow-y-auto custom-scrollbar">
                  {MOCK_REGISTERED_MEMBERS.map((member) => (
                    <div key={member.id} className="flex items-center gap-3 p-2 bg-surface-container-high rounded-lg border border-outline-variant/20">
                      <div className="w-8 h-8 rounded-full bg-primary-container/30 flex items-center justify-center text-[10px] font-bold text-primary shrink-0">
                        {member.avatar}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-on-surface truncate">{member.name}</p>
                        <p className="text-[10px] text-on-surface-variant font-mono">{member.level}</p>
                      </div>
                      <div className="flex items-center gap-1">
                        <Check className="w-3 h-3 text-emerald-400" />
                        <span className="text-[9px] font-mono text-emerald-400 font-bold">CHECKED IN</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-2 border-t border-outline-variant">
                <button 
                  onClick={() => {
                    setShowDetailModal(false);
                    setDetailEvent(null);
                    handleOpenEditModal(detailEvent);
                  }}
                  className="flex-1 py-2.5 bg-background border border-surface-variant rounded-lg text-xs font-bold text-on-surface hover:bg-surface-variant transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Edit className="w-3.5 h-3.5" /> Edit
                </button>
                <button 
                  onClick={() => {
                    setShowDetailModal(false);
                    setDetailEvent(null);
                    handleDeleteClick(detailEvent.id);
                  }}
                  className="py-2.5 px-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 hover:bg-red-500/20 transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Delete
                </button>
                <button 
                  onClick={() => handleSimulateCheckIn(detailEvent)}
                  className="py-2.5 px-3 bg-tertiary-container/30 border border-tertiary-container rounded-lg text-tertiary hover:bg-tertiary-container/50 transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Users className="w-3.5 h-3.5" /> Check In
                </button>
                <button 
                  onClick={() => toast.success(`Sent broadcast text to registered members for ${detailEvent.title}.`)}
                  className="py-2.5 px-3 bg-secondary-container/30 border border-secondary-container rounded-lg text-secondary hover:bg-secondary-container/50 transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                  title="Broadcast Notification"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
