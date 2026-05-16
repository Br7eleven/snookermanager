import { useState, useEffect } from 'react';
import { Clock, Info, Plus, Pencil, Trash2, Database, Download, Upload, Eye, EyeOff, ShieldCheck, User, X } from 'lucide-react';
import { useToast } from '../hooks/useToast';
import '../styles/settings.css';
import BeverageDrawer from '../components/ui/BeverageDrawer';

function StaffModal({ mode, form, onFormChange, onSubmit, onClose, loading }) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="staff-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{mode === 'add' ? 'Add staff account' : 'Edit staff account'}</h3>
          <button className="modal-close" type="button" onClick={onClose}><X /></button>
        </div>
        <form onSubmit={onSubmit}>
          <div className="staff-form-body">
            <div className="staff-form-group">
              <label>Full name</label>
              <input
                className="staff-input"
                type="text"
                value={form.fullName}
                onChange={e => onFormChange({ ...form, fullName: e.target.value })}
                required
              />
            </div>
            <div className="staff-form-group">
              <label>Username</label>
              <input
                className="staff-input"
                type="text"
                value={form.username}
                onChange={e => onFormChange({ ...form, username: e.target.value })}
                required
              />
              <span className="staff-hint">Must be unique. Recommended: first initial + last name.</span>
            </div>
            <div className="staff-form-group">
              <label>Account Role</label>
              <div className="role-selector">
                <button
                  type="button"
                  className={`role-card ${form.role === 'staff' ? 'selected' : ''}`}
                  onClick={() => onFormChange({ ...form, role: 'staff' })}
                >
                  <div className="role-card-header">
                    <User />
                    <span>Staff</span>
                  </div>
                  <div className="role-perms">
                    <span className="role-perm">Manage Tables</span>
                    <span className="role-perm">Billing & Drinks</span>
                  </div>
                </button>
                <button
                  type="button"
                  className={`role-card ${form.role === 'owner' ? 'selected' : ''}`}
                  onClick={() => onFormChange({ ...form, role: 'owner' })}
                >
                  <div className="role-card-header">
                    <ShieldCheck />
                    <span>Owner</span>
                  </div>
                  <div className="role-perms">
                    <span className="role-perm">Manage Reports</span>
                    <span className="role-perm">Add Staff</span>
                  </div>
                </button>
              </div>
            </div>
            <div className="staff-form-group">
              <label>{mode === 'edit' ? 'New password' : 'Password'}</label>
              <div className="password-wrapper">
                <input
                  className="staff-input"
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={e => onFormChange({ ...form, password: e.target.value })}
                  required={mode === 'add'}
                />
                <button type="button" className="password-eye" onClick={() => setShowPassword(v => !v)}>
                  {showPassword ? <EyeOff /> : <Eye />}
                </button>
              </div>
              {mode === 'edit' && <span className="staff-hint">Leave blank to keep current password.</span>}
            </div>
            <div className="staff-form-group">
              <label>Confirm password</label>
              <div className="password-wrapper">
                <input
                  className="staff-input"
                  type={showConfirm ? 'text' : 'password'}
                  value={form.confirmPassword}
                  onChange={e => onFormChange({ ...form, confirmPassword: e.target.value })}
                  required={mode === 'add' || form.password.length > 0}
                />
                <button type="button" className="password-eye" onClick={() => setShowConfirm(v => !v)}>
                  {showConfirm ? <EyeOff /> : <Eye />}
                </button>
              </div>
            </div>
            <div className="staff-form-group">
              <div className="toggle-row">
                <div>
                  <div className="toggle-label">Account Active</div>
                  <div className="toggle-desc">Allow this user to sign in immediately.</div>
                </div>
                <button
                  type="button"
                  className={`toggle-btn ${form.isActive ? 'on' : 'off'}`}
                  onClick={() => onFormChange({ ...form, isActive: !form.isActive })}
                >
                  <span className="toggle-thumb" />
                </button>
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn-secondary-settings" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-emerald-settings" disabled={loading}>
              {loading ? 'Saving...' : 'Save account'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function DeleteConfirmModal({ member, onConfirm, onClose }) {
  const displayName = member.full_name || member.name || '';
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="confirm-modal" onClick={e => e.stopPropagation()}>
        <div className="confirm-icon danger">
          <Trash2 />
        </div>
        <h3>Remove staff member?</h3>
        <p><strong>{displayName}</strong> will lose access immediately.</p>
        <div className="confirm-actions">
          <button className="btn-secondary-settings" onClick={onClose}>Cancel</button>
          <button className="btn-coral-settings" onClick={onConfirm}>Remove</button>
        </div>
      </div>
    </div>
  );
}

