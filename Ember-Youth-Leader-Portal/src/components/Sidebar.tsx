import { NavTab } from '../types';
import { 
  LayoutDashboard, 
  Users, 
  Megaphone, 
  Calendar, 
  Flame, 
  QrCode, 
  Settings, 
  HelpCircle, 
  FlameKindling,
  X,
  BookOpen,
  ClipboardList,
  LogOut,
  CalendarDays
} from 'lucide-react';

interface SidebarProps {
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
  isOpen: boolean;
  onClose: () => void;
  onLaunchScanner: () => void;
  onLogout: () => void;
  profile?: any;
}

export default function Sidebar({ 
  activeTab, 
  setActiveTab, 
  isOpen, 
  onClose,
  onLaunchScanner,
  onLogout,
  profile
}: SidebarProps) {
  
  const menuItems = [
    { id: 'overview', name: 'Overview', icon: LayoutDashboard },
    { id: 'members', name: 'Youth Members', icon: Users },
    { id: 'announcements', name: 'Announcements', icon: Megaphone },
    { id: 'events', name: 'Manage Events', icon: Calendar },
    { id: 'prayers', name: 'Prayer Management', icon: Flame },
    { id: 'feed', name: 'Community Feed', icon: BookOpen },
    { id: 'attendance', name: 'Attendance Log', icon: ClipboardList },
    { id: 'sunday', name: 'Sunday Attendance', icon: CalendarDays },
  ] as const;

  const handleNav = (tabId: NavTab) => {
    setActiveTab(tabId);
    onClose();
  };

  const displayName = profile?.name || 'Alex Rivera';
  const displayRole = profile?.role === 'leader' ? 'YOUTH LEADER' : 'LEAD PASTOR';
  const displayAvatar = profile?.avatar || 'https://lh3.googleusercontent.com/aida-public/AB6AXuC3j0iMcJukmdOVIrdKqXct652DjZaGVopriJUcla9B6FKUMl-c7pojuMZdzhHbQeCds9QlyAnmg3aH4TXnCId3p5DwrCDujO5esmccI2Kqcj4rjpY-w5SNSwhTVloIxcaPb4lOqAyGNPQXjFHhErgVj_wZ-IXSoZpmjyXTeJnFKteoL88V-dGftNBFBHlvs7C5So0e4fm00o0TpnQlqJdV-Te-x6Cnkv2ceVdsOCSg5WckdFdzTUPTTv9Z1ChyCB1wTbK3gPBTs-zm';

  const sidebarContent = (
    <div className="flex flex-col h-full bg-surface-container-low border-r border-outline-variant p-4">
      {/* Brand Header */}
      <div className="flex items-center justify-between mb-8 px-2">
        <div className="flex items-center gap-3">
          <img src="/favicon.svg" className="w-12 h-12 text-primary" />
          <div>
            <h1 className="text-xl font-black tracking-[0.15em] uppercase text-primary">Risktaker Generation</h1>
            <p className="text-[8px] text-on-surface font-mono tracking-[0.3em] uppercase leading-none mt-1">YOUTH_SYSTEM // PH_4</p>
          </div>
        </div>
        
        {/* Mobile Close Button */}
        <button 
          onClick={onClose}
          className="lg:hidden p-1 rounded-lg hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleNav(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-all duration-150 active:scale-98 ${
                isActive 
                  ? 'text-on-primary-container bg-primary-container font-semibold shadow-md shadow-primary/10' 
                  : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'text-primary' : ''}`} />
              <span className="font-sans text-sm">{item.name}</span>
            </button>
          );
        })}

        {/* Dedicated Scanner Tab */}
        <button
          onClick={() => handleNav('scanner')}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-all duration-150 active:scale-98 ${
            activeTab === 'scanner'
              ? 'text-on-primary-container bg-primary-container font-semibold shadow-md shadow-primary/10'
              : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high'
          }`}
        >
          <QrCode className="w-5 h-5" />
          <span className="font-sans text-sm">Attendance Scanner</span>
        </button>
      </nav>

      {/* Footer / Utilities */}
      <div className="mt-auto border-t border-outline-variant pt-4 space-y-2">
        {/* Launch Live QR Scanner FAB */}
        <button 
          onClick={() => {
            onLaunchScanner();
            onClose();
          }}
          className="w-full bg-primary text-on-primary font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 hover:opacity-90 active:scale-95 transition-all shadow-lg shadow-primary/20"
        >
          <QrCode className="w-4 h-4 text-on-primary" />
          <span className="font-mono text-xs tracking-wider">Launch Live Scanner</span>
        </button>

        {/* Settings */}
        <button 
          onClick={() => handleNav('settings')}
          className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg transition-colors text-left ${
            activeTab === 'settings'
              ? 'text-primary bg-primary/10'
              : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high'
          }`}
        >
          <Settings className="w-4 h-4" />
          <span className="font-sans text-sm">Settings</span>
        </button>

        {/* Logout */}
        <button 
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-4 py-2 text-error hover:bg-error/10 rounded-lg transition-colors text-left"
        >
          <LogOut className="w-4 h-4" />
          <span className="font-sans text-sm">Sign Out</span>
        </button>

        {/* Leader Profile Badge */}
        <div className="flex items-center gap-3 p-3 mt-4 rounded-xl bg-surface-container-high border border-outline-variant">
          <img 
            className="w-9 h-9 rounded-full border border-primary/30 object-cover" 
            src={displayAvatar}
            alt={displayName}
            referrerPolicy="no-referrer"
          />
          <div className="overflow-hidden">
            <p className="font-sans text-sm font-bold text-on-surface truncate">{displayName}</p>
            <p className="font-mono text-[9px] text-primary tracking-wider">{displayRole}</p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar (Pinned) */}
      <aside className="hidden lg:flex flex-col w-64 h-screen fixed left-0 top-0 z-40">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer (Slides In Overlay) */}
      <div className={`lg:hidden fixed inset-0 z-50 transition-opacity duration-300 ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
        {/* Backdrop overlay */}
        <div 
          onClick={onClose}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        />
        
        {/* Drawer panel */}
        <div className={`absolute top-0 left-0 w-64 h-full transform transition-transform duration-300 ease-out ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          {sidebarContent}
        </div>
      </div>
    </>
  );
}


