const API_BASE_URL = import.meta.env.VITE_API_URL || '/api/v1';

class ApiClient {
  constructor() {
    this.baseUrl = API_BASE_URL;
    this.token = localStorage.getItem('rg_leader_access_token');
    this._refreshPromise = null;
    this._onSessionExpired = null;
  }

  onSessionExpired(callback) {
    this._onSessionExpired = callback;
  }

  setToken(token) {
    this.token = token;
    if (token) {
      localStorage.setItem('rg_leader_access_token', token);
    } else {
      localStorage.removeItem('rg_leader_access_token');
    }
  }

  getRefreshToken() {
    return localStorage.getItem('rg_leader_refresh_token');
  }

  setRefreshToken(token) {
    if (token) {
      localStorage.setItem('rg_leader_refresh_token', token);
    } else {
      localStorage.removeItem('rg_leader_refresh_token');
    }
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
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
        // Deduplicate concurrent refresh attempts
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

  async handleResponse(response) {
    const contentType = response.headers.get('content-type') || '';
    let data;
    
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

  async refreshToken() {
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
    localStorage.removeItem('rg_leader_is_logged_in');
    localStorage.removeItem('rg_leader_profile');
    if (this._onSessionExpired) {
      this._onSessionExpired();
    }
  }

  // ============ AUTH ENDPOINTS ============

  async register(userData) {
    const data = await this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        ...userData,
        role: 'leader'
      }),
    });
    
    this.setToken(data.accessToken);
    this.setRefreshToken(data.refreshToken);
    localStorage.setItem('rg_leader_is_logged_in', 'true');
    
    return data;
  }

  async login(email, password) {
    const data = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    
    if (data.user.role !== 'leader') {
      this.logout();
      throw new Error('Access denied. Leader account required.');
    }
    
    this.setToken(data.accessToken);
    this.setRefreshToken(data.refreshToken);
    localStorage.setItem('rg_leader_is_logged_in', 'true');
    
    return data;
  }

  async getMe() {
    return this.request('/auth/me');
  }

  async updateProfile(updates) {
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
      localStorage.removeItem('rg_leader_is_logged_in');
      localStorage.removeItem('rg_leader_profile');
    }
  }

  // ============ LEADER DASHBOARD ENDPOINTS ============

  async getMembers() {
    const data = await this.request('/leader/members');
    return data.members;
  }

  async getMember(id) {
    const data = await this.request(`/leader/members/${id}`);
    return data.member;
  }

  async createMember(memberData) {
    const data = await this.request('/leader/members', {
      method: 'POST',
      body: JSON.stringify(memberData),
    });
    return data.member;
  }

  async updateMember(id, updates) {
    const data = await this.request(`/leader/members/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
    return data.member;
  }

  async deleteMember(id) {
    return this.request(`/leader/members/${id}`, { method: 'DELETE' });
  }

  async getStats() {
    const data = await this.request('/leader/stats');
    return data.stats;
  }

  async getActivity(limit = 20) {
    const data = await this.request(`/leader/activity?limit=${limit}`);
    return data.activity;
  }

  async checkInMemberToEvent(eventId, userId) {
    return this.request(`/leader/events/${eventId}/checkin-member`, {
      method: 'POST',
      body: JSON.stringify({ userId }),
    });
  }

  async publishAnnouncement(announcementId) {
    return this.request(`/leader/announcements/${announcementId}/publish`, {
      method: 'POST',
    });
  }

  // ============ POST MODERATION ENDPOINTS ============

  async getPendingPosts() {
    const data = await this.request('/posts/pending');
    return data.posts;
  }

  async getAllPosts() {
    const data = await this.request('/posts');
    return data.posts;
  }

  async approvePost(postId) {
    return this.request(`/leader/posts/${postId}/approve`, { method: 'POST' });
  }

  async rejectPost(postId) {
    return this.request(`/leader/posts/${postId}/reject`, { method: 'POST' });
  }

  async getPostStats() {
    const data = await this.request('/posts/stats');
    return data.stats;
  }

  async reactToPost(postId, reactionType) {
    return this.request(`/posts/${postId}/react`, {
      method: 'POST',
      body: JSON.stringify({ reactionType }),
    });
  }

  // ============ EVENT MANAGEMENT ENDPOINTS ============

  async getEvents() {
    const data = await this.request('/events');
    return data.events;
  }

  async createEvent(eventData) {
    return this.request('/events', {
      method: 'POST',
      body: JSON.stringify(eventData),
    });
  }

  async updateEvent(id, updates) {
    return this.request(`/events/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async deleteEvent(id) {
    return this.request(`/events/${id}`, { method: 'DELETE' });
  }

  // ============ SUNDAY ATTENDANCE ENDPOINTS ============

  async checkInSunday(userId, date, time) {
    return this.request('/sunday-attendance/checkin', {
      method: 'POST',
      body: JSON.stringify({ userId, date, time }),
    });
  }

  async getSundayAttendance(date) {
    const data = await this.request(`/sunday-attendance?date=${date}`);
    return data.records;
  }

  async getSundayHistory() {
    const data = await this.request('/sunday-attendance/history');
    return data.history;
  }

  async removeSundayAttendance(userId, date) {
    return this.request('/sunday-attendance', {
      method: 'DELETE',
      body: JSON.stringify({ userId, date }),
    });
  }

  // ============ PRAYER MANAGEMENT ENDPOINTS ============

  async getPrayers(stage = null) {
    const query = stage ? `?stage=${stage}` : '';
    const data = await this.request(`/prayers${query}`);
    return data.prayers;
  }

  async updatePrayerStage(prayerId, stage) {
    return this.request(`/leader/prayers/${prayerId}/stage`, {
      method: 'PUT',
      body: JSON.stringify({ stage }),
    });
  }

  async getPrayerStats() {
    const data = await this.request('/prayers/stats');
    return data.stats;
  }

  // ============ ANNOUNCEMENT MANAGEMENT ENDPOINTS ============

  async getAnnouncements() {
    const data = await this.request('/announcements');
    return data.announcements;
  }

  async createAnnouncement(announcementData) {
    return this.request('/announcements', {
      method: 'POST',
      body: JSON.stringify(announcementData),
    });
  }

  async updateAnnouncement(id, updates) {
    return this.request(`/announcements/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async deleteAnnouncement(id) {
    return this.request(`/announcements/${id}`, { method: 'DELETE' });
  }

  async getAnnouncementStats() {
    const data = await this.request('/announcements/stats');
    return data.stats;
  }

  async uploadCoverImage(file) {
    const formData = new FormData();
    formData.append('coverImage', file);
    const response = await fetch(`${this.baseUrl}/upload`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${this.token}` },
      body: formData,
    });
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || 'Upload failed');
    }
    const data = await response.json();
    return data.url;
  }

  // ============ UTILITY METHODS ============

  isAuthenticated() {
    return !!this.token;
  }

  getStoredProfile() {
    const saved = localStorage.getItem('rg_leader_profile');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return null;
      }
    }
    return null;
  }

  setStoredProfile(profile) {
    localStorage.setItem('rg_leader_profile', JSON.stringify(profile));
  }

  // ============ SSE REAL-TIME ============

  connectSSE() {
    const streamUrl = `${this.baseUrl.replace('/v1', '')}/v1/stream?token=${this.token}`;
    const eventSource = new EventSource(streamUrl);

    eventSource.addEventListener('connected', (e) => {
      console.log('SSE connected:', JSON.parse(e.data));
    });

    eventSource.onerror = () => {
      console.warn('SSE connection lost, will auto-reconnect');
    };

    return {
      eventSource,
      on(eventType, callback) {
        eventSource.addEventListener(eventType, (e) => callback(JSON.parse(e.data)));
      },
      close() {
        eventSource.close();
      }
    };
  }
}

export const api = new ApiClient();
export default api;
