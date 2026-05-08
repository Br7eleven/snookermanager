import { useState, useEffect } from 'react';
import { Search, Plus, UserPlus, X, Edit2 } from 'lucide-react';
import { format } from 'date-fns';
import '../styles/members.css';
import { useToast } from '../hooks/useToast';

export default function Members() {
  const [members, setMembers] = useState([]);
  const [filteredMembers, setFilteredMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('All');
  const [selectedMember, setSelectedMember] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadMembers();
  }, []);

  useEffect(() => {
    filterMembers();
  }, [searchQuery, filterType, members]);

  const loadMembers = async () => {
    try {
      const result = await window.electron.invoke('members:getAll');
      if (result.success) {
        setMembers(result.data);
      }
    } catch (error) {
      toast.error('Failed to load members');
    } finally {
      setLoading(false);
    }
  };

  const filterMembers = () => {
    let filtered = members;

    if (searchQuery) {
      filtered = filtered.filter(m =>
        m.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.phone?.includes(searchQuery)
      );
    }

    if (filterType === 'Active') {
      filtered = filtered.filter(m => m.last_visit);
    } else if (filterType === 'With balance') {
      filtered = filtered.filter(m => m.balance !== 0);
    }

    setFilteredMembers(filtered);
  };

  const getInitials = (name) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const getBalanceClass = (balance) => {
    if (balance > 0) return 'positive';
    if (balance < 0) return 'negative';
    return 'zero';
  };

  if (loading) {
    return (
      <div className="members-container">
        <div className="members-header">
          <div className="skeleton" style={{ width: 300, height: 40 }} />
          <div className="skeleton" style={{ width: 120, height: 40 }} />
        </div>
        <div className="members-grid">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="member-card skeleton" style={{ height: 180 }} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="members-container">
      <div className="members-header">
        <div className="filters-row">
          <div className="search-wrapper">
            <Search size={18} />
            <input
              type="text"
              placeholder="Search members..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
          </div>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="filter-select"
          >
            <option value="All">All</option>
            <option value="Active">Active</option>
            <option value="With balance">With balance</option>
          </select>
        </div>
        <button className="btn-emerald" onClick={() => setShowAddModal(true)}>
          <Plus size={18} />
          Add member
        </button>
      </div>

      {filteredMembers.length === 0 ? (
        <div className="empty-state">
          <UserPlus size={48} />
          <h3>No members yet</h3>
          <p>Add your first member to get started</p>
          <button className="btn-emerald" onClick={() => setShowAddModal(true)}>
            <Plus size={18} />
            Add first member
          </button>
        </div>
      ) : (
        <div className="members-grid">
          {filteredMembers.map(member => (
            <div
              key={member.id}
              className="member-card"
              onClick={() => setSelectedMember(member)}
            >
              <div className="member-avatar">{getInitials(member.full_name)}</div>
              <h3 className="member-name">{member.full_name}</h3>
              {member.phone && <p className="member-phone">{member.phone}</p>}
              <div className="member-meta">
                <span className="meta-label">Member since</span>
                <span className="meta-value">{format(new Date(member.created_at), 'dd MMM yyyy')}</span>
              </div>
              {member.last_visit && (
                <div className="member-meta">
                  <span className="meta-label">Last visit</span>
                  <span className="meta-value">{format(new Date(member.last_visit), 'dd MMM yyyy')}</span>
                </div>
              )}
              <div className={`balance-chip ${getBalanceClass(member.balance)}`}>
                {member.balance > 0 ? `+Rs ${member.balance}` :
                 member.balance < 0 ? `Rs ${member.balance}` :
                 'No balance'}
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedMember && (
        <MemberDetailPanel
          member={selectedMember}
          onClose={() => setSelectedMember(null)}
          onUpdate={loadMembers}
        />
      )}

      {showAddModal && (
        <AddMemberModal
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            loadMembers();
            setShowAddModal(false);
          }}
        />
      )}
    </div>
  );
}

function MemberDetailPanel({ member, onClose, onUpdate }) {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSessions();
  }, [member.id]);

  const loadSessions = async () => {
    try {
      const result = await window.electron.invoke('reports:getRange', {
        startDate: '2020-01-01',
        endDate: new Date().toISOString().split('T')[0]
      });
      if (result.success) {
        const memberSessions = result.data.filter(s => s.member_id === member.id);
        setSessions(memberSessions);
      }
    } catch (error) {
      console.error('Failed to load sessions');
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (name) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <>
      <div className="panel-overlay" onClick={onClose} />
      <div className="detail-panel">
        <div className="panel-header">
          <div className="panel-header-content">
            <div className="member-avatar large">{getInitials(member.full_name)}</div>
            <div className="member-info">
              <h2>{member.full_name}</h2>
              {member.phone && <p>{member.phone}</p>}
            </div>
          </div>
          <button className="icon-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="panel-body">
          <section className="panel-section">
            <h3>Session History</h3>
            {loading ? (
              <div className="skeleton" style={{ height: 200 }} />
            ) : sessions.length === 0 ? (
              <p className="empty-message">No sessions yet</p>
            ) : (
              <div className="session-history-table">
                <table>
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Table</th>
                      <th>Game</th>
                      <th>Duration</th>
                      <th>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sessions.map(session => {
                      const duration = session.ended_at
                        ? Math.round((new Date(session.ended_at) - new Date(session.started_at)) / 60000)
                        : 0;
                      const total = (session.total_game_cost || 0) + (session.beverages_total || 0);
                      return (
                        <tr key={session.id}>
                          <td>{format(new Date(session.started_at), 'dd MMM')}</td>
                          <td>{session.table_name}</td>
                          <td>{session.game_type_name}</td>
                          <td>{duration}m</td>
                          <td>Rs {total.toLocaleString()}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section className="panel-section">
            <h3>Balance Ledger</h3>
            <div className="balance-summary">
              <div className="balance-item">
                <span className="balance-label">Current Balance</span>
                <span className="balance-value">Rs {member.balance}</span>
              </div>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}

function AddMemberModal({ onClose, onSuccess }) {
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [balance, setBalance] = useState('0');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!fullName) {
      toast.error('Full name is required');
      return;
    }

    setLoading(true);
    try {
      const result = await window.electron.invoke('members:add', {
        fullName,
        phone: phone || null,
        balance: parseFloat(balance) || 0
      });

      if (result.success) {
        toast.success(`${fullName} added as member`);
        onSuccess();
      } else {
        toast.error(result.error || 'Failed to add member');
      }
    } catch (error) {
      toast.error('Failed to add member');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal add-member-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Add Member</h2>
          <button className="icon-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <form className="modal-body" onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Full name</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="input"
              required
            />
          </div>

          <div className="form-group">
            <label>Phone</label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="input"
            />
          </div>

          <div className="form-group">
            <label>Initial balance (Rs)</label>
            <input
              type="number"
              value={balance}
              onChange={(e) => setBalance(e.target.value)}
              className="input"
              step="1"
            />
          </div>

          <div className="modal-actions">
            <button type="button" className="btn-text" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-emerald" disabled={loading}>
              {loading ? 'Adding...' : 'Add member'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
