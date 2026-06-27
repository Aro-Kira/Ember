import { useState, FormEvent } from 'react';
import {
  Heart,
  Check,
  X,
  ArrowRight,
  CheckCircle,
  Filter,
  Plus
} from 'lucide-react';
import { PrayerItem } from '../types';
import toast from '../hooks/useToast.tsx';

interface PrayerBoardProps {
  prayerItems: PrayerItem[];
  onUpdatePrayerStage: (id: string, stage: 'new' | 'active' | 'archived') => void;
  onAddPrayerItem: (item: Omit<PrayerItem, 'id' | 'prayingCount'>) => void;
}

export default function PrayerBoard({
  prayerItems,
  onUpdatePrayerStage,
  onAddPrayerItem
}: PrayerBoardProps) {
  const [showAddPrayer, setShowAddPrayer] = useState(false);
  const [newPrayerCategory, setNewPrayerCategory] = useState('STUDIES');
  const [newPrayerText, setNewPrayerText] = useState('');
  const [newPrayerAuthor, setNewPrayerAuthor] = useState('Anonymous');

const handleAddPrayer = (e: FormEvent) => {
    e.preventDefault();
    if (!newPrayerText) {
      toast.error('Please enter your prayer request content.');
      return;
    }

    onAddPrayerItem({
      category: newPrayerCategory.toUpperCase(),
      text: `"${newPrayerText}"`,
      author: newPrayerAuthor || 'Anonymous',
      stage: 'new'
    });

    setNewPrayerText('');
    setNewPrayerAuthor('Anonymous');
    setShowAddPrayer(false);
    toast.success('Prayer request registered in the "New Queue".');
  };

  const newPrayers = prayerItems.filter(p => p.stage === 'new');
  const activePrayers = prayerItems.filter(p => p.stage === 'active');
  const archivedPrayers = prayerItems.filter(p => p.stage === 'archived');

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-outline-variant/30 pb-4">
        <div>
          <span className="font-mono text-xs text-primary uppercase tracking-[0.2em] mb-1 block">Prayer Center</span>
          <h3 className="font-sans text-xl font-bold text-on-surface">Prayer Management</h3>
        </div>

        <button
          onClick={() => setShowAddPrayer(true)}
          className="bg-primary hover:bg-primary-fixed-dim text-on-primary font-bold px-5 py-2.5 rounded-lg text-xs flex items-center gap-1.5 transition-all active:scale-95 shadow-lg shadow-primary/10 cursor-pointer"
        >
          <Plus className="w-4 h-4 text-on-primary" /> Create Prayer Request
        </button>
      </div>

      {/* Prayer Kanban Board */}
      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between mb-1">
            <h4 className="font-sans text-sm font-bold text-on-surface flex items-center gap-1.5">
              <Heart className="w-4 h-4 text-primary fill-primary" />
              Prayer Kanban Board
            </h4>
            <div className="flex gap-1">
              <button
                onClick={() => toast.info('Filter prayers option coming soon...')}
                className="w-7 h-7 rounded bg-surface-container-high flex items-center justify-center text-on-surface-variant hover:text-primary cursor-pointer"
                title="Filter Prayer Board"
              >
                <Filter className="w-3.5 h-3.5" />
              </button>
            </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 min-h-[500px]">
          {/* Column 1: New Queue */}
          <div className="flex flex-col gap-2 bg-surface-container-lowest/30 rounded-xl p-2 border border-outline-variant/10">
            <div className="flex items-center gap-2 px-2.5 py-1.5 bg-surface-container-high rounded-lg border-b-2 border-primary font-mono text-[10px] uppercase font-bold tracking-wider text-on-surface">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
              <span>New Queue</span>
              <span className="ml-auto text-on-surface-variant">{newPrayers.length}</span>
            </div>
            <div className="flex-1 overflow-y-auto space-y-2 pb-4 custom-scrollbar">
              {newPrayers.length > 0 ? (
                newPrayers.map((p) => (
                  <div key={p.id} className="glass-card p-3 rounded-lg flex flex-col gap-2.5 hover:border-primary/50 transition-all">
                    <span className="self-start bg-secondary-container/50 text-secondary text-[8px] font-mono font-bold px-1.5 py-0.5 rounded uppercase tracking-wider">
                      {p.category}
                    </span>
                    <p className="text-xs text-on-surface-variant leading-relaxed line-clamp-3">{p.text}</p>
                    <div className="flex items-center justify-between mt-1 pt-2 border-t border-outline-variant/10">
                      <span className="text-[9px] text-on-surface-variant italic font-mono">- {p.author}</span>
                      <button
                        onClick={() => onUpdatePrayerStage(p.id, 'active')}
                        className="text-primary hover:bg-primary/10 px-2 py-0.5 rounded text-[9px] font-bold flex items-center gap-0.5 cursor-pointer"
                        title="Move to Active Prayer"
                      >
                        Next <ArrowRight className="w-2.5 h-2.5" />
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-10 text-on-surface-variant text-[11px] font-sans">
                  Queue empty.
                </div>
              )}
            </div>
          </div>

          {/* Column 2: Active Prayer */}
          <div className="flex flex-col gap-2 bg-surface-container-lowest/30 rounded-xl p-2 border border-outline-variant/10">
            <div className="flex items-center gap-2 px-2.5 py-1.5 bg-surface-container-high rounded-lg border-b-2 border-secondary font-mono text-[10px] uppercase font-bold tracking-wider text-on-surface">
              <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span>
              <span>Active Prayer</span>
              <span className="ml-auto text-on-surface-variant">{activePrayers.length}</span>
            </div>
            <div className="flex-1 overflow-y-auto space-y-2 pb-4 custom-scrollbar">
              {activePrayers.length > 0 ? (
                activePrayers.map((p) => (
                  <div key={p.id} className="glass-card p-3 rounded-lg flex flex-col gap-2.5 hover:border-secondary/50 transition-all border-l-2 border-l-secondary">
                    <span className="self-start bg-secondary-container/50 text-secondary text-[8px] font-mono font-bold px-1.5 py-0.5 rounded uppercase tracking-wider">
                      {p.category}
                    </span>
                    <p className="text-xs text-on-surface-variant leading-relaxed line-clamp-3">{p.text}</p>
                    <div className="flex items-center justify-between mt-1 pt-2 border-t border-outline-variant/10">
                      <span className="text-[9px] text-on-surface-variant italic font-mono">{p.prayingCount} leaders praying</span>
                      <button
                        onClick={() => onUpdatePrayerStage(p.id, 'archived')}
                        className="text-secondary hover:bg-secondary/10 px-2 py-0.5 rounded text-[9px] font-bold flex items-center gap-0.5 cursor-pointer"
                        title="Archive Prayer Request"
                      >
                        Archive <ArrowRight className="w-2.5 h-2.5" />
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-10 text-on-surface-variant text-[11px] font-sans">
                  No active requests.
                </div>
              )}
            </div>
          </div>

          {/* Column 3: Archived */}
          <div className="flex flex-col gap-2 bg-surface-container-lowest/30 rounded-xl p-2 border border-outline-variant/10">
            <div className="flex items-center gap-2 px-2.5 py-1.5 bg-surface-container-high rounded-lg border-b-2 border-on-primary-container font-mono text-[10px] uppercase font-bold tracking-wider text-on-surface">
              <CheckCircle className="w-3.5 h-3.5 text-primary" />
              <span>Archived / Praise</span>
              <span className="ml-auto text-on-surface-variant">{archivedPrayers.length}</span>
            </div>
            <div className="flex-1 overflow-y-auto space-y-2 pb-4 custom-scrollbar opacity-75 grayscale hover:grayscale-0 hover:opacity-100 transition-all">
              {archivedPrayers.length > 0 ? (
                archivedPrayers.map((p) => (
                  <div key={p.id} className="glass-card p-3 rounded-lg flex flex-col gap-2 bg-surface-container-low/30 border-dashed">
                    <div className="flex justify-between items-start">
                      <span className="text-[9px] font-mono text-on-surface-variant uppercase">COMPLETED / PRAISE</span>
                      <Check className="w-3.5 h-3.5 text-primary" />
                    </div>
                    <p className="text-xs text-on-surface-variant leading-relaxed line-clamp-3 font-sans italic">{p.text}</p>
                    <span className="text-[9px] text-on-surface-variant italic font-mono self-end">- {p.author}</span>
                  </div>
                ))
              ) : (
                <div className="text-center py-10 text-on-surface-variant text-[11px] font-sans">
                  No items archived yet.
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Add Prayer Request Form Modal */}
      {showAddPrayer && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-surface-container border border-outline-variant w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl font-sans">
            <div className="p-6 border-b border-outline-variant flex justify-between items-center bg-surface-container-high">
              <h3 className="font-sans text-md font-bold text-on-surface">Submit Prayer Request</h3>
              <button
                onClick={() => setShowAddPrayer(false)}
                className="p-1 rounded-lg hover:bg-surface-container-low text-on-surface-variant hover:text-on-surface transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddPrayer} className="p-6 space-y-4 text-sm">
              <div>
                <label className="block text-xs font-semibold text-on-surface-variant uppercase mb-1">Category / Tag</label>
                <select
                  value={newPrayerCategory}
                  onChange={(e) => setNewPrayerCategory(e.target.value)}
                  className="w-full bg-background border border-outline-variant rounded-lg px-3 py-2 text-sm text-on-surface focus:outline-none focus:border-primary"
                >
                  <option value="STUDIES">STUDIES</option>
                  <option value="FAMILY">FAMILY</option>
                  <option value="FRIENDSHIP">FRIENDSHIP</option>
                  <option value="HEALTH">HEALTH</option>
                  <option value="SPIRITUAL">SPIRITUAL</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-on-surface-variant uppercase mb-1">Author Name (Optional)</label>
                <input
                  type="text"
                  value={newPrayerAuthor}
                  onChange={(e) => setNewPrayerAuthor(e.target.value)}
                  placeholder="e.g. Elena R. or Anonymous"
                  className="w-full bg-background border border-outline-variant rounded-lg px-3 py-2 text-sm text-on-surface focus:outline-none focus:border-primary transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-on-surface-variant uppercase mb-1">Prayer Details</label>
                <textarea
                  value={newPrayerText}
                  onChange={(e) => setNewPrayerText(e.target.value)}
                  placeholder="Write what you would like the team to pray for..."
                  rows={4}
                  className="w-full bg-background border border-outline-variant rounded-lg px-3 py-2 text-sm text-on-surface focus:outline-none focus:border-primary transition-all resize-none leading-relaxed"
                />
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddPrayer(false)}
                  className="px-4 py-2 bg-surface-container-high hover:bg-surface-container border border-outline-variant text-on-surface text-xs font-semibold rounded-lg transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-primary text-background font-bold text-xs rounded-lg hover:opacity-90 transition-all flex items-center gap-1"
                >
                  <Check className="w-4 h-4" /> Register
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
