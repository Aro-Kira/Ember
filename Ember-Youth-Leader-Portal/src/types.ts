export type NavTab = 'overview' | 'members' | 'announcements' | 'events' | 'prayers' | 'scanner' | 'feed' | 'attendance' | 'sunday' | 'settings';

export interface YouthMember {
  id: string;
  name: string;
  email: string;
  rgId: string;
  joinedDate: string;
  level: 'Ignition' | 'Blaze' | 'Inferno';
  status: 'Active' | 'Inactive';
  avatar: string;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  priority: 'High' | 'Normal' | 'Low';
  targetAudience: 'All Youth' | 'Middle Schoolers' | 'High Schoolers' | 'Leaders Only';
  date: string;
  views: number;
  status: 'Active' | 'Draft' | 'Archive';
  coverImage?: string;
  authorName: string;
  authorAvatar: string;
}

export interface RegistrationField {
  id: string;
  label: string;
  type: 'contact_number' | 'text' | 'textarea' | 'number' | 'select';
  required: boolean;
  options?: string[];
}

export interface PortalEvent {
  id: string;
  title: string;
  dateTime: string;
  registered: number;
  totalCapacity: number;
  checkedIn: number;
  type: 'live' | 'meet' | 'summit' | 'cleanup';
  dateKey: string; // e.g., '2024-10-07', '2024-10-11', '2024-10-25'
  revenue?: number;
  registrationFields: RegistrationField[];
}

export interface ModerationSubmission {
  id: string;
  title: string;
  name: string;
  timeAgo: string;
  type: 'TESTIMONY' | 'DEVOTIONAL';
  content: string;
  status: 'pending' | 'approved' | 'rejected';
  reactions?: {
    amen: number;
    encouraged: number;
    praying: number;
    blessed: number;
    total: number;
  };
  userReactions?: string[];
}

export interface PrayerItem {
  id: string;
  category: string;
  text: string;
  author: string;
  stage: 'new' | 'active' | 'archived';
  prayingCount: number;
  date?: string;
}
