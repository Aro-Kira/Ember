import { useState, FormEvent } from 'react';
import {
  User,
  Mail,
  Shield,
  Bell,
  Palette,
  Save,
  Camera,
  Lock,
  ChevronRight,
  Check,
  X,
  Loader2
} from 'lucide-react';

type ThemePreference = 'dark' | 'light' | 'system';

interface SettingsPageProps {
  profile: any;
  onUpdateProfile: (updates: {
    name?: string;
    email?: string;
    avatar?: string;
    bio?: string;
    emergencyContact?: string;
  }) => void;
  theme: ThemePreference;
  onThemeChange: (theme: ThemePreference) => void;
}

export default function SettingsPage({ profile, onUpdateProfile, theme, onThemeChange }: SettingsPageProps) {
  const [notification, setNotification] = useState<string | null>(null);

  const triggerNotification = (message: string) => {
    setNotification(message);
    setTimeout(() => setNotification(null), 3000);
  };

  const [editName, setEditName] = useState(profile?.name || '');
  const [editEmail, setEditEmail] = useState(profile?.email || '');
  const [editAvatar, setEditAvatar] = useState(profile?.avatar || '');
  const [editBio, setEditBio] = useState(profile?.bio || '');
  const [editEmergency, setEditEmergency] = useState(profile?.emergencyContact || '');

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);

  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);

  const [emailPrayer, setEmailPrayer] = useState(true);
  const [emailModeration, setEmailModeration] = useState(true);
  const [emailEvents, setEmailEvents] = useState(false);
  const [pushAnnouncements, setPushAnnouncements] = useState(true);

  const [isSavingProfile, setIsSavingProfile] = useState(false);

  const handleSaveProfile = (e: FormEvent) => {
    e.preventDefault();
    setIsSavingProfile(true);
    setTimeout(() => {
      onUpdateProfile({
        name: editName,
        email: editEmail,
        avatar: editAvatar,
        bio: editBio,
        emergencyContact: editEmergency
      });
      setIsSavingProfile(false);
      triggerNotification('Profile updated successfully.');
    }, 600);
  };

  const handleChangePassword = (e: FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword || !confirmPassword) {
      triggerNotification('Please fill out all password fields.');
      return;
    }
    if (newPassword !== confirmPassword) {
      triggerNotification('New passwords do not match.');
      return;
    }
    setChangingPassword(true);
    setTimeout(() => {
      setChangingPassword(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      triggerNotification('Password changed successfully.');
    }, 800);
  };

  return (
    <div className="space-y-6">
      {notification && (
        <div className="fixed bottom-6 right-6 z-50 bg-primary-container text-on-primary-container px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 border border-primary animate-bounce">
          <Check className="w-5 h-5 text-primary" />
          <span className="font-sans font-medium text-sm">{notification}</span>
        </div>
      )}

      <div className="flex items-center gap-2">
        <h1 className="font-sans text-xl font-bold text-on-surface">Settings</h1>
        <span className="font-mono text-[10px] text-on-surface-variant uppercase tracking-wider bg-surface-container-highest px-2 py-0.5 rounded-full">
          Profile & Preferences
        </span>
      </div>

      <div className="grid grid-cols-12 gap-6 items-start">
        {/* Left Column: Profile Card */}
        <div className="col-span-12 lg:col-span-4 space-y-6">
          <div className="glass-card rounded-xl overflow-hidden">
            <div className="h-24 bg-gradient-to-br from-primary/30 via-surface-container-high to-tertiary-container/20 relative">
              <div className="absolute -bottom-8 left-6">
                <div className="relative group">
                  <img
                    className="w-20 h-20 rounded-2xl object-cover border-4 border-surface-container shadow-xl"
                    src={editAvatar || profile?.avatar || ''}
                    alt={editName || profile?.name || 'Leader'}
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 rounded-2xl bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                    <Camera className="w-5 h-5 text-white" />
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-12 pb-6 px-6 space-y-3">
              <div>
                <h2 className="font-sans text-lg font-bold text-on-surface">{editName || profile?.name || 'Leader Name'}</h2>
                <p className="font-sans text-xs text-on-surface-variant">{editEmail || profile?.email || 'leader@risktakergeneration.com'}</p>
              </div>

              <div className="flex items-center gap-2">
                <span className="bg-primary/20 text-primary font-mono text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
                  {profile?.role || 'Leader'}
                </span>
                <span className="bg-surface-container-highest text-on-surface-variant font-mono text-[10px] px-2.5 py-1 rounded-full border border-outline-variant">
                  Active
                </span>
              </div>

              {editBio && (
                <p className="text-on-surface-variant font-sans text-xs leading-relaxed pt-2 border-t border-outline-variant/30">
                  {editBio}
                </p>
              )}
            </div>
          </div>

          {/* Quick Stats */}
          <div className="glass-card p-5 rounded-xl space-y-4">
            <h3 className="font-sans text-sm font-bold text-on-surface">Activity Summary</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-sans text-xs text-on-surface-variant">Members Managed</span>
                <span className="font-mono text-xs text-primary font-bold">42</span>
              </div>
              <div className="h-px bg-outline-variant/30"></div>
              <div className="flex items-center justify-between">
                <span className="font-sans text-xs text-on-surface-variant">Events Hosted</span>
                <span className="font-mono text-xs text-primary font-bold">18</span>
              </div>
              <div className="h-px bg-outline-variant/30"></div>
              <div className="flex items-center justify-between">
                <span className="font-sans text-xs text-on-surface-variant">Moderations Reviewed</span>
                <span className="font-mono text-xs text-primary font-bold">156</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Settings Forms */}
        <div className="col-span-12 lg:col-span-8 space-y-6">
          {/* Profile Edit Section */}
          <div className="glass-card rounded-xl overflow-hidden">
            <div className="p-5 border-b border-outline-variant flex items-center gap-3">
              <div className="bg-primary/10 w-9 h-9 rounded-lg flex items-center justify-center">
                <User className="w-4.5 h-4.5 text-primary" />
              </div>
              <div>
                <h3 className="font-sans text-sm font-bold text-on-surface">Edit Profile</h3>
                <p className="font-mono text-[10px] text-on-surface-variant uppercase tracking-wider">Personal Information</p>
              </div>
            </div>

            <form onSubmit={handleSaveProfile} className="p-6 space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-on-surface-variant uppercase">Full Name</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      placeholder="Enter your full name"
                      className="w-full bg-surface-container-high border border-outline-variant rounded-lg px-4 py-2.5 pl-10 text-sm text-on-surface focus:outline-none focus:border-primary transition-all font-sans"
                    />
                    <User className="w-4 h-4 text-on-surface-variant absolute left-3 top-3 opacity-50" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-on-surface-variant uppercase">Email Address</label>
                  <div className="relative">
                    <input
                      type="email"
                      value={editEmail}
                      onChange={(e) => setEditEmail(e.target.value)}
                      placeholder="leader@risktakergeneration.com"
                      className="w-full bg-surface-container-high border border-outline-variant rounded-lg px-4 py-2.5 pl-10 text-sm text-on-surface focus:outline-none focus:border-primary transition-all font-sans"
                    />
                    <Mail className="w-4 h-4 text-on-surface-variant absolute left-3 top-3 opacity-50" />
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-on-surface-variant uppercase">Avatar URL</label>
                <div className="relative">
                  <input
                    type="text"
                    value={editAvatar}
                    onChange={(e) => setEditAvatar(e.target.value)}
                    placeholder="https://example.com/avatar.jpg"
                    className="w-full bg-surface-container-high border border-outline-variant rounded-lg px-4 py-2.5 pl-10 text-sm text-on-surface focus:outline-none focus:border-primary transition-all font-sans"
                  />
                  <Camera className="w-4 h-4 text-on-surface-variant absolute left-3 top-3 opacity-50" />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-on-surface-variant uppercase">Bio</label>
                <textarea
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                  rows={3}
                  placeholder="Tell the youth group a little about yourself..."
                  className="w-full bg-surface-container-high border border-outline-variant rounded-lg px-4 py-2.5 text-sm text-on-surface focus:outline-none focus:border-primary transition-all resize-none leading-relaxed font-sans"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-on-surface-variant uppercase">Emergency Contact</label>
                <div className="relative">
                  <input
                    type="text"
                    value={editEmergency}
                    onChange={(e) => setEditEmergency(e.target.value)}
                    placeholder="Name - Phone Number"
                    className="w-full bg-surface-container-high border border-outline-variant rounded-lg px-4 py-2.5 pl-10 text-sm text-on-surface focus:outline-none focus:border-primary transition-all font-sans"
                  />
                  <Shield className="w-4 h-4 text-on-surface-variant absolute left-3 top-3 opacity-50" />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={isSavingProfile}
                  className="bg-primary text-on-primary font-mono text-[11px] font-bold px-5 py-2.5 rounded-lg hover:opacity-90 active:scale-95 transition-all flex items-center gap-2 disabled:opacity-60 cursor-pointer"
                >
                  {isSavingProfile ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" /> Save Profile
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Account Settings */}
          <div className="glass-card rounded-xl overflow-hidden">
            <div className="p-5 border-b border-outline-variant flex items-center gap-3">
              <div className="bg-secondary/10 w-9 h-9 rounded-lg flex items-center justify-center">
                <Lock className="w-4.5 h-4.5 text-secondary" />
              </div>
              <div>
                <h3 className="font-sans text-sm font-bold text-on-surface">Account Settings</h3>
                <p className="font-mono text-[10px] text-on-surface-variant uppercase tracking-wider">Security & Access</p>
              </div>
            </div>

            <div className="divide-y divide-outline-variant/30">
              {/* Change Password */}
              <form onSubmit={handleChangePassword} className="p-6 space-y-4">
                <h4 className="font-sans text-xs font-bold text-on-surface uppercase tracking-wider">Change Password</h4>

                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-on-surface-variant uppercase">Current Password</label>
                    <input
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="Enter current password"
                      className="w-full bg-surface-container-high border border-outline-variant rounded-lg px-4 py-2.5 text-sm text-on-surface focus:outline-none focus:border-primary transition-all font-sans"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="block text-xs font-semibold text-on-surface-variant uppercase">New Password</label>
                      <input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Enter new password"
                        className="w-full bg-surface-container-high border border-outline-variant rounded-lg px-4 py-2.5 text-sm text-on-surface focus:outline-none focus:border-primary transition-all font-sans"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-xs font-semibold text-on-surface-variant uppercase">Confirm Password</label>
                      <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Re-enter new password"
                        className="w-full bg-surface-container-high border border-outline-variant rounded-lg px-4 py-2.5 text-sm text-on-surface focus:outline-none focus:border-primary transition-all font-sans"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={changingPassword}
                    className="bg-surface-container-highest text-on-surface font-mono text-[11px] font-bold px-5 py-2.5 rounded-lg border border-outline-variant hover:bg-surface-container-high active:scale-95 transition-all flex items-center gap-2 disabled:opacity-60 cursor-pointer"
                  >
                    {changingPassword ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" /> Updating...
                      </>
                    ) : (
                      <>
                        <Lock className="w-4 h-4" /> Update Password
                      </>
                    )}
                  </button>
                </div>
              </form>

              {/* Two-Factor Authentication */}
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="bg-tertiary/10 w-9 h-9 rounded-lg flex items-center justify-center">
                      <Shield className="w-4.5 h-4.5 text-tertiary-container" />
                    </div>
                    <div>
                      <h4 className="font-sans text-sm font-bold text-on-surface">Two-Factor Authentication</h4>
                      <p className="font-sans text-xs text-on-surface-variant">Add an extra layer of security to your account</p>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setTwoFactorEnabled(!twoFactorEnabled);
                      triggerNotification(
                        twoFactorEnabled
                          ? 'Two-factor authentication disabled.'
                          : 'Two-factor authentication enabled.'
                      );
                    }}
                    className={`relative w-12 h-6 rounded-full transition-colors duration-300 cursor-pointer ${
                      twoFactorEnabled ? 'bg-primary' : 'bg-surface-container-highest border border-outline-variant'
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 w-5 h-5 rounded-full bg-surface-bright shadow-md transition-transform duration-300 ${
                        twoFactorEnabled ? 'translate-x-6.5' : 'translate-x-0.5'
                      }`}
                    />
                  </button>
                </div>

                <div className="mt-3 ml-12 flex items-center gap-2">
                  <span className={`font-mono text-[10px] font-bold uppercase tracking-wider ${
                    twoFactorEnabled ? 'text-primary' : 'text-on-surface-variant'
                  }`}>
                    {twoFactorEnabled ? 'Enabled' : 'Disabled'}
                  </span>
                  {twoFactorEnabled && (
                    <span className="bg-primary/10 text-primary font-mono text-[9px] px-2 py-0.5 rounded-full font-bold">
                      SECURED
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Notification Preferences */}
          <div className="glass-card rounded-xl overflow-hidden">
            <div className="p-5 border-b border-outline-variant flex items-center gap-3">
              <div className="bg-tertiary-container/20 w-9 h-9 rounded-lg flex items-center justify-center">
                <Bell className="w-4.5 h-4.5 text-tertiary-container" />
              </div>
              <div>
                <h3 className="font-sans text-sm font-bold text-on-surface">Notification Preferences</h3>
                <p className="font-mono text-[10px] text-on-surface-variant uppercase tracking-wider">Alerts & Updates</p>
              </div>
            </div>

            <div className="p-6 space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-sans text-sm font-semibold text-on-surface">New Prayer Requests</h4>
                  <p className="font-sans text-xs text-on-surface-variant">Get notified when a youth submits a prayer request</p>
                </div>
                <button
                  onClick={() => {
                    setEmailPrayer(!emailPrayer);
                    triggerNotification(emailPrayer ? 'Prayer request notifications disabled.' : 'Prayer request notifications enabled.');
                  }}
                  className={`relative w-12 h-6 rounded-full transition-colors duration-300 cursor-pointer ${
                    emailPrayer ? 'bg-primary' : 'bg-surface-container-highest border border-outline-variant'
                  }`}
                >
                  <span
                    className={`absolute top-0.5 w-5 h-5 rounded-full bg-surface-bright shadow-md transition-transform duration-300 ${
                      emailPrayer ? 'translate-x-6.5' : 'translate-x-0.5'
                    }`}
                  />
                </button>
              </div>

              <div className="h-px bg-outline-variant/30"></div>

              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-sans text-sm font-semibold text-on-surface">Pending Moderation</h4>
                  <p className="font-sans text-xs text-on-surface-variant">Alerts for testimonies or devotions awaiting review</p>
                </div>
                <button
                  onClick={() => {
                    setEmailModeration(!emailModeration);
                    triggerNotification(emailModeration ? 'Moderation alerts disabled.' : 'Moderation alerts enabled.');
                  }}
                  className={`relative w-12 h-6 rounded-full transition-colors duration-300 cursor-pointer ${
                    emailModeration ? 'bg-primary' : 'bg-surface-container-highest border border-outline-variant'
                  }`}
                >
                  <span
                    className={`absolute top-0.5 w-5 h-5 rounded-full bg-surface-bright shadow-md transition-transform duration-300 ${
                      emailModeration ? 'translate-x-6.5' : 'translate-x-0.5'
                    }`}
                  />
                </button>
              </div>

              <div className="h-px bg-outline-variant/30"></div>

              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-sans text-sm font-semibold text-on-surface">Event Registrations</h4>
                  <p className="font-sans text-xs text-on-surface-variant">Notify when youth register for upcoming events</p>
                </div>
                <button
                  onClick={() => {
                    setEmailEvents(!emailEvents);
                    triggerNotification(emailEvents ? 'Event registration notifications disabled.' : 'Event registration notifications enabled.');
                  }}
                  className={`relative w-12 h-6 rounded-full transition-colors duration-300 cursor-pointer ${
                    emailEvents ? 'bg-primary' : 'bg-surface-container-highest border border-outline-variant'
                  }`}
                >
                  <span
                    className={`absolute top-0.5 w-5 h-5 rounded-full bg-surface-bright shadow-md transition-transform duration-300 ${
                      emailEvents ? 'translate-x-6.5' : 'translate-x-0.5'
                    }`}
                  />
                </button>
              </div>

              <div className="h-px bg-outline-variant/30"></div>

              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-sans text-sm font-semibold text-on-surface">Push: Announcements</h4>
                  <p className="font-sans text-xs text-on-surface-variant">Receive push notifications for all published announcements</p>
                </div>
                <button
                  onClick={() => {
                    setPushAnnouncements(!pushAnnouncements);
                    triggerNotification(pushAnnouncements ? 'Push announcements disabled.' : 'Push announcements enabled.');
                  }}
                  className={`relative w-12 h-6 rounded-full transition-colors duration-300 cursor-pointer ${
                    pushAnnouncements ? 'bg-primary' : 'bg-surface-container-highest border border-outline-variant'
                  }`}
                >
                  <span
                    className={`absolute top-0.5 w-5 h-5 rounded-full bg-surface-bright shadow-md transition-transform duration-300 ${
                      pushAnnouncements ? 'translate-x-6.5' : 'translate-x-0.5'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* Appearance */}
          <div className="glass-card rounded-xl overflow-hidden">
            <div className="p-5 border-b border-outline-variant flex items-center gap-3">
              <div className="bg-on-surface/5 w-9 h-9 rounded-lg flex items-center justify-center">
                <Palette className="w-4.5 h-4.5 text-on-surface" />
              </div>
              <div>
                <h3 className="font-sans text-sm font-bold text-on-surface">Appearance</h3>
                <p className="font-mono text-[10px] text-on-surface-variant uppercase tracking-wider">Theme & Display</p>
              </div>
            </div>

            <div className="p-6">
              <h4 className="font-sans text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-4">Theme Preference</h4>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {(['dark', 'light', 'system'] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => {
                      onThemeChange(t);
                      triggerNotification(`Theme set to ${t.charAt(0).toUpperCase() + t.slice(1)}.`);
                    }}
                    className={`relative p-4 rounded-xl border-2 transition-all cursor-pointer text-left ${
                      theme === t
                        ? 'border-primary bg-primary/5'
                        : 'border-outline-variant/50 bg-surface-container-high/30 hover:border-outline-variant'
                    }`}
                  >
                    {theme === t && (
                      <div className="absolute top-2 right-2">
                        <Check className="w-4 h-4 text-primary" />
                      </div>
                    )}

                    <div className="mb-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        t === 'dark'
                          ? 'bg-slate-800 text-on-surface'
                          : t === 'light'
                            ? 'bg-gray-100 text-gray-800'
                            : 'bg-gradient-to-br from-slate-800 to-gray-100 text-on-surface'
                      }`}>
                        <Palette className="w-5 h-5" />
                      </div>
                    </div>

                    <h5 className="font-sans text-sm font-bold text-on-surface capitalize">{t}</h5>
                    <p className="font-sans text-[11px] text-on-surface-variant mt-0.5">
                      {t === 'dark' && 'Oled-friendly dark mode'}
                      {t === 'light' && 'Clean light appearance'}
                      {t === 'system' && 'Match device setting'}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
