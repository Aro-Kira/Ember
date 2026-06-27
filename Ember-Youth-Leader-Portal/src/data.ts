import { YouthMember, Announcement, PortalEvent, ModerationSubmission, PrayerItem } from './types';

export const INITIAL_MEMBERS: YouthMember[] = [
  {
    id: '1',
    name: 'Maya Rodriguez',
    email: 'maya.rod@email.com',
    rgId: '#RG-8821',
    joinedDate: 'Oct 12, 2023',
    level: 'Ignition',
    status: 'Active',
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBZp2HD6in7vGw-ebIrZu3B0eo1UMZrWCDR_DEV1phcfdW-SRWNlY9wHYpJK8RGow53F4JWZJ3uPY2Re95CDd6UR5wTOjDruw_t9f7xqsmBum6V7P2xQ1Yb4R5rxBAP0kSNB1kfNOG30bDeuXGEJ93JU_t2q5OU1xF8VBM55mUT9p-KYn5ADAXCIwcWcYagUB4MHpwcd0zUCrQ9740ja7OLaeoLunxu1hMZsBfRUvNiB9V-MALCKsiMqsEKTavTF0AB5ePQbGttb7HW'
  },
  {
    id: '2',
    name: 'Kenji Sato',
    email: 'kenji.s@email.com',
    rgId: '#RG-9012',
    joinedDate: 'Nov 05, 2023',
    level: 'Blaze',
    status: 'Active',
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCZNvu3FgyHvV37UF2-mWacklgeui03KmVn0fUjwujyahmip7o5JhWbM9Ox-FcDWL7hpWGDnPXIQvlW8nMwQiUDKr9zqVa0JSTpHhEzt4fTegexnw04sxyM-JFoqD78RV6Xu3DwYc_XuuTo_UvVelFhjBoMlJb8KXgZ-JUIND2935qqR-10-ac3nWzJLo0Q1EJVi99cQwXm5hQfvIUtJ079k5OxlnAqYFC1ttuC6zuv5zXQxExxKCzKPSHLMq14aULfPSHM2z1o5lHX'
  },
  {
    id: '3',
    name: 'Liam Smith',
    email: 'liam.s88@email.com',
    rgId: '#RG-4432',
    joinedDate: 'Jan 14, 2024',
    level: 'Ignition',
    status: 'Inactive',
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDXiDajMS1f1mRUP_WlYpsPvY3mGDiSvYW6yVsuBwXwMc-WEinXqf88RQR8hKxUIBhfMbgqRnDGg8NgzMbcOgbXwGXG7TlM7N_ueUJOrqaXcAQe5B06N50B2eJy2odmTWko8F9TFZFNwEAoVlQbiy5vrWhQYvJQP7GMhGXJK8gStI4xxle-M8beW5dogO2-iaD-NRkTeGYTb9nn3KBn9DWEImDWZuzKG4WkNeUExDBhzpFaX2KCoq8oKHEiJf3fqCfO6B7ZPcCeDH8u'
  },
  {
    id: '4',
    name: 'Zahara Williams',
    email: 'zahara.w@email.com',
    rgId: '#RG-2290',
    joinedDate: 'Feb 22, 2024',
    level: 'Inferno',
    status: 'Active',
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCyc5VVHHy84KZIy6U3ia03M_SaylBpzg1Ct-w92BMcn8eR4u9vVIm_0mYUEON0BuESScGLSuOKVW6rIahgIhrMkuqDwCqXdfORykat-62hEKEwGJ4zLb_IAonWosCys378uIxD4bjsRNzTo2v1mws9snzbR7ZFHBdCqJI8dGBeTJDuYbkn1pfOosa-Kw3e_shg8r_XWx4TnxCemTOlkpnyuheTJQGDvNJzcfzTtIez0CttkgrL_7-T_141YhJ6y0RPz7xzhT_EdLNk'
  }
];

