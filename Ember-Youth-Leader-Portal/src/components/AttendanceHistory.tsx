import { useState, useEffect, useCallback } from 'react';
import { 
  Search, 
  UserCheck, 
  Calendar, 
  Clock, 
  CheckCircle, 
  Filter, 
  Download, 
  Users, 
  BarChart2, 
  ArrowUpRight
} from 'lucide-react';
import { YouthMember, PortalEvent } from '../types';

interface CheckInEntry {
  id: string;
  memberName: string;
  rgId: string;
  eventTitle: string;
  timestamp: string;
  status: 'Checked In' | 'Registered';
  avatar: string;
  level: 'Ignition' | 'Blaze' | 'Inferno';
}

interface AttendanceHistoryProps {
  members: YouthMember[];
  events: PortalEvent[];
  onCheckInMember: (rgId: string) => void;
}

export default function AttendanceHistory({ 
  members, 
  events, 
  onCheckInMember 
}: AttendanceHistoryProps) {
  const [selectedEvent, setSelectedEvent] = useState<string>('');
  const [manualSearchTerm, setManualSearchTerm] = useState('');
  const [historyFilter, setHistoryFilter] = useState('');
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [selectedRgId, setSelectedRgId] = useState<string>('');
  const [searchDropdownOpen, setSearchDropdownOpen] = useState(false);

  const [checkInLog, setCheckInLog] = useState<CheckInEntry[]>([]);

  useEffect(() => {
    if (members.length === 0 || events.length === 0) return;

    const mockEntries: CheckInEntry[] = [];
    const times = [
      '6:42 PM', '6:38 PM', '6:31 PM', '6:25 PM', '6:18 PM',
      '6:12 PM', '6:05 PM', '5:58 PM', '5:50 PM', '5:44 PM',
      '5:37 PM', '5:30 PM', '5:22 PM', '5:15 PM', '5:08 PM'
    ];
    const dates = [
      'Jun 26, 2026', 'Jun 26, 2026', 'Jun 26, 2026', 'Jun 26, 2026', 'Jun 26, 2026',
      'Jun 26, 2026', 'Jun 26, 2026', 'Jun 26, 2026', 'Jun 26, 2026', 'Jun 26, 2026',
      'Jun 25, 2026', 'Jun 25, 2026', 'Jun 25, 2026', 'Jun 25, 2026', 'Jun 25, 2026'
    ];
    const statuses: ('Checked In' | 'Registered')[] = ['Checked In', 'Registered'];

    for (let i = 0; i < Math.min(15, Math.max(members.length, 15)); i++) {
      const member = members[i % members.length];
      const event = events[i % events.length];
      mockEntries.push({
        id: `chk-${i + 1}`,
        memberName: member.name,
        rgId: member.rgId,
        eventTitle: event.title,
        timestamp: `${dates[i]}, ${times[i]}`,
        status: statuses[i % 2],
        avatar: member.avatar,
        level: member.level
      });
    }

    setCheckInLog(mockEntries);
  }, [members, events]);

  const filteredMembers = members.filter(member =>
    member.name.toLowerCase().includes(manualSearchTerm.toLowerCase()) ||
    member.rgId.toLowerCase().includes(manualSearchTerm.toLowerCase())
  );

  const filteredLog = checkInLog.filter(entry =>
    entry.memberName.toLowerCase().includes(historyFilter.toLowerCase()) ||
    entry.rgId.toLowerCase().includes(historyFilter.toLowerCase()) ||
    entry.eventTitle.toLowerCase().includes(historyFilter.toLowerCase())
  );

  const selectedEventData = events.find(ev => ev.id === selectedEvent);

  const getEventRoster = useCallback(() => {
    if (!selectedEventData) return [];
    const rosterMembers = checkInLog.filter(
      entry => entry.eventTitle === selectedEventData.title && entry.status === 'Checked In'
    );
    return rosterMembers.length > 0 ? rosterMembers : checkInLog.filter(
      entry => entry.status === 'Checked In'
    ).slice(0, 6);
  }, [selectedEventData, checkInLog]);

  const rosterMembers = getEventRoster();

  const handleManualCheckIn = () => {
    if (!selectedRgId) {
      toast.error('Please select a member to check in.');
      return;
    }
    const member = members.find(m => m.rgId === selectedRgId);
    if (!member) return;

    onCheckInMember(selectedRgId);

    const newEntry: CheckInEntry = {
      id: `chk-${Date.now()}`,
      memberName: member.name,
      rgId: member.rgId,
      eventTitle: selectedEventData?.title || 'General Attendance',
      timestamp: `Jun 26, 2026, ${new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}`,
      status: 'Checked In',
      avatar: member.avatar,
      level: member.level
    };

    setCheckInLog(prev => [newEntry, ...prev]);
    setManualSearchTerm('');
    setSelectedRgId('');
    setSearchDropdownOpen(false);
    setShowSuccessToast(true);
  };

  useEffect(() => {
    if (showSuccessToast) {
      const timer = setTimeout(() => setShowSuccessToast(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [showSuccessToast]);

  const totalCheckInsToday = checkInLog.filter(
    e => e.status === 'Checked In' && e.timestamp.includes('Jun 26')
  ).length;

  const activeEvents = events.length;

  const avgAttendanceRate = events.length > 0
    ? Math.round(events.reduce((sum, ev) => sum + (ev.totalCapacity > 0 ? (ev.checkedIn / ev.totalCapacity) * 100 : 0), 0) / events.length)
    : 0;

  return (
    <div className="space-y-6">
      {showSuccessToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-600 text-white px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3 border border-emerald-500 animate-bounce">
          <CheckCircle className="w-5 h-5" />
          <span className="font-sans font-medium text-sm">Member checked in successfully!</span>
        </div>
      )}

      {/* Manual Check-In Section */}
      <div className="bg-surface-container border border-outline-variant rounded-2xl p-6 shadow-2xl">
        <div className="flex items-center gap-3 mb-5">
          <div className="bg-primary/10 w-10 h-10 rounded-xl flex items-center justify-center">
            <UserCheck className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-sans text-md font-bold text-on-surface">Manual Check-In</h3>
            <p className="font-sans text-xs text-on-surface-variant">Search and check in a member manually</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Event Selector */}
          <div>
            <label className="block font-mono text-[10px] text-on-surface-variant uppercase tracking-widest mb-1.5 font-bold">
              Select Event
            </label>
            <div className="relative">
              <Calendar className="w-4 h-4 text-on-surface-variant absolute left-3 top-2.5 opacity-60 pointer-events-none" />
              <select
                value={selectedEvent}
                onChange={(e) => setSelectedEvent(e.target.value)}
                className="w-full bg-background border border-outline-variant rounded-lg pl-10 pr-4 py-2 text-sm text-on-surface focus:outline-none focus:border-primary transition-all font-sans appearance-none cursor-pointer"
              >
                <option value="">All Events / General</option>
                {events.map(ev => (
                  <option key={ev.id} value={ev.id}>{ev.title} — {ev.dateTime}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Member Search */}
          <div className="relative">
            <label className="block font-mono text-[10px] text-on-surface-variant uppercase tracking-widest mb-1.5 font-bold">
              Find Member
            </label>
            <div className="relative">
              <Search className="w-4 h-4 text-on-surface-variant absolute left-3 top-2.5 opacity-60 pointer-events-none" />
              <input
                type="text"
                placeholder="Search by name or RG ID..."
                value={manualSearchTerm}
                onChange={(e) => {
                  setManualSearchTerm(e.target.value);
                  setSearchDropdownOpen(true);
                  setSelectedRgId('');
                }}
                onFocus={() => setSearchDropdownOpen(true)}
                className="w-full bg-background border border-outline-variant rounded-lg pl-10 pr-4 py-2 text-sm text-on-surface focus:outline-none focus:border-primary transition-all font-sans"
              />
            </div>

            {searchDropdownOpen && manualSearchTerm && filteredMembers.length > 0 && (
              <div className="absolute left-0 right-0 mt-1 bg-surface-container-high border border-outline-variant rounded-xl shadow-2xl z-30 max-h-48 overflow-y-auto custom-scrollbar">
                {filteredMembers.slice(0, 8).map(member => (
                  <button
                    key={member.id}
                    onClick={() => {
                      setManualSearchTerm(member.name);
                      setSelectedRgId(member.rgId);
                      setSearchDropdownOpen(false);
                    }}
                    className={`w-full px-4 py-2.5 flex items-center gap-3 hover:bg-surface-container-highest transition-colors text-left cursor-pointer ${
                      selectedRgId === member.rgId ? 'bg-primary/10 border-l-2 border-primary' : ''
                    }`}
                  >
                    <img
                      className="w-8 h-8 rounded-lg object-cover ring-1 ring-outline-variant"
                      src={member.avatar}
                      alt={member.name}
                      referrerPolicy="no-referrer"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-sans text-sm font-bold text-on-surface truncate">{member.name}</p>
                      <p className="font-mono text-[10px] text-on-surface-variant">{member.rgId}</p>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase font-mono ${
                      member.level === 'Ignition' 
                        ? 'bg-primary/10 text-primary' 
                        : member.level === 'Blaze' 
                          ? 'bg-tertiary-container/10 text-tertiary-container' 
                          : 'bg-on-secondary-container/10 text-on-secondary-container'
                    }`}>
                      {member.level}
                    </span>
                  </button>
                ))}
              </div>
            )}

            {searchDropdownOpen && manualSearchTerm && filteredMembers.length === 0 && (
              <div className="absolute left-0 right-0 mt-1 bg-surface-container-high border border-outline-variant rounded-xl shadow-2xl z-30 p-4 text-center">
                <p className="text-xs text-on-surface-variant font-sans">No members found matching "{manualSearchTerm}"</p>
              </div>
            )}
          </div>

          {/* Check In Button */}
          <div className="flex items-end">
            <button
              onClick={handleManualCheckIn}
              disabled={!selectedRgId}
              className="w-full bg-primary text-background font-bold px-6 py-2.5 rounded-xl text-sm hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40 disabled:pointer-events-none shadow-md shadow-primary/15"
            >
              <UserCheck className="w-4 h-4 text-background" />
              <span>Check In Member</span>
            </button>
          </div>
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Attendance History Log (Left Column) */}
        <div className="lg:col-span-7 bg-surface-container border border-outline-variant rounded-2xl overflow-hidden shadow-2xl">
          <div className="p-5 border-b border-outline-variant flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-surface-container-high/40">
            <div className="flex items-center gap-3">
              <div className="bg-secondary-container/20 w-9 h-9 rounded-lg flex items-center justify-center">
                <Clock className="w-4 h-4 text-secondary" />
              </div>
              <div>
                <h3 className="font-sans text-sm font-bold text-on-surface">Attendance History</h3>
                <p className="font-mono text-[10px] text-on-surface-variant">{filteredLog.length} records</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Filter records..."
                  value={historyFilter}
                  onChange={(e) => setHistoryFilter(e.target.value)}
                  className="bg-surface-container border border-outline-variant rounded-full py-1.5 pl-9 pr-4 text-xs text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:border-primary transition-all w-44 font-sans"
                />
                <Filter className="w-3.5 h-3.5 text-on-surface-variant absolute left-3 top-2 opacity-60 pointer-events-none" />
              </div>
              <button className="flex items-center gap-1.5 border border-outline-variant px-3 py-1.5 rounded-lg text-on-surface-variant hover:bg-surface-container-highest transition-colors text-xs font-semibold cursor-pointer">
                <Download className="w-3.5 h-3.5 text-primary" />
                <span className="hidden sm:inline">Export</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse font-sans">
              <thead>
                <tr className="bg-surface-container-high/50 border-b border-outline-variant">
                  <th className="px-5 py-3.5 font-mono text-[10px] text-on-surface-variant uppercase tracking-wider">Member Name</th>
                  <th className="px-5 py-3.5 font-mono text-[10px] text-on-surface-variant uppercase tracking-wider">RG ID</th>
                  <th className="px-5 py-3.5 font-mono text-[10px] text-on-surface-variant uppercase tracking-wider">Event</th>
                  <th className="px-5 py-3.5 font-mono text-[10px] text-on-surface-variant uppercase tracking-wider">Date/Time</th>
                  <th className="px-5 py-3.5 font-mono text-[10px] text-on-surface-variant uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/40">
                {filteredLog.length > 0 ? (
                  filteredLog.map((entry) => (
                    <tr key={entry.id} className="hover:bg-surface-container-highest/30 transition-colors group">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <img
                            className="w-8 h-8 rounded-lg object-cover ring-2 ring-primary/20 group-hover:ring-primary/50 transition-all"
                            src={entry.avatar}
                            alt={entry.memberName}
                            referrerPolicy="no-referrer"
                          />
                          <span className="font-bold text-on-surface text-sm">{entry.memberName}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 font-mono text-xs text-secondary font-medium">{entry.rgId}</td>
                      <td className="px-5 py-3.5 text-xs text-on-surface-variant max-w-[160px] truncate">{entry.eventTitle}</td>
                      <td className="px-5 py-3.5 text-xs text-on-surface-variant font-mono whitespace-nowrap">{entry.timestamp}</td>
                      <td className="px-5 py-3.5">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest border ${
                          entry.status === 'Checked In'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                        }`}>
                          {entry.status}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="text-center py-10 text-on-surface-variant text-sm font-sans">
                      No attendance records match your filter.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="px-5 py-3.5 bg-surface-container-low/50 border-t border-outline-variant flex items-center justify-between">
            <p className="font-mono text-[10px] text-on-surface-variant">
              Showing {filteredLog.length} of {checkInLog.length} records
            </p>
            <div className="flex items-center gap-1 font-sans">
              <button className="px-2.5 py-1 rounded-lg bg-surface-container text-on-surface-variant hover:bg-surface-container-high transition-colors text-xs font-bold disabled:opacity-40" disabled>Prev</button>
              <button className="w-6 h-6 rounded-lg bg-primary text-background font-bold text-[10px]">1</button>
              <button className="w-6 h-6 rounded-lg hover:bg-surface-container text-on-surface text-[10px] transition-colors">2</button>
              <span className="px-0.5 text-on-surface-variant text-xs">...</span>
              <button className="px-2.5 py-1 rounded-lg bg-surface-container text-on-surface hover:bg-surface-container-high transition-colors text-xs font-bold">Next</button>
            </div>
          </div>
        </div>

        {/* Event Roster View (Right Column) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-surface-container border border-outline-variant rounded-2xl overflow-hidden shadow-2xl">
            <div className="p-5 border-b border-outline-variant bg-surface-container-high/40">
              <div className="flex items-center gap-3">
                <div className="bg-primary/10 w-9 h-9 rounded-lg flex items-center justify-center">
                  <Users className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <h3 className="font-sans text-sm font-bold text-on-surface">Event Roster</h3>
                  <p className="font-mono text-[10px] text-on-surface-variant">
                    {selectedEventData ? 'Live event data' : 'Select an event above'}
                  </p>
                </div>
              </div>
            </div>

            {selectedEventData ? (
              <div className="p-5 space-y-5">
                {/* Event Info Header */}
                <div className="bg-surface-container-high/60 rounded-xl p-4 border border-outline-variant/30">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="font-sans text-base font-bold text-on-surface">{selectedEventData.title}</h4>
                      <p className="font-mono text-[10px] text-on-surface-variant mt-0.5">{selectedEventData.dateTime}</p>
                    </div>
                    <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold uppercase font-mono border ${
                      selectedEventData.type === 'summit' 
                        ? 'bg-primary/10 text-primary border-primary/20' 
                        : selectedEventData.type === 'live'
                          ? 'bg-tertiary-container/10 text-tertiary-container border-tertiary-container/20'
                          : 'bg-secondary/10 text-secondary border-secondary/20'
                    }`}>
                      {selectedEventData.type}
                    </span>
                  </div>

                  {/* Capacity Stats */}
                  <div className="grid grid-cols-3 gap-3 mb-3">
                    <div className="text-center">
                      <p className="font-mono text-[9px] text-on-surface-variant uppercase tracking-wider mb-0.5">Registered</p>
                      <p className="font-sans text-lg font-black text-on-surface">{selectedEventData.registered}</p>
                    </div>
                    <div className="text-center border-x border-outline-variant/30">
                      <p className="font-mono text-[9px] text-on-surface-variant uppercase tracking-wider mb-0.5">Checked In</p>
                      <p className="font-sans text-lg font-black text-primary">{selectedEventData.checkedIn}</p>
                    </div>
                    <div className="text-center">
                      <p className="font-mono text-[9px] text-on-surface-variant uppercase tracking-wider mb-0.5">Capacity</p>
                      <p className="font-sans text-lg font-black text-on-surface">{selectedEventData.totalCapacity}</p>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-mono text-[9px] text-on-surface-variant uppercase tracking-wider">Check-In Rate</span>
                      <span className="font-mono text-[10px] text-primary font-bold">
                        {selectedEventData.registered > 0 ? Math.round((selectedEventData.checkedIn / selectedEventData.registered) * 100) : 0}%
                      </span>
                    </div>
                    <div className="h-2 bg-background rounded-full overflow-hidden">
                      <div
                        className="bg-primary h-full rounded-full transition-all duration-500 shadow-[0_0_8px_rgba(255,106,0,0.3)]"
                        style={{ width: `${selectedEventData.registered > 0 ? (selectedEventData.checkedIn / selectedEventData.registered) * 100 : 0}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Checked-In Members List */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h5 className="font-mono text-[10px] text-on-surface-variant uppercase tracking-widest font-bold">Checked-In Members</h5>
                    <span className="bg-surface-container-high text-primary px-2 py-0.5 rounded text-[9px] font-bold font-mono">
                      {rosterMembers.length} TOTAL
                    </span>
                  </div>

                  <div className="space-y-2 max-h-[320px] overflow-y-auto custom-scrollbar">
                    {rosterMembers.map((member, idx) => (
                      <div
                        key={member.id}
                        className="bg-surface-container-high/60 rounded-xl border border-outline-variant/30 p-3 flex items-center gap-3 hover:border-primary/30 transition-colors group/roster"
                      >
                        <img
                          className="w-9 h-9 rounded-lg object-cover ring-2 ring-primary/20 group-hover/roster:ring-primary/50 transition-all"
                          src={member.avatar}
                          alt={member.memberName}
                          referrerPolicy="no-referrer"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-sans text-sm font-bold text-on-surface truncate">{member.memberName}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className={`px-1.5 py-0 rounded text-[8px] font-bold uppercase font-mono ${
                              member.level === 'Ignition' 
                                ? 'bg-primary/10 text-primary' 
                                : member.level === 'Blaze' 
                                  ? 'bg-tertiary-container/10 text-tertiary-container' 
                                  : 'bg-on-secondary-container/10 text-on-secondary-container'
                            }`}>
                              {member.level}
                            </span>
                            <span className="font-mono text-[9px] text-on-surface-variant">{member.rgId}</span>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="flex items-center gap-1 text-on-surface-variant">
                            <Clock className="w-3 h-3" />
                            <span className="font-mono text-[10px]">{member.timestamp.split(', ').pop()}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-10 flex flex-col items-center justify-center text-center min-h-[400px]">
                <div className="bg-surface-container-high/60 w-16 h-16 rounded-2xl flex items-center justify-center mb-4">
                  <Calendar className="w-8 h-8 text-on-surface-variant/30 animate-pulse" />
                </div>
                <p className="font-sans text-sm font-bold text-on-surface-variant uppercase tracking-wider">No Event Selected</p>
                <p className="font-sans text-xs text-on-surface-variant/60 max-w-[220px] mt-2 leading-relaxed">
                  Choose an event from the selector above to view the live check-in roster and attendance data.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-surface-container p-5 rounded-xl border border-outline-variant relative overflow-hidden group">
          <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:scale-110 transition-transform duration-700">
            <CheckCircle className="w-24 h-24 text-primary" />
          </div>
          <p className="font-mono text-[10px] text-on-surface-variant uppercase tracking-widest mb-1">Total Check-ins Today</p>
          <h3 className="font-sans text-3xl font-black text-primary mb-0.5">{totalCheckInsToday}</h3>
          <p className="text-xs text-emerald-400 font-medium flex items-center gap-1">
            <ArrowUpRight className="w-3.5 h-3.5" /> Active participation
          </p>
        </div>

        <div className="bg-surface-container p-5 rounded-xl border border-outline-variant">
          <p className="font-mono text-[10px] text-on-surface-variant uppercase tracking-widest mb-2">Active Events</p>
          <div className="flex items-center gap-3">
            <h3 className="font-sans text-3xl font-black text-on-surface">{activeEvents}</h3>
            <div className="flex items-center gap-1 bg-primary/10 px-2 py-0.5 rounded-lg">
              <Calendar className="w-3.5 h-3.5 text-primary" />
              <span className="font-mono text-[10px] text-primary font-bold">LIVE</span>
            </div>
          </div>
          <div className="mt-3 flex items-end gap-1.5 h-8">
            {events.slice(0, 6).map((ev, i) => {
              const pct = ev.totalCapacity > 0 ? (ev.checkedIn / ev.totalCapacity) * 100 : 0;
              return (
                <div
                  key={ev.id}
                  className="w-4 bg-primary/20 rounded-t hover:bg-primary/40 transition-colors"
                  style={{ height: `${Math.max(pct * 0.3, 20)}%` }}
                  title={`${ev.title}: ${Math.round(pct)}%`}
                />
              );
            })}
          </div>
          <p className="font-sans text-xs text-on-surface-variant mt-2">Across all scheduled gatherings</p>
        </div>

        <div className="bg-surface-container p-5 rounded-xl border border-outline-variant relative overflow-hidden">
          <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:scale-110 transition-transform duration-700">
            <BarChart2 className="w-24 h-24 text-tertiary" />
          </div>
          <p className="font-mono text-[10px] text-on-surface-variant uppercase tracking-widest mb-1">Average Attendance Rate</p>
          <h3 className="font-sans text-3xl font-black text-on-surface mb-0.5">{avgAttendanceRate}%</h3>
          <div className="mt-2 h-1.5 bg-background rounded-full overflow-hidden">
            <div
              className="bg-primary h-full rounded-full"
              style={{ width: `${avgAttendanceRate}%` }}
            />
          </div>
          <p className="text-xs text-on-surface-variant mt-2 flex items-center gap-1">
            <Users className="w-3.5 h-3.5" /> Based on {events.length} events
          </p>
        </div>
      </div>
    </div>
  );
}
