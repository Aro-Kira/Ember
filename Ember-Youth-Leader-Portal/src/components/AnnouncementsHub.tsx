import { useState, FormEvent, useRef } from 'react';
import { 
  Megaphone, 
  Send, 
  Eye, 
  FileEdit, 
  Clock, 
  PlusCircle, 
  Sparkles,
  Smartphone,
  ChevronRight,
  ArrowRight,
  Image as ImageIcon,
  Trash2,
  Edit,
  ChevronDown,
  ChevronUp,
  Upload,
  X,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import { Announcement } from '../types';
import toast from '../hooks/useToast.tsx';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api/v1';
const BACKEND_ORIGIN = API_BASE_URL.startsWith('http') ? new URL(API_BASE_URL).origin : '';

interface AnnouncementsHubProps {
  announcements: Announcement[];
  onAddAnnouncement: (announcement: Omit<Announcement, 'id' | 'views' | 'date' | 'authorName' | 'authorAvatar'>) => void;
  onUpdateAnnouncement: (id: string, updates: Partial<Announcement>) => void;
  onDeleteAnnouncement: (id: string) => void;
}

export default function AnnouncementsHub({ 
  announcements, 
  onAddAnnouncement,
  onUpdateAnnouncement,
  onDeleteAnnouncement
}: AnnouncementsHubProps) {
  const [filter, setFilter] = useState<'All' | 'Active' | 'Draft'>('All');
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);
  const [expandedCard, setExpandedCard] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  
  // Form State
  const [formTitle, setFormTitle] = useState('Next Gen Leadership Summit');
  const [formPriority, setFormPriority] = useState<'High' | 'Normal' | 'Low'>('High');
  const [formAudience, setFormAudience] = useState<'All Youth' | 'Middle Schoolers' | 'High Schoolers' | 'Leaders Only'>('All Youth');
  const [formContent, setFormContent] = useState('Join us for a weekend of growth, vision, and connection. This summit is designed for aspiring student leaders who want to make a real impact in their schools and communities. Register now in the events tab.');
  const [formCover, setFormCover] = useState('https://lh3.googleusercontent.com/aida-public/AB6AXuDKL65a6IxWPGYdM_EGFATLgguLTkdT7Iu0uLfgt9BNZYZrMTTj5fU5rhQdVQu1t6sqyb9BkXUrE3ankKUN412yfbA7CYrWn3x8z-e-nrC0lFlCaSnS2G8yQnNBtFYegTpoJr80DTwfC33z8TTC2B6rhbRPItnUu9J5aVgF1TiC4hJhlOrTaUngrVyVx9l08BCaFo81huiHMGEYSLeFrYeIumb0DU0PKTBv8GkGlS5HSgUmJDeiANH1F33U0BR0M4jqBxshbKs0P5aJ');

  const handlePostToApp = (e: FormEvent) => {
    e.preventDefault();
    if (!formTitle || !formContent) {
      toast.error('Please fill out the Title and Content fields before posting.');
      return;
    }

    if (editingAnnouncement) {
      onUpdateAnnouncement(editingAnnouncement.id, {
        title: formTitle,
        content: formContent,
        priority: formPriority,
        targetAudience: formAudience,
        status: 'Active',
        coverImage: formCover
      });
      setEditingAnnouncement(null);
      toast.success('Announcement updated successfully!');
    } else {
      onAddAnnouncement({
        title: formTitle,
        content: formContent,
        priority: formPriority,
        targetAudience: formAudience,
        status: 'Active',
        coverImage: formCover
      });
      toast.success('Announcement posted successfully! It is now visible in the live dashboard feed.');
    }

      // Reset Form to empty values or placeholder
      setFormTitle('');
      setFormContent('');
      setFormPriority('Normal');
      setFormAudience('All Youth');
      if (!editingAnnouncement) {
        toast.success('Announcement posted successfully! It is now visible in the live dashboard feed.');
      }
  };

  const handleSaveDraft = () => {
    if (!formTitle || !formContent) {
      toast.error('Please fill out the Title and Content fields to save a draft.');
      return;
    }

    if (editingAnnouncement) {
      onUpdateAnnouncement(editingAnnouncement.id, {
        title: formTitle,
        content: formContent,
        priority: formPriority,
        targetAudience: formAudience,
        status: 'Draft',
        coverImage: formCover
      });
      setEditingAnnouncement(null);
      toast.success('Announcement updated successfully!');
    } else {
      onAddAnnouncement({
        title: formTitle,
        content: formContent,
        priority: formPriority,
        targetAudience: formAudience,
        status: 'Draft',
        coverImage: formCover
      });
    }

    if (editingAnnouncement) {
      toast.success('Announcement updated successfully.');
    } else {
      toast.success('Draft saved successfully.');
    }
  };

  const handleStartEdit = (announcement: Announcement) => {
    setEditingAnnouncement(announcement);
    setFormTitle(announcement.title);
    setFormContent(announcement.content);
    setFormPriority(announcement.priority);
    setFormAudience(announcement.targetAudience);
    const coverUrl = announcement.coverImage || '';
    setFormCover(coverUrl.startsWith('/uploads/') ? BACKEND_ORIGIN + coverUrl : coverUrl);
  };

  const handleCancelEdit = () => {
    setEditingAnnouncement(null);
    setFormTitle('');
    setFormContent('');
    setFormPriority('Normal');
    setFormAudience('All Youth');
    setFormCover('');
  };

  const handleDelete = (id: string) => {
    onDeleteAnnouncement(id);
    setDeleteConfirmId(null);
  };

  const handlePublishToggle = (announcement: Announcement) => {
    const newStatus = announcement.status === 'Active' ? 'Draft' : 'Active';
    onUpdateAnnouncement(announcement.id, { status: newStatus });
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be under 5MB');
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    setFormCover(previewUrl);
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('coverImage', file);
      const token = localStorage.getItem('rg_leader_access_token');
      const response = await fetch(`${BACKEND_ORIGIN}/api/v1/upload`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Upload failed');
      }
      const data = await response.json();
      setFormCover(BACKEND_ORIGIN + data.url);
    } catch (err: any) {
      toast.error('Upload failed: ' + (err.message || 'Unknown error'));
      setFormCover('');
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveCover = () => {
    setFormCover('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const toggleExpand = (id: string) => {
    setExpandedCard(expandedCard === id ? null : id);
  };

  const filteredAnnouncements = announcements.filter(item => {
    if (filter === 'All') return true;
    return item.status === filter;
  });

  return (
    <div className="grid grid-cols-12 gap-6 items-start">
      {/* Left Column: Announcements list (Span 5 on large screens) */}
      <section className="col-span-12 lg:col-span-5 space-y-4 max-h-[calc(100vh-140px)] overflow-y-auto pr-1 custom-scrollbar">
        <div className="flex border-b border-surface-variant w-full gap-4 pb-2">
          {(['All', 'Active', 'Draft'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`pb-1 font-sans text-sm font-semibold transition-colors relative cursor-pointer ${
                filter === tab ? 'text-primary' : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              {tab === 'All' ? `All Items (${announcements.length})` : tab}
              {filter === tab && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />
              )}
            </button>
          ))}
        </div>

        {/* Announcement Cards */}
        <div className="space-y-4">
          {filteredAnnouncements.length > 0 ? (
            filteredAnnouncements.map((item) => (
              <div 
                key={item.id}
                className={`bg-surface-container-low border p-4 rounded-xl transition-all duration-200 ${
                  item.status === 'Draft' 
                    ? 'border-dashed border-outline-variant opacity-60' 
                    : item.priority === 'High' 
                      ? 'border-l-4 border-l-primary border-outline-variant/30 bg-surface-container-high/30' 
                      : 'border-l-4 border-l-green-500 border-outline-variant/30'
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <span className={`font-mono text-[9px] px-2 py-0.5 rounded-full font-bold uppercase ${
                    item.priority === 'High' 
                      ? 'bg-primary/20 text-primary' 
                      : item.status === 'Draft' 
                        ? 'bg-surface-container-highest text-on-surface-variant' 
                        : 'bg-secondary-container text-secondary'
                  }`}>
                    {item.status === 'Draft' ? 'Draft' : `${item.priority} Priority`}
                  </span>
                  <span className="text-on-surface-variant text-xs font-mono">{item.date}</span>
                </div>
                <h3 
                  className="font-sans text-sm font-bold text-on-surface mb-1 cursor-pointer hover:text-primary transition-colors"
                  onClick={() => toggleExpand(item.id)}
                >
                  {item.title}
                </h3>
                <p className={`text-on-surface-variant text-xs leading-relaxed ${
                  expandedCard === item.id ? '' : 'line-clamp-2'
                }`}>
                  {expandedCard === item.id ? item.content : `${item.content.substring(0, 120)}${item.content.length > 120 ? '...' : ''}`}
                </p>
                <div className="flex items-center justify-between mt-3">
                  <div className="flex items-center gap-4 text-[11px] text-on-surface-variant font-mono">
                    <span className="flex items-center gap-1">
                      <Eye className="w-3.5 h-3.5" /> {item.views ?? 0} views
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" /> {item.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleExpand(item.id)}
                      className="flex items-center gap-1 text-[10px] text-primary font-semibold hover:underline cursor-pointer"
                    >
                      {expandedCard === item.id ? (
                        <>
                          <ChevronUp className="w-3 h-3" /> Less
                        </>
                      ) : (
                        <>
                          <ChevronDown className="w-3 h-3" /> Read More
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => handlePublishToggle(item)}
                      className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg cursor-pointer transition-all active:scale-95 ${
                        item.status === 'Active'
                          ? 'bg-green-500/15 text-green-600 border border-green-500/30 hover:bg-green-500/25'
                          : 'bg-amber-500/15 text-amber-600 border border-amber-500/30 hover:bg-amber-500/25'
                      }`}
                    >
                      {item.status === 'Active' ? (
                        <>
                          <CheckCircle2 className="w-4 h-4" />
                          Published
                        </>
                      ) : (
                        <>
                          <XCircle className="w-4 h-4" />
                          Draft
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => handleStartEdit(item)}
                      className="p-1 text-on-surface-variant hover:text-primary transition-colors cursor-pointer"
                      title="Edit announcement"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setDeleteConfirmId(item.id)}
                      className="p-1 text-on-surface-variant hover:text-error transition-colors cursor-pointer"
                      title="Delete announcement"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                {/* Expanded Detail View */}
                {expandedCard === item.id && (
                  <div className="mt-3 pt-3 border-t border-outline-variant/30">
                    <div className="flex items-center gap-2 text-on-surface-variant text-[11px] font-mono mb-2">
                      <span className="font-semibold">Target:</span> {item.targetAudience}
                    </div>
                    <div className="flex items-center gap-2 text-on-surface-variant text-[11px] font-mono">
                      <span className="font-semibold">Posted by:</span> {item.authorName}
                    </div>
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="text-center py-12 text-on-surface-variant text-sm font-sans">
              No announcements in this category yet.
            </div>
          )}
        </div>
      </section>

      {/* Right Column: Create/Edit form & Live Mobile Preview (Span 7) */}
      <section className="col-span-12 lg:col-span-7 space-y-6">
        {/* Create/Edit Form Card */}
        <div className="bg-surface-container border border-surface-variant rounded-2xl p-6 shadow-2xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-outline-variant/30 pb-4">
            <div className="flex items-center gap-2">
              {editingAnnouncement ? (
                <>
                  <Edit className="w-5 h-5 text-primary" />
                  <h2 className="font-sans text-md font-bold text-on-surface">Edit Announcement</h2>
                </>
              ) : (
                <>
                  <PlusCircle className="w-5 h-5 text-primary" />
                  <h2 className="font-sans text-md font-bold text-on-surface">Create New Announcement</h2>
                </>
              )}
            </div>
            <div className="flex gap-2">
              {editingAnnouncement && (
                <button 
                  type="button"
                  onClick={handleCancelEdit}
                  className="px-4 py-2 text-xs font-semibold border border-error rounded-lg text-error hover:bg-error/10 transition-colors cursor-pointer"
                >
                  Cancel Edit
                </button>
              )}
              <button 
                type="button"
                onClick={handleSaveDraft}
                className="px-4 py-2 text-xs font-semibold border border-surface-variant rounded-lg text-on-surface hover:bg-surface-container-high transition-colors cursor-pointer"
              >
                {editingAnnouncement ? 'Save Changes' : 'Save as Draft'}
              </button>
              <button 
                type="button"
                onClick={handlePostToApp}
                className="bg-primary text-background font-bold text-xs px-5 py-2 rounded-lg hover:brightness-110 active:scale-95 transition-all cursor-pointer flex items-center gap-1"
              >
                <Send className="w-3.5 h-3.5" /> {editingAnnouncement ? 'Save Changes' : 'Post to App'}
              </button>
            </div>
          </div>

          <form className="space-y-4 font-sans text-sm">
            <div>
              <label className="block text-xs font-semibold text-on-surface-variant uppercase mb-1">Bulletin Title</label>
              <input 
                type="text"
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                placeholder="e.g. Next Gen Leadership Summit"
                className="w-full bg-background border border-outline-variant rounded-lg px-4 py-2.5 text-on-surface font-semibold focus:outline-none focus:border-primary transition-all"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-on-surface-variant uppercase mb-1">Priority level</label>
                <select 
                  value={formPriority}
                  onChange={(e) => setFormPriority(e.target.value as any)}
                  className="w-full bg-background border border-outline-variant rounded-lg px-4 py-2.5 text-on-surface focus:outline-none focus:border-primary"
                >
                  <option value="Normal">Normal</option>
                  <option value="High">High Priority</option>
                  <option value="Low">Low</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-on-surface-variant uppercase mb-1">Target Audience</label>
                <select 
                  value={formAudience}
                  onChange={(e) => setFormAudience(e.target.value as any)}
                  className="w-full bg-background border border-outline-variant rounded-lg px-4 py-2.5 text-on-surface focus:outline-none focus:border-primary"
                >
                  <option value="All Youth">All Youth</option>
                  <option value="Middle Schoolers">Middle Schoolers</option>
                  <option value="High Schoolers">High Schoolers</option>
                  <option value="Leaders Only">Leaders Only</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-on-surface-variant uppercase mb-1">Content Details</label>
              <textarea 
                value={formContent}
                onChange={(e) => setFormContent(e.target.value)}
                rows={4}
                placeholder="Share full descriptions, schedules, etc..."
                className="w-full bg-background border border-outline-variant rounded-lg px-4 py-2.5 text-on-surface focus:outline-none focus:border-primary transition-all resize-none leading-relaxed"
              />
            </div>

            {/* Cover Image Upload */}
            <div>
              <label className="block text-xs font-semibold text-on-surface-variant uppercase mb-1">Cover Image</label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
              {formCover ? (
                <div className="relative rounded-lg overflow-hidden border border-outline-variant">
                  <img
                    src={formCover}
                    alt="Cover preview"
                    className="w-full h-32 object-cover"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3 py-1.5 text-xs font-semibold bg-background/90 rounded-lg mr-2 cursor-pointer hover:bg-background transition-colors"
                    >
                      Change
                    </button>
                    <button
                      type="button"
                      onClick={handleRemoveCover}
                      className="px-3 py-1.5 text-xs font-semibold bg-error/90 text-background rounded-lg cursor-pointer hover:bg-error transition-colors"
                    >
                      Remove
                    </button>
                  </div>
                  {uploading && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                      <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    </div>
                  )}
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="w-full py-4 border-2 border-dashed border-outline-variant rounded-lg text-on-surface-variant hover:border-primary hover:text-primary transition-all cursor-pointer flex flex-col items-center gap-2"
                >
                  <Upload className="w-5 h-5" />
                  <span className="text-xs font-semibold">
                    {uploading ? 'Uploading...' : 'Click to upload cover image'}
                  </span>
                  <span className="text-[10px] opacity-60">Recommended: 1200x630px (16:9 ratio)</span>
                  <span className="text-[10px] opacity-60">JPG, PNG, WebP (max 5MB)</span>
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Live Mobile Mockup Preview */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-on-surface-variant px-2">
            <Smartphone className="w-4 h-4 text-secondary" />
            <h3 className="font-mono text-[10px] uppercase tracking-wider">Live Mobile App Mockup Preview</h3>
          </div>
          
          <div className="bg-surface-dim border border-surface-variant rounded-2xl py-8 flex items-center justify-center relative overflow-hidden">
            {/* Ambient background glow effects */}
            <div className="absolute inset-0 opacity-10 blur-3xl pointer-events-none">
              <div className="absolute top-1/4 left-1/4 w-48 h-48 bg-primary rounded-full"></div>
              <div className="absolute bottom-1/4 right-1/4 w-48 h-48 bg-tertiary-container rounded-full"></div>
            </div>

            {/* iPhone Shell Frame */}
            <div className="w-[280px] h-[480px] bg-background border-4 border-slate-800 rounded-[36px] shadow-2xl relative overflow-hidden flex flex-col z-10">
              {/* Camera Notch */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-28 h-5 bg-slate-800 rounded-b-xl z-20"></div>

              {/* Simulated App Bar Header */}
              <div className="pt-6 px-4 pb-3 flex justify-between items-center bg-background/80 backdrop-blur-md border-b border-outline-variant/10">
                <ChevronRight className="w-4 h-4 text-on-surface transform rotate-180" />
                <span className="font-sans text-xs text-primary font-black tracking-widest">RG</span>
                <span className="w-4 h-4"></span> {/* Spacer */}
              </div>

              {/* Simulated Scrollable Feed */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                {/* Active Card Mockup */}
                <div className="bg-surface-container rounded-2xl overflow-hidden shadow-lg border border-outline-variant/20">
                  
                  {/* Banner Cover Image */}
                  <div className="h-28 w-full bg-slate-900 overflow-hidden relative">
                    {formCover ? (
                      <img 
                        className="w-full h-full object-cover opacity-80" 
                        src={formCover} 
                        alt="Banner Preview"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ImageIcon className="w-8 h-8 text-slate-600" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  </div>

                  {/* Content details inside phone */}
                  <div className="p-4 relative">
                    {/* Badge */}
                    <div className={`absolute -top-3 right-4 font-mono text-[8px] px-2.5 py-1 rounded-full shadow-lg font-bold uppercase ${
                      formPriority === 'High' 
                        ? 'bg-primary text-background' 
                        : 'bg-secondary-container text-secondary'
                    }`}>
                      {formPriority} Priority
                    </div>

                    <h4 className="font-sans text-xs font-bold text-on-surface leading-snug mb-1.5">
                      {formTitle || 'Enter title above...'}
                    </h4>

                    {/* Author banner inside phone */}
                    <div className="flex items-center gap-1.5 mb-2.5">
                      <img 
                        className="w-4 h-4 rounded-full border border-primary/20" 
                        src="https://lh3.googleusercontent.com/aida-public/AB6AXuC3j0iMcJukmdOVIrdKqXct652DjZaGVopriJUcla9B6FKUMl-c7pojuMZdzhHbQeCds9QlyAnmg3aH4TXnCId3p5DwrCDujO5esmccI2Kqcj4rjpY-w5SNSwhTVloIxcaPb4lOqAyGNPQXjFHhErgVj_wZ-IXSoZpmjyXTeJnFKteoL88V-dGftNBFBHlvs7C5So0e4fm00o0TpnQlqJdV-Te-x6Cnkv2ceVdsOCSg5WckdFdzTUPTTv9Z1ChyCB1wTbK3gPBTs-zm" 
                        alt="Author"
                        referrerPolicy="no-referrer"
                      />
                      <span className="text-[9px] text-on-surface-variant font-medium">Alex Rivera • Just now</span>
                    </div>

                    <p className="text-[11px] text-on-surface-variant leading-relaxed font-sans">
                      {formContent.length > 120 ? `${formContent.substring(0, 120)}...` : formContent || 'Enter content description above...'}
                    </p>

                    <button 
                      type="button"
                      className="w-full mt-3 bg-surface-container-highest text-on-surface font-sans font-bold py-1.5 rounded-xl text-[10px] flex items-center justify-center gap-1 hover:bg-surface-container-high transition-all"
                    >
                      Read More <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                {/* Simulated below-fold item */}
                <div className="bg-surface-container/30 h-16 rounded-2xl border border-outline-variant/15 p-3 opacity-40">
                  <div className="w-1/3 h-2.5 bg-surface-variant rounded-full mb-2"></div>
                  <div className="w-2/3 h-1.5 bg-surface-variant rounded-full"></div>
                </div>
              </div>

              {/* Simulated navigation bar mockup inside phone */}
              <div className="h-11 bg-background/90 border-t border-outline-variant/10 flex justify-around items-center px-4 shrink-0 text-on-surface-variant">
                <span className="text-xs text-primary font-bold">●</span>
                <span className="text-[10px]">■</span>
                <span className="text-[10px]">▲</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setDeleteConfirmId(null)}
          role="dialog"
          aria-labelledby="delete-announcement-title"
          aria-describedby="delete-announcement-desc"
        >
          <div 
            className="bg-surface-container border border-outline-variant rounded-2xl p-6 shadow-2xl max-w-sm w-full mx-4 animate-slide-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-error/10 rounded-full">
                <Trash2 className="w-5 h-5 text-error" />
              </div>
              <h3 id="delete-announcement-title" className="font-sans text-md font-bold text-on-surface">Delete Announcement</h3>
            </div>
            <p id="delete-announcement-desc" className="text-on-surface-variant text-sm font-sans mb-6">
              Are you sure you want to delete this announcement? This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="px-4 py-2 text-xs font-semibold border border-outline-variant rounded-lg text-on-surface hover:bg-surface-container-high transition-all cursor-pointer active:scale-95"
                type="button"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirmId)}
                className="px-4 py-2 text-xs font-semibold bg-error text-background rounded-lg hover:opacity-90 active:scale-95 transition-all cursor-pointer flex items-center gap-1"
                type="button"
              >
                <Trash2 className="w-3.5 h-3.5" /> Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
