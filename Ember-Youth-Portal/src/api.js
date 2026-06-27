const API_BASE_URL = import.meta.env.VITE_API_URL || '/api/v1';

class ApiClient {
  constructor() {
    this.baseUrl = API_BASE_URL;
    this.token = localStorage.getItem('rg_access_token');
    this._refreshPromise = null;
    this._onSessionExpired = null;
  }

  onSessionExpired(callback) {
    this._onSessionExpired = callback;
  }

  setToken(token) {
    this.token = token;
    if (token) {
      localStorage.setItem('rg_access_token', token);
    } else {
      localStorage.removeItem('rg_access_token');
    }
  }

  getRefreshToken() {
    return localStorage.getItem('rg_refresh_token');
  }

  setRefreshToken(token) {
    if (token) {
      localStorage.setItem('rg_refresh_token', token);
    } else {
      localStorage.removeItem('rg_refresh_token');
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

    // Handle token expiration or invalid token (but NOT rate limiting)
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
    localStorage.removeItem('rg_is_logged_in');
    localStorage.removeItem('rg_user_profile');
    localStorage.removeItem('rg_submitted_posts');
    localStorage.removeItem('rg_events_list');
    localStorage.removeItem('rg_prayers_list');
    if (this._onSessionExpired) {
      this._onSessionExpired();
    }
  }

  // ============ AUTH ENDPOINTS ============

  async register(userData) {
    const data = await this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
    
    this.setToken(data.accessToken);
    this.setRefreshToken(data.refreshToken);
    localStorage.setItem('rg_is_logged_in', 'true');
    
    return data;
  }

  async login(email, password) {
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
      localStorage.removeItem('rg_is_logged_in');
      localStorage.removeItem('rg_user_profile');
      localStorage.removeItem('rg_submitted_posts');
      localStorage.removeItem('rg_events_list');
      localStorage.removeItem('rg_prayers_list');
    }
  }

  // ============ EVENT ENDPOINTS ============

  async getEvents() {
    const data = await this.request('/events');
    return data.events;
  }

  async getEvent(id) {
    const data = await this.request(`/events/${id}`);
    return data.event;
  }

  async registerForEvent(eventId, registrationData = {}) {
    return this.request(`/events/${eventId}/register`, {
      method: 'POST',
      body: JSON.stringify({ registrationData }),
    });
  }

  async unregisterFromEvent(eventId) {
    return this.request(`/events/${eventId}/unregister`, { method: 'POST' });
  }

  async checkInToEvent(eventId) {
    return this.request(`/events/${eventId}/checkin`, { method: 'POST' });
  }

  async getMyEvents() {
    const data = await this.request('/events/user/mine');
    return data.registrations;
  }

  // ============ POST ENDPOINTS ============

  async getPosts() {
    const data = await this.request('/posts');
    return data.posts;
  }

  async getMyPosts() {
    const data = await this.request('/posts/mine');
    return data.posts;
  }

  async createPost({ title, body, type }) {
    return this.request('/posts', {
      method: 'POST',
      body: JSON.stringify({ title, body, type }),
    });
  }

  async deletePost(id) {
    return this.request(`/posts/${id}`, { method: 'DELETE' });
  }

  async toggleReaction(postId, reactionType) {
    return this.request(`/posts/${postId}/react`, {
      method: 'POST',
      body: JSON.stringify({ reactionType }),
    });
  }

  async getPostReactions(postId) {
    return this.request(`/posts/${postId}/reactions`);
  }

  // ============ PRAYER ENDPOINTS ============

  async getPrayers(stage = null) {
    const query = stage ? `?stage=${stage}` : '';
    const data = await this.request(`/prayers${query}`);
    return data.prayers;
  }

  async getMyPrayers() {
    const data = await this.request('/prayers/mine');
    return data.prayers;
  }

  async createPrayer({ content, category, isAnonymous }) {
    return this.request('/prayers', {
      method: 'POST',
      body: JSON.stringify({ content, category, isAnonymous }),
    });
  }

  async prayForRequest(prayerId) {
    return this.request(`/prayers/${prayerId}/pray`, { method: 'POST' });
  }

  async markPrayerAnswered(prayerId) {
    return this.request(`/prayers/${prayerId}/answered`, { method: 'POST' });
  }

  async deletePrayer(id) {
    return this.request(`/prayers/${id}`, { method: 'DELETE' });
  }

  // ============ ANNOUNCEMENT ENDPOINTS ============

  async getAnnouncements() {
    const data = await this.request('/announcements');
    return data.announcements;
  }

  async getAnnouncement(id) {
    const data = await this.request(`/announcements/${id}`);
    return data.announcement;
  }

  // ============ UTILITY METHODS ============

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

  setStoredProfile(profile) {
    localStorage.setItem('rg_user_profile', JSON.stringify(profile));
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