export const INITIAL_ANNOUNCEMENTS: Announcement[] = [
  {
    id: 'a1',
    title: 'Winter Retreat Registration Open!',
    content: 'The annual Risktaker Generation Winter Retreat is finally here. Make sure to grab your early bird tickets before they sell out next week. Join us for an unforgettable weekend of worship, small groups, and winter activities.',
    priority: 'High',
    targetAudience: 'All Youth',
    date: 'Today, 10:30 AM',
    views: 142,
    status: 'Active',
    coverImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDKL65a6IxWPGYdM_EGFATLgguLTkdT7Iu0uLfgt9BNZYZrMTTj5fU5rhQdVQu1t6sqyb9BkXUrE3ankKUN412yfbA7CYrWn3x8z-e-nrC0lFlCaSnS2G8yQnNBtFYegTpoJr80DTwfC33z8TTC2B6rhbRPItnUu9J5aVgF1TiC4hJhlOrTaUngrVyVx9l08BCaFo81huiHMGEYSLeFrYeIumb0DU0PKTBv8GkGlS5HSgUmJDeiANH1F33U0BR0M4jqBxshbKs0P5aJ',
    authorName: 'Alex Rivera',
    authorAvatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC3j0iMcJukmdOVIrdKqXct652DjZaGVopriJUcla9B6FKUMl-c7pojuMZdzhHbQeCds9QlyAnmg3aH4TXnCId3p5DwrCDujO5esmccI2Kqcj4rjpY-w5SNSwhTVloIxcaPb4lOqAyGNPQXjFHhErgVj_wZ-IXSoZpmjyXTeJnFKteoL88V-dGftNBFBHlvs7C5So0e4fm00o0TpnQlqJdV-Te-x6Cnkv2ceVdsOCSg5WckdFdzTUPTTv9Z1ChyCB1wTbK3gPBTs-zm'
  },
  {
    id: 'a2',
    title: 'Community Garden Volunteering',
    content: 'Join us this Saturday for our monthly outreach program. We will be helping the local community center with their spring planting, clean up, and setting up new soil beds. Wear clothes you do not mind getting dirty!',
    priority: 'Normal',
    targetAudience: 'All Youth',
    date: 'Yesterday',
    views: 89,
    status: 'Active',
    coverImage: 'https://images.unsplash.com/photo-1530741929025-a75655719bc2?auto=format&fit=crop&q=80&w=400',
    authorName: 'Marcus Chen',
    authorAvatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAL2LXgGPeFN0R1tqtuWJ3rZ9EGCrsKnP9AfFIMf5C5J99L0pn4_S-0mPU0dj3VTWbcMx1Xe-fzNis2pWfvoDNrMQZM2tQvBnSdS5ax1Qs8f7E2AxWKRl4MCQjdbnsmAdFNKKYyUhZFAD0EyL4qXblRtG2315Vmk3SSDCeBa_rmLOqwDfq8WQyB2ZNpMyIXEiSD2gpHjAsUKl7a5DqwFmxpdx0l-zqegtSY6dsmk267lf7DzuRmmM7iyuguQCPuqt3PewQVbl2OUxRq'
  },
  {
    id: 'a3',
    title: 'Friday Night Worship Setlist',
    content: 'The worship team has curated a special night of acoustic praise for this coming Friday. Preview the songs here: Way Maker, Praise, Gratitude, and Tremble. Doors open at 6:30 PM!',
    priority: 'Low',
    targetAudience: 'All Youth',
    date: 'Edited 2h ago',
    views: 45,
    status: 'Draft',
    coverImage: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&q=80&w=400',
    authorName: 'Alex Rivera',
    authorAvatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC3j0iMcJukmdOVIrdKqXct652DjZaGVopriJUcla9B6FKUMl-c7pojuMZdzhHbQeCds9QlyAnmg3aH4TXnCId3p5DwrCDujO5esmccI2Kqcj4rjpY-w5SNSwhTVloIxcaPb4lOqAyGNPQXjFHhErgVj_wZ-IXSoZpmjyXTeJnFKteoL88V-dGftNBFBHlvs7C5So0e4fm00o0TpnQlqJdV-Te-x6Cnkv2ceVdsOCSg5WckdFdzTUPTTv9Z1ChyCB1wTbK3gPBTs-zm'
  },
  {
    id: 'a4',
    title: 'Bible Study: Romans Chapter 12',
    content: 'Dive deep into what it means to be a "living sacrifice" in our next session. Bring your study guides! We will cover spiritual gifts, genuine love, and living in peace with others.',
    priority: 'Normal',
    targetAudience: 'Leaders Only',
    date: 'Oct 24, 2025',
    views: 215,
    status: 'Archive',
    coverImage: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?auto=format&fit=crop&q=80&w=400',
    authorName: 'Marcus Chen',
    authorAvatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAL2LXgGPeFN0R1tqtuWJ3rZ9EGCrsKnP9AfFIMf5C5J99L0pn4_S-0mPU0dj3VTWbcMx1Xe-fzNis2pWfvoDNrMQZM2tQvBnSdS5ax1Qs8f7E2AxWKRl4MCQjdbnsmAdFNKKYyUhZFAD0EyL4qXblRtG2315Vmk3SSDCeBa_rmLOqwDfq8WQyB2ZNpMyIXEiSD2gpHjAsUKl7a5DqwFmxpdx0l-zqegtSY6dsmk267lf7DzuRmmM7iyuguQCPuqt3PewQVbl2OUxRq'
  }
];

