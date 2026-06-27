import { useState, useEffect, useCallback } from 'react';
import { 
  Search, 
  UserCheck, 
  CalendarDays, 
  Clock, 
  CheckCircle, 
  Filter, 
  Download, 
  Users, 
  BarChart2, 
  ArrowUpRight
} from 'lucide-react';
import { YouthMember } from '../types';
import toast from '../hooks/useToast';
import api from '../api';

interface SundayRecord {
  id: string;
  userId: string;
  name: string;
  rgId: string;
  avatar: string;
  levelName: 'Ignition' | 'Blaze' | 'Inferno';
  date: string;
  time: string;
}

interface SundayHistoryEntry {
  date: string;
  attendee_count: string;
}

interface SundayAttendanceProps {
  members: YouthMember[];
}

export default function SundayAttendance({ members }: SundayAttendanceProps) {
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    if (today.getDay() === 0) {
      return today.toISOString().split('T')[0];
    }
    const nextSunday = new Date(today);
    nextSunday.setDate(today.getDate() + (7 - today.getDay()));
    return nextSunday.toISOString().split('T')[0];
  });

  const [manualSearchTerm, setManualSearchTerm] = useState('');
  const [selectedRgId, setSelectedRgId] = useState<string>('');
  const [searchDropdownOpen, setSearchDropdownOpen] = useState(false);
  const [selectedTime, setSelectedTime] = useState(() => {
    return new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
  });

  const [records, setRecords] = useState<SundayRecord[]>([]);
  const [history, setHistory] = useState<SundayHistoryEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [historyFilter, setHistoryFilter] = useState('');

  const loadRecords = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.getSundayAttendance(selectedDate);
      setRecords(data || []);
    } catch (error) {
      console.error('Failed to load Sunday attendance:', error);
      toast.error('Failed to load attendance data');
    } finally {
      setLoading(false);
    }
  }, [selectedDate]);

  const loadHistory = useCallback(async () => {
    try {
      const data = await api.getSundayHistory();
      setHistory(data || []);
    } catch (error) {
      console.error('Failed to load Sunday history:', error);
    }
  }, []);

  useEffect(() => {
    loadRecords();
    loadHistory();
  }, [loadRecords, loadHistory]);

  const filteredMembers = members.filter(member =>
    member.name.toLowerCase().includes(manualSearchTerm.toLowerCase()) ||
    member.rgId.toLowerCase().includes(manualSearchTerm.toLowerCase())
  );

  const handleManualCheckIn = async () => {
    if (!selectedRgId) {
      toast.error('Please select a member to check in.');
      return;
    }
    const member = members.find(m => m.rgId === selectedRgId);
    if (!member) return;

    try {
      await api.checkInSunday(member.id, selectedDate, selectedTime);
      toast.success('Member checked in for Sunday attendance!');
      setManualSearchTerm('');
      setSelectedRgId('');
      setSearchDropdownOpen(false);
      loadRecords();
    } catch (error) {
      console.error('Check-in failed:', error);
      toast.error('Failed to check in member');
    }
  };

  const handleRemove = async (userId: string) => {
    try {
      await api.removeSundayAttendance(userId, selectedDate);
      toast.success('Attendance record removed');
      loadRecords();
    } catch (error) {
      console.error('Remove failed:', error);
      toast.error('Failed to remove attendance record');
    }
  };

  const totalAttendees = records.length;
  const uniqueMembers = new Set(records.map(r => r.userId)).size;
  const totalSundays = history.length;

  const filteredHistory = history.filter(entry =>
    entry.date.toLowerCase().includes(historyFilter.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Check-In Section */}
      <div className="bg-surface-container border border-outline-variant rounded-2xl p-6 shadow-2xl">
        <div className="flex items-center gap-3 mb-5">
          <div className="bg-primary/10 w-10 h-10 rounded-xl flex items-center justify-center">
            <CalendarDays className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-sans text-md font-bold text-on-surface">Sunday Attendance Check-In</h3>
            <p className="font-sans text-xs text-on-surface-variant">Record youth attendance for any Sunday</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Date Picker */}
          <div>
            <label className="block font-mono text-[10px] text-on-surface-variant uppercase tracking-widest mb-1.5 font-bold">
              Select Sunday
            </label>
            <div className="relative">
              <CalendarDays className="w-4 h-4 text-on-surface-variant absolute left-3 top-2.5 opacity-60 pointer-events-none" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full bg-background border border-outline-variant rounded-lg pl-10 pr-4 py-2 text-sm text-on-surface focus:outline-none focus:border-primary transition-all font-sans"
              />
            </div>
          </div>

          {/* Time Picker */}
          <div>
            <label className="block font-mono text-[10px] text-on-surface-variant uppercase tracking-widest mb-1.5 font-bold">
              Check-In Time
            </label>
            <div className="relative">
              <Clock className="w-4 h-4 text-on-surface-variant absolute left-3 top-2.5 opacity-60 pointer-events-none" />
              <input
                type="time"
                value={selectedTime}
                onChange={(e) => setSelectedTime(e.target.value)}
                className="w-full bg-background border border-outline-variant rounded-lg pl-10 pr-4 py-2 text-sm text-on-surface focus:outline-none focus:border-primary transition-all font-sans"
              />
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
              disabled={!selectedRgId || loading}
              className="w-full bg-primary text-background font-bold px-6 py-2.5 rounded-xl text-sm hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40 disabled:pointer-events-none shadow-md shadow-primary/15"
            >
              <UserCheck className="w-4 h-4 text-background" />
              <span>Check In</span>
            </button>
          </div>
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Attendance List (Left Column) */}
        <div className="lg:col-span-7 bg-surface-container border border-outline-variant rounded-2xl overflow-hidden shadow-2xl">
          <div className="p-5 border-b border-outline-variant flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-surface-container-high/40">
            <div className="flex items-center gap-3">
              <div className="bg-secondary-container/20 w-9 h-9 rounded-lg flex items-center justify-center">
                <Clock className="w-4 h-4 text-secondary" />
              </div>
              <div>
                <h3 className="font-sans text-sm font-bold text-on-surface">Sunday Attendance</h3>
                <p className="font-mono text-[10px] text-on-surface-variant">{records.length} attendees</p>
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
                  <th className="px-5 py-3.5 font-mono text-[10px] text-on-surface-variant uppercase tracking-wider">Level</th>
                  <th className="px-5 py-3.5 font-mono text-[10px] text-on-surface-variant uppercase tracking-wider">Time</th>
                  <th className="px-5 py-3.5 font-mono text-[10px] text-on-surface-variant uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/40">
                {records.length > 0 ? (
                  records.map((record) => (
                    <tr key={record.id} className="hover:bg-surface-container-highest/30 transition-colors group">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <img
                            className="w-8 h-8 rounded-lg object-cover ring-2 ring-primary/20 group-hover:ring-primary/50 transition-all"
                            src={record.avatar}
                            alt={record.name}
                            referrerPolicy="no-referrer"
                          />
                          <span className="font-bold text-on-surface text-sm">{record.name}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 font-mono text-xs text-secondary font-medium">{record.rgId}</td>
                      <td className="px-5 py-3.5">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase font-mono ${
                          record.levelName === 'Ignition' 
                            ? 'bg-primary/10 text-primary' 
                            : record.levelName === 'Blaze' 
                              ? 'bg-tertiary-container/10 text-tertiary-container' 
                              : 'bg-on-secondary-container/10 text-on-secondary-container'
                        }`}>
                          {record.levelName}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-xs text-on-surface-variant font-mono whitespace-nowrap">{record.time}</td>
                      <td className="px-5 py-3.5">
                        <button
                          onClick={() => handleRemove(record.userId)}
                          className="text-xs text-error hover:text-error/80 font-medium transition-colors"
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="text-center py-10 text-on-surface-variant text-sm font-sans">
                      {loading ? 'Loading attendance records...' : 'No attendance records for this date.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="px-5 py-3.5 bg-surface-container-low/50 border-t border-outline-variant flex items-center justify-between">
            <p className="font-mono text-[10px] text-on-surface-variant">
              Showing {records.length} attendees
            </p>
            <div className="flex items-center gap-1 font-sans">
              <button className="px-2.5 py-1 rounded-lg bg-surface-container text-on-surface-variant hover:bg-surface-container-high transition-colors text-xs font-bold disabled:opacity-40" disabled>Prev</button>
              <button className="w-6 h-6 rounded-lg bg-primary text-background font-bold text-[10px]">1</button>
              <button className="px-2.5 py-1 rounded-lg bg-surface-container text-on-surface hover:bg-surface-container-high transition-colors text-xs font-bold">Next</button>
            </div>
          </div>
        </div>

        {/* History Panel (Right Column) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-surface-container border border-outline-variant rounded-2xl overflow-hidden shadow-2xl">
            <div className="p-5 border-b border-outline-variant bg-surface-container-high/40">
              <div className="flex items-center gap-3">
                <div className="bg-primary/10 w-9 h-9 rounded-lg flex items-center justify-center">
                  <CalendarDays className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <h3 className="font-sans text-sm font-bold text-on-surface">Sunday History</h3>
                  <p className="font-mono text-[10px] text-on-surface-variant">{totalSundays} total Sundays</p>
                </div>
              </div>
            </div>

            <div className="p-5 space-y-3 max-h-[400px] overflow-y-auto custom-scrollbar">
              {filteredHistory.length > 0 ? (
                filteredHistory.map((entry) => (
                  <div
                    key={entry.date}
                    className="bg-surface-container-high/60 rounded-xl border border-outline-variant/30 p-4 flex items-center justify-between hover:border-primary/30 transition-colors cursor-pointer"
                    onClick={() => setSelectedDate(entry.date)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="bg-primary/10 w-10 h-10 rounded-lg flex items-center justify-center">
                        <CalendarDays className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <p className="font-sans text-sm font-bold text-on-surface">
                          {new Date(entry.date + 'T12:00:00').toLocaleDateString('en-US', { 
                            weekday: 'long', 
                            month: 'short', 
                            day: 'numeric', 
                            year: 'numeric' 
                          })}
                        </p>
                        <p className="font-mono text-[10px] text-on-surface-variant">{entry.date}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-sans text-lg font-black text-primary">{entry.attendee_count}</p>
                      <p className="font-mono text-[9px] text-on-surface-variant uppercase tracking-wider">attendees</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-10 flex flex-col items-center justify-center text-center min-h-[200px]">
                  <CalendarDays className="w-8 h-8 text-on-surface-variant/30 mb-4" />
                  <p className="font-sans text-sm font-bold text-on-surface-variant uppercase tracking-wider">No History</p>
                  <p className="font-sans text-xs text-on-surface-variant/60 max-w-[220px] mt-2 leading-relaxed">
                    No Sunday attendance records found yet.
                  </p>
                </div>
              )}
            </div>
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
          <h3 className="font-sans text-3xl font-black text-primary mb-0.5">{totalAttendees}</h3>
          <p className="text-xs text-emerald-400 font-medium flex items-center gap-1">
            <ArrowUpRight className="w-3.5 h-3.5" /> Active participation
          </p>
        </div>

        <div className="bg-surface-container p-5 rounded-xl border border-outline-variant">
          <p className="font-mono text-[10px] text-on-surface-variant uppercase tracking-widest mb-2">Unique Members</p>
          <div className="flex items-center gap-3">
            <h3 className="font-sans text-3xl font-black text-on-surface">{uniqueMembers}</h3>
            <div className="flex items-center gap-1 bg-primary/10 px-2 py-0.5 rounded-lg">
              <Users className="w-3.5 h-3.5 text-primary" />
              <span className="font-mono text-[10px] text-primary font-bold">TOTAL</span>
            </div>
          </div>
          <p className="font-sans text-xs text-on-surface-variant mt-2">Different youth this Sunday</p>
        </div>

        <div className="bg-surface-container p-5 rounded-xl border border-outline-variant relative overflow-hidden">
          <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:scale-110 transition-transform duration-700">
            <BarChart2 className="w-24 h-24 text-tertiary" />
          </div>
          <p className="font-mono text-[10px] text-on-surface-variant uppercase tracking-widest mb-1">Total Sundays Tracked</p>
          <h3 className="font-sans text-3xl font-black text-on-surface mb-0.5">{totalSundays}</h3>
          <p className="text-xs text-on-surface-variant mt-2 flex items-center gap-1">
            <CalendarDays className="w-3.5 h-3.5" /> Historical attendance
          </p>
        </div>
      </div>
    </div>
  );
}