import { useState } from 'react';
import { 
  Users, 
  AlertTriangle, 
  Flame, 
  Calendar, 
  TrendingUp, 
  ArrowUpRight, 
  Clock, 
  BookOpen, 
  ShieldAlert, 
  Check, 
  Search,
  CheckCircle,
  Bell
} from 'lucide-react';
import { NavTab, YouthMember, PortalEvent } from '../types';

interface DashboardOverviewProps {
  members: YouthMember[];
  events: PortalEvent[];
  prayerCount: number;
  pendingSubmissionsCount: number;
  stats: {
    totalMembers: number;
    activeMembers: number;
    totalPosts: number;
    pendingPosts: number;
    totalPrayers: number;
    activePrayers: number;
    totalEvents: number;
    activeEvents: number;
  } | null;
  recentActivity: any[];
  onNavigate: (tab: NavTab) => void;
}

export default function DashboardOverview({ 
  members, 
  events, 
  prayerCount,
  pendingSubmissionsCount,
  stats,
  recentActivity,
  onNavigate 
}: DashboardOverviewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [notification, setNotification] = useState<string | null>(null);
  const [activityLog, setActivityLog] = useState(recentActivity.length > 0 ? recentActivity : [
    { id: 'act1', name: 'Jordan Bennett', initial: 'JB', role: 'MEMBER', date: 'Oct 24, 2:15 PM', status: 'Checked In', statusColor: 'text-primary' },
    { id: 'act2', name: 'Sarah Miller', initial: 'SM', role: 'LEADER', date: 'Oct 24, 1:45 PM', status: 'Verified Account', statusColor: 'text-on-surface-variant' },
    { id: 'act3', name: 'Liam Chen', initial: 'LC', role: 'MEMBER', date: 'Oct 24, 11:20 AM', status: 'New Registration', statusColor: 'text-on-surface-variant' },
    { id: 'act4', name: 'Avery Watson', initial: 'AW', role: 'MEMBER', date: 'Oct 23, 5:40 PM', status: 'Profile Updated', statusColor: 'text-tertiary' }
  ]);

  const triggerNotification = (message: string) => {
    setNotification(message);
    setTimeout(() => setNotification(null), 3000);
  };

  const loadMoreActivity = () => {
    setActivityLog(prev => [
      ...prev,
      { id: 'act5', name: 'Elena Rostova', initial: 'ER', role: 'MEMBER', date: 'Oct 23, 2:10 PM', status: 'Checked In', statusColor: 'text-primary' },
      { id: 'act6', name: 'Zahara Williams', initial: 'ZW', role: 'MEMBER', date: 'Oct 23, 11:05 AM', status: 'Verified Account', statusColor: 'text-on-surface-variant' }
    ]);
    triggerNotification('Loaded additional registration records.');
  };

  const filteredLog = activityLog.filter((act: any) => 
    act.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const displayStats = stats || {
    totalMembers: members.length || 127,
    activeMembers: members.filter(m => m.status === 'Active').length || 87,
    totalPosts: 0,
    pendingPosts: pendingSubmissionsCount,
    totalPrayers: prayerCount,
    activePrayers: 0,
    totalEvents: events.length,
    activeEvents: events.filter(e => e.type === 'live').length
  };

  const upcomingEvents = events.slice(0, 3);

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {notification && (
        <div className="fixed bottom-6 right-6 z-50 bg-primary-container text-on-primary-container px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 border border-primary animate-bounce">
          <Bell className="w-5 h-5 text-primary animate-spin" />
          <span className="font-sans font-medium text-sm">{notification}</span>
        </div>
      )}

      {/* Metric Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Total Youth */}
        <div className="glass-card p-6 rounded-xl relative overflow-hidden group">
          <div className="absolute -right-4 -bottom-4 opacity-10 transform group-hover:scale-110 transition-transform duration-500">
            <Users className="w-24 h-24 text-on-surface" />
          </div>
          <p className="font-mono text-[10px] text-on-surface-variant uppercase tracking-wider mb-2">Total Youth</p>
          <h2 className="font-sans text-5xl font-extrabold text-on-surface leading-none tracking-tight">{displayStats.totalMembers}</h2>
          <div className="mt-4 flex items-center gap-2">
            <span className="bg-primary/20 text-primary px-2.5 py-1 rounded-lg font-mono text-[11px] font-bold flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5" /> {displayStats.activeMembers} active
            </span>
          </div>
        </div>

        {/* Metric 2: Pending Submissions */}
        <div className="glass-card p-6 rounded-xl relative group">
          <p className="font-mono text-[10px] text-on-surface-variant uppercase tracking-wider mb-2">Pending Submissions</p>
          <div className="flex items-end justify-between">
            <h2 className="font-sans text-5xl font-extrabold text-on-surface leading-none tracking-tight">{pendingSubmissionsCount}</h2>
            {pendingSubmissionsCount > 0 && (
              <span className="font-mono text-[10px] bg-primary text-on-primary px-2.5 py-1 rounded-full font-bold">URGENT</span>
            )}
          </div>
          <p className="text-on-surface-variant font-sans text-xs mt-4">Requires leader review</p>
        </div>

        {/* Metric 3: Prayer Requests */}
        <div className="glass-card p-6 rounded-xl relative group">
          <p className="font-mono text-[10px] text-on-surface-variant uppercase tracking-wider mb-2">Prayer Requests</p>
          <div className="flex items-end justify-between">
            <h2 className="font-sans text-5xl font-extrabold text-on-surface leading-none tracking-tight">{prayerCount}</h2>
            <span className="font-mono text-[10px] bg-secondary text-on-secondary px-2.5 py-1 rounded-full font-bold">ACTIVE</span>
          </div>
          <p className="text-on-surface-variant font-sans text-xs mt-4">Needs follow-up today</p>
        </div>

        {/* Metric 4: Events */}
        <div className="glass-card p-6 rounded-xl relative overflow-hidden">
          <p className="font-mono text-[10px] text-on-surface-variant uppercase tracking-wider mb-2">Upcoming Events</p>
          <div className="flex items-baseline gap-2">
            <h2 className="font-sans text-5xl font-extrabold text-primary leading-none tracking-tight">{displayStats.totalEvents}</h2>
            <p className="font-sans text-xs text-on-surface opacity-60">total</p>
          </div>
          <div className="mt-4 flex gap-4">
            <div>
              <p className="font-mono text-[9px] text-on-surface-variant">ACTIVE</p>
              <p className="font-sans text-sm font-bold text-on-surface">{displayStats.activeEvents}</p>
            </div>
            <div className="h-8 w-px bg-outline-variant self-center"></div>
            <div>
              <p className="font-mono text-[9px] text-on-surface-variant">TOTAL REG.</p>
              <p className="font-sans text-sm font-bold text-on-surface">{events.reduce((sum, e) => sum + e.registered, 0)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Layout Grid */}
      <div className="grid grid-cols-12 gap-6 items-start">
        {/* Left Column: Recent Registration & Activity */}
        <div className="col-span-12 lg:col-span-8 glass-card rounded-xl overflow-hidden">
          <div className="p-6 border-b border-outline-variant flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-sans text-lg font-bold text-on-surface">Recent Registration &amp; Activity</h3>
              <p className="font-sans text-xs text-on-surface-variant mt-0.5">Live updates from the youth portal ecosystem.</p>
            </div>

            <div className="relative">
              <input 
                type="text" 
                placeholder="Search updates..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-surface-container-high border border-outline-variant rounded-full py-1.5 pl-9 pr-4 text-xs text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:border-primary transition-all w-48"
              />
              <Search className="w-3.5 h-3.5 text-on-surface-variant absolute left-3 top-2.5 opacity-60" />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left font-sans text-sm border-collapse">
              <thead className="bg-surface-container-high/50 text-on-surface-variant font-mono text-[11px] uppercase tracking-wider border-b border-outline-variant">
                <tr>
                  <th className="px-6 py-4 font-semibold">Name</th>
                  <th className="px-6 py-4 font-semibold">Date</th>
                  <th className="px-6 py-4 font-semibold">Role</th>
                  <th className="px-6 py-4 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/30">
                {filteredLog.length > 0 ? (
                  filteredLog.map((act: any) => (
                    <tr key={act.id} className="hover:bg-surface-container-high/30 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary-container/20 flex items-center justify-center text-primary font-bold text-xs">
                            {act.initial || act.name?.substring(0, 2) || '??'}
                          </div>
                          <span className="text-on-surface font-semibold">{act.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-on-surface-variant text-xs">{act.date}</td>
                      <td className="px-6 py-4">
                        <span className="font-mono text-[10px] bg-surface-container-highest px-2 py-0.5 rounded text-on-surface border border-outline-variant">
                          {act.role}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`flex items-center gap-1.5 text-xs font-medium ${act.statusColor || 'text-on-surface-variant'}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${act.status === 'Checked In' ? 'bg-primary animate-pulse' : 'bg-on-surface-variant'}`}></span>
                          {act.status}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="text-center py-8 text-on-surface-variant text-xs">No updates matching search term.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="p-4 bg-surface-container-high/20 text-center border-t border-outline-variant">
            <button 
              onClick={loadMoreActivity}
              className="font-mono text-xs text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer"
            >
              Load More Activity
            </button>
          </div>
        </div>

        {/* Right Column: Action Queue & Upcoming Events */}
        <div className="col-span-12 lg:col-span-4 space-y-6">
          <div className="flex justify-between items-end">
            <h3 className="font-sans text-md font-bold text-on-surface">Action Queue</h3>
            <span className="font-mono text-[11px] text-primary">{pendingSubmissionsCount + prayerCount} ACTIVE</span>
          </div>

          {/* Action Card 1: Pending Submissions */}
          {pendingSubmissionsCount > 0 && (
            <div className="glass-card p-5 rounded-xl border-l-4 border-l-primary flex gap-4 group">
              <div className="bg-primary/10 text-primary w-11 h-11 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                <BookOpen className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="font-sans text-sm font-bold text-on-surface mb-0.5">Pending Content Review</p>
                <p className="font-sans text-xs text-on-surface-variant mb-3 leading-relaxed">
                  {pendingSubmissionsCount} submission{pendingSubmissionsCount !== 1 ? 's' : ''} awaiting leader approval.
                </p>
                <button 
                  onClick={() => onNavigate('feed')}
                  className="bg-primary text-on-primary font-mono text-[11px] font-bold px-4 py-2 rounded-lg hover:opacity-90 active:scale-95 transition-all cursor-pointer"
                >
                  REVIEW NOW
                </button>
              </div>
            </div>
          )}

          {/* Action Card 2: Prayer Requests */}
          {prayerCount > 0 && (
            <div className="glass-card p-5 rounded-xl border-l-4 border-l-secondary flex gap-4 group">
              <div className="bg-secondary/10 text-secondary w-11 h-11 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                <img src="/favicon.svg" className="w-5 h-5 text-secondary" />
              </div>
              <div className="flex-1">
                <p className="font-sans text-sm font-bold text-on-surface mb-0.5">Prayer Requests</p>
                <p className="font-sans text-xs text-on-surface-variant mb-3 leading-relaxed">
                  {prayerCount} active prayer request{prayerCount !== 1 ? 's' : ''} need attention.
                </p>
                <button 
                  onClick={() => onNavigate('prayers')}
                  className="bg-surface-container-highest text-on-surface font-mono text-[11px] font-bold px-4 py-2 rounded-lg border border-outline-variant hover:bg-surface-container-high active:scale-95 transition-all cursor-pointer"
                >
                  VIEW PRAYERS
                </button>
              </div>
            </div>
          )}

          {/* Action Card 3: Upcoming Event */}
          {upcomingEvents.length > 0 && (
            <div className="glass-card p-5 rounded-xl border-l-4 border-l-tertiary-container flex gap-4 group">
              <div className="bg-tertiary/10 text-tertiary-container w-11 h-11 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                <Calendar className="w-5 h-5 text-tertiary" />
              </div>
              <div className="flex-1">
                <p className="font-sans text-sm font-bold text-on-surface mb-0.5">Next Event</p>
                <p className="font-sans text-xs text-on-surface-variant mb-3 leading-relaxed">
                  {upcomingEvents[0].title} — {upcomingEvents[0].registered}/{upcomingEvents[0].totalCapacity} registered.
                </p>
                <button 
                  onClick={() => onNavigate('events')}
                  className="bg-surface-container-highest text-on-surface font-mono text-[11px] font-bold px-4 py-2 rounded-lg border border-outline-variant hover:bg-surface-container-high active:scale-95 transition-all cursor-pointer"
                >
                  MANAGE EVENTS
                </button>
              </div>
            </div>
          )}

          {/* Upcoming Events Mini List */}
          <div className="glass-card p-6 rounded-xl bg-gradient-to-br from-surface-container-low to-surface-container-high">
            <div className="flex items-center justify-between mb-5">
              <h4 className="font-sans text-sm font-bold text-on-surface">Upcoming Events</h4>
              <Calendar className="w-4 h-4 text-primary" />
            </div>
            <div className="space-y-4">
              {upcomingEvents.length > 0 ? (
                upcomingEvents.map((ev) => {
                  let month = '???';
                  let day = '??';
                  const dateParts = ev.dateKey.split('-');
                  if (dateParts.length === 3) {
                    const parsed = new Date(parseInt(dateParts[0]), parseInt(dateParts[1]) - 1);
                    if (!isNaN(parsed.getTime())) {
                      month = parsed.toLocaleString('en', { month: 'short' }).toUpperCase();
                      day = dateParts[2];
                    }
                  } else {
                    const parsed = new Date(ev.dateKey);
                    if (!isNaN(parsed.getTime())) {
                      month = parsed.toLocaleString('en', { month: 'short' }).toUpperCase();
                      day = String(parsed.getDate());
                    }
                  }
                  return (
                    <div key={ev.id} className="flex gap-3 items-center">
                      <div className="bg-primary/20 text-primary w-10 h-11 rounded flex flex-col items-center justify-center flex-shrink-0 border border-primary/30">
                        <span className="font-mono text-[8px] font-bold leading-none">{month}</span>
                        <span className="font-sans text-sm font-black leading-none mt-0.5">{parseInt(day)}</span>
                      </div>
                      <div>
                        <p className="font-sans text-xs font-bold text-on-surface">{ev.title}</p>
                        <p className="font-mono text-[10px] text-on-surface-variant">{ev.dateTime}</p>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-4 text-on-surface-variant text-xs font-sans">
                  No upcoming events.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