export const INITIAL_EVENTS: PortalEvent[] = [
  {
    id: 'e1',
    title: 'Youth Night Live',
    dateTime: 'Oct 11 • 7:00 PM',
    registered: 112,
    totalCapacity: 150,
    checkedIn: 87,
    type: 'live',
    dateKey: '2024-10-11',
    revenue: 560,
    registrationFields: []
  },
  {
    id: 'e2',
    title: 'Risktaker Generation Summit',
    dateTime: 'Oct 25 • All Day',
    registered: 225,
    totalCapacity: 500,
    checkedIn: 180,
    type: 'summit',
    dateKey: '2024-10-25',
    revenue: 3500,
    registrationFields: []
  },
  {
    id: 'e3',
    title: 'Leadership Meet',
    dateTime: 'Oct 07 • 6:00 PM',
    registered: 20,
    totalCapacity: 30,
    checkedIn: 18,
    type: 'meet',
    dateKey: '2024-10-07',
    revenue: 60,
    registrationFields: []
  },
  {
    id: 'e4',
    title: 'Community Clean-up',
    dateTime: 'Nov 08 • 6:30 PM',
    registered: 45,
    totalCapacity: 100,
    checkedIn: 0,
    type: 'cleanup',
    dateKey: '2024-11-08',
    revenue: 0,
    registrationFields: []
  }
];

export const INITIAL_SUBMISSIONS: ModerationSubmission[] = [
  {
    id: 'sub1',
    title: 'Exam Stress Breakthrough',
    name: 'Sarah J.',
    timeAgo: '20m ago',
    type: 'TESTIMONY',
    content: '"I was really struggling with my exams last week, feeling totally overwhelmed. During youth group on Wednesday, the message about \'Peace that surpasses understanding\' really hit home. I\'ve been feeling so much lighter since then and wanted to thank the leaders for praying with me!"',
    status: 'pending'
  },
  {
    id: 'sub2',
    title: 'Morning Reflection on Psalm 23',
    name: 'David Miller',
    timeAgo: '1h ago',
    type: 'DEVOTIONAL',
    content: '"Morning reflection on Psalm 23. Even when things feel dark, there\'s always a path forward. I wanted to share this with anyone else who\'s feeling a bit lost this week. Remember that He restores our souls and guides our paths."',
    status: 'pending'
  }
];

export const INITIAL_PRAYER_ITEMS: PrayerItem[] = [
  {
    id: 'pr1',
    category: 'STUDIES',
    text: '"Finals are starting tomorrow and I\'m really anxious about my chemistry exam. Please pray for clarity and calm."',
    author: 'Anonymous',
    stage: 'new',
    prayingCount: 3
  },
  {
    id: 'pr2',
    category: 'FAMILY',
    text: '"Praying for my parents as they navigate some tough health issues recently. Hoping for strength and swift healing."',
    author: 'Marcus K.',
    stage: 'new',
    prayingCount: 5
  },
  {
    id: 'pr3',
    category: 'FRIENDSHIP',
    text: '"Asking for reconciliation with my best friend. We had a huge misunderstanding last week and haven\'t spoken since."',
    author: 'Elena R.',
    stage: 'active',
    prayingCount: 12
  },
  {
    id: 'pr4',
    category: 'HEALTH',
    text: '"Praise report! My surgery went well and recovery is faster than expected. Thank you for all your prayer support!"',
    author: 'Tyler G.',
    stage: 'archived',
    prayingCount: 48
  }
];
