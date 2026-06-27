import { useState, FormEvent } from 'react';
import { 
  Search, 
  Filter, 
  SortAsc, 
  Download, 
  UserPlus, 
  Eye, 
  Edit, 
  Check, 
  X,
  TrendingUp,
  Flame,
  UserCheck,
  Trash2
} from 'lucide-react';
import { YouthMember } from '../types';

interface MembersDirectoryProps {
  members: YouthMember[];
  onAddMember: (member: Omit<YouthMember, 'id' | 'rgId' | 'joinedDate'>) => void;
  onUpdateMember: (member: YouthMember) => void;
  onDeleteMember: (id: string) => void;
}

export default function MembersDirectory({ 
  members, 
  onAddMember,
  onUpdateMember,
  onDeleteMember
}: MembersDirectoryProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [levelFilter, setLevelFilter] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [showFilters, setShowFilters] = useState(false);
  const [isSorted, setIsSorted] = useState(false);
  
  // Member Create Form state
  const [showAddForm, setShowAddForm] = useState(false);
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [newMemberLevel, setNewMemberLevel] = useState<'Ignition' | 'Blaze' | 'Inferno'>('Ignition');
  const [newMemberStatus, setNewMemberStatus] = useState<'Active' | 'Inactive'>('Active');
  const [newMemberAvatar, setNewMemberAvatar] = useState('');

  // Edit Member Modal state
  const [editingMember, setEditingMember] = useState<YouthMember | null>(null);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editLevel, setEditLevel] = useState<'Ignition' | 'Blaze' | 'Inferno'>('Ignition');
  const [editStatus, setEditStatus] = useState<'Active' | 'Inactive'>('Active');
  const [editAvatar, setEditAvatar] = useState('');

  // Delete Confirmation Dialog state
  const [deletingMember, setDeletingMember] = useState<YouthMember | null>(null);

  // Selected Profile detail popup state
  const [selectedMember, setSelectedMember] = useState<YouthMember | null>(null);

  const openEditModal = (member: YouthMember) => {
    setEditingMember(member);
    setEditName(member.name);
    setEditEmail(member.email);
    setEditLevel(member.level);
    setEditStatus(member.status);
    setEditAvatar(member.avatar);
  };

  const closeEditModal = () => {
    setEditingMember(null);
    setEditName('');
    setEditEmail('');
    setEditLevel('Ignition');
    setEditStatus('Active');
    setEditAvatar('');
  };

  const handleSaveEdit = (e: FormEvent) => {
    e.preventDefault();
    if (!editingMember || !editName || !editEmail) {
      toast.error('Please fill out the name and email fields.');
      return;
    }

    const updatedMember: YouthMember = {
      ...editingMember,
      name: editName,
      email: editEmail,
      level: editLevel,
      status: editStatus,
      avatar: editAvatar
    };

    onUpdateMember(updatedMember);
    closeEditModal();
    toast.success('Member updated successfully.');
  };

  const openDeleteDialog = (member: YouthMember) => {
    setDeletingMember(member);
  };

  const closeDeleteDialog = () => {
    setDeletingMember(null);
  };

  const confirmDelete = () => {
    if (deletingMember) {
      onDeleteMember(deletingMember.id);
      setDeletingMember(null);
    }
  };

  const handleSubmitAdd = (e: FormEvent) => {
    e.preventDefault();
    const errors: string[] = [];
    
    if (!newMemberName) errors.push('Name is required');
    if (!newMemberEmail) errors.push('Email is required');
    
    if (errors.length > 0) {
      toast.error(errors.join(', '));
      return;
    }
    
    // Choose random stylish avatar if none is selected
    const randomAvatar = newMemberAvatar || `https://images.unsplash.com/photo-${[
      '1534528741775-53994a69daeb',
      '1539571696357-5a69c17a67c6',
      '1494790108377-be9c29b29330',
      '1507003211169-0a1dd7228f2d'
    ][Math.floor(Math.random() * 4)]}?auto=format&fit=crop&q=80&w=200`;

    onAddMember({
      name: newMemberName,
      email: newMemberEmail,
      level: newMemberLevel,
      status: newMemberStatus,
      avatar: randomAvatar
    });

    // Reset Form
    setNewMemberName('');
    setNewMemberEmail('');
    setNewMemberLevel('Ignition');
    setNewMemberStatus('Active');
    setNewMemberAvatar('');
    setShowAddForm(false);
  };

  const handleToggleStatus = (member: YouthMember) => {
    onUpdateMember({
      ...member,
      status: member.status === 'Active' ? 'Inactive' : 'Active'
    });
  };

  const handleToggleSort = () => {
    setIsSorted(!isSorted);
  };

  let filteredMembers = members.filter(member => {
    const matchesSearch = member.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          member.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLevel = levelFilter === 'All' || member.level === levelFilter;
    const matchesStatus = statusFilter === 'All' || member.status === statusFilter;
    return matchesSearch && matchesLevel && matchesStatus;
  });

  if (isSorted) {
    filteredMembers = [...filteredMembers].sort((a, b) => a.name.localeCompare(b.name));
  }

  const exportMemberList = () => {
    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
      JSON.stringify(filteredMembers, null, 2)
    )}`;
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', jsonString);
    downloadAnchor.setAttribute('download', 'RG_Youth_Members_Directory.json');
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="space-y-6">
      {/* Action Strip */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Left Side Filters & Sort */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <button 
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-4 py-2 bg-surface-container border rounded-lg text-on-surface hover:bg-surface-container-highest transition-colors cursor-pointer text-sm font-medium ${
                showFilters || levelFilter !== 'All' || statusFilter !== 'All' 
                  ? 'border-primary text-primary' 
                  : 'border-outline-variant'
              }`}
            >
              <Filter className="w-4 h-4" />
              <span>Filter</span>
            </button>
            
            {showFilters && (
              <div className="absolute left-0 mt-2 w-56 bg-surface-container-high border border-outline-variant rounded-xl p-4 shadow-2xl z-20 space-y-3">
                <div>
                  <label className="block text-xs text-on-surface-variant font-bold uppercase mb-1">Youth Level</label>
                  <select 
                    value={levelFilter}
                    onChange={(e) => setLevelFilter(e.target.value)}
                    className="w-full bg-background border border-outline-variant rounded-lg px-2.5 py-1.5 text-xs text-on-surface focus:outline-none focus:border-primary"
                  >
                    <option value="All">All Levels</option>
                    <option value="Ignition">Ignition</option>
                    <option value="Blaze">Blaze</option>
                    <option value="Inferno">Inferno</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs text-on-surface-variant font-bold uppercase mb-1">Status</label>
                  <select 
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full bg-background border border-outline-variant rounded-lg px-2.5 py-1.5 text-xs text-on-surface focus:outline-none focus:border-primary"
                  >
                    <option value="All">All Statuses</option>
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>
            )}
          </div>

          <div className="relative">
            <button 
              onClick={handleToggleSort}
              className={`flex items-center gap-2 border px-4 py-2 rounded-lg transition-colors text-sm font-medium cursor-pointer ${
                isSorted
                  ? 'bg-primary/10 border-primary text-primary'
                  : 'bg-surface-container border-outline-variant text-on-surface hover:bg-surface-container-highest'
              }`}
            >
              <SortAsc className="w-4 h-4" />
              <span>Alphabetical</span>
            </button>
          </div>
        </div>

        {/* Search Input on Mobile/Tablet */}
        <div className="relative flex-1 max-w-sm">
          <input 
            type="text" 
            placeholder="Search members by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-surface-container border border-outline-variant text-on-surface rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-primary transition-all font-sans"
          />
          <Search className="w-4 h-4 text-on-surface-variant absolute left-3 top-2.5 opacity-60" />
        </div>

        {/* Right Side Action Buttons */}
        <div className="flex items-center gap-3">
          <button 
            onClick={exportMemberList}
            className="flex items-center gap-2 border border-outline-variant px-4 py-2 rounded-lg text-on-surface hover:bg-surface-container-highest transition-colors text-sm font-semibold cursor-pointer"
          >
            <Download className="w-4 h-4 text-primary" />
            <span>Export Directory</span>
          </button>
          <button 
            onClick={() => setShowAddForm(true)}
            className="flex items-center gap-2 bg-primary text-background px-5 py-2.5 rounded-lg font-bold hover:brightness-110 active:scale-95 transition-all text-sm font-sans cursor-pointer"
          >
            <UserPlus className="w-4 h-4 text-background" />
            <span>Add Member</span>
          </button>
        </div>
      </div>

      {/* Members Bento Data Table */}
      <div className="glass-panel rounded-xl overflow-hidden border border-outline-variant shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse font-sans">
            <thead>
              <tr className="bg-surface-container-high/50 border-b border-outline-variant">
                <th className="px-6 py-4 font-mono text-[11px] text-on-surface-variant uppercase tracking-wider">Name</th>
                <th className="px-6 py-4 font-mono text-[11px] text-on-surface-variant uppercase tracking-wider">RG ID</th>
                <th className="px-6 py-4 font-mono text-[11px] text-on-surface-variant uppercase tracking-wider">Joined Date</th>
                <th className="px-6 py-4 font-mono text-[11px] text-on-surface-variant uppercase tracking-wider">Level</th>
                <th className="px-6 py-4 font-mono text-[11px] text-on-surface-variant uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 font-mono text-[11px] text-on-surface-variant uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/40">
              {filteredMembers.length > 0 ? (
                filteredMembers.map((member) => (
                  <tr key={member.id} className="hover:bg-surface-container-highest/30 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <img 
                          className="w-10 h-10 rounded-xl object-cover ring-2 ring-primary/20 group-hover:ring-primary/50 transition-all" 
                          src={member.avatar} 
                          alt={member.name}
                          referrerPolicy="no-referrer"
                        />
                        <div>
                          <p className="font-bold text-on-surface text-sm">{member.name}</p>
                          <p className="text-xs text-on-surface-variant">{member.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-mono text-xs text-secondary font-medium">{member.rgId}</td>
                    <td className="px-6 py-4 text-xs text-on-surface-variant">{member.joinedDate}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest border ${
                        member.level === 'Ignition' 
                          ? 'bg-primary/10 text-primary border-primary/20' 
                          : member.level === 'Blaze' 
                            ? 'bg-tertiary-container/10 text-tertiary-container border-tertiary-container/20' 
                            : 'bg-on-secondary-container/10 text-on-secondary-container border-on-secondary-container/20'
                      }`}>
                        {member.level}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <button 
                        onClick={() => handleToggleStatus(member)}
                        className="flex items-center gap-2 cursor-pointer group/toggle"
                      >
                        <span className={`w-2 h-2 rounded-full transition-all duration-300 ${
                          member.status === 'Active' 
                            ? 'bg-primary shadow-[0_0_8px_rgba(255,106,0,0.6)]' 
                            : 'bg-surface-variant border border-on-surface-variant/30'
                        }`} />
                        <span className="text-xs text-on-surface group-hover/toggle:text-primary transition-colors">{member.status}</span>
                      </button>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => setSelectedMember(member)}
                          className="p-1.5 rounded-lg hover:bg-surface-container-highest text-on-surface-variant hover:text-primary transition-all"
                          title="View Profile Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => openEditModal(member)}
                          className="p-1.5 rounded-lg hover:bg-surface-container-highest text-on-surface-variant hover:text-primary transition-all"
                          title="Edit Member"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => openDeleteDialog(member)}
                          className="p-1.5 rounded-lg hover:bg-surface-container-highest text-on-surface-variant hover:text-red-500 transition-all"
                          title="Remove Member"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-on-surface-variant text-sm font-sans">
                    No members match your filter options.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Directory Pagination bar */}
        <div className="px-6 py-4 bg-surface-container-low/50 border-t border-outline-variant flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="font-mono text-[11px] text-on-surface-variant">
            Showing {filteredMembers.length} of {members.length} members
          </p>
          <div className="flex items-center gap-1 font-sans">
            <button className="px-2.5 py-1.5 rounded-lg bg-surface-container text-on-surface-variant hover:bg-surface-container-high transition-colors text-xs font-bold disabled:opacity-40" disabled>Prev</button>
            <button className="w-7 h-7 rounded-lg bg-primary text-background font-bold text-xs">1</button>
            <button className="w-7 h-7 rounded-lg hover:bg-surface-container text-on-surface text-xs transition-colors">2</button>
            <span className="px-1 text-on-surface-variant text-xs">...</span>
            <button className="px-2.5 py-1.5 rounded-lg bg-surface-container text-on-surface hover:bg-surface-container-high transition-colors text-xs font-bold">Next</button>
          </div>
        </div>
      </div>

      {/* Bottom Asymmetric Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Growth stats */}
        <div className="p-6 bg-surface-container rounded-xl border border-outline-variant relative overflow-hidden group">
          <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:scale-110 transition-transform duration-700">
            <TrendingUp className="w-24 h-24 text-primary" />
          </div>
          <p className="font-mono text-[10px] text-on-surface-variant uppercase tracking-widest mb-1">Growth Rate</p>
          <h3 className="font-sans text-3xl font-black text-on-surface mb-0.5">+12.4%</h3>
          <p className="text-xs text-tertiary font-medium flex items-center gap-1">
            <UserCheck className="w-3.5 h-3.5" /> Increased attendance this month
          </p>
        </div>

        {/* Engagement stats bar illustration */}
        <div className="p-6 bg-surface-container rounded-xl border border-outline-variant">
          <p className="font-mono text-[10px] text-on-surface-variant uppercase tracking-widest mb-2">Engagement</p>
          <div className="flex items-end gap-1.5 h-12 mb-3">
            <div className="w-3 bg-primary/20 h-5 rounded-t"></div>
            <div className="w-3 bg-primary/40 h-10 rounded-t"></div>
            <div className="w-3 bg-primary/60 h-8 rounded-t"></div>
            <div className="w-3 bg-primary h-12 rounded-t shadow-[0_0_10px_rgba(255,106,0,0.4)]"></div>
            <div className="w-3 bg-primary/80 h-11 rounded-t"></div>
            <div className="w-3 bg-primary/50 h-7 rounded-t"></div>
          </div>
          <p className="font-sans text-xs font-bold text-on-surface">Peak Hours: 7:00 PM</p>
          <p className="text-[10px] text-on-surface-variant">Saturday Youth Night Program</p>
        </div>

        {/* Tips card */}
        <div className="p-6 bg-primary text-background rounded-xl relative overflow-hidden shadow-lg">
          <div className="z-10 relative">
            <h4 className="font-sans text-sm font-bold mb-1.5 flex items-center gap-1.5">
              <img src="/favicon.svg" className="w-4 h-4 fill-background" />
              Leader Tip
            </h4>
            <p className="font-sans text-xs opacity-90 leading-relaxed">
              Consider organizing a "Blaze" level workshop for upcoming leaders to maintain engagement levels this quarter.
            </p>
          </div>
          <div className="absolute -top-6 -left-6 w-24 h-24 bg-on-primary/10 rounded-full blur-2xl"></div>
        </div>
      </div>

      {/* Add Member Form Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-surface-container border border-outline-variant w-full max-w-md rounded-2xl overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-outline-variant flex justify-between items-center bg-surface-container-high">
              <h3 className="font-sans text-md font-bold text-on-surface">Add New Member</h3>
              <button 
                onClick={() => setShowAddForm(false)}
                className="p-1 rounded-lg hover:bg-surface-container-low text-on-surface-variant hover:text-on-surface transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSubmitAdd} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-on-surface-variant uppercase mb-1">Full Name</label>
                <input 
                  type="text" 
                  value={newMemberName}
                  onChange={(e) => setNewMemberName(e.target.value)}
                  placeholder="e.g. Maya Rodriguez"
                  className="w-full bg-background border border-outline-variant rounded-lg px-3 py-2 text-sm text-on-surface focus:outline-none focus:border-primary transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-on-surface-variant uppercase mb-1">Email Address</label>
                <input 
                  type="email" 
                  value={newMemberEmail}
                  onChange={(e) => setNewMemberEmail(e.target.value)}
                  placeholder="e.g. maya.rod@email.com"
                  className="w-full bg-background border border-outline-variant rounded-lg px-3 py-2 text-sm text-on-surface focus:outline-none focus:border-primary transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-on-surface-variant uppercase mb-1">Youth Level</label>
                  <select 
                    value={newMemberLevel}
                    onChange={(e) => setNewMemberLevel(e.target.value as any)}
                    className="w-full bg-background border border-outline-variant rounded-lg px-3 py-2 text-sm text-on-surface focus:outline-none focus:border-primary"
                  >
                    <option value="Ignition">Ignition</option>
                    <option value="Blaze">Blaze</option>
                    <option value="Inferno">Inferno</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-on-surface-variant uppercase mb-1">Initial Status</label>
                  <select 
                    value={newMemberStatus}
                    onChange={(e) => setNewMemberStatus(e.target.value as any)}
                    className="w-full bg-background border border-outline-variant rounded-lg px-3 py-2 text-sm text-on-surface focus:outline-none focus:border-primary"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-on-surface-variant uppercase mb-1">Avatar Image URL (Optional)</label>
                <input 
                  type="text" 
                  value={newMemberAvatar}
                  onChange={(e) => setNewMemberAvatar(e.target.value)}
                  placeholder="Leave blank for a random picture"
                  className="w-full bg-background border border-outline-variant rounded-lg px-3 py-2 text-xs text-on-surface focus:outline-none focus:border-primary transition-all"
                />
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button 
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-4 py-2 bg-surface-container-high hover:bg-surface-container border border-outline-variant text-on-surface text-xs font-semibold rounded-lg transition-all"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-5 py-2 bg-primary text-background font-bold text-xs rounded-lg hover:opacity-90 transition-all flex items-center gap-1"
                >
                  <Check className="w-4 h-4" /> Create Member
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Member Modal */}
      {editingMember && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-surface-container border border-outline-variant w-full max-w-md rounded-2xl overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-outline-variant flex justify-between items-center bg-surface-container-high">
              <h3 className="font-sans text-md font-bold text-on-surface">Edit Member</h3>
              <button 
                onClick={closeEditModal}
                className="p-1 rounded-lg hover:bg-surface-container-low text-on-surface-variant hover:text-on-surface transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSaveEdit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-on-surface-variant uppercase mb-1">Full Name</label>
                <input 
                  type="text" 
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="e.g. Maya Rodriguez"
                  className="w-full bg-background border border-outline-variant rounded-lg px-3 py-2 text-sm text-on-surface focus:outline-none focus:border-primary transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-on-surface-variant uppercase mb-1">Email Address</label>
                <input 
                  type="email" 
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  placeholder="e.g. maya.rod@email.com"
                  className="w-full bg-background border border-outline-variant rounded-lg px-3 py-2 text-sm text-on-surface focus:outline-none focus:border-primary transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-on-surface-variant uppercase mb-1">Youth Level</label>
                  <select 
                    value={editLevel}
                    onChange={(e) => setEditLevel(e.target.value as any)}
                    className="w-full bg-background border border-outline-variant rounded-lg px-3 py-2 text-sm text-on-surface focus:outline-none focus:border-primary"
                  >
                    <option value="Ignition">Ignition</option>
                    <option value="Blaze">Blaze</option>
                    <option value="Inferno">Inferno</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-on-surface-variant uppercase mb-1">Status</label>
                  <select 
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value as any)}
                    className="w-full bg-background border border-outline-variant rounded-lg px-3 py-2 text-sm text-on-surface focus:outline-none focus:border-primary"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-on-surface-variant uppercase mb-1">Avatar Image URL</label>
                <input 
                  type="text" 
                  value={editAvatar}
                  onChange={(e) => setEditAvatar(e.target.value)}
                  placeholder="Enter avatar URL"
                  className="w-full bg-background border border-outline-variant rounded-lg px-3 py-2 text-xs text-on-surface focus:outline-none focus:border-primary transition-all"
                />
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button 
                  type="button"
                  onClick={closeEditModal}
                  className="px-4 py-2 bg-surface-container-high hover:bg-surface-container border border-outline-variant text-on-surface text-xs font-semibold rounded-lg transition-all"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-5 py-2 bg-primary text-background font-bold text-xs rounded-lg hover:opacity-90 transition-all flex items-center gap-1"
                >
                  <Check className="w-4 h-4" /> Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {deletingMember && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setDeletingMember(null)}
          role="dialog"
          aria-labelledby="delete-member-title"
          aria-describedby="delete-member-desc"
        >
          <div 
            className="bg-surface-container border border-outline-variant w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl animate-slide-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-outline-variant flex justify-between items-center bg-surface-container-high">
              <h3 id="delete-member-title" className="font-sans text-md font-bold text-on-surface">Remove Member</h3>
              <button 
                onClick={closeDeleteDialog}
                className="p-1 rounded-lg hover:bg-surface-container-low text-on-surface-variant hover:text-on-surface transition-all"
                aria-label="Close delete confirmation"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm text-on-surface">
                Are you sure you want to remove <strong>{deletingMember.name}</strong>?
              </p>
              <p id="delete-member-desc" className="text-xs text-on-surface-variant">
                This action cannot be undone. The member will be permanently removed from the directory.
              </p>
              <div className="flex justify-end gap-3 pt-2">
                <button 
                  onClick={closeDeleteDialog}
                  className="px-4 py-2 bg-surface-container-high hover:bg-surface-container border border-outline-variant text-on-surface text-xs font-semibold rounded-lg transition-all active:scale-95 cursor-pointer"
                  type="button"
                >
                  Cancel
                </button>

                <button 
                  onClick={confirmDelete}
                  className="px-5 py-2 bg-error text-white font-bold text-xs rounded-lg hover:opacity-90 active:scale-95 transition-all cursor-pointer flex items-center gap-1"
                  type="button"
                >
                  <Trash2 className="w-4 h-4" /> Remove Member
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Selected Profile Detail Dialog */}
      {selectedMember && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-surface-container border border-outline-variant w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl">
            <div className="relative h-28 bg-gradient-to-tr from-surface-container-low to-surface-container-highest">
              {/* Cover pattern */}
              <div className="absolute right-4 top-4 bg-primary-container text-on-primary-container font-mono text-[9px] px-2.5 py-0.5 rounded-full font-bold">
                {selectedMember.rgId}
              </div>
              
              <button 
                onClick={() => setSelectedMember(null)}
                className="absolute left-4 top-4 p-1.5 rounded-lg bg-black/40 hover:bg-black/60 text-white transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="p-6 relative -mt-10 space-y-4 text-center">
              <img 
                className="w-20 h-20 rounded-2xl object-cover border-4 border-surface mx-auto" 
                src={selectedMember.avatar} 
                alt={selectedMember.name}
                referrerPolicy="no-referrer"
              />
              
              <div>
                <h3 className="font-sans text-md font-bold text-on-surface">{selectedMember.name}</h3>
                <p className="text-xs text-on-surface-variant font-medium">{selectedMember.email}</p>
              </div>

              <div className="grid grid-cols-2 gap-2 text-left bg-surface-container-high/60 p-3 rounded-xl border border-outline-variant/30">
                <div>
                  <span className="block text-[9px] text-on-surface-variant font-mono uppercase">Level</span>
                  <span className="text-xs font-bold text-on-surface">{selectedMember.level}</span>
                </div>
                <div>
                  <span className="block text-[9px] text-on-surface-variant font-mono uppercase">Status</span>
                  <span className="text-xs font-bold text-on-surface">{selectedMember.status}</span>
                </div>
                <div className="col-span-2 border-t border-outline-variant/30 pt-1.5 mt-1.5">
                  <span className="block text-[9px] text-on-surface-variant font-mono uppercase">Joined Portal On</span>
                  <span className="text-xs font-bold text-on-surface">{selectedMember.joinedDate}</span>
                </div>
              </div>

              <button 
                onClick={() => setSelectedMember(null)}
                className="w-full py-2 bg-surface-container-high hover:bg-surface-container border border-outline-variant text-on-surface text-xs font-bold rounded-xl transition-all"
              >
                Close View
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


