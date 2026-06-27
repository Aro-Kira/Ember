import React, { useState, useEffect, useCallback } from 'react';
import { 
  Menu, 
  Bell, 
  Calendar, 
  ChevronRight, 
  Clock, 
  AlertCircle,
  CheckCircle,
  LogOut,
  Sparkles,
  FlameKindling,
  Loader2
} from 'lucide-react';

import { NavTab, YouthMember, Announcement, PortalEvent, ModerationSubmission, PrayerItem } from './types';
import api from './api';
import useTheme from './hooks/useTheme';

import Sidebar from './components/Sidebar';
import DashboardOverview from './components/DashboardOverview';
import MembersDirectory from './components/MembersDirectory';
import AnnouncementsHub from './components/AnnouncementsHub';
import EventsManager from './components/EventsManager';
import PrayerBoard from './components/PrayerBoard';
import AttendanceScannerView from './components/AttendanceScannerView';
import CommunityFeed from './components/CommunityFeed';
import AttendanceHistory from './components/AttendanceHistory';
import SundayAttendance from './components/SundayAttendance';
import SettingsPage from './components/SettingsPage';
import { ToastContainer } from './hooks/useToast.tsx';

export default function App() {
  const { theme, setTheme } = useTheme();
  const [activeTab, setActiveTab] = useState<NavTab>('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(api.isAuthenticated());
  const [isLoading, setIsLoading] = useState(false);
  const [loginEmail, setLoginEmail] = useState('leader@risktakergeneration.com');
  const [loginPassword, setLoginPassword] = useState('leader123');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [profile, setProfile] = useState<any>(null);

  // Register session expiry callback
  useEffect(() => {
    api.onSessionExpired(() => {
      setProfile(null);
      setMembers([]);
      setAnnouncements([]);
      setEvents([]);
      setSubmissions([]);
      setPrayerItems([]);
      setDataLoaded(false);
      setIsLoggedIn(false);
    });
    return () => api.onSessionExpired(null);
  }, []);

  const [members, setMembers] = useState<YouthMember[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [events, setEvents] = useState<PortalEvent[]>([]);
  const [submissions, setSubmissions] = useState<ModerationSubmission[]>([]);
  const [prayerItems, setPrayerItems] = useState<PrayerItem[]>([]);

  const [dataLoaded, setDataLoaded] = useState(false);
  const [currentTime, setCurrentTime] = useState('');
  const [stats, setStats] = useState<any>(null);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const loadMembers = useCallback(async () => {
    try {
      const data = await api.getMembers();
      const mapped = data.map((m: any) => ({
        id: m.id,
        name: m.name,
        email: m.email,
        rgId: `#RG-${m.id.substring(0, 4).toUpperCase()}`,
        joinedDate: m.joinedDate,
        level: m.levelName,
        status: m.status,
        avatar: m.avatar
      }));
      setMembers(mapped);
    } catch (err) {
      console.error('Failed to load members:', err);
    }
  }, []);

  const loadAnnouncements = useCallback(async () => {
    try {
      const data = await api.getAnnouncements();
      const mapped = data.map((a: any) => ({
        id: a.id,
        title: a.title,
        content: a.content,
        priority: a.priority,
        targetAudience: a.target_audience,
        date: new Date(a.created_at).toLocaleDateString(),
        views: a.views ?? 0,
        status: a.status,
        coverImage: a.cover_image,
        authorName: a.author_name,
        authorAvatar: a.author_avatar
      }));
      setAnnouncements(mapped);
    } catch (err) {
      console.error('Failed to load announcements:', err);
    }
  }, []);

  const loadEvents = useCallback(async () => {
    try {
      const data = await api.getEvents();
      const mapped = data.map((e: any) => ({
        id: e.id,
        title: e.title,
        dateTime: `${e.date} -- ${e.time}`,
        registered: e.registeredCount,
        totalCapacity: e.total_capacity,
        checkedIn: e.checkedInCount,
        type: e.type,
        dateKey: e.date,
        revenue: 0,
        registrationFields: Array.isArray(e.registration_fields) ? e.registration_fields : []
      }));
      setEvents(mapped);
    } catch (err) {
      console.error('Failed to load events:', err);
    }
  }, []);

  const loadPosts = useCallback(async () => {
    try {
      const data = await api.getAllPosts();
      const mapped = data.map((p: any) => ({
        id: p.id,
        title: p.title,
        name: p.author_name,
        timeAgo: new Date(p.created_at).toLocaleDateString(),
        type: p.type.toUpperCase(),
        content: p.body,
        status: p.status,
        reactions: p.reactions,
        userReactions: p.userReactions
      }));
      setSubmissions(mapped);
    } catch (err) {
      console.error('Failed to load posts:', err);
    }
  }, []);

  const loadPrayers = useCallback(async () => {
    try {
      const data = await api.getPrayers();
      const mapped = data.map((p: any) => ({
        id: p.id,
        category: p.category || 'general',
        text: p.content,
        author: p.display_name,
        stage: p.stage,
        prayingCount: p.prayedCount,
        date: new Date(p.created_at).toLocaleDateString()
      }));
      setPrayerItems(mapped);
    } catch (err) {
      console.error('Failed to load prayers:', err);
    }
  }, []);

  const loadProfile = useCallback(async () => {
    try {
      const data = await api.getMe();
      setProfile(data.user);
    } catch (err) {
      console.error('Failed to load profile:', err);
    }
  }, []);

  const loadStats = useCallback(async () => {
    try {
      const data = await api.getStats();
      setStats(data.stats || data);
    } catch (err) {
      console.error('Failed to load stats:', err);
    }
  }, []);

  const loadActivity = useCallback(async () => {
    try {
      const data = await api.getActivity(20);
      const mapped = (data.activity || data || []).map((a: any, i: number) => ({
        id: `act-${i}`,
        name: a.user_name || a.name || 'Unknown',
        initial: (a.user_name || a.name || 'UN').substring(0, 2).toUpperCase(),
        role: a.type === 'registration' ? 'MEMBER' : a.type === 'post' ? 'MEMBER' : 'MEMBER',
        date: a.created_at ? new Date(a.created_at).toLocaleDateString() : 'Unknown',
        status: a.type === 'registration' ? 'New Registration' : a.type === 'check_in' ? 'Checked In' : a.type === 'post' ? 'New Post' : 'Activity',
        statusColor: a.type === 'check_in' ? 'text-primary' : 'text-on-surface-variant'
      }));
      setRecentActivity(mapped);
    } catch (err) {
      console.error('Failed to load activity:', err);
    }
  }, []);

  const loadAllData = useCallback(async () => {
    await Promise.all([
      loadProfile(),
      loadMembers(),
      loadAnnouncements(),
      loadEvents(),
      loadPosts(),
      loadPrayers(),
      loadStats(),
      loadActivity()
    ]);
    setDataLoaded(true);
  }, [loadProfile, loadMembers, loadAnnouncements, loadEvents, loadPosts, loadPrayers, loadStats, loadActivity]);

  useEffect(() => {
    if (isLoggedIn) {
      loadAllData();
    }
  }, [isLoggedIn, loadAllData]);

  // SSE real-time subscription
  useEffect(() => {
    if (!isLoggedIn) return;
    const sse = api.connectSSE();
    sse.on('post:created', () => loadPosts());
    sse.on('post:approved', () => loadPosts());
    sse.on('post:rejected', () => loadPosts());
    sse.on('post:reacted', () => loadPosts());
    sse.on('post:deleted', () => loadPosts());
    sse.on('prayer:created', () => loadPrayers());
    sse.on('prayer:prayed', () => loadPrayers());
    sse.on('prayer:stage-changed', () => loadPrayers());
    sse.on('prayer:answered', () => loadPrayers());
    sse.on('prayer:deleted', () => loadPrayers());
    sse.on('announcement:created', () => loadAnnouncements());
    sse.on('announcement:updated', () => loadAnnouncements());
    sse.on('announcement:deleted', () => loadAnnouncements());
    sse.on('announcement:published', () => loadAnnouncements());
    sse.on('event:created', () => loadEvents());
    sse.on('event:updated', () => loadEvents());
    sse.on('event:deleted', () => loadEvents());
    sse.on('event:registered', () => { loadEvents(); loadStats(); });
    sse.on('event:unregistered', () => loadEvents());
    sse.on('event:checked-in', () => { loadEvents(); loadMembers(); });
    sse.on('member:created', () => loadMembers());
    sse.on('member:updated', () => loadMembers());
    sse.on('member:deleted', () => loadMembers());
    return () => sse.close();
  }, [isLoggedIn]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setIsLoading(true);
    try {
      await api.login(loginEmail, loginPassword);
      setIsLoggedIn(true);
    } catch (err: any) {
      setLoginError(err.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    await api.logout();
    setProfile(null);
    setMembers([]);
    setAnnouncements([]);
    setEvents([]);
    setSubmissions([]);
    setPrayerItems([]);
    setStats(null);
    setRecentActivity([]);
    setDataLoaded(false);
    setIsLoggedIn(false);
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-surface-dim flex items-center justify-center p-6">
        <div className="w-full max-w-md bg-surface-card rounded-2xl p-8 border border-border-subtle shadow-xl">
          <div className="text-center mb-8">
            <img src="/favicon.svg" className="w-12 h-12 text-primary mx-auto mb-3" />
            <h1 className="text-2xl font-bold text-text-primary">Risktaker Generation Leader Portal</h1>
            <p className="text-sm text-text-muted mt-1">Sign in with your leader account</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
            {loginError && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-sm text-red-400">
                {loginError}
              </div>
            )}
            <div>
              <label className="block text-xs font-mono text-text-muted mb-1.5">Email</label>
              <input
                type="email"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                className="w-full bg-surface-dim border border-border-subtle rounded-xl py-3 px-4 text-sm text-text-primary focus:outline-none focus:ring-1 focus:ring-primary"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-mono text-text-muted mb-1.5">Password</label>
              <input
                type="password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                className="w-full bg-surface-dim border border-border-subtle rounded-xl py-3 px-4 text-sm text-text-primary focus:outline-none focus:ring-1 focus:ring-primary"
                required
              />
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-primary hover:bg-primary-hover text-on-primary font-bold rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              {isLoading ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Signing in...</>
              ) : (
                'Sign In'
              )}
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (!dataLoaded) {
    return (
      <div className="min-h-screen bg-surface-dim flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto mb-3" />
          <p className="text-sm text-text-muted">Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  const handleAddMember = async (newMember: Omit<YouthMember, 'id' | 'rgId' | 'joinedDate'>) => {
    try {
      await api.createMember({
        name: newMember.name,
        email: newMember.email,
        level: newMember.level,
        status: newMember.status,
        avatar: newMember.avatar
      });
      await loadMembers();
    } catch (err) {
      console.error('Failed to create member:', err);
    }
  };

  const handleUpdateMember = async (updated: YouthMember) => {
    try {
      await api.updateMember(updated.id, {
        name: updated.name,
        email: updated.email,
        level: updated.level,
        status: updated.status,
        avatar: updated.avatar
      });
      await loadMembers();
    } catch (err) {
      console.error('Failed to update member:', err);
      setMembers(prev => prev.map(m => m.id === updated.id ? updated : m));
    }
  };

  const handleDeleteMember = async (id: string) => {
    try {
      await api.deleteMember(id);
      await loadMembers();
    } catch (err) {
      console.error('Failed to delete member:', err);
      setMembers(prev => prev.filter(m => m.id !== id));
    }
  };

  const handleAddAnnouncement = async (newAnn: Omit<Announcement, 'id' | 'views' | 'date' | 'authorName' | 'authorAvatar'>) => {
    try {
      await api.createAnnouncement({
        title: newAnn.title,
        content: newAnn.content,
        priority: newAnn.priority,
        targetAudience: newAnn.targetAudience,
        coverImage: newAnn.coverImage,
        status: newAnn.status
      });
      await loadAnnouncements();
    } catch (err) {
      console.error('Failed to create announcement:', err);
    }
  };

  const handleUpdateAnnouncement = async (id: string, updates: Partial<Announcement>) => {
    try {
      await api.updateAnnouncement(id, updates);
      await loadAnnouncements();
    } catch (err) {
      console.error('Failed to update announcement:', err);
      setAnnouncements(prev => prev.map(a => a.id === id ? { ...a, ...updates } : a));
    }
  };

  const handleDeleteAnnouncement = async (id: string) => {
    try {
      await api.deleteAnnouncement(id);
      await loadAnnouncements();
    } catch (err) {
      console.error('Failed to delete announcement:', err);
      setAnnouncements(prev => prev.filter(a => a.id !== id));
    }
  };

  const handleAddEvent = async (newEvent: Omit<PortalEvent, 'id' | 'checkedIn'>) => {
    try {
      const parts = newEvent.dateTime.split(' -- ');
      await api.createEvent({
        title: newEvent.title,
        date: parts[0] || newEvent.dateTime,
        time: parts[1] || '',
        location: 'TBD',
        description: newEvent.title,
        type: newEvent.type,
        totalCapacity: newEvent.totalCapacity,
        registrationFields: newEvent.registrationFields || []
      });
      await loadEvents();
    } catch (err) {
      console.error('Failed to create event:', err);
    }
  };

  const handleUpdateEvent = async (updated: PortalEvent) => {
    try {
      await api.updateEvent(updated.id, {
        title: updated.title,
        date: updated.dateKey,
        totalCapacity: updated.totalCapacity,
        type: updated.type,
        registrationFields: updated.registrationFields || []
      });
      await loadEvents();
    } catch (err) {
      console.error('Failed to update event:', err);
      setEvents(prev => prev.map(ev => ev.id === updated.id ? updated : ev));
    }
  };

  const handleDeleteEvent = async (id: string) => {
    try {
      await api.deleteEvent(id);
      await loadEvents();
    } catch (err) {
      console.error('Failed to delete event:', err);
      setEvents(prev => prev.filter(ev => ev.id !== id));
    }
  };

  const handleApproveSubmission = async (id: string) => {
    setSubmissions(prev => prev.map(s => 
      s.id === id ? { ...s, status: 'approved' as const } : s
    ));
    try {
      await api.approvePost(id);
      await loadPosts();
    } catch (err) {
      console.error('Failed to approve post:', err);
      await loadPosts();
    }
  };

  const handleRejectSubmission = async (id: string) => {
    setSubmissions(prev => prev.map(s => 
      s.id === id ? { ...s, status: 'rejected' as const } : s
    ));
    try {
      await api.rejectPost(id);
      await loadPosts();
    } catch (err) {
      console.error('Failed to reject post:', err);
      await loadPosts();
    }
  };

  const handleUpdatePrayerStage = async (id: string, stage: 'new' | 'active' | 'archived') => {
    try {
      await api.updatePrayerStage(id, stage);
      await loadPrayers();
    } catch (err) {
      console.error('Failed to update prayer stage:', err);
    }
  };

  const handleAddPrayerItem = (item: Omit<PrayerItem, 'id' | 'prayingCount'>) => {
    const created: PrayerItem = {
      ...item,
      id: `pr-${Date.now()}`,
      prayingCount: 1
    };
    setPrayerItems(prev => [created, ...prev]);
  };

  const handleCheckInMember = async (rgId: string) => {
    const student = members.find(m => m.rgId === rgId);
    if (!student) return;

    try {
      const liveEvent = events.find(e => e.type === 'live');
      if (liveEvent) {
        await api.checkInMemberToEvent(liveEvent.id, student.id);
      }

      if (student.status === 'Inactive') {
        setMembers(prev => prev.map(m => m.rgId === rgId ? { ...m, status: 'Active' } : m));
      }

      if (liveEvent) {
        const nextCheckedIn = Math.min(liveEvent.checkedIn + 1, liveEvent.registered);
        setEvents(prev => prev.map(ev => ev.id === liveEvent.id ? { ...ev, checkedIn: nextCheckedIn } : ev));
      }
    } catch (err) {
      console.error('Failed to check in member:', err);
    }
  };

  const handleCheckInSunday = async (userId: string) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const time = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
      await api.checkInSunday(userId, today, time);
    } catch (err) {
      console.error('Failed to record Sunday attendance:', err);
    }
  };

  const handleCheckInEvent = async (eventId: string, userId: string) => {
    try {
      await api.checkInMemberToEvent(eventId, userId);
      setEvents(prev => prev.map(ev => ev.id === eventId ? { ...ev, checkedIn: ev.checkedIn + 1 } : ev));
    } catch (err) {
      console.error('Failed to check in member to event:', err);
    }
  };

  const liveEvents = events.filter(e => e.type === 'live');

  const handleUpdateProfile = async (updates: { name?: string; email?: string; avatar?: string; bio?: string; emergencyContact?: string }) => {
    try {
      await api.updateProfile(updates);
      setProfile((prev: any) => ({ ...prev, ...updates }));
    } catch (err) {
      console.error('Failed to update profile:', err);
      setProfile((prev: any) => ({ ...prev, ...updates }));
    }
  };

  const getTabTitle = () => {
    switch (activeTab) {
      case 'overview': return 'Overview Dashboard';
      case 'members': return 'Youth Members Directory';
      case 'announcements': return 'Announcements Hub';
      case 'events': return 'Events & Calendar Manager';
      case 'prayers': return 'Prayer Management';
      case 'scanner': return 'Live QR Check-In';
      case 'feed': return 'Community Feed';
      case 'attendance': return 'Attendance History & Reports';
      case 'sunday': return 'Sunday Attendance Tracker';
      case 'settings': return 'Account Settings';
      default: return 'Youth Leader Portal';
    }
  };

  const pendingSubmissionsCount = submissions.filter(s => s.status === 'pending').length;

  return (
    <div className="min-h-screen bg-surface-dim flex">
      <ToastContainer />
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)}
        onLaunchScanner={() => setActiveTab('scanner')}
        onLogout={handleLogout}
        profile={profile}
      />

      <div className="flex-1 lg:pl-64 flex flex-col min-h-screen overflow-hidden">
        <header className="sticky top-0 z-30 bg-surface-container-low/80 backdrop-blur-md border-b border-outline-variant px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-lg hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer"
            >
              <Menu className="w-5 h-5" />
            </button>
            
            <div>
              <div className="hidden sm:flex items-center gap-1.5 font-mono text-[10px] text-on-surface-variant uppercase tracking-widest">
                <span>RG PORTAL</span>
                <ChevronRight className="w-3 h-3 text-outline" />
                <span className="text-primary font-bold">{activeTab}</span>
              </div>
              <h2 className="font-sans text-md sm:text-lg font-black text-on-surface leading-none mt-0.5">
                {getTabTitle()}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-2 bg-surface-container-high border border-outline-variant/60 rounded-xl px-3.5 py-1.5 font-mono text-xs text-on-surface">
              <Clock className="w-3.5 h-3.5 text-primary" />
              <span>{currentTime || '12:00:00 PM'}</span>
              <span className="text-on-surface-variant opacity-60">UTC</span>
            </div>

            {pendingSubmissionsCount > 0 && (
              <button 
                onClick={() => setActiveTab('feed')}
                className="relative p-2 rounded-xl bg-surface-container-high hover:bg-surface-container border border-outline-variant/60 text-primary hover:text-on-surface transition-all cursor-pointer flex items-center gap-1"
                title={`${pendingSubmissionsCount} submissions pending moderation`}
              >
                <Bell className="w-4 h-4 text-primary animate-pulse" />
                <span className="font-mono text-[10px] font-bold bg-primary text-background px-1.5 py-0.2 rounded-full leading-none">
                  {pendingSubmissionsCount}
                </span>
              </button>
            )}

            <div className="flex items-center gap-3 pl-2 border-l border-outline-variant/40">
              <img 
                className="w-8 h-8 rounded-full border border-primary/25 object-cover" 
                src={profile?.avatar || "https://lh3.googleusercontent.com/aida-public/AB6AXuC3j0iMcJukmdOVIrdKqXct652DjZaGVopriJUcla9B6FKUMl-c7pojuMZdzhHbQeCds9QlyAnmg3aH4TXnCId3p5DwrCDujO5esmccI2Kqcj4rjpY-w5SNSwhTVloIxcaPb4lOqAyGNPQXjFHhErgVj_wZ-IXSoZpmjyXTeJnFKteoL88V-dGftNBFBHlvs7C5So0e4fm00o0TpnQlqJdV-Te-x6Cnkv2ceVdsOCSg5WckdFdzTUPTTv9Z1ChyCB1wTbK3gPBTs-zm"} 
                alt="Leader" 
                referrerPolicy="no-referrer"
              />
              <div className="hidden sm:block">
                <p className="font-sans text-xs font-bold text-on-surface">{profile?.name || 'Alex Rivera'}</p>
                <p className="font-mono text-[9px] text-on-surface-variant leading-none uppercase">{profile?.role === 'leader' ? 'Youth Leader' : 'Portal Master'}</p>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 p-6 overflow-y-auto max-w-[1500px] w-full mx-auto">
          {activeTab === 'overview' && (
            <DashboardOverview 
              members={members} 
              events={events}
              prayerCount={prayerItems.filter(p => p.stage !== 'archived').length}
              pendingSubmissionsCount={pendingSubmissionsCount}
              stats={stats}
              recentActivity={recentActivity}
              onNavigate={setActiveTab}
            />
          )}

          {activeTab === 'members' && (
            <MembersDirectory 
              members={members} 
              onAddMember={handleAddMember}
              onUpdateMember={handleUpdateMember}
              onDeleteMember={handleDeleteMember}
            />
          )}

          {activeTab === 'announcements' && (
            <AnnouncementsHub 
              announcements={announcements} 
              onAddAnnouncement={handleAddAnnouncement}
              onUpdateAnnouncement={handleUpdateAnnouncement}
              onDeleteAnnouncement={handleDeleteAnnouncement}
            />
          )}

          {activeTab === 'events' && (
            <EventsManager 
              events={events} 
              onAddEvent={handleAddEvent}
              onUpdateEvent={handleUpdateEvent}
              onDeleteEvent={handleDeleteEvent}
            />
          )}

          {activeTab === 'prayers' && (
            <PrayerBoard
              prayerItems={prayerItems}
              onUpdatePrayerStage={handleUpdatePrayerStage}
              onAddPrayerItem={handleAddPrayerItem}
            />
          )}

          {activeTab === 'scanner' && (
            <AttendanceScannerView
              onCheckInMember={handleCheckInMember}
              onCheckInSunday={handleCheckInSunday}
              onCheckInEvent={handleCheckInEvent}
              members={members}
              liveEvents={liveEvents}
            />
          )}

          {activeTab === 'feed' && (
            <CommunityFeed 
              submissions={submissions}
              onApprove={handleApproveSubmission}
              onReject={handleRejectSubmission}
            />
          )}

          {activeTab === 'attendance' && (
            <AttendanceHistory 
              members={members}
              events={events}
              onCheckInMember={handleCheckInMember}
            />
          )}

          {activeTab === 'sunday' && (
            <SundayAttendance 
              members={members}
            />
          )}

          {activeTab === 'settings' && (
            <SettingsPage 
              profile={profile}
              onUpdateProfile={handleUpdateProfile}
              theme={theme}
              onThemeChange={setTheme}
            />
          )}
        </main>
      </div>
    </div>
  );
}


