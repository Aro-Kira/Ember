import { useState, useEffect } from 'react';
import {
  Heart,
  ThumbsUp,
  Hand,
  Sparkles,
  Filter,
  CheckCircle,
  XCircle,
  Clock,
  MessageCircle,
  BookOpen
} from 'lucide-react';
import { ModerationSubmission } from '../types';
import api from '../api';

interface CommunityFeedProps {
  submissions: ModerationSubmission[];
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
}

interface ReactionState {
  amen: { count: number; active: boolean };
  encouraged: { count: number; active: boolean };
  praying: { count: number; active: boolean };
  blessed: { count: number; active: boolean };
}

function buildReactionsFromPost(sub: ModerationSubmission): ReactionState {
  const r = sub.reactions || { amen: 0, encouraged: 0, praying: 0, blessed: 0 };
  const u = sub.userReactions || [];
  return {
    amen: { count: r.amen, active: u.includes('amen') },
    encouraged: { count: r.encouraged, active: u.includes('encouraged') },
    praying: { count: r.praying, active: u.includes('praying') },
    blessed: { count: r.blessed, active: u.includes('blessed') }
  };
}

export default function CommunityFeed({
  submissions,
  onApprove,
  onReject
}: CommunityFeedProps) {
  const [statusTab, setStatusTab] = useState<'all' | 'approved' | 'pending' | 'rejected'>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | 'DEVOTIONAL' | 'TESTIMONY'>('all');
  const [reactionsMap, setReactionsMap] = useState<Record<string, ReactionState>>(() => {
    const map: Record<string, ReactionState> = {};
    submissions.forEach((sub) => {
      map[sub.id] = buildReactionsFromPost(sub);
    });
    return map;
  });

  useEffect(() => {
    setReactionsMap(prev => {
      const updated = { ...prev };
      submissions.forEach(sub => {
        if (!updated[sub.id]) {
          updated[sub.id] = buildReactionsFromPost(sub);
        } else {
          updated[sub.id] = buildReactionsFromPost(sub);
        }
      });
      return updated;
    });
  }, [submissions]);

  const totalPosts = submissions.length;
  const approvedCount = submissions.filter((s) => s.status === 'approved').length;
  const pendingCount = submissions.filter((s) => s.status === 'pending').length;
  const rejectedCount = submissions.filter((s) => s.status === 'rejected').length;

  const filteredSubmissions = submissions.filter((sub) => {
    if (statusTab !== 'all' && sub.status !== statusTab) return false;
    if (typeFilter !== 'all' && sub.type !== typeFilter) return false;
    return true;
  });

  const handleReaction = async (postId: string, key: keyof ReactionState) => {
    const current = reactionsMap[postId] || buildReactionsFromPost(submissions.find(s => s.id === postId)!);
    const prev = current[key];
    setReactionsMap((prevMap) => ({
      ...prevMap,
      [postId]: {
        ...current,
        [key]: {
          count: prev.active ? prev.count - 1 : prev.count + 1,
          active: !prev.active
        }
      }
    }));

    try {
      const res = await api.reactToPost(postId, key);
      setReactionsMap((prevMap) => ({
        ...prevMap,
        [postId]: {
          amen: { count: res.reactions.amen, active: res.userReactions.includes('amen') },
          encouraged: { count: res.reactions.encouraged, active: res.userReactions.includes('encouraged') },
          praying: { count: res.reactions.praying, active: res.userReactions.includes('praying') },
          blessed: { count: res.reactions.blessed, active: res.userReactions.includes('blessed') }
        }
      }));
    } catch (err) {
      console.error('Failed to toggle reaction:', err);
    }
  };

  const getInitials = (name: string): string => {
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const getStatusBadge = (status: ModerationSubmission['status']) => {
    switch (status) {
      case 'approved':
        return (
          <span className="inline-flex items-center gap-1 bg-emerald-500/15 text-emerald-400 font-mono text-[9px] font-bold px-2 py-0.5 rounded-full uppercase">
            <CheckCircle className="w-2.5 h-2.5" /> Approved
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 bg-yellow-500/15 text-yellow-400 font-mono text-[9px] font-bold px-2 py-0.5 rounded-full uppercase">
            <Clock className="w-2.5 h-2.5" /> Pending
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1 bg-red-500/15 text-red-400 font-mono text-[9px] font-bold px-2 py-0.5 rounded-full uppercase">
            <XCircle className="w-2.5 h-2.5" /> Rejected
          </span>
        );
    }
  };

  const getTypeBadge = (type: ModerationSubmission['type']) => {
    switch (type) {
      case 'DEVOTIONAL':
        return (
          <span className="inline-flex items-center gap-1 bg-primary/15 text-primary font-mono text-[9px] font-bold px-2 py-0.5 rounded-full uppercase">
            <BookOpen className="w-2.5 h-2.5" /> Devotional
          </span>
        );
      case 'TESTIMONY':
        return (
          <span className="inline-flex items-center gap-1 bg-secondary-container text-secondary font-mono text-[9px] font-bold px-2 py-0.5 rounded-full uppercase">
            <MessageCircle className="w-2.5 h-2.5" /> Testimony
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-outline-variant/30 pb-4">
          <div>
            <span className="font-mono text-xs text-primary uppercase tracking-[0.2em] mb-1 block">Community Hub</span>
            <h3 className="font-sans text-xl font-bold text-on-surface">Posts &amp; Feed Viewer</h3>
          </div>
          <div className="flex items-center gap-2 text-on-surface-variant">
            <Filter className="w-4 h-4 text-primary" />
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as typeof typeFilter)}
              className="bg-surface-container-high border border-outline-variant rounded-lg px-3 py-2 text-xs font-sans font-semibold text-on-surface focus:outline-none focus:border-primary transition-all cursor-pointer"
            >
              <option value="all">All Types</option>
              <option value="DEVOTIONAL">Devotional</option>
              <option value="TESTIMONY">Testimony</option>
            </select>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="glass-card p-4 rounded-xl flex items-center gap-3">
            <div className="bg-primary/10 p-2 rounded-lg">
              <MessageCircle className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="font-mono text-[10px] text-on-surface-variant uppercase tracking-wider">Total Posts</p>
              <p className="font-sans font-bold text-on-surface text-lg">{totalPosts}</p>
            </div>
          </div>
          <div className="glass-card p-4 rounded-xl flex items-center gap-3">
            <div className="bg-emerald-500/10 p-2 rounded-lg">
              <CheckCircle className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <p className="font-mono text-[10px] text-on-surface-variant uppercase tracking-wider">Approved</p>
              <p className="font-sans font-bold text-emerald-400 text-lg">{approvedCount}</p>
            </div>
          </div>
          <div className="glass-card p-4 rounded-xl flex items-center gap-3">
            <div className="bg-yellow-500/10 p-2 rounded-lg">
              <Clock className="w-4 h-4 text-yellow-400" />
            </div>
            <div>
              <p className="font-mono text-[10px] text-on-surface-variant uppercase tracking-wider">Pending</p>
              <p className="font-sans font-bold text-yellow-400 text-lg">{pendingCount}</p>
            </div>
          </div>
          <div className="glass-card p-4 rounded-xl flex items-center gap-3">
            <div className="bg-red-500/10 p-2 rounded-lg">
              <XCircle className="w-4 h-4 text-red-400" />
            </div>
            <div>
              <p className="font-mono text-[10px] text-on-surface-variant uppercase tracking-wider">Rejected</p>
              <p className="font-sans font-bold text-red-400 text-lg">{rejectedCount}</p>
            </div>
          </div>
        </div>

        {/* Status Sub-Tabs */}
        <div className="flex border-b border-outline-variant gap-6 font-sans">
          {(['all', 'approved', 'pending', 'rejected'] as const).map((tab) => {
            const label = tab === 'all'
              ? `All Posts (${totalPosts})`
              : tab === 'approved'
                ? `Approved (${approvedCount})`
                : tab === 'pending'
                  ? `Pending (${pendingCount})`
                  : `Rejected (${rejectedCount})`;
            return (
              <button
                key={tab}
                onClick={() => setStatusTab(tab)}
                className={`pb-3 px-1 text-xs font-bold flex items-center gap-2 transition-all relative cursor-pointer ${
                  statusTab === tab
                    ? 'text-primary'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                {label}
                {statusTab === tab && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Posts Feed */}
      <div className="max-w-2xl mx-auto space-y-4">
        {filteredSubmissions.length > 0 ? (
          filteredSubmissions.map((sub) => {
            const r = reactionsMap[sub.id];

            return (
              <div
                key={sub.id}
                className="bg-surface-container rounded-xl border border-outline-variant p-5 flex flex-col gap-4 transition-all hover:translate-y-[-1px] hover:shadow-lg hover:shadow-primary/5"
              >
                {/* Post Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-surface-container-high border border-outline-variant flex items-center justify-center text-primary text-xs font-bold font-mono shrink-0">
                      {getInitials(sub.name)}
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <p className="font-sans text-sm font-bold text-on-surface leading-tight">{sub.name}</p>
                      <span className="font-mono text-[10px] text-on-surface-variant">{sub.timeAgo}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {getTypeBadge(sub.type)}
                    {getStatusBadge(sub.status)}
                  </div>
                </div>

                {/* Post Title */}
                {sub.title && (
                  <h4 className="font-sans text-base font-bold text-on-surface">{sub.title}</h4>
                )}

                {/* Post Content */}
                <div className="bg-surface-container-low/50 p-4 rounded-lg border border-outline-variant/20">
                  <p className="font-sans text-sm text-on-surface leading-relaxed whitespace-pre-wrap">
                    {sub.content}
                  </p>
                </div>

                {/* Reaction Buttons Row */}
                <div className="flex items-center gap-2 pt-1 border-t border-outline-variant/20">
                  <button
                    onClick={() => handleReaction(sub.id, 'amen')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-sans font-semibold transition-all cursor-pointer ${
                      r?.amen.active
                        ? 'bg-red-500/15 text-red-400 border border-red-500/30'
                        : 'bg-surface-container-high text-on-surface-variant hover:text-red-400 hover:bg-surface-container-highest border border-transparent'
                    }`}
                  >
                    <Heart className={`w-3.5 h-3.5 ${r?.amen.active ? 'fill-red-400' : ''}`} />
                    <span>Amen</span>
                    <span className="font-mono text-[10px] opacity-70">{r?.amen.count ?? 0}</span>
                  </button>

                  <button
                    onClick={() => handleReaction(sub.id, 'encouraged')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-sans font-semibold transition-all cursor-pointer ${
                      r?.encouraged.active
                        ? 'bg-blue-500/15 text-blue-400 border border-blue-500/30'
                        : 'bg-surface-container-high text-on-surface-variant hover:text-blue-400 hover:bg-surface-container-highest border border-transparent'
                    }`}
                  >
                    <ThumbsUp className={`w-3.5 h-3.5 ${r?.encouraged.active ? 'fill-blue-400' : ''}`} />
                    <span>Encouraged</span>
                    <span className="font-mono text-[10px] opacity-70">{r?.encouraged.count ?? 0}</span>
                  </button>

                  <button
                    onClick={() => handleReaction(sub.id, 'praying')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-sans font-semibold transition-all cursor-pointer ${
                      r?.praying.active
                        ? 'bg-purple-500/15 text-purple-400 border border-purple-500/30'
                        : 'bg-surface-container-high text-on-surface-variant hover:text-purple-400 hover:bg-surface-container-highest border border-transparent'
                    }`}
                  >
                    <Hand className={`w-3.5 h-3.5 ${r?.praying.active ? 'fill-purple-400' : ''}`} />
                    <span>Praying</span>
                    <span className="font-mono text-[10px] opacity-70">{r?.praying.count ?? 0}</span>
                  </button>

                  <button
                    onClick={() => handleReaction(sub.id, 'blessed')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-sans font-semibold transition-all cursor-pointer ${
                      r?.blessed.active
                        ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                        : 'bg-surface-container-high text-on-surface-variant hover:text-amber-400 hover:bg-surface-container-highest border border-transparent'
                    }`}
                  >
                    <Sparkles className={`w-3.5 h-3.5 ${r?.blessed.active ? 'fill-amber-400' : ''}`} />
                    <span>Blessed</span>
                    <span className="font-mono text-[10px] opacity-70">{r?.blessed.count ?? 0}</span>
                  </button>
                </div>

                {/* Approval Actions for Pending Posts */}
                {sub.status === 'pending' && (
                  <div className="flex gap-2 pt-2 border-t border-outline-variant/20">
                    <button
                      onClick={() => {
                        onReject(sub.id);
                      }}
                      className="flex-1 flex items-center justify-center gap-1.5 bg-on-tertiary-container/30 hover:bg-on-tertiary-container/50 text-error hover:text-on-error transition-colors py-2.5 rounded-lg text-xs font-bold cursor-pointer"
                    >
                      <XCircle className="w-3.5 h-3.5" /> Reject
                    </button>
                    <button
                      onClick={() => {
                        onApprove(sub.id);
                      }}
                      className="flex-1 flex items-center justify-center gap-1.5 bg-primary/20 hover:bg-primary text-primary hover:text-background transition-colors py-2.5 rounded-lg text-xs font-bold cursor-pointer"
                    >
                      <CheckCircle className="w-3.5 h-3.5" /> Approve
                    </button>
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="text-center py-16 bg-surface-container-low rounded-xl border border-dashed border-outline-variant text-on-surface-variant text-xs font-sans">
            No posts match the current filters. Try adjusting your selection.
          </div>
        )}
      </div>
    </div>
  );
}
