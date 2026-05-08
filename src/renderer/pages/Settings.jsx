import { useState, useEffect } from 'react';
import { Clock, Info, Plus, Pencil, Trash2, Database, Download, Upload } from 'lucide-react';
import { useToast } from '../hooks/useToast';
import '../styles/settings.css';

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

  const addBeverage = () => {
    toast('Add beverage modal would open here');
  };

  const editBeverage = (id) => {
    toast('Edit beverage modal would open here');
  };

  const deleteBeverage = async (id) => {
    const result = await window.electron.deleteBeverage(id);
    if (result.success) {
      toast.success('Beverage deleted');
      loadSettings();
    } else {
      toast.error(result.error);
    }
  };

  const addStaff = () => {
    toast('Add staff modal would open here');
  };

  const editStaff = (id) => {
    toast('Edit staff modal would open here');
  };

  const deleteStaff = async (id) => {
    const result = await window.electron.deleteStaff(id);
    if (result.success) {
      toast.success('Staff member removed');
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
                  <h2>Tables & Hourly Pricing</h2>
                  <button className="btn-save" onClick={saveTablesPricing}>
                    Save Pricing Changes
                  </button>
                </div>
                <div className="pricing-table-container">
                  <table className="pricing-table">
                    <thead>
                      <tr>
                        <th>Table Name / Type</th>
                        <th>Full Ball (Rs/h)</th>
                        <th>8-Ball (Rs/h)</th>
                        <th>9-Ball (Rs/h)</th>
                        <th>Snooker (Rs/h)</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tables.map((table) => (
                        <tr key={table.id}>
                          <td>
                            <div className="table-name-cell">{table.name}</div>
                            <span className="table-type-label">{table.type}</span>
                          </td>
                          <td>
                            <input
                              type="number"
                              className="pricing-input"
                              value={table.fullBallPrice}
                              onChange={(e) => updateTablePrice(table.id, 'fullBallPrice', e.target.value)}
                            />
                          </td>
                          <td>
                            <input
                              type="number"
                              className="pricing-input"
                              value={table.eightBallPrice}
                              onChange={(e) => updateTablePrice(table.id, 'eightBallPrice', e.target.value)}
                            />
                          </td>
                          <td>
                            <input
                              type="number"
                              className="pricing-input"
                              value={table.nineBallPrice}
                              onChange={(e) => updateTablePrice(table.id, 'nineBallPrice', e.target.value)}
                            />
                          </td>
                          <td>
                            <input
                              type="number"
                              className="pricing-input"
                              value={table.snookerPrice}
                              onChange={(e) => updateTablePrice(table.id, 'snookerPrice', e.target.value)}
                            />
                          </td>
                          <td className="action-cell">
                            <button
                              className={`btn-action ${table.status.toLowerCase()}`}
                              onClick={() => toggleTableStatus(table.id)}
                            >
                              {table.status}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="pricing-note">
                  <Info />
                  <span>
                    Pricing values are applied immediately to new sessions. Existing sessions will retain their original pricing rates.
                  </span>
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
                        <button className="btn-icon" onClick={() => editBeverage(beverage.id)}>
                          <Pencil />
                        </button>
                        <button className="btn-icon" onClick={() => deleteBeverage(beverage.id)}>
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
                  <button className="btn-add" onClick={addStaff}>
                    <Plus />
                    Add Staff
                  </button>
                </div>
                <div className="staff-list">
                  {staff.map((member) => (
                    <div key={member.id} className="staff-item">
                      <div className="staff-info">
                        <div className="staff-avatar">{member.name.substring(0, 2).toUpperCase()}</div>
                        <div className="staff-details">
                          <div className="staff-name">{member.name}</div>
                          <div className="staff-role">{member.role}</div>
                        </div>
                      </div>
                      <div className="staff-actions">
                        <button className="btn-icon" onClick={() => editStaff(member.id)}>
                          <Pencil />
                        </button>
                        <button className="btn-icon" onClick={() => deleteStaff(member.id)}>
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
        </div>
  );
}