export default function Settings() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('general');

  const [generalSettings, setGeneralSettings] = useState({
    clubName: '',
    currency: 'Rs',
    address: '',
    openingTime: '10:00',
    closingTime: '02:00'
  });

  const [tables, setTables] = useState([]);
  const [beverages, setBeverages] = useState([]);
  const [staff, setStaff] = useState([]);

  const [showBeverageDrawer, setShowBeverageDrawer] = useState(false);
  const [editingBeverage, setEditingBeverage] = useState(null);

  const [showStaffModal, setShowStaffModal] = useState(false);
  const [staffModalMode, setStaffModalMode] = useState('add');
  const [staffForm, setStaffForm] = useState({ fullName: '', username: '', role: 'staff', password: '', confirmPassword: '', isActive: true });
  const [editingStaffId, setEditingStaffId] = useState(null);
  const [deleteConfirmStaff, setDeleteConfirmStaff] = useState(null);
  const [staffLoading, setStaffLoading] = useState(false);

  const [renamingTableId, setRenamingTableId] = useState(null);
  const [renameValue, setRenameValue] = useState('');
  const [showAddTableForm, setShowAddTableForm] = useState(false);
  const [newTableName, setNewTableName] = useState('');
  const [newTableType, setNewTableType] = useState('open');
  const [deleteConfirmTableId, setDeleteConfirmTableId] = useState(null);
  const [expandedTableId, setExpandedTableId] = useState(null);
  const [addingGTForTable, setAddingGTForTable] = useState(null);
  const [newGT, setNewGT] = useState({ name: '', billingType: 'per_frame', rate: '' });
  const [editingGT, setEditingGT] = useState(null);
  const [editGTForm, setEditGTForm] = useState({ name: '', billingType: 'per_frame', rate: '' });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    const result = await window.electron.getSettings();
    if (result.success) {
      setGeneralSettings(result.data.general);
      setTables(result.data.tables);
      setBeverages(result.data.beverages);
      setStaff(result.data.staff);
    }
  };

  const saveGeneralSettings = async () => {
    const result = await window.electron.saveGeneralSettings(generalSettings);
    if (result.success) {
      toast.success('General settings saved!');
    } else {
      toast.error(result.error);
    }
  };

  const saveTablesPricing = async () => {
    const result = await window.electron.saveTablesPricing(tables);
    if (result.success) {
      toast.success('Tables & pricing saved!');
    } else {
      toast.error(result.error);
    }
  };

  const updateTablePrice = (tableId, field, value) => {
    setTables(tables.map(t =>
      t.id === tableId ? { ...t, [field]: parseFloat(value) || 0 } : t
    ));
  };

  const toggleTableStatus = (tableId) => {
    setTables(tables.map(t =>
      t.id === tableId ? { ...t, status: t.status === 'Active' ? 'Maintenance' : 'Active' } : t
    ));
  };

  const handleAddTable = async (e) => {
    e.preventDefault();
    if (!newTableName.trim()) return;
    const result = await window.electron.addTable({ name: newTableName.trim(), type: newTableType });
    if (result.success) {
      toast.success(`${newTableName.trim()} added`);
      setNewTableName('');
      setNewTableType('open');
      setShowAddTableForm(false);
      loadSettings();
    } else {
      toast.error(result.error);
    }
  };

  const handleRenameTable = async (id) => {
    if (!renameValue.trim()) { setRenamingTableId(null); return; }
    const result = await window.electron.renameTable({ id, name: renameValue.trim() });
    if (result.success) {
      toast.success('Table renamed');
      setRenamingTableId(null);
      loadSettings();
    } else {
      toast.error(result.error);
    }
  };

  const handleDeleteTable = async (id) => {
    const result = await window.electron.deleteTable({ id });
    if (result.success) {
      toast.success('Table removed');
      setDeleteConfirmTableId(null);
      loadSettings();
    } else {
      toast.error(result.error);
      setDeleteConfirmTableId(null);
    }
  };

  const addBeverage = () => {
    setEditingBeverage(null);
    setShowBeverageDrawer(true);
  };

  const editBeverage = (beverage) => {
    setEditingBeverage(beverage);
    setShowBeverageDrawer(true);
  };

  const deleteBeverage = async (id) => {
    const result = await window.electron.deleteBeverage({ id });
    if (result.success) {
      toast.success('Beverage deleted');
      loadSettings();
    } else {
      toast.error(result.error);
    }
  };

  const openAddStaff = () => {
    setStaffForm({ fullName: '', username: '', role: 'staff', password: '', confirmPassword: '', isActive: true });
    setStaffModalMode('add');
    setEditingStaffId(null);
    setShowStaffModal(true);
  };

  const openEditStaff = (member) => {
    setStaffForm({
      fullName: member.full_name || member.name || '',
      username: member.username || '',
      role: member.role || 'staff',
      password: '',
      confirmPassword: '',
      isActive: member.is_active !== 0
    });
    setStaffModalMode('edit');
    setEditingStaffId(member.id);
    setShowStaffModal(true);
  };

  const handleStaffSubmit = async (e) => {
    e.preventDefault();
    if (staffForm.password !== staffForm.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    setStaffLoading(true);
    try {
      if (staffModalMode === 'add') {
        const result = await window.electron.addStaff({
          fullName: staffForm.fullName,
          username: staffForm.username,
          role: staffForm.role,
          password: staffForm.password
        });
        if (result.success) {
          toast.success('Staff account created');
          setShowStaffModal(false);
          loadSettings();
        } else {
          toast.error(result.error);
        }
      } else {
        const payload = {
          id: editingStaffId,
          fullName: staffForm.fullName,
          username: staffForm.username,
          role: staffForm.role,
          isActive: staffForm.isActive
        };
        if (staffForm.password) payload.password = staffForm.password;
        const result = await window.electron.updateStaff(payload);
        if (result.success) {
          toast.success('Staff account updated');
          setShowStaffModal(false);
          loadSettings();
        } else {
          toast.error(result.error);
        }
      }
    } finally {
      setStaffLoading(false);
    }
  };

  const handleDeleteStaff = async () => {
    const result = await window.electron.deleteStaff({ id: deleteConfirmStaff.id });
    if (result.success) {
      toast.success('Staff member removed');
      setDeleteConfirmStaff(null);
      loadSettings();
    } else {
      toast.error(result.error);
    }
  };

  const handleAddGameType = async (e, tableId) => {
    e.preventDefault();
    if (!newGT.name.trim() || !newGT.rate) return;
    const result = await window.electron.addGameType({
      tableId, name: newGT.name.trim(), billingType: newGT.billingType, rate: parseFloat(newGT.rate)
    });
    if (result.success) {
      toast.success('Game type added');
      setAddingGTForTable(null);
      setNewGT({ name: '', billingType: 'per_frame', rate: '' });
      loadSettings();
    } else {
      toast.error(result.error);
    }
  };

  const handleUpdateGameType = async (e, gtId) => {
    e.preventDefault();
    if (!editGTForm.name.trim() || !editGTForm.rate) return;
    const result = await window.electron.updateGameType({
      id: gtId, name: editGTForm.name.trim(), billingType: editGTForm.billingType, rate: parseFloat(editGTForm.rate)
    });
    if (result.success) {
      toast.success('Game type updated');
      setEditingGT(null);
      loadSettings();
    } else {
      toast.error(result.error);
    }
  };

  const handleDeleteGameType = async (gtId) => {
    const result = await window.electron.deleteGameType({ id: gtId });
    if (result.success) {
      toast.success('Game type removed');
      loadSettings();
    } else {
      toast.error(result.error);
    }
  };

  const createBackup = async () => {
    const result = await window.electron.createBackup();
    if (result.success) {
      toast.success('Backup created successfully!');
    } else {
      toast.error(result.error);
    }
  };

  const restoreBackup = async () => {
    const result = await window.electron.restoreBackup();
    if (result.success) {
      toast.success('Backup restored successfully!');
      loadSettings();
    } else {
      toast.error(result.error);
    }
  };

  return (
    <div className="settings-container">
      <div className="settings-tabs">
        <button
          className={`settings-tab ${activeTab === 'general' ? 'active' : ''}`}
          onClick={() => setActiveTab('general')}
        >
          General
        </button>
        <button
          className={`settings-tab ${activeTab === 'tables' ? 'active' : ''}`}
          onClick={() => setActiveTab('tables')}
        >
          Tables & Pricing
        </button>
        <button
          className={`settings-tab ${activeTab === 'beverages' ? 'active' : ''}`}
          onClick={() => setActiveTab('beverages')}
        >
          Beverages
        </button>
        <button
          className={`settings-tab ${activeTab === 'staff' ? 'active' : ''}`}
          onClick={() => setActiveTab('staff')}
        >
          Staff
        </button>
        <button
          className={`settings-tab ${activeTab === 'backup' ? 'active' : ''}`}
          onClick={() => setActiveTab('backup')}
        >
          Backup
        </button>
      </div>

      <div className="settings-main">
        {activeTab === 'general' && (
          <div className="settings-section">
            <div className="section-header">
              <h2>General Information</h2>
              <button className="btn-save" onClick={saveGeneralSettings}>
                Save General Settings
              </button>
            </div>
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Club Name</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Royal Snooker Lounge"
                  value={generalSettings.clubName}
                  onChange={(e) => setGeneralSettings({ ...generalSettings, clubName: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Currency</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Rs"
                  value={generalSettings.currency}
                  onChange={(e) => setGeneralSettings({ ...generalSettings, currency: e.target.value })}
                />
              </div>
              <div className="form-group full-width">
                <label className="form-label">Address</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="12 R High Street, Commercial District, Colombo 03"
                  value={generalSettings.address}
                  onChange={(e) => setGeneralSettings({ ...generalSettings, address: e.target.value })}
                />
              </div>
              <div className="form-group full-width">
                <label className="form-label">Opening Hours</label>
                <div className="time-inputs">
                  <div className="time-input-wrapper">
                    <Clock />
                    <input
                      type="time"
                      value={generalSettings.openingTime}
                      onChange={(e) => setGeneralSettings({ ...generalSettings, openingTime: e.target.value })}
                    />
                  </div>
                  <span className="time-separator">to</span>
                  <div className="time-input-wrapper">
                    <Clock />
                    <input
                      type="time"
                      value={generalSettings.closingTime}
                      onChange={(e) => setGeneralSettings({ ...generalSettings, closingTime: e.target.value })}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'tables' && (
          <div className="settings-section">
            <div className="section-header">
              <h2>Tables & Game Types</h2>
              <button className="btn-add" onClick={() => setShowAddTableForm(v => !v)}>
                <Plus />
                Add Table
              </button>
            </div>

            {showAddTableForm && (
              <form className="add-table-form" onSubmit={handleAddTable}>
                <input
                  type="text"
                  className="form-input add-table-name"
                  placeholder="Table name (e.g. VIP Table 1)"
                  value={newTableName}
                  onChange={e => setNewTableName(e.target.value)}
                  required
                  autoFocus
                />
                <div className="add-table-type-row">
                  <button type="button" className={`type-pill ${newTableType === 'private' ? 'selected' : ''}`} onClick={() => setNewTableType('private')}>Private</button>
                  <button type="button" className={`type-pill ${newTableType === 'open' ? 'selected' : ''}`} onClick={() => setNewTableType('open')}>Open</button>
                </div>
                <button type="submit" className="btn-save">Add</button>
                <button type="button" className="btn-icon" onClick={() => setShowAddTableForm(false)}><X size={16} /></button>
              </form>
            )}

            <div className="tables-list">
              {tables.map((table) => (
                <div key={table.id} className="table-settings-card">
                  <div className="table-settings-header">
                    <div className="table-settings-left">
                      {renamingTableId === table.id ? (
                        <div className="rename-input-row">
                          <input
                            type="text"
                            className="pricing-input rename-input"
                            value={renameValue}
                            onChange={e => setRenameValue(e.target.value)}
                            onKeyDown={e => {
                              if (e.key === 'Enter') handleRenameTable(table.id);
                              if (e.key === 'Escape') setRenamingTableId(null);
                            }}
                            autoFocus
                          />
                          <button className="btn-save-sm" onClick={() => handleRenameTable(table.id)}>Save</button>
                          <button className="btn-icon" onClick={() => setRenamingTableId(null)}><X size={14} /></button>
                        </div>
                      ) : (
                        <>
                          <span className="table-settings-name">{table.name}</span>
                          <span className="table-type-label">{table.type}</span>
                        </>
                      )}
                    </div>
                    <div className="table-row-actions">
                      <button
                        className="btn-icon"
                        onClick={() => setExpandedTableId(expandedTableId === table.id ? null : table.id)}
                        title={expandedTableId === table.id ? 'Collapse' : 'Manage game types'}
                      >
                        <Pencil size={15} />
                      </button>
                      {deleteConfirmTableId === table.id ? (
                        <div className="table-delete-confirm">
                          <span>Delete?</span>
                          <button className="btn-text-sm danger" onClick={() => handleDeleteTable(table.id)}>Yes</button>
                          <button className="btn-text-sm" onClick={() => setDeleteConfirmTableId(null)}>No</button>
                        </div>
                      ) : (
                        <button className="btn-icon danger" onClick={() => { setRenamingTableId(table.id); setRenameValue(table.name); }}
                          title="Rename">
                          <Pencil size={15} />
                        </button>
                      )}
                      <button className="btn-icon danger" title="Delete table" onClick={() => setDeleteConfirmTableId(table.id)}>
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>

                  {expandedTableId === table.id && (
                    <div className="game-types-panel">
                      <div className="gt-panel-header">
                        <span className="gt-panel-title">Game Types</span>
                        <button className="btn-add-sm" onClick={() => { setAddingGTForTable(table.id); setNewGT({ name: '', billingType: 'per_frame', rate: '' }); }}>
                          <Plus size={13} /> Add
                        </button>
                      </div>

                      {(table.game_types || []).map(gt => (
                        <div key={gt.id} className="gt-row">
                          {editingGT === gt.id ? (
                            <form className="gt-edit-form" onSubmit={e => handleUpdateGameType(e, gt.id)}>
                              <input className="pricing-input gt-name-input" value={editGTForm.name} onChange={e => setEditGTForm(f => ({ ...f, name: e.target.value }))} required autoFocus />
                              <div className="billing-toggle">
                                <button type="button" className={`billing-pill ${editGTForm.billingType === 'per_frame' ? 'selected' : ''}`} onClick={() => setEditGTForm(f => ({ ...f, billingType: 'per_frame' }))}>Per Frame</button>
                                <button type="button" className={`billing-pill ${editGTForm.billingType === 'per_hour' ? 'selected' : ''}`} onClick={() => setEditGTForm(f => ({ ...f, billingType: 'per_hour' }))}>Per Hour</button>
                              </div>
                              <input type="number" className="pricing-input" placeholder="Rate (Rs)" value={editGTForm.rate} onChange={e => setEditGTForm(f => ({ ...f, rate: e.target.value }))} required min="0" />
                              <button type="submit" className="btn-save-sm">Save</button>
                              <button type="button" className="btn-icon" onClick={() => setEditingGT(null)}><X size={14} /></button>
                            </form>
                          ) : (
                            <>
                              <span className="gt-name">{gt.name}</span>
                              <span className={`billing-badge ${gt.billing_type}`}>{gt.billing_type === 'per_hour' ? 'Per Hour' : 'Per Frame'}</span>
                              <span className="gt-rate">Rs {gt.rate_per_hour}</span>
                              <div className="gt-actions">
                                <button className="btn-icon" onClick={() => { setEditingGT(gt.id); setEditGTForm({ name: gt.name, billingType: gt.billing_type, rate: gt.rate_per_hour }); }}><Pencil size={14} /></button>
                                <button className="btn-icon danger" onClick={() => handleDeleteGameType(gt.id)}><Trash2 size={14} /></button>
                              </div>
                            </>
                          )}
                        </div>
                      ))}

                      {addingGTForTable === table.id && (
                        <form className="gt-edit-form gt-add-form" onSubmit={e => handleAddGameType(e, table.id)}>
                          <input className="pricing-input gt-name-input" placeholder="Game name" value={newGT.name} onChange={e => setNewGT(f => ({ ...f, name: e.target.value }))} required autoFocus />
                          <div className="billing-toggle">
                            <button type="button" className={`billing-pill ${newGT.billingType === 'per_frame' ? 'selected' : ''}`} onClick={() => setNewGT(f => ({ ...f, billingType: 'per_frame' }))}>Per Frame</button>
                            <button type="button" className={`billing-pill ${newGT.billingType === 'per_hour' ? 'selected' : ''}`} onClick={() => setNewGT(f => ({ ...f, billingType: 'per_hour' }))}>Per Hour</button>
                          </div>
                          <input type="number" className="pricing-input" placeholder="Rate (Rs)" value={newGT.rate} onChange={e => setNewGT(f => ({ ...f, rate: e.target.value }))} required min="0" />
                          <button type="submit" className="btn-save-sm">Add</button>
                          <button type="button" className="btn-icon" onClick={() => setAddingGTForTable(null)}><X size={14} /></button>
                        </form>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="pricing-note">
              <Info />
              <span>Per Frame = flat rate per game. Per Hour = timed billing. Changes apply to new sessions only.</span>
            </div>
          </div>
        )}

        {activeTab === 'beverages' && (
          <div className="settings-section">
            <div className="section-header">
              <h2>Beverages Management</h2>
              <button className="btn-add" onClick={addBeverage}>
                <Plus />
                Add Beverage
              </button>
            </div>
            <div className="beverage-list">
              {beverages.map((beverage) => (
                <div key={beverage.id} className="beverage-item">
                  <div className="beverage-info">
                    <div className="beverage-name">{beverage.name}</div>
                    <div className="beverage-price">Rs {beverage.price.toFixed(2)}</div>
                  </div>
                  <div className="beverage-actions">
                    <button className="btn-icon" onClick={() => editBeverage(beverage)}>
                      <Pencil />
                    </button>
                    <button className="btn-icon danger" onClick={() => deleteBeverage(beverage.id)}>
                      <Trash2 />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'staff' && (
          <div className="settings-section">
            <div className="section-header">
              <h2>Staff & Access</h2>
              <button className="btn-add" onClick={openAddStaff}>
                <Plus />
                Add Staff
              </button>
            </div>
            <div className="staff-list">
              {staff.map((member) => (
                <div key={member.id} className="staff-item">
                  <div className="staff-info">
                    <div className="staff-avatar">
                      {(member.full_name || member.name || '??').substring(0, 2).toUpperCase()}
                    </div>
                    <div className="staff-details">
                      <div className="staff-name">{member.full_name || member.name}</div>
                      <div className="staff-role">{member.role}</div>
                    </div>
                  </div>
                  <div className="staff-actions">
                    <button className="btn-icon" onClick={() => openEditStaff(member)}>
                      <Pencil />
                    </button>
                    <button className="btn-icon danger" onClick={() => setDeleteConfirmStaff(member)}>
                      <Trash2 />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'backup' && (
          <div className="settings-section">
            <div className="backup-section">
              <div className="backup-icon">
                <Database />
              </div>
              <h3>Database Backup & Restore</h3>
              <p>Create a backup of all your data or restore from a previous backup file.</p>
              <div className="backup-actions">
                <button className="btn-backup" onClick={restoreBackup}>
                  <Upload />
                  Restore Backup
                </button>
                <button className="btn-backup primary" onClick={createBackup}>
                  <Download />
                  Create Backup
                </button>
              </div>
              <div className="last-backup">Last backup: Never</div>
            </div>
          </div>
        )}
      </div>

      {showStaffModal && (
        <StaffModal
          mode={staffModalMode}
          form={staffForm}
          onFormChange={setStaffForm}
          onSubmit={handleStaffSubmit}
          onClose={() => setShowStaffModal(false)}
          loading={staffLoading}
        />
      )}

      {deleteConfirmStaff && (
        <DeleteConfirmModal
          member={deleteConfirmStaff}
          onConfirm={handleDeleteStaff}
          onClose={() => setDeleteConfirmStaff(null)}
        />
      )}

      {showBeverageDrawer && (
        <BeverageDrawer
          beverage={editingBeverage}
          onClose={() => { setShowBeverageDrawer(false); setEditingBeverage(null); }}
          onSuccess={() => { loadSettings(); setShowBeverageDrawer(false); setEditingBeverage(null); }}
        />
      )}
    </div>
  );
}
