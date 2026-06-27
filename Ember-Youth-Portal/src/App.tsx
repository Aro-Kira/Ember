import React, { useState, useEffect, useCallback } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import {
  ArrowRight,
  Award,
  Bell,
  BookOpen,
  Calendar,
  ChevronRight,
  CheckCircle2,
  Clock,
  Eye,
  EyeOff,
  FileText,
  Heart,
  Image,
  Loader2,
  Lock,
  LogOut,
  Mail,
  MapPin,
  MessageSquare,
  Monitor,
  Palette,
  Plus,
  QrCode,
  Send,
  Share2,
  Sparkles,
  SquarePen,
  TriangleAlert,
  User,
  UserPlus,
  X,
  Zap,
} from 'lucide-react';
import { useTheme } from './hooks/useTheme';
import { useToast } from './hooks/useToast';

// ============ INLINE API CLIENT ============

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api/v1';
const BACKEND_ORIGIN = API_BASE_URL.startsWith('http') ? new URL(API_BASE_URL).origin : '';

class ApiClient {
  token: string | null;
  _refreshPromise: Promise<boolean> | null;
  _onSessionExpired: (() => void) | null;
  baseUrl: string;

  constructor() {
    this.baseUrl = API_BASE_URL;
    this.token = localStorage.getItem('rg_access_token');
    this._refreshPromise = null;
    this._onSessionExpired = null;
  }

  onSessionExpired(callback: () => void) {
    this._onSessionExpired = callback;
  }

  setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem('rg_access_token', token);
    } else {
      localStorage.removeItem('rg_access_token');
    }
  }

  getRefreshToken(): string | null {
    return localStorage.getItem('rg_refresh_token');
  }

  setRefreshToken(token: string | null) {
    if (token) {
      localStorage.setItem('rg_refresh_token', token);
    } else {
      localStorage.removeItem('rg_refresh_token');
    }
  }

  async request(endpoint: string, options: RequestInit = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> || {}),
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if ((response.status === 401 || response.status === 403) && response.headers.get('content-type')?.includes('application/json')) {
      const refreshToken = this.getRefreshToken();
      if (refreshToken) {
        if (!this._refreshPromise) {
          this._refreshPromise = this.refreshToken().finally(() => {
            this._refreshPromise = null;
          });
        }
        const refreshed = await this._refreshPromise;
        if (refreshed) {
          headers['Authorization'] = `Bearer ${this.token}`;
          const retryResponse = await fetch(url, {
            ...options,
            headers,
          });
          if (!retryResponse.ok) {
            this._forceLogout();
          }
          return this.handleResponse(retryResponse);
        }
      }
      this._forceLogout();
      throw new Error('Session expired. Please log in again.');
    }

    return this.handleResponse(response);
  }

  async handleResponse(response: Response) {
    const contentType = response.headers.get('content-type') || '';
    let data: any;

    if (contentType.includes('application/json')) {
      data = await response.json();
    } else {
      const text = await response.text();
      if (!response.ok) {
        throw new Error(text || `Request failed with status ${response.status}`);
      }
      return text;
    }

    if (!response.ok) {
      throw new Error(data.error || 'Request failed');
    }

    return data;
  }

  async refreshToken(): Promise<boolean> {
    try {
      const refreshToken = this.getRefreshToken();
      if (!refreshToken) return false;

      const response = await fetch(`${this.baseUrl}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });

      if (!response.ok) {
        this._forceLogout();
        return false;
      }

      const data = await response.json();
      this.setToken(data.accessToken);
      this.setRefreshToken(data.refreshToken);
      return true;
    } catch (error) {
      this._forceLogout();
      return false;
    }
  }

  _forceLogout() {
    this.setToken(null);
    this.setRefreshToken(null);
    localStorage.removeItem('rg_is_logged_in');
    localStorage.removeItem('rg_user_profile');
    localStorage.removeItem('rg_submitted_posts');
    localStorage.removeItem('rg_events_list');
    localStorage.removeItem('rg_prayers_list');
    if (this._onSessionExpired) {
      this._onSessionExpired();
    }
  }

  async register(userData: any) {
    const data = await this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
    this.setToken(data.accessToken);
    this.setRefreshToken(data.refreshToken);
    localStorage.setItem('rg_is_logged_in', 'true');
    return data;
  }

  async login(email: string, password: string) {
    const data = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    this.setToken(data.accessToken);
    this.setRefreshToken(data.refreshToken);
    localStorage.setItem('rg_is_logged_in', 'true');
    return data;
  }

  async getMe() {
    return this.request('/auth/me');
  }

  async updateProfile(updates: any) {
    return this.request('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async logout() {
    try {
      const refreshToken = this.getRefreshToken();
      if (refreshToken) {
        await fetch(`${this.baseUrl}/auth/logout`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken }),
        });
      }
    } catch (error) {
      // Ignore logout errors
    } finally {
      this.setToken(null);
      this.setRefreshToken(null);
      localStorage.removeItem('rg_is_logged_in');
      localStorage.removeItem('rg_user_profile');
      localStorage.removeItem('rg_submitted_posts');
      localStorage.removeItem('rg_events_list');
      localStorage.removeItem('rg_prayers_list');
    }
  }

  async getEvents() {
    const data = await this.request('/events');
    return data.events;
  }

  async getEvent(id: string) {
    const data = await this.request(`/events/${id}`);
    return data.event;
  }

  async registerForEvent(eventId: string, registrationData: any = {}) {
    return this.request(`/events/${eventId}/register`, {
      method: 'POST',
      body: JSON.stringify({ registrationData }),
    });
  }

  async unregisterFromEvent(eventId: string) {
    return this.request(`/events/${eventId}/unregister`, { method: 'POST' });
  }

  async checkInToEvent(eventId: string) {
    return this.request(`/events/${eventId}/checkin`, { method: 'POST' });
  }

  async getMyEvents() {
    const data = await this.request('/events/user/mine');
    return data.registrations;
  }

  async getPosts() {
    const data = await this.request('/posts');
    return data.posts;
  }

  async getMyPosts() {
    const data = await this.request('/posts/mine');
    return data.posts;
  }

  async createPost({ title, body, type }: { title: string; body: string; type: string }) {
    return this.request('/posts', {
      method: 'POST',
      body: JSON.stringify({ title, body, type }),
    });
  }

  async deletePost(id: string) {
    return this.request(`/posts/${id}`, { method: 'DELETE' });
  }

  async toggleReaction(postId: string, reactionType: string) {
    return this.request(`/posts/${postId}/react`, {
      method: 'POST',
      body: JSON.stringify({ reactionType }),
    });
  }

  async getPostReactions(postId: string) {
    return this.request(`/posts/${postId}/reactions`);
  }

  async getPrayers(stage: string | null = null) {
    const query = stage ? `?stage=${stage}` : '';
    const data = await this.request(`/prayers${query}`);
    return data.prayers;
  }

  async getMyPrayers() {
    const data = await this.request('/prayers/mine');
    return data.prayers;
  }

  async createPrayer({ content, category, isAnonymous }: { content: string; category: string; isAnonymous: boolean }) {
    return this.request('/prayers', {
      method: 'POST',
      body: JSON.stringify({ content, category, isAnonymous }),
    });
  }

  async prayForRequest(prayerId: string) {
    return this.request(`/prayers/${prayerId}/pray`, { method: 'POST' });
  }

  async markPrayerAnswered(prayerId: string) {
    return this.request(`/prayers/${prayerId}/answered`, { method: 'POST' });
  }

  async deletePrayer(id: string) {
    return this.request(`/prayers/${id}`, { method: 'DELETE' });
  }

  async getAnnouncements() {
    const data = await this.request('/announcements');
    return data.announcements;
  }

  async getAnnouncement(id: string) {
    const data = await this.request(`/announcements/${id}`);
    return data.announcement;
  }

  isAuthenticated() {
    return !!this.token;
  }

  getStoredProfile() {
    const saved = localStorage.getItem('rg_user_profile');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return null;
      }
    }
    return null;
  }

  setStoredProfile(profile: any) {
    localStorage.setItem('rg_user_profile', JSON.stringify(profile));
  }

  connectSSE() {
    const streamUrl = `${this.baseUrl.replace('/v1', '')}/v1/stream?token=${this.token}`;
    const eventSource = new EventSource(streamUrl);

    eventSource.addEventListener('connected', (e: MessageEvent) => {
      console.log('SSE connected:', JSON.parse(e.data));
    });

    eventSource.onerror = () => {
      console.warn('SSE connection lost, will auto-reconnect');
    };

    return {
      eventSource,
      on(eventType: string, callback: (data: any) => void) {
        eventSource.addEventListener(eventType, (e: MessageEvent) => callback(JSON.parse(e.data)));
      },
      close() {
        eventSource.close();
      },
    };
  }
}

const api = new ApiClient();

// ============ DEFAULT AVATARS ============

const DEFAULT_AVATARS = [
  { name: 'Explorer Aaron', url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuANk-XFd6Gvyzx3kDej5Vtr4qf7gdca2Ll7BpF8VLWScwITBIt3mSVHjs-z4xPHJL6EwAJ2ckm3Q-55XC8gWGPEx57m6KQpWck8meaFuCAtrFlzw_qTelRK0rj-HAWERrVlfR_OykTH8PPRnRb9-6eSW9iFkMAteloRfIV96cHcUv2pmg-UW3x20ZEgD8HEUqXFmiwC35zv5CjfyhHhaEjlo9TXvY11W1V9E50-BD6lM-byECVW1G-AP8iz5AFl2uJ4oqUCe45EEp3d' },
  { name: 'Leader Chloe', url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80' },
  { name: 'Tech Nathan', url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80' },
  { name: 'Speaker Sarah', url: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&auto=format&fit=crop&q=80' },
  { name: 'Creative Grace', url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80' },
  { name: 'Musician David', url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80' },
];

// ============ MAIN APP COMPONENT ============

export default function App() {
  const { theme, setTheme } = useTheme();
  const [showSplash, setShowSplash] = useState(true);
  const [splashFade, setSplashFade] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('home');
  const [eventsSubTab, setEventsSubTab] = useState('events');
  const [isLoggedIn, setIsLoggedIn] = useState(api.isAuthenticated());
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const { toast, showToast } = useToast();

  // Login form
  const [loginEmail, setLoginEmail] = useState('aaron@risktakergeneration.com');
  const [loginPassword, setLoginPassword] = useState('password123');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  // Register form
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regEmergencyContact, setRegEmergencyContact] = useState('');
  const [regAvatar, setRegAvatar] = useState(DEFAULT_AVATARS[0].url);
  const [regError, setRegError] = useState<string | null>(null);

  // Session expired handler
  useEffect(() => {
    api.onSessionExpired(() => {
      setProfile(null);
      setMyPosts([]);
      setEvents([]);
      setPrayers([]);
      setAnnouncements([]);
      setIsLoggedIn(false);
    });
    return () => { api.onSessionExpired(null as any); };
  }, []);

  // Notifications panel
  const [showNotifications, setShowNotifications] = useState(false);

  // Modals
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showContributions, setShowContributions] = useState(false);

  // Event registration
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [eventFormFields, setEventFormFields] = useState<Record<string, any>>({});

  // Profile
  const [profile, setProfile] = useState<any>(null);

  // Splash effect
  useEffect(() => {
    const fadeTimer = setTimeout(() => { setSplashFade(true); }, 2000);
    const hideTimer = setTimeout(() => { setShowSplash(false); }, 2500);
    return () => { clearTimeout(fadeTimer); clearTimeout(hideTimer); };
  }, []);

  // Notifications toggle
  const [showNotifPanel, setShowNotifPanel] = useState(false);

  // Data
  const [myPosts, setMyPosts] = useState<any[]>([]);
  const [approvedPosts, setApprovedPosts] = useState<any[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [events, setEvents] = useState<any[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [prayers, setPrayers] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);

  // Prayer form
  const [prayerText, setPrayerText] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [loadingPrayers, setLoadingPrayers] = useState(false);

  // Create post form
  const [postType, setPostType] = useState('devotional');
  const [postTitle, setPostTitle] = useState('');
  const [postBody, setPostBody] = useState('');
  const [isSubmittingPost, setIsSubmittingPost] = useState(false);
  const [postSubmitted, setPostSubmitted] = useState(false);

  // ============ DATA LOADING ============

  const loadProfile = useCallback(async () => {
    try {
      const res = (await api.getMe()) as any;
      const user = res.user;
      const p = {
        name: user.name,
        avatar: user.avatar || DEFAULT_AVATARS[0].url,
        id: user.id.substring(0, 8).toUpperCase(),
        level: user.level || 1,
        streak: user.streak || 0,
        points: user.points || 100,
        checkIns: user.checkIns || 0,
        checkInsTarget: user.checkInsTarget || 15,
        prayersShared: user.prayersShared || 0,
        postsCount: user.postsCount || 0,
        bio: user.bio,
      };
      setProfile(p);
      api.setStoredProfile(p);
    } catch (err) {
      console.error('Failed to load profile:', err);
    }
  }, []);

  const loadEvents = useCallback(async () => {
    setLoadingEvents(true);
    try {
      const raw = (await api.getEvents()) as any[];
      const mapped = raw.map((e: any) => ({
        id: e.id,
        title: e.title,
        date: e.date,
        time: e.time,
        location: e.location,
        image: e.image,
        description: e.description,
        pointsReward: e.points_reward,
        price: e.price,
        registered: e.registered,
        registrationFields: Array.isArray(e.registration_fields) ? e.registration_fields : [],
      }));
      setEvents(mapped);
    } catch (err) {
      console.error('Failed to load events:', err);
    } finally {
      setLoadingEvents(false);
    }
  }, []);

  const loadMyPosts = useCallback(async () => {
    setLoadingPosts(true);
    try {
      const raw = (await api.getMyPosts()) as any[];
      const mapped = raw.map((p: any) => ({
        id: p.id,
        title: p.title,
        body: p.body,
        type: p.type,
        timestamp: new Date(p.created_at).toLocaleDateString(),
        status: p.status === 'approved' ? 'Approved' : 'Pending Review',
      }));
      setMyPosts(mapped);
    } catch (err) {
      console.error('Failed to load posts:', err);
    } finally {
      setLoadingPosts(false);
    }
  }, []);

  const loadApprovedPosts = useCallback(async (silent = false) => {
    if (!silent) setLoadingPosts(true);
    try {
      const posts = await api.getPosts();
      setApprovedPosts(posts);
    } catch (err) {
      console.error('Failed to load approved posts:', err);
    } finally {
      if (!silent) setLoadingPosts(false);
    }
  }, []);

  const loadPrayers = useCallback(async () => {
    setLoadingPrayers(true);
    try {
      const raw = (await api.getPrayers()) as any[];
      const mapped = raw.map((p: any) => ({
        id: p.id,
        author: p.display_name,
        avatar: p.display_avatar,
        content: p.content,
        prayersCount: p.prayedCount,
        hasPrayed: p.hasPrayed,
        timeAgo: new Date(p.created_at).toLocaleDateString(),
        owner: p.author_name,
        isAnswered: p.is_answered,
      }));
      setPrayers(mapped);
    } catch (err) {
      console.error('Failed to load prayers:', err);
    } finally {
      setLoadingPrayers(false);
    }
  }, []);

  const loadAnnouncements = useCallback(async () => {
    try {
      const raw = (await api.getAnnouncements()) as any[];
      const mapped = raw.map((a: any) => ({
        ...a,
        coverImage: a.cover_image
          ? a.cover_image.startsWith('/uploads/')
            ? BACKEND_ORIGIN + a.cover_image
            : a.cover_image
          : null,
      }));
      setAnnouncements(mapped);
    } catch (err) {
      console.error('Failed to load announcements:', err);
    }
  }, []);

  // ============ EFFECTS ============

  useEffect(() => {
    if (isLoggedIn) {
      loadProfile();
      loadEvents();
      loadMyPosts();
      loadApprovedPosts();
      loadPrayers();
      loadAnnouncements();
    }
  }, [isLoggedIn, loadProfile, loadEvents, loadMyPosts, loadApprovedPosts, loadPrayers, loadAnnouncements]);

  // SSE
  useEffect(() => {
    if (!isLoggedIn) return;
    const sse = api.connectSSE();
    sse.on('post:approved', () => { loadMyPosts(); loadApprovedPosts(); });
    sse.on('post:rejected', () => loadMyPosts());
    sse.on('post:reacted', () => loadApprovedPosts(true));
    sse.on('post:deleted', () => { loadMyPosts(); loadApprovedPosts(); });
    sse.on('prayer:created', () => loadPrayers());
    sse.on('prayer:prayed', () => loadPrayers());
    sse.on('prayer:stage-changed', () => loadPrayers());
    sse.on('prayer:answered', () => loadPrayers());
    sse.on('announcement:created', () => loadAnnouncements());
    sse.on('announcement:published', () => loadAnnouncements());
    sse.on('event:created', () => loadEvents());
    sse.on('event:updated', () => loadEvents());
    sse.on('event:registered', () => loadEvents());
    return () => sse.close();
  }, [isLoggedIn]);

  // ============ HANDLERS ============

  const handleOpenCreatePost = (type?: string) => {
    if (type === 'devotional' || type === 'testimony') {
      setPostType(type);
      setShowCreatePost(true);
    } else if (type === 'prayer') {
      setActiveTab('prayers');
    }
  };

  const handleSubmitPost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!postTitle.trim() || !postBody.trim()) {
      showToast('Please fill in both a title and message body!');
      return;
    }
    setIsSubmittingPost(true);
    try {
      await api.createPost({ title: postTitle, body: postBody, type: postType });
      await loadMyPosts();
      await loadApprovedPosts();
      await loadProfile();
      setPostSubmitted(true);
      showToast('Post submitted for review! Earned +25 points!');
      setTimeout(() => {
        setPostSubmitted(false);
        setPostTitle('');
        setPostBody('');
        setShowCreatePost(false);
      }, 2000);
    } catch (err: any) {
      showToast(err.message || 'Failed to submit post');
    } finally {
      setIsSubmittingPost(false);
    }
  };

  const handleReaction = async (postId: string, reactionType: string) => {
    try {
      const result = await api.toggleReaction(postId, reactionType);
      setApprovedPosts((prev) =>
        prev.map((post) => {
          if (post.id !== postId) return post;
          const hadReaction = post.userReactions?.includes(reactionType);
          const newReactions = { ...post.reactions };
          if (result.action === 'added') {
            newReactions[reactionType] = (newReactions[reactionType] || 0) + 1;
            newReactions.total = (newReactions.total || 0) + 1;
          } else {
            newReactions[reactionType] = Math.max(0, (newReactions[reactionType] || 0) - 1);
            newReactions.total = Math.max(0, (newReactions.total || 0) - 1);
          }
          const updatedUserReactions = hadReaction
            ? (post.userReactions || []).filter((r: string) => r !== reactionType)
            : [...(post.userReactions || []), reactionType];
          return { ...post, reactions: newReactions, userReactions: updatedUserReactions };
        })
      );
    } catch (err: any) {
      showToast(err.message || 'Failed to update reaction');
    }
  };

  const handleSharePost = async (post: any) => {
    const text = `🔥 "${post.title}"\n\n${post.body}\n\n🙏 Shared from Risktaker Generation Youth Portal`;
    try {
      await navigator.clipboard.writeText(text);
      showToast('Post copied to clipboard!');
    } catch {
      showToast('Failed to copy to clipboard');
    }
  };

  const handleSubmitPrayer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prayerText.trim()) {
      showToast('Please describe your prayer request.');
      return;
    }
    try {
      await api.createPrayer({ content: prayerText, category: 'general', isAnonymous });
      await loadPrayers();
      await loadProfile();
      setPrayerText('');
      setIsAnonymous(false);
      showToast('Prayer request submitted! Earned +15 points!');
    } catch (err: any) {
      showToast(err.message || 'Failed to submit prayer');
    }
  };

  const handleMarkPrayerAnswered = async (prayerId: string) => {
    try {
      await api.markPrayerAnswered(prayerId);
      await loadPrayers();
      await loadProfile();
      showToast('Praise God! We rejoice with you! +20 points!');
    } catch (err: any) {
      showToast(err.message || 'Failed to update prayer');
    }
  };

  const handleRegisterForEvent = async (eventId: string, event: any) => {
    try {
      await api.registerForEvent(eventId, eventFormFields);
      setEvents((prev) => prev.map((e) => (e.id === eventId ? { ...e, registered: true } : e)));
      await loadProfile();
      showToast(`Registered for ${event.title}! Earned +${event.pointsReward} points!`);
    } catch (err: any) {
      showToast(err.message || 'Failed to register for event');
    }
    setEventFormFields({});
    setSelectedEvent(null);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setIsAuthLoading(true);
    const email = loginEmail.trim();
    if (!email) {
      setLoginError('Please enter your email address.');
      setIsAuthLoading(false);
      return;
    }
    if (loginPassword.length < 6) {
      setLoginError('Password must be at least 6 characters.');
      setIsAuthLoading(false);
      return;
    }
    try {
      await api.login(email, loginPassword);
      setIsLoggedIn(true);
      showToast('Welcome back! Connecting to Risktaker Generation services...');
    } catch (err: any) {
      setLoginError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError(null);
    setIsAuthLoading(true);
    const name = regName.trim();
    const email = regEmail.trim();
    const emergencyContact = regEmergencyContact.trim();
    if (!name) {
      setRegError('Please enter your full name.');
      setIsAuthLoading(false);
      return;
    }
    if (!email || !email.includes('@')) {
      setRegError('Please enter a valid email address.');
      setIsAuthLoading(false);
      return;
    }
    if (regPassword.length < 6) {
      setRegError('Password must be at least 6 characters.');
      setIsAuthLoading(false);
      return;
    }
    if (!emergencyContact) {
      setRegError('Emergency contact number is required.');
      setIsAuthLoading(false);
      return;
    }
    try {
      await api.register({ name, email, password: regPassword, emergencyContact, avatar: regAvatar });
      setIsLoggedIn(true);
      showToast('Welcome to Risktaker Generation! Earned +100 XP starting bonus!');
    } catch (err: any) {
      setRegError(err.message || 'Registration failed. Please try again.');
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handleLogout = async () => {
    await api.logout();
    setProfile(null);
    setMyPosts([]);
    setEvents([]);
    setPrayers([]);
    setAnnouncements([]);
    setIsLoggedIn(false);
    showToast('Logged out of Risktaker Generation successfully.');
  };

  // ============ RENDER ============

  // SPLASH SCREEN
  if (showSplash) {
    return (
      <div className={`min-h-screen bg-surface-container-low text-on-surface flex flex-col justify-center items-center px-6 py-12 font-hanken transition-all duration-500 ${splashFade ? 'fade-exit-active' : ''}`}>
        <div className="flex flex-col items-center justify-center space-y-6">
          <div className="w-24 h-24 rounded-2xl bg-primary/10 border border-primary/30 flex items-center justify-center animate-risk-pulse relative rg-glow-strong">
            <img src="/favicon.svg" className="text-primary w-14 h-14 fill-primary" />
          </div>
          <div className="text-center space-y-2">
            <h1 className="font-extrabold text-5xl tracking-widest text-primary font-hanken animate-pulse">Risktaker Generation</h1>
            <p className="text-xs uppercase tracking-widest text-on-surface-variant/70 font-mono">Igniting Youth Connection</p>
          </div>
          <div className="w-48 h-1 bg-surface-container-highest rounded-full overflow-hidden relative mt-8">
            <div className="absolute top-0 left-0 h-full bg-gradient-to-r from-primary to-primary rounded-full animate-progress-loading" />
          </div>
        </div>
      </div>
    );
  }

  // LOADING PROFILE
  if (isLoggedIn && !profile) {
    return (
      <div className="min-h-screen bg-surface-dim text-on-surface flex flex-col justify-center items-center font-hanken">
        <Loader2 className="w-8 h-8 text-primary animate-spin mb-4" />
        <p className="text-sm text-on-surface-variant">Loading your profile...</p>
      </div>
    );
  }

  // MAIN APP
  if (isLoggedIn && profile) {
    return (
      <div className="min-h-screen bg-surface-dim text-on-surface flex flex-col font-hanken relative overflow-x-hidden pb-28 pt-16">
        {/* Toast Notification */}
        {toast && (
          <div id="toast-notif" className="fixed top-20 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-sm bg-surface-container-high border border-primary/50 rounded-xl p-4 shadow-2xl shadow-primary/10 animate-bounce flex items-start gap-3">
            <div className="p-1 rounded-full bg-primary/10 text-primary">
              <Sparkles className="w-5 h-5 animate-spin" />
            </div>
            <div className="flex-1">
              <p className="text-xs font-mono text-primary uppercase tracking-widest mb-0.5">Risktaker Generation Portal Update</p>
              <p className="text-sm text-on-surface font-medium leading-tight">{toast}</p>
            </div>
          </div>
        )}

        {/* Header */}
        <header className="fixed top-0 left-0 w-full z-40 bg-surface-dim border-b border-surface-container-highest/40 flex justify-between items-center px-5 h-16">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => setActiveTab('home')}>
            <img src="/favicon.svg" className="text-primary w-7 h-7 fill-primary" />
            <h1 className="font-extrabold text-xl tracking-tight text-primary font-hanken">Risktaker Generation</h1>
          </div>
          <div className="flex items-center gap-4">
            <button id="btn-notif-bell" onClick={() => setShowNotifications(!showNotifications)} className="hover:opacity-80 transition-opacity active:scale-95 text-on-surface-variant relative p-1.5 rounded-lg bg-surface-container-low border border-surface-container-highest/30">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-primary border border-surface-dim animate-pulse" />
            </button>
            <div onClick={() => setActiveTab('profile')} className="w-9 h-9 rounded-full border border-primary/50 bg-surface-container-highest cursor-pointer hover:ring-2 hover:ring-primary transition-all p-0.5">
              <img className="w-full h-full rounded-full object-cover" src={profile.avatar} alt={profile.name} />
            </div>
          </div>
        </header>

        {/* Notifications Panel */}
        {showNotifications && (
          <div className="fixed inset-0 z-50 bg-surface-container-low/80 backdrop-blur-sm flex justify-end">
            <div className="w-full max-w-sm bg-surface-container-high h-full border-l border-surface-container-highest p-6 flex flex-col">
              <div className="flex justify-between items-center pb-4 border-b border-surface-container-highest">
                <div className="flex items-center gap-2">
                  <Bell className="text-primary w-5 h-5" />
                  <h3 className="font-bold text-lg">Announcements</h3>
                </div>
                <button onClick={() => setShowNotifications(false)} className="p-1.5 rounded-full hover:bg-surface-container-highest text-on-surface-variant transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto py-4 space-y-4">
                <div className="p-4 bg-surface-container-highest/30 border-l-4 border-primary rounded-r-lg">
                  <span className="text-[10px] font-mono text-primary bg-primary/10 py-0.5 px-2 rounded-full mb-2 inline-block">LATEST</span>
                  <h4 className="font-semibold text-sm text-on-surface mb-1">Youth Fellowship Night This Friday!</h4>
                  <p className="text-xs text-on-surface-variant leading-relaxed">Join us at 6:00 PM for group games and worship in the Main Sanctuary.</p>
                </div>
                <div className="p-4 bg-surface-container-low border-l-4 border-tertiary rounded-r-lg">
                  <span className="text-[10px] font-mono text-on-surface-variant bg-tertiary/10 py-0.5 px-2 rounded-full mb-2 inline-block">POINTS ALERT</span>
                  <h4 className="font-semibold text-sm text-on-surface mb-1">Check-in Milestone Approaching!</h4>
                  <p className="text-xs text-on-surface-variant leading-relaxed">You are only 3 check-ins away from hitting Level 13! Complete this cycle to unlock the Explorer Badge.</p>
                </div>
                <div className="p-4 bg-surface-container-low border-l-4 border-error rounded-r-lg">
                  <span className="text-[10px] font-mono text-error bg-error/10 py-0.5 px-2 rounded-full mb-2 inline-block">SYSTEM</span>
                  <h4 className="font-semibold text-sm text-on-surface mb-1">Risktaker Generation Portal V2.4.0 Live</h4>
                  <p className="text-xs text-on-surface-variant leading-relaxed">New interactive prayer wall and Devotional sharing modules now active. Earn points for contributing!</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Main Content */}
        <main className="flex-grow px-5 py-4 max-w-lg mx-auto w-full">

          {/* ======================== HOME TAB ======================== */}
          {activeTab === 'home' && (
            <div className="space-y-8 animate-fade-in">
              <section className="space-y-2 mt-2">
                <p className="text-on-surface-variant font-mono text-xs uppercase tracking-widest">Welcome Back</p>
                <h2 className="text-3xl font-extrabold text-on-surface leading-tight">Hello, {profile.name}!</h2>
                <div className="h-1.5 w-14 bg-primary rounded-full" />
              </section>

              {/* Quick Actions */}
              <section className="-mx-5 overflow-hidden">
                <div className="flex overflow-x-auto gap-4 px-5 pb-2 hide-scrollbar">
                  <button onClick={() => handleOpenCreatePost('devotional')} className="flex-shrink-0 w-40 p-4 bg-surface-container-high border border-surface-container-highest/40 rounded-xl text-left hover:border-primary/40 transition-all duration-300 group hover:translate-y-[-2px]">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-4 text-primary group-hover:bg-primary/20 transition-all">
                      <BookOpen className="w-5 h-5" />
                    </div>
                    <p className="font-semibold text-sm text-on-surface leading-tight mb-1">Share Devotion</p>
                    <p className="text-[10px] font-mono text-on-surface-variant/60 uppercase tracking-wider">Submit Insight</p>
                  </button>
                  <button onClick={() => handleOpenCreatePost('testimony')} className="flex-shrink-0 w-40 p-4 bg-surface-container-high border border-surface-container-highest/40 rounded-xl text-left hover:border-tertiary/40 transition-all duration-300 group hover:translate-y-[-2px]">
                    <div className="w-10 h-10 rounded-xl bg-tertiary/10 flex items-center justify-center mb-4 text-tertiary group-hover:bg-tertiary/20 transition-all">
                      <MessageSquare className="w-5 h-5" />
                    </div>
                    <p className="font-semibold text-sm text-on-surface leading-tight mb-1">Share Testimony</p>
                    <p className="text-[10px] font-mono text-on-surface-variant/60 uppercase tracking-wider">Inspire Community</p>
                  </button>
                  <button onClick={() => handleOpenCreatePost('prayer')} className="flex-shrink-0 w-40 p-4 bg-surface-container-high border border-surface-container-highest/40 rounded-xl text-left hover:border-error/40 transition-all duration-300 group hover:translate-y-[-2px]">
                    <div className="w-10 h-10 rounded-xl bg-error/10 flex items-center justify-center mb-4 text-error group-hover:bg-error/20 transition-all">
                      <Heart className="w-5 h-5" />
                    </div>
                    <p className="font-semibold text-sm text-on-surface leading-tight mb-1">Request Prayer</p>
                    <p className="text-[10px] font-mono text-on-surface-variant/60 uppercase tracking-wider">Confidential</p>
                  </button>
                </div>
              </section>

              {/* Latest Announcement */}
              {announcements.length > 0 && (
                <section className="space-y-3">
                  <div className="flex justify-between items-end">
                    <h3 className="font-bold text-lg text-on-surface">Latest Announcement</h3>
                    <button onClick={() => { setEventsSubTab('announcements'); setActiveTab('events'); }} className="font-mono text-xs text-primary hover:underline">View All</button>
                  </div>
                  <div onClick={() => { setEventsSubTab('announcements'); setActiveTab('events'); }} className="bg-surface-container rounded-2xl overflow-hidden shadow-lg border border-outline-variant/20 cursor-pointer hover:border-primary/40 transition-all duration-300 group">
                    {announcements[0].coverImage ? (
                      <div className="h-44 w-full overflow-hidden relative">
                        <img className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" src={announcements[0].coverImage} alt={announcements[0].title} referrerPolicy="no-referrer" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                      </div>
                    ) : (
                      <div className="h-28 w-full bg-gradient-to-r from-primary/20 to-tertiary/20 flex items-center justify-center">
                        <Image className="w-10 h-10 text-primary/30" />
                      </div>
                    )}
                    <div className="p-4 relative">
                      {announcements[0].priority === 'High' && (
                        <div className="absolute -top-3 right-4 font-mono text-[9px] px-2.5 py-1 rounded-full shadow-lg font-bold uppercase bg-primary text-background">HIGH PRIORITY</div>
                      )}
                      <h4 className="font-sans text-sm font-bold text-on-surface leading-snug mb-2 group-hover:text-primary transition-colors">{announcements[0].title}</h4>
                      <div className="flex items-center gap-2 mb-2.5">
                        {announcements[0].authorAvatar ? (
                          <img className="w-5 h-5 rounded-full border border-primary/20" src={announcements[0].authorAvatar} alt={announcements[0].authorName} referrerPolicy="no-referrer" />
                        ) : (
                          <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center">
                            <span className="text-[8px] font-bold text-primary">{announcements[0].authorName?.charAt(0) || 'A'}</span>
                          </div>
                        )}
                        <span className="text-[11px] text-on-surface-variant font-medium">{announcements[0].authorName} · Just now</span>
                      </div>
                      <p className="text-xs text-on-surface-variant leading-relaxed font-sans line-clamp-3">{announcements[0].content}</p>
                      <button type="button" className="w-full mt-3 bg-surface-container-highest text-on-surface font-sans font-bold py-2 rounded-xl text-[11px] flex items-center justify-center gap-1 group-hover:bg-primary group-hover:text-background transition-all">
                        Read More <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </section>
              )}

              {/* Upcoming Events */}
              <section className="space-y-4">
                <div className="flex justify-between items-end">
                  <h3 className="font-bold text-lg text-on-surface">Upcoming Events</h3>
                  <button onClick={() => setActiveTab('events')} className="font-mono text-xs text-primary hover:underline">View All</button>
                </div>
                {events.slice(0, 1).map((evt) => (
                  <div key={evt.id} className="group relative overflow-hidden bg-surface-container-high border border-surface-container-highest/40 rounded-2xl">
                    <div className="h-48 w-full overflow-hidden relative">
                      <img className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" src={evt.image} alt={evt.title} />
                      <div className="absolute inset-0 bg-gradient-to-t from-surface-container-high to-transparent" />
                    </div>
                    <div className="p-5 space-y-4 relative -mt-4 bg-surface-container-high rounded-t-xl">
                      <div className="flex justify-between items-start gap-2">
                        <h4 className="font-extrabold text-lg text-on-surface group-hover:text-primary transition-colors">{evt.title}</h4>
                        <span className="shrink-0 font-mono text-xs bg-secondary/30 text-tertiary px-2.5 py-1 rounded border border-surface-container-highest">{evt.date}</span>
                      </div>
                      <p className="text-on-surface-variant text-sm leading-relaxed">{evt.description}</p>
                      <div className="pt-2">
                        {evt.registered ? (
                          <div className="w-full py-3 bg-secondary/30 border border-surface-container-highest rounded-xl flex items-center justify-center gap-2 text-tertiary font-bold text-sm">
                            <CheckCircle2 className="w-4 h-4 text-green-500" />
                            <span>Registered & Going!</span>
                          </div>
                        ) : (
                          <button onClick={() => setSelectedEvent(evt)} className="w-full py-3 bg-primary hover:bg-primary/90 text-on-primary font-bold text-sm rounded-xl hover:opacity-90 active:scale-[0.98] transition-all">
                            Register Now (+{evt.pointsReward} Points)
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </section>

              {/* My Stats */}
              <section className="space-y-4">
                <h3 className="font-bold text-lg text-on-surface">My Stats</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div onClick={() => setActiveTab('check-in')} className="p-5 bg-surface-container-high border border-surface-container-highest/40 rounded-xl flex flex-col justify-between cursor-pointer hover:border-primary/20 transition-colors">
                    <p className="font-mono text-xs text-on-surface-variant mb-2 uppercase tracking-wider">Check-ins</p>
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-extrabold text-on-surface">{profile.checkIns}</span>
                      <span className="text-xs text-primary font-mono">/ {profile.checkInsTarget}</span>
                    </div>
                    <div className="w-full bg-surface-container-low h-1.5 rounded-full mt-3 overflow-hidden">
                      <div className="bg-primary h-full rounded-full transition-all duration-500" style={{ width: `${(profile.checkIns / profile.checkInsTarget) * 100}%` }} />
                    </div>
                  </div>
                  <div onClick={() => setActiveTab('profile')} className="p-5 bg-surface-container-high border border-surface-container-highest/40 rounded-xl flex flex-col justify-between cursor-pointer hover:border-primary/20 transition-colors">
                    <p className="font-mono text-xs text-on-surface-variant mb-2 uppercase tracking-wider">Points Balance</p>
                    <div className="flex items-center gap-1.5">
                      <span className="text-3xl font-extrabold text-on-surface">{profile.points}</span>
                      <Sparkles className="text-primary w-5 h-5 fill-primary animate-pulse" />
                    </div>
                    <p className="text-[10px] font-mono text-on-surface-variant/50 mt-3 uppercase tracking-wider">Level {profile.level} Member</p>
                  </div>
                </div>
              </section>
            </div>
          )}

          {/* ======================== EVENTS TAB ======================== */}
          {activeTab === 'events' && (
            <div className="space-y-6 animate-fade-in">
              <div className="bg-surface-container-high rounded-xl p-1 flex gap-1">
                <button onClick={() => setEventsSubTab('events')} className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all duration-200 ${eventsSubTab === 'events' ? 'bg-primary text-on-primary shadow-md' : 'text-on-surface-variant hover:text-on-surface'}`}>Events</button>
                <button onClick={() => setEventsSubTab('announcements')} className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all duration-200 ${eventsSubTab === 'announcements' ? 'bg-primary text-on-primary shadow-md' : 'text-on-surface-variant hover:text-on-surface'}`}>Announcements</button>
              </div>

              {eventsSubTab === 'events' && (
                <div className="space-y-1">
                  <h2 className="text-2xl font-extrabold text-on-surface">Risktaker Generation Youth Events</h2>
                  <p className="text-on-surface-variant text-sm">Stay connected and join our upcoming weekend fellowships, camps, and summits.</p>
                </div>
              )}

              {eventsSubTab === 'events' && (
                <div className="space-y-6">
                  {events.map((evt) => (
                    <div key={evt.id} className="bg-surface-container-high border border-surface-container-highest/40 rounded-2xl overflow-hidden hover:border-primary/20 transition-colors">
                      <div className="h-40 w-full relative overflow-hidden">
                        <img className="w-full h-full object-cover" src={evt.image} alt={evt.title} />
                        <div className="absolute inset-0 bg-gradient-to-t from-surface-container-high to-transparent" />
                      </div>
                      <div className="p-5 space-y-3 relative -mt-4 bg-surface-container-high rounded-t-xl">
                        <div className="flex justify-between items-start gap-2">
                          <h3 className="font-extrabold text-lg text-on-surface">{evt.title}</h3>
                          <span className="shrink-0 font-mono text-[10px] bg-secondary/30 text-tertiary px-2 py-0.5 rounded border border-surface-container-highest">{evt.date}</span>
                        </div>
                        <p className="text-xs text-on-surface-variant leading-relaxed">{evt.description}</p>
                        <div className="flex flex-wrap gap-y-2 gap-x-4 text-xs font-mono text-on-surface-variant/80 pt-1">
                          <div className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-primary" />
                            <span>{evt.time}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-primary" />
                            <span>{evt.location}</span>
                          </div>
                        </div>
                        <div className="flex justify-between items-center gap-4 pt-3 border-t border-surface-container-highest/30">
                          <div>
                            <p className="text-[10px] text-on-surface-variant/50 uppercase tracking-widest font-mono">Admission</p>
                            <p className="text-xs font-bold text-on-surface">{evt.price}</p>
                          </div>
                          {evt.registered ? (
                            <div className="px-4 py-2 bg-green-500/10 border border-green-500/30 text-green-400 font-bold text-xs rounded-lg flex items-center gap-1.5">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Going</span>
                            </div>
                          ) : (
                            <button onClick={() => setSelectedEvent(evt)} className="px-4 py-2 bg-primary hover:bg-primary/90 text-on-primary font-bold text-xs rounded-lg transition-all">RSVP Now</button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {eventsSubTab === 'announcements' && (
                <div className="space-y-1">
                  <h2 className="text-2xl font-extrabold text-on-surface">Announcements</h2>
                  <p className="text-on-surface-variant text-sm">Stay updated with the latest news and updates from the youth ministry.</p>
                </div>
              )}

              {eventsSubTab === 'announcements' && (
                <div className="space-y-5">
                  {announcements.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-4">
                      <div className="w-16 h-16 rounded-full bg-surface-container-high flex items-center justify-center">
                        <Bell className="w-8 h-8 text-on-surface-variant/40" />
                      </div>
                      <div className="text-center space-y-1">
                        <p className="text-on-surface font-bold">No announcements yet</p>
                        <p className="text-on-surface-variant text-sm">Check back later for updates from the youth ministry.</p>
                      </div>
                    </div>
                  ) : (
                    announcements.map((ann) => (
                      <div key={ann.id} className="bg-surface-container-high/70 backdrop-blur-md rounded-2xl border border-surface-container-highest/40 overflow-hidden rg-glow">
                        {ann.coverImage ? (
                          <div className="h-44 w-full overflow-hidden relative">
                            <img className="w-full h-full object-cover" src={ann.coverImage} alt={ann.title} referrerPolicy="no-referrer" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                          </div>
                        ) : (
                          <div className="h-28 w-full bg-gradient-to-r from-primary/20 to-tertiary/20 flex items-center justify-center">
                            <Bell className="w-10 h-10 text-primary/30" />
                          </div>
                        )}
                        <div className="p-4 relative">
                          {ann.priority === 'High' && (
                            <div className="absolute -top-3 right-4 font-mono text-[9px] px-2.5 py-1 rounded-full shadow-lg font-bold uppercase bg-primary text-background">HIGH PRIORITY</div>
                          )}
                          <h4 className="font-sans text-sm font-bold text-on-surface leading-snug mb-2">{ann.title}</h4>
                          <div className="flex items-center gap-2 mb-2.5">
                            {ann.authorAvatar ? (
                              <img className="w-5 h-5 rounded-full border border-primary/20" src={ann.authorAvatar} alt={ann.authorName} referrerPolicy="no-referrer" />
                            ) : (
                              <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center">
                                <span className="text-[8px] font-bold text-primary">{ann.authorName?.charAt(0) || 'A'}</span>
                              </div>
                            )}
                            <span className="text-[11px] text-on-surface-variant font-medium">{ann.authorName}</span>
                            {ann.createdAt && (
                              <span className="text-[11px] text-on-surface-variant/50">· {new Date(ann.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                            )}
                          </div>
                          <p className="text-xs text-on-surface-variant leading-relaxed font-sans">{ann.content}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          )}

          {/* ======================== CHECK-IN TAB ======================== */}
          {activeTab === 'check-in' && (
            <div className="space-y-6 flex flex-col items-center justify-center animate-fade-in min-h-[70dvh] relative">
              <div className="w-full bg-surface-container-high border border-surface-container-highest/40 rounded-2xl p-6 flex flex-col items-center relative z-10 rg-glow text-center space-y-6">
                {/* Avatar */}
                <div className="relative">
                  <div className="w-24 h-24 rounded-full border-4 border-primary p-1 bg-surface-dim overflow-hidden">
                    <img className="w-full h-full object-cover rounded-full" src={profile.avatar} alt={profile.name} />
                  </div>
                  <div className="absolute -bottom-1 -right-1 bg-on-primary-container text-on-primary px-2.5 py-0.5 rounded-full font-mono text-[10px] font-bold border-2 border-surface-container-high">ACTIVE</div>
                </div>

                {/* Name & ID */}
                <div>
                  <h2 className="text-2xl font-extrabold text-on-surface">{profile.name}</h2>
                  <p className="text-xs font-mono text-on-surface-variant uppercase tracking-widest mt-1">ID: {profile.id}</p>
                </div>

                {/* QR Code */}
                <div className="relative">
                  <div className="p-4 bg-white rounded-2xl border-4 border-transparent transition-all">
                    <QRCodeSVG value={profile.id} size={160} bgColor="#ffffff" fgColor="#1a1a1a" level="M" />
                  </div>
                </div>

                {/* Instructions */}
                <div className="max-w-[280px]">
                  <p className="text-sm text-on-surface-variant">Present this QR code to a Youth Leader to register your attendance.</p>
                </div>

                {/* QR Code Active Status */}
                <div className="w-full">
                  <div className="w-full py-3 bg-green-500/10 border border-green-500/20 text-green-400 font-bold text-sm rounded-xl flex items-center justify-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    <span>QR Code Active</span>
                  </div>
                </div>

                {/* Stats Badges */}
                <div className="flex gap-3 justify-center w-full">
                  <span className="bg-secondary/20 border border-surface-container-highest text-tertiary px-4 py-1.5 rounded-full font-mono text-xs font-bold">LEVEL {profile.level}</span>
                  <span className="bg-secondary/20 border border-surface-container-highest text-tertiary px-4 py-1.5 rounded-full font-mono text-xs font-bold flex items-center gap-1">
                    <Zap className="w-3.5 h-3.5 text-primary fill-primary" />STREAK: {profile.streak}
                  </span>
                </div>
              </div>

              {/* Secure Code Active Indicator */}
              <div className="opacity-50 flex items-center gap-2 mt-4">
                <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse" />
                <span className="font-mono text-xs text-on-surface-variant tracking-widest uppercase">Secure Dynamic Code Active</span>
              </div>
            </div>
          )}

          {/* ======================== POSTS TAB ======================== */}
          {activeTab === 'posts' && (
            <>
              <div className="space-y-5 animate-fade-in">
                <div className="space-y-1">
                  <h2 className="text-2xl font-extrabold text-on-surface">Community Feed</h2>
                  <p className="text-on-surface-variant text-sm">See what God is doing in the lives of our youth community.</p>
                </div>

                {loadingPosts ? (
                  <div className="flex flex-col items-center justify-center py-20 gap-3">
                    <Loader2 className="w-6 h-6 text-primary animate-spin" />
                    <p className="text-on-surface-variant text-sm">Loading community posts...</p>
                  </div>
                ) : approvedPosts.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 gap-4">
                    <div className="w-16 h-16 rounded-full bg-surface-container-high flex items-center justify-center">
                      <MessageSquare className="w-8 h-8 text-on-surface-variant/40" />
                    </div>
                    <div className="text-center space-y-1">
                      <p className="text-on-surface font-bold">No posts yet</p>
                      <p className="text-on-surface-variant text-sm">Be the first to share your testimony or devotion!</p>
                    </div>
                    <button onClick={() => { setPostType('testimony'); setShowCreatePost(true); }} className="bg-primary hover:bg-primary/90 text-on-primary font-bold py-3 px-6 rounded-xl flex items-center gap-2 transition-all active:scale-[0.97]">
                      <Plus className="w-4 h-4" />
                      <span>Share Your Story</span>
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {approvedPosts.map((post) => {
                      const hasReacted = (type: string) => post.userReactions?.includes(type);
                      return (
                        <div key={post.id} className="bg-surface-container-high/70 backdrop-blur-md rounded-2xl border border-surface-container-highest/40 overflow-hidden rg-glow">
                          <div className="p-4 pb-0 flex items-center gap-3">
                            <img src={post.author_avatar || DEFAULT_AVATARS[0].url} alt={post.author_name} className="w-10 h-10 rounded-full object-cover border-2 border-surface-container-highest" />
                            <div className="flex-1 min-w-0">
                              <p className="font-bold text-sm text-on-surface truncate">{post.author_name}</p>
                              <p className="text-[10px] font-mono text-on-surface-variant/50">{new Date(post.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                            </div>
                            <span className={`text-[10px] font-mono font-bold uppercase px-2.5 py-1 rounded-full border ${post.type === 'testimony' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' : 'bg-blue-500/10 text-blue-400 border-blue-500/20'}`}>
                              {post.type === 'testimony' ? 'Testimony' : 'Devotion'}
                            </span>
                          </div>
                          <div className="px-4 py-3">
                            <h3 className="font-bold text-on-surface text-base mb-1.5">{post.title}</h3>
                            <p className="text-sm text-on-surface-variant/80 leading-relaxed whitespace-pre-line">{post.body}</p>
                          </div>
                          <div className="px-4 pb-4 flex items-center justify-between">
                            <div className="flex items-center gap-1 flex-wrap">
                              <button onClick={() => handleReaction(post.id, 'amen')} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all duration-200 ${hasReacted('amen') ? 'bg-primary/20 text-primary border border-primary/40' : 'bg-surface-container-high text-on-surface-variant/70 border border-transparent hover:bg-surface-container-highest/60 hover:text-on-surface'}`}>
                                <span className="text-sm">🙏</span>
                                <span>Amen</span>
                                {(post.reactions?.amen ?? 0) > 0 && <span className="opacity-70">{post.reactions.amen}</span>}
                              </button>
                              <button onClick={() => handleReaction(post.id, 'encouraged')} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all duration-200 ${hasReacted('encouraged') ? 'bg-primary/20 text-primary border border-primary/40' : 'bg-surface-container-high text-on-surface-variant/70 border border-transparent hover:bg-surface-container-highest/60 hover:text-on-surface'}`}>
                                <span className="text-sm">💪</span>
                                <span>Encouraged</span>
                                {(post.reactions?.encouraged ?? 0) > 0 && <span className="opacity-70">{post.reactions.encouraged}</span>}
                              </button>
                              <button onClick={() => handleReaction(post.id, 'praying')} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all duration-200 ${hasReacted('praying') ? 'bg-primary/20 text-primary border border-primary/40' : 'bg-surface-container-high text-on-surface-variant/70 border border-transparent hover:bg-surface-container-highest/60 hover:text-on-surface'}`}>
                                <span className="text-sm">🕊️</span>
                                <span>Praying</span>
                                {(post.reactions?.praying ?? 0) > 0 && <span className="opacity-70">{post.reactions.praying}</span>}
                              </button>
                              <button onClick={() => handleReaction(post.id, 'blessed')} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all duration-200 ${hasReacted('blessed') ? 'bg-primary/20 text-primary border border-primary/40' : 'bg-surface-container-high text-on-surface-variant/70 border border-transparent hover:bg-surface-container-highest/60 hover:text-on-surface'}`}>
                                <span className="text-sm">✨</span>
                                <span>Blessed</span>
                                {(post.reactions?.blessed ?? 0) > 0 && <span className="opacity-70">{post.reactions.blessed}</span>}
                              </button>
                            </div>
                            <button onClick={() => handleSharePost(post)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-surface-container-high text-on-surface-variant/70 hover:bg-surface-container-highest/60 hover:text-on-surface transition-all duration-200 border border-transparent shrink-0">
                              <Share2 className="w-3.5 h-3.5" />
                              <span>Share</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                    <div className="text-center opacity-50 pt-2">
                      <span className="font-mono text-xs text-on-surface-variant">Risktaker Generation PORTAL V2.4.0</span>
                    </div>
                  </div>
                )}

                {/* FAB */}
                <button onClick={() => { setPostType('devotional'); setShowCreatePost(true); }} className="fixed bottom-32 right-6 z-40 w-14 h-14 rounded-full bg-primary hover:bg-primary/90 text-on-primary flex items-center justify-center shadow-lg shadow-primary/30 transition-all active:scale-90">
                  <SquarePen className="w-6 h-6" />
                </button>
              </div>
            </>
          )}

          {/* ======================== PRAYERS TAB ======================== */}
          {activeTab === 'prayers' && (
            <div className="space-y-6 animate-fade-in">
              <div className="space-y-1">
                <h2 className="text-2xl font-extrabold text-on-surface">Private Prayer Request</h2>
                <p className="text-on-surface-variant text-sm">Share your heart, burdens, or praise reports privately with the youth leadership team.</p>
              </div>

              <div className="p-4 bg-surface-container-high border border-error/20 rounded-2xl flex gap-3 text-xs leading-relaxed text-on-surface-variant shadow-sm">
                <Lock className="text-error shrink-0 w-5 h-5 mt-0.5" />
                <div>
                  <p className="font-bold text-on-surface mb-0.5">Strictly Confidential</p>
                  <p>Your requests are private. Only youth leaders/pastors can see them. Other youth will never see your requests on their devices.</p>
                </div>
              </div>

              <div className="bg-surface-container-high border border-surface-container-highest/40 rounded-2xl p-5 space-y-4">
                <h3 className="font-bold text-base text-on-surface">New Prayer Request</h3>
                <form onSubmit={handleSubmitPrayer} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="block text-xs uppercase font-mono text-on-surface-variant/70 tracking-widest" htmlFor="prayer-content">How can the leadership team pray for you?</label>
                    <textarea id="prayer-content" rows={4} value={prayerText} onChange={(e) => setPrayerText(e.target.value)} className="w-full bg-surface-container-low border border-surface-container-highest rounded-xl p-3.5 text-sm text-on-surface placeholder-on-surface-variant/30 focus:outline-none focus:ring-1 focus:ring-error focus:border-error" placeholder="Share your trials, struggles, guidance requests, or praise reports..." required />
                  </div>
                  <div className="flex items-center gap-3">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" checked={isAnonymous} onChange={(e) => setIsAnonymous(e.target.checked)} className="sr-only peer" />
                      <div className="w-9 h-5 bg-surface-container-highest peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-surface after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-error" />
                    </label>
                    <span className="text-xs text-on-surface-variant">Share anonymously with leaders</span>
                  </div>
                  <button type="submit" className="w-full py-3.5 bg-error text-on-error hover:opacity-90 font-bold rounded-xl text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98] cursor-pointer">
                    <Send className="w-4 h-4" />
                    <span>Send Private Request (+15 XP)</span>
                  </button>
                </form>
              </div>

              <div className="space-y-4">
                <h3 className="font-bold text-base text-on-surface px-1">My Private Requests</h3>
                {prayers.filter((p) => p.owner === profile.name || (p.author === profile.name && !p.owner)).length === 0 ? (
                  <div className="p-8 bg-surface-container-high/30 border border-dashed border-surface-container-highest rounded-2xl text-center text-on-surface-variant/60 text-xs">
                    <Heart className="w-8 h-8 text-error/20 mx-auto mb-2 animate-pulse" />
                    <p className="font-medium text-on-surface mb-0.5">No prayer requests submitted yet</p>
                    <p>Fill out the form above to share your request privately.</p>
                  </div>
                ) : (
                  prayers.filter((p) => p.owner === profile.name || (p.author === profile.name && !p.owner)).map((prayer) => (
                    <div key={prayer.id} className="bg-surface-container-high border border-surface-container-highest/30 rounded-2xl p-5 space-y-4 animate-fade-in">
                      <div className="flex justify-between items-start gap-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full border border-surface-container-highest overflow-hidden bg-surface-dim p-0.5">
                            <img className="w-full h-full object-cover rounded-full" src={prayer.avatar} alt={prayer.author} />
                          </div>
                          <div>
                            <h4 className="font-bold text-xs text-on-surface">{prayer.author === 'Anonymous Member' ? 'Anonymous Request' : 'Personal Request'}</h4>
                            <p className="text-[9px] text-on-surface-variant/40 font-mono uppercase tracking-widest">{prayer.timeAgo}</p>
                          </div>
                        </div>
                        <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${prayer.isAnswered ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-yellow-500/10 text-primary border-primary/20 animate-pulse'}`}>
                          {prayer.isAnswered ? 'Answered Praise! 🙌' : 'Active Request'}
                        </span>
                      </div>
                      <p className="text-sm text-on-surface leading-relaxed italic">"{prayer.content}"</p>
                      <div className="flex justify-end pt-3 border-t border-surface-container-highest/20">
                        <button onClick={() => handleMarkPrayerAnswered(prayer.id)} className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${prayer.isAnswered ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-error/10 hover:bg-error/20 text-error border border-error/20'}`}>
                          <CheckCircle2 className={`w-3.5 h-3.5 ${prayer.isAnswered ? 'text-green-400' : ''}`} />
                          <span>{prayer.isAnswered ? 'Shared Praise Report' : 'Mark as Answered Praise'}</span>
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* ======================== PROFILE TAB ======================== */}
          {activeTab === 'profile' && (
            <div className="space-y-8 animate-fade-in">
              <section className="flex flex-col items-center text-center space-y-4 mt-2">
                <div className="relative group">
                  <div className="absolute inset-0 rounded-full bg-primary/20 blur-xl group-hover:bg-primary/30 transition-all" />
                  <div className="relative w-28 h-28 rounded-full border-4 border-surface-container-high overflow-hidden p-1 bg-surface-dim">
                    <img className="w-full h-full object-cover rounded-full" src={profile.avatar} alt={profile.name} />
                  </div>
                  <div className="absolute bottom-1 right-1 w-7 h-7 rounded-full bg-surface-dim border-2 border-surface-container-highest flex items-center justify-center">
                    <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
                  </div>
                </div>
                <div className="space-y-1">
                  <h2 className="text-2xl font-extrabold text-on-surface">{profile.name}</h2>
                  <p className="text-xs font-mono text-on-surface-variant bg-surface-container-highest/60 px-3 py-1 rounded-full border border-surface-container-highest inline-block">{profile.id}</p>
                  <div className="mt-3 block">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/30 text-primary font-mono text-[10px] font-bold uppercase tracking-wider">
                      <Award className="w-3.5 h-3.5" />
                      <span>Level {profile.level} Explorer</span>
                    </div>
                  </div>
                  {profile.bio && (
                    <p className="text-xs text-on-surface-variant/80 max-w-sm pt-2 leading-relaxed italic">"{profile.bio}"</p>
                  )}
                </div>
              </section>

              <section className="grid grid-cols-2 gap-4">
                <div className="bg-surface-container-high p-4 rounded-xl border border-surface-container-highest/40 flex items-center gap-3 shadow-md">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <Sparkles className="w-5 h-5 fill-primary" />
                  </div>
                  <div>
                    <p className="text-[10px] font-mono text-on-surface-variant/60 uppercase tracking-wider">Points</p>
                    <p className="text-lg font-bold text-on-surface">{profile.points}</p>
                  </div>
                </div>
                <div className="bg-surface-container-high p-4 rounded-xl border border-surface-container-highest/40 flex items-center gap-3 shadow-md">
                  <div className="w-10 h-10 rounded-lg bg-tertiary/10 text-tertiary flex items-center justify-center shrink-0">
                    <QrCode className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[10px] font-mono text-on-surface-variant/60 uppercase tracking-wider">Check-ins</p>
                    <p className="text-lg font-bold text-on-surface">{profile.checkIns}</p>
                  </div>
                </div>
                <div className="bg-surface-container-high p-4 rounded-xl border border-surface-container-highest/40 flex items-center gap-3 shadow-md">
                  <div className="w-10 h-10 rounded-lg bg-error/10 text-error flex items-center justify-center shrink-0">
                    <Heart className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[10px] font-mono text-on-surface-variant/60 uppercase tracking-wider">Prayers Shared</p>
                    <p className="text-lg font-bold text-on-surface">{profile.prayersShared}</p>
                  </div>
                </div>
                <div className="bg-surface-container-high p-4 rounded-xl border border-surface-container-highest/40 flex items-center gap-3 shadow-md">
                  <div className="w-10 h-10 rounded-lg bg-on-primary-container/10 text-primary flex items-center justify-center shrink-0">
                    <MessageSquare className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[10px] font-mono text-on-surface-variant/60 uppercase tracking-wider">Posts</p>
                    <p className="text-lg font-bold text-on-surface">{profile.postsCount}</p>
                  </div>
                </div>
              </section>

              <section className="space-y-3">
                <h4 className="font-mono text-xs text-on-surface-variant uppercase tracking-widest mb-4 px-1">Account & Content</h4>
                <button onClick={() => setShowEditProfile(true)} className="w-full flex items-center justify-between p-4 bg-surface-container-low rounded-xl border border-surface-container-highest/10 hover:bg-surface-container-high transition-colors group active:scale-[0.98] text-left">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-surface-container-highest text-primary">
                      <User className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-bold text-sm text-on-surface">Edit Profile</p>
                      <p className="text-[11px] text-on-surface-variant/60 font-mono">Update your username, avatar or bio</p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-on-surface-variant group-hover:translate-x-1 transition-transform" />
                </button>
                <button onClick={() => setShowContributions(true)} className="w-full flex items-center justify-between p-4 bg-surface-container-low rounded-xl border border-surface-container-highest/10 hover:bg-surface-container-high transition-colors group active:scale-[0.98] text-left">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-surface-container-highest text-primary">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-bold text-sm text-on-surface">My Contributions</p>
                      <p className="text-[11px] text-on-surface-variant/60 font-mono">Testimonies & Devotions status</p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-on-surface-variant group-hover:translate-x-1 transition-transform" />
                </button>
                <div className="flex items-center justify-between p-4 bg-surface-container-low rounded-xl border border-surface-container-highest/10 text-left">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-surface-container-highest text-primary">
                      <Bell className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-bold text-sm text-on-surface">Notification Settings</p>
                      <p className="text-[11px] text-on-surface-variant/60 font-mono">Mute or enable announcements</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" defaultChecked className="sr-only peer" />
                    <div className="w-9 h-5 bg-surface-container-highest peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-surface after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary" />
                  </label>
                </div>
                <div className="p-4 bg-surface-container-low rounded-xl border border-surface-container-highest/10 text-left">
                  <div className="flex items-center gap-4 mb-3">
                    <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-surface-container-highest text-primary">
                      <Palette className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-bold text-sm text-on-surface">Appearance</p>
                      <p className="text-[11px] text-on-surface-variant/60 font-mono">Switch between dark and light mode</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 ml-14">
                    {(['dark', 'light', 'system'] as const).map((mode) => (
                      <button key={mode} onClick={() => setTheme(mode)} className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-bold transition-all ${theme === mode ? 'bg-primary text-on-surface' : 'bg-surface-container-highest/60 text-on-surface-variant hover:bg-surface-container-highest'}`}>
                        {mode === 'system' && <Monitor className="w-3 h-3" />}
                        {mode === 'dark' && <Eye className="w-3 h-3" />}
                        {mode === 'light' && <EyeOff className="w-3 h-3" />}
                        <span className="capitalize">{mode}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </section>

              <button onClick={handleLogout} className="w-full py-4 rounded-xl border border-error/20 text-error flex items-center justify-center gap-2 font-bold hover:bg-red-500/5 transition-all text-sm active:scale-[0.98]">
                <LogOut className="w-4 h-4" />
                <span>Logout Simulated Session</span>
              </button>
            </div>
          )}
        </main>

        {/* ======================== MODALS ======================== */}

        {/* Edit Profile Modal */}
        {showEditProfile && (
          <div className="fixed inset-0 z-50 bg-surface-container-low/80 backdrop-blur-sm flex justify-center items-center p-5">
            <div className="w-full max-w-md bg-surface-container-high border border-surface-container-highest rounded-2xl p-6 space-y-6">
              <div className="flex justify-between items-center pb-2 border-b border-surface-container-highest">
                <h3 className="font-bold text-lg text-on-surface">Edit Risktaker Generation Profile</h3>
                <button onClick={() => setShowEditProfile(false)} className="text-on-surface-variant p-1"><X className="w-5 h-5" /></button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-mono uppercase tracking-widest text-on-surface-variant mb-2">Display Username</label>
                  <input type="text" value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} className="w-full bg-surface-container-low border border-surface-container-highest rounded-xl py-3 px-4 text-sm text-on-surface focus:outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-mono uppercase tracking-widest text-on-surface-variant mb-2">Avatar URL</label>
                  <input type="text" value={profile.avatar} onChange={(e) => setProfile({ ...profile, avatar: e.target.value })} className="w-full bg-surface-container-low border border-surface-container-highest rounded-xl py-2 px-3 text-xs text-on-surface focus:outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-mono uppercase tracking-widest text-on-surface-variant mb-2">Personal Bio Quote</label>
                  <textarea rows={3} value={profile.bio || ''} onChange={(e) => setProfile({ ...profile, bio: e.target.value })} className="w-full bg-surface-container-low border border-surface-container-highest rounded-xl py-3 px-4 text-sm text-on-surface focus:outline-none resize-none" />
                </div>
              </div>
              <button onClick={async () => {
                try {
                  await api.updateProfile({ name: profile.name, avatar: profile.avatar, bio: profile.bio || '' });
                  api.setStoredProfile(profile);
                  showToast('Risktaker Generation member profile updated successfully!');
                } catch {
                  showToast('Failed to update profile. Please try again.');
                }
                setShowEditProfile(false);
              }} className="w-full py-3 bg-primary text-on-primary font-bold rounded-xl text-sm">Save Profile Changes</button>
            </div>
          </div>
        )}

        {/* Contributions Modal */}
        {showContributions && (
          <div className="fixed inset-0 z-50 bg-surface-container-low/80 backdrop-blur-sm flex justify-center items-center p-5">
            <div className="w-full max-w-md bg-surface-container-high border border-surface-container-highest rounded-2xl p-6 space-y-4 max-h-[80vh] flex flex-col">
              <div className="flex justify-between items-center pb-2 border-b border-surface-container-highest">
                <h3 className="font-bold text-lg text-on-surface">My Contributions</h3>
                <button onClick={() => setShowContributions(false)} className="text-on-surface-variant p-1"><X className="w-5 h-5" /></button>
              </div>
              <div className="flex-1 overflow-y-auto space-y-4 py-2">
                {myPosts.map((post) => (
                  <div key={post.id} className="p-4 bg-surface-container-low border border-surface-container-highest rounded-xl space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-mono uppercase bg-primary/10 text-primary px-2 py-0.5 rounded-full border border-primary/20">{post.type}</span>
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${post.status === 'Approved' ? 'bg-green-500/10 text-green-400' : 'bg-yellow-500/10 text-yellow-400'}`}>✓ {post.status}</span>
                    </div>
                    <h4 className="font-bold text-sm text-on-surface">{post.title}</h4>
                    <p className="text-xs text-on-surface-variant/80 leading-relaxed italic">"{post.body}"</p>
                    <p className="text-[9px] text-on-surface-variant/40 font-mono pt-1 text-right">{post.timestamp}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Create Post Modal */}
        {showCreatePost && (
          <div className="fixed inset-0 z-50 bg-surface-container-low/80 backdrop-blur-sm flex justify-center items-center p-5">
            <div className="w-full max-w-md bg-surface-container-high border border-surface-container-highest rounded-2xl p-6 space-y-5 max-h-[90vh] flex flex-col">
              <div className="flex justify-between items-center pb-2 border-b border-surface-container-highest">
                <div>
                  <h3 className="font-extrabold text-lg text-primary">Share Your Fire</h3>
                  <p className="text-xs text-tertiary font-mono uppercase">Submit for leader review</p>
                </div>
                <button onClick={() => { setShowCreatePost(false); setPostSubmitted(false); setPostTitle(''); setPostBody(''); }} className="text-on-surface-variant p-1 hover:text-on-surface transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleSubmitPost} className="space-y-5 flex-1 overflow-y-auto">
                <div className="space-y-2">
                  <label className="block font-mono text-xs text-on-surface-variant uppercase tracking-wider">Content Type</label>
                  <div className="flex bg-surface-container-high p-1 rounded-xl w-full">
                    <button type="button" onClick={() => setPostType('devotional')} className={`flex-1 py-2.5 rounded-lg font-bold text-sm transition-all duration-300 ${postType === 'devotional' ? 'bg-primary text-on-primary shadow-md' : 'text-on-surface-variant hover:text-on-surface'}`}>Devotional</button>
                    <button type="button" onClick={() => setPostType('testimony')} className={`flex-1 py-2.5 rounded-lg font-bold text-sm transition-all duration-300 ${postType === 'testimony' ? 'bg-primary text-on-primary shadow-md' : 'text-on-surface-variant hover:text-on-surface'}`}>Testimony</button>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="block font-mono text-xs text-on-surface-variant uppercase tracking-wider" htmlFor="modal-post-title">Title</label>
                  <input id="modal-post-title" type="text" value={postTitle} onChange={(e) => setPostTitle(e.target.value)} className="w-full bg-surface-container-low border border-surface-container-highest/50 rounded-xl py-3 px-4 text-on-surface placeholder-tertiary/30 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all" placeholder={postType === 'devotional' ? 'Enter a catchy title...' : 'My testimony title...'} required />
                </div>
                <div className="space-y-2">
                  <label className="block font-mono text-xs text-on-surface-variant uppercase tracking-wider" htmlFor="modal-post-body">Message</label>
                  <textarea id="modal-post-body" rows={5} value={postBody} onChange={(e) => setPostBody(e.target.value)} className="w-full bg-surface-container-low border border-surface-container-highest/50 rounded-xl py-3 px-4 text-on-surface placeholder-tertiary/30 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all resize-none" placeholder={postType === 'devotional' ? 'What spiritual insight or scripture study is on your heart?...' : 'How has God been working in your life recently?...'} required />
                </div>
                <div className="p-3 bg-primary/10 border border-primary/20 rounded-xl flex gap-3 text-xs leading-relaxed text-on-surface-variant">
                  <TriangleAlert className="text-primary shrink-0 w-4 h-4 mt-0.5" />
                  <p>Submissions undergo leader validation before appearing in the community feed.</p>
                </div>
                {isSubmittingPost ? (
                  <button type="button" className="w-full py-3.5 bg-secondary/30 text-tertiary font-bold rounded-xl cursor-not-allowed flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Submitting...</span>
                  </button>
                ) : postSubmitted ? (
                  <button type="button" className="w-full py-3.5 bg-green-500/20 border border-green-500/40 text-green-400 font-bold rounded-xl flex items-center justify-center gap-2 animate-pulse">
                    <CheckCircle2 className="w-5 h-5" />
                    <span>Sent for Review! (+25 XP)</span>
                  </button>
                ) : (
                  <button type="submit" className="w-full bg-primary hover:bg-primary/90 text-on-primary font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-[0.98] shadow-lg shadow-primary/10">
                    <span>Submit for Review</span>
                    <Send className="w-4 h-4" />
                  </button>
                )}
              </form>
            </div>
          </div>
        )}

        {/* Event Registration Modal */}
        {selectedEvent && (
          <div className="fixed inset-0 z-50 bg-surface-container-low/80 backdrop-blur-sm flex justify-center items-center p-5">
            <div className="w-full max-w-md bg-surface-container-high border border-surface-container-highest rounded-2xl p-6 space-y-4">
              <div className="flex justify-between items-center pb-2 border-b border-surface-container-highest">
                <div>
                  <h3 className="font-extrabold text-lg text-primary">{selectedEvent.title}</h3>
                  <p className="text-xs text-tertiary font-mono uppercase">Ticket Registration</p>
                </div>
                <button onClick={() => setSelectedEvent(null)} className="text-on-surface-variant p-1"><X className="w-5 h-5" /></button>
              </div>
              <div className="p-3 bg-surface-container-low rounded-xl border border-surface-container-highest flex gap-3 items-center">
                <Sparkles className="w-5 h-5 text-primary fill-primary" />
                <div className="text-xs">
                  <p className="font-bold text-on-surface">Points Reward on Attendance</p>
                  <p className="text-on-surface-variant">Complete this registration to reserve and claim +{selectedEvent.pointsReward} XP!</p>
                </div>
              </div>
              <form onSubmit={(e) => { e.preventDefault(); handleRegisterForEvent(selectedEvent.id, selectedEvent); }} className="space-y-4">
                {selectedEvent.registrationFields?.length > 0 ? (
                  selectedEvent.registrationFields.map((field: any) => (
                    <div key={field.id} className="space-y-1.5">
                      <label className="block text-[10px] font-mono text-on-surface-variant uppercase">
                        {field.label} {field.required && <span className="text-error">*</span>}
                      </label>
                      {field.type === 'text' && (
                        <input type="text" placeholder={`Enter ${field.label.toLowerCase()}`} value={eventFormFields[field.id] || ''} onChange={(e) => setEventFormFields({ ...eventFormFields, [field.id]: e.target.value })} className="w-full bg-surface-container-low border border-surface-container-highest rounded-lg p-2 text-xs text-on-surface" required={field.required} />
                      )}
                      {field.type === 'textarea' && (
                        <textarea placeholder={`Enter ${field.label.toLowerCase()}`} value={eventFormFields[field.id] || ''} onChange={(e) => setEventFormFields({ ...eventFormFields, [field.id]: e.target.value })} className="w-full bg-surface-container-low border border-surface-container-highest rounded-lg p-2 text-xs text-on-surface min-h-[80px] resize-none" required={field.required} />
                      )}
                      {field.type === 'number' && (
                        <input type="number" placeholder={`Enter ${field.label.toLowerCase()}`} value={eventFormFields[field.id] || ''} onChange={(e) => setEventFormFields({ ...eventFormFields, [field.id]: e.target.value })} className="w-full bg-surface-container-low border border-surface-container-highest rounded-lg p-2 text-xs text-on-surface" required={field.required} />
                      )}
                      {field.type === 'select' && (
                        <select value={eventFormFields[field.id] || ''} onChange={(e) => setEventFormFields({ ...eventFormFields, [field.id]: e.target.value })} className="w-full bg-surface-container-low border border-surface-container-highest rounded-lg p-2 text-xs text-on-surface" required={field.required}>
                          <option value="">Select...</option>
                          {field.options?.map((opt: string) => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
                        </select>
                      )}
                      {field.type === 'contact_number' && (
                        <input type="tel" placeholder="+1 (555) 019-2834" value={eventFormFields[field.id] || ''} onChange={(e) => { const v = e.target.value; if (v === '' || /^\+?[\d\s\-().]{7,20}$/.test(v)) setEventFormFields({ ...eventFormFields, [field.id]: v }); }} className="w-full bg-surface-container-low border border-surface-container-highest rounded-lg p-2 text-xs text-on-surface" required={field.required} pattern="^\+?[\d\s\-().]{7,20}$" title="Please enter a valid phone number" />
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-on-surface-variant text-center py-2">No additional information required.</p>
                )}
                <button type="submit" className="w-full py-3 bg-primary text-on-primary font-extrabold rounded-xl text-sm transition-all hover:opacity-90 active:scale-[0.98]">Confirm Spot & RSVP</button>
              </form>
            </div>
          </div>
        )}

        {/* ======================== BOTTOM NAV ======================== */}
        <nav className="fixed bottom-0 left-0 w-full z-40 bg-surface-container-high border-t border-surface-container-highest/40 shadow-2xl flex justify-around items-end pb-5 pt-2 px-2 rounded-t-2xl">
          <button id="tab-home" onClick={() => setActiveTab('home')} className={`flex flex-col items-center justify-center cursor-pointer transition-all duration-200 px-4 py-1.5 rounded-xl ${activeTab === 'home' ? 'text-primary' : 'text-tertiary hover:bg-surface-container-highest/30'}`}>
            <img src="/favicon.svg" className={`w-6 h-6 ${activeTab === 'home' ? 'fill-primary' : ''}`} />
            <span className="font-mono text-[10px] mt-1 font-bold">Home</span>
            {activeTab === 'home' && <span className="w-1.5 h-1.5 rounded-full bg-on-primary-container mt-0.5 animate-pulse" />}
          </button>
          <button id="tab-events" onClick={() => setActiveTab('events')} className={`flex flex-col items-center justify-center cursor-pointer transition-all duration-200 px-4 py-1.5 rounded-xl ${activeTab === 'events' ? 'text-primary' : 'text-tertiary hover:bg-surface-container-highest/30'}`}>
            <Calendar className="w-6 h-6" />
            <span className="font-mono text-[10px] mt-1 font-bold">Events</span>
            {activeTab === 'events' && <span className="w-1.5 h-1.5 rounded-full bg-on-primary-container mt-0.5 animate-pulse" />}
          </button>
          <div className="flex flex-col items-center justify-center -mb-2">
            <button id="tab-checkin" onClick={() => setActiveTab('check-in')} className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg transition-all duration-300 active:scale-90 border-4 border-surface-dim ${activeTab === 'check-in' ? 'bg-gradient-to-br from-primary to-primary text-on-primary shadow-primary/40 rotate-45' : 'bg-gradient-to-br from-secondary to-secondary text-surface-container'}`}>
              <QrCode className={`w-7 h-7 ${activeTab === 'check-in' ? '-rotate-45' : ''}`} />
            </button>
            <span className="font-mono text-[10px] mt-1.5 font-bold text-primary">Check-In</span>
          </div>
          <button id="tab-posts" onClick={() => setActiveTab('posts')} className={`flex flex-col items-center justify-center cursor-pointer transition-all duration-200 px-4 py-1.5 rounded-xl ${activeTab === 'posts' ? 'text-primary' : 'text-tertiary hover:bg-surface-container-highest/30'}`}>
            <MessageSquare className="w-6 h-6" />
            <span className="font-mono text-[10px] mt-1 font-bold">Posts</span>
            {activeTab === 'posts' && <span className="w-1.5 h-1.5 rounded-full bg-on-primary-container mt-0.5 animate-pulse" />}
          </button>
          <button id="tab-prayers" onClick={() => setActiveTab('prayers')} className={`flex flex-col items-center justify-center cursor-pointer transition-all duration-200 px-4 py-1.5 rounded-xl ${activeTab === 'prayers' ? 'text-primary' : 'text-tertiary hover:bg-surface-container-highest/30'}`}>
            <Heart className="w-6 h-6" />
            <span className="font-mono text-[10px] mt-1 font-bold">Prayers</span>
            {activeTab === 'prayers' && <span className="w-1.5 h-1.5 rounded-full bg-on-primary-container mt-0.5 animate-pulse" />}
          </button>
        </nav>
      </div>
    );
  }

  // ======================== AUTH SCREEN ========================
  return (
    <div className="min-h-screen bg-surface-dim text-on-surface flex flex-col justify-center items-center px-6 py-12 font-hanken relative overflow-hidden">
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-error/5 rounded-full blur-3xl pointer-events-none" />
      <div className="w-full max-w-md glass-auth-card rounded-2xl p-8 rg-glow-strong relative z-10">
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/30 flex items-center justify-center animate-float">
            <img src="/favicon.svg" className="text-primary w-10 h-10 fill-primary/10" />
          </div>
        </div>
        <div className="text-center mb-8">
          <h1 className="font-extrabold text-3xl tracking-tight text-primary font-hanken">Risktaker Generation</h1>
          <p className="text-xs text-on-surface-variant/80 uppercase tracking-widest font-mono mt-1">Youth Community Portal</p>
        </div>

        <div className="grid grid-cols-2 p-1 bg-surface-container-low rounded-xl border border-surface-container-highest mb-6">
          <button onClick={() => { setAuthMode('login'); setLoginError(null); }} className={`py-2 text-sm font-semibold rounded-lg transition-all ${authMode === 'login' ? 'bg-surface-container-highest text-primary shadow' : 'text-on-surface-variant hover:text-on-surface'}`}>Sign In</button>
          <button onClick={() => { setAuthMode('register'); setRegError(null); }} className={`py-2 text-sm font-semibold rounded-lg transition-all ${authMode === 'register' ? 'bg-surface-container-highest text-primary shadow' : 'text-on-surface-variant hover:text-on-surface'}`}>Register</button>
        </div>

        {authMode === 'login' ? (
          <form onSubmit={handleLogin} className="space-y-5">
            {loginError && (
              <div className="p-3 bg-error/20 border border-primary/30 rounded-xl text-xs text-primary flex items-center gap-2">
                <TriangleAlert className="w-4 h-4 shrink-0" />
                <span>{loginError}</span>
              </div>
            )}
            <div className="space-y-1.5">
              <label className="block text-xs uppercase tracking-widest text-on-surface-variant font-mono" htmlFor="login-name">Email Address</label>
              <div className="relative">
                <User className="absolute left-3.5 top-3.5 w-4 h-4 text-on-surface-variant/50" />
                <input id="login-name" type="text" value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} className="w-full bg-surface-container-low border border-surface-container-highest rounded-xl py-3 pl-11 pr-4 text-sm text-on-surface placeholder-tertiary/30 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all" placeholder="e.g. Aaron" required />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs uppercase tracking-widest text-on-surface-variant font-mono" htmlFor="login-pass">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3.5 w-4 h-4 text-on-surface-variant/50" />
                <input id="login-pass" type={showPassword ? 'text' : 'password'} value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} className="w-full bg-surface-container-low border border-surface-container-highest rounded-xl py-3 pl-11 pr-11 text-sm text-on-surface placeholder-tertiary/30 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all" placeholder="Enter password" required />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 top-3.5 text-on-surface-variant/50 hover:text-on-surface-variant transition-colors">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div className="p-4 bg-surface-container-low/60 rounded-xl border border-surface-container-highest/50 text-xs text-on-surface-variant/90 leading-relaxed flex gap-3">
              <Lock className="text-primary shrink-0 w-4 h-4 mt-0.5" />
              <span>Test account: <strong>aaron@risktakergeneration.com</strong> / <strong>password123</strong></span>
            </div>
            <button type="submit" disabled={isAuthLoading} className="w-full py-3.5 bg-primary hover:bg-primary/90 text-on-primary font-bold rounded-xl flex items-center justify-center gap-2 transition-all active:scale-[0.98] shadow-lg shadow-primary/10 cursor-pointer text-sm disabled:opacity-50 disabled:cursor-not-allowed">
              {isAuthLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Connecting...</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <UserPlus className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        ) : (
          <form onSubmit={handleRegister} className="space-y-4">
            {regError && (
              <div className="p-3 bg-error/20 border border-primary/30 rounded-xl text-xs text-primary flex items-center gap-2">
                <TriangleAlert className="w-4 h-4 shrink-0" />
                <span>{regError}</span>
              </div>
            )}
            <div className="space-y-1.5">
              <label className="block text-xs uppercase tracking-widest text-on-surface-variant font-mono" htmlFor="reg-name">Full Name</label>
              <div className="relative">
                <User className="absolute left-3.5 top-3.5 w-4 h-4 text-on-surface-variant/50" />
                <input id="reg-name" type="text" value={regName} onChange={(e) => setRegName(e.target.value)} className="w-full bg-surface-container-low border border-surface-container-highest rounded-xl py-3 pl-11 pr-4 text-sm text-on-surface placeholder-tertiary/30 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all" placeholder="e.g. Timothy Smith" required />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs uppercase tracking-widest text-on-surface-variant font-mono" htmlFor="reg-email">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3.5 w-4 h-4 text-on-surface-variant/50" />
                <input id="reg-email" type="email" value={regEmail} onChange={(e) => setRegEmail(e.target.value)} className="w-full bg-surface-container-low border border-surface-container-highest rounded-xl py-3 pl-11 pr-4 text-sm text-on-surface placeholder-tertiary/30 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all" placeholder="name@example.com" required />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs uppercase tracking-widest text-on-surface-variant font-mono" htmlFor="reg-pass">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3.5 w-4 h-4 text-on-surface-variant/50" />
                <input id="reg-pass" type="password" value={regPassword} onChange={(e) => setRegPassword(e.target.value)} className="w-full bg-surface-container-low border border-surface-container-highest rounded-xl py-3 pl-11 pr-4 text-sm text-on-surface placeholder-tertiary/30 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all" placeholder="Min. 6 characters" required />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs uppercase tracking-widest text-on-surface-variant font-mono" htmlFor="reg-contact">Emergency Contact Number</label>
              <div className="relative">
                <Plus className="absolute left-3.5 top-3.5 w-4 h-4 text-on-surface-variant/50" />
                <input id="reg-contact" type="tel" value={regEmergencyContact} onChange={(e) => setRegEmergencyContact(e.target.value)} className="w-full bg-surface-container-low border border-surface-container-highest rounded-xl py-3 pl-11 pr-4 text-sm text-on-surface placeholder-tertiary/30 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all" placeholder="+1 (555) 019-2834" required />
              </div>
            </div>
            <div className="space-y-2">
              <label className="block text-xs uppercase tracking-widest text-on-surface-variant font-mono">Select Profile Avatar</label>
              <div className="grid grid-cols-6 gap-2">
                {DEFAULT_AVATARS.map((av) => (
                  <button key={av.name} type="button" onClick={() => setRegAvatar(av.url)} className={`relative rounded-full aspect-square border overflow-hidden p-0.5 transition-all active:scale-95 cursor-pointer ${regAvatar === av.url ? 'border-primary scale-105 shadow shadow-primary/50' : 'border-transparent hover:border-on-surface-variant/40'}`}>
                    <img src={av.url} alt={av.name} className="w-full h-full rounded-full object-cover" />
                    {regAvatar === av.url && (
                      <div className="absolute inset-0 bg-primary/20 flex items-center justify-center rounded-full">
                        <CheckCircle2 className="w-4 h-4 text-primary fill-on-surface-container-low stroke-2" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
            <button type="submit" disabled={isAuthLoading} className="w-full mt-2 py-3.5 bg-primary hover:bg-primary/90 text-on-primary font-bold rounded-xl flex items-center justify-center gap-2 transition-all active:scale-[0.98] shadow-lg shadow-primary/10 cursor-pointer text-sm disabled:opacity-50 disabled:cursor-not-allowed">
              {isAuthLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Creating Account...</span>
                </>
              ) : (
                <>
                  <span>Register & Claim Starting Bonus</span>
                  <Sparkles className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
