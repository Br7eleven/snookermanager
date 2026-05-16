import { useState, useEffect } from 'react';
import { Play, Plus, X, CheckCircle, Printer } from 'lucide-react';
import { format } from 'date-fns';
import '../styles/tables.css';
import { useToast } from '../hooks/useToast';

export default function Tables() {
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeSessions, setActiveSessions] = useState({});
  const [showStartModal, setShowStartModal] = useState(null);
  const [showBeverageModal, setShowBeverageModal] = useState(null);
  const [showEndModal, setShowEndModal] = useState(null);
  const { toast } = useToast();

  useEffect(() => {
    loadTables();
  }, []);

  const loadTables = async () => {
    try {
      const result = await window.electron.invoke('tables:getAll');
      if (result.success) {
        setTables(result.data);
        const sessionsResult = await window.electron.invoke('sessions:getActive');
        if (sessionsResult.success) {
          const sessionsMap = {};
          sessionsResult.data.forEach(session => {
            sessionsMap[session.table_id] = session;
          });
          setActiveSessions(sessionsMap);
        }
      }
    } catch (error) {
      toast.error('Failed to load tables');
    } finally {
      setLoading(false);
    }
  };

  const handleStartSession = (table) => {
    setShowStartModal(table);
  };

  const handleAddBeverage = (table, session) => {
    setShowBeverageModal({ table, session });
  };

  const handleEndSession = (table, session) => {
    setShowEndModal({ table, session });
  };

  if (loading) {
    return (
      <div className="tables-container">
        <div className="tables-grid">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="table-card skeleton" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="tables-container">
      <div className="tables-grid">
        {tables.map(table => {
          const session = activeSessions[table.id];
          const isActive = !!session;

          return (
            <TableCard
              key={table.id}
              table={table}
              session={session}
              isActive={isActive}
              onStartSession={handleStartSession}
              onAddBeverage={handleAddBeverage}
              onEndSession={handleEndSession}
            />
          );
        })}
      </div>

      {showStartModal && (
        <StartSessionModal
          table={showStartModal}
          onClose={() => setShowStartModal(null)}
          onSuccess={loadTables}
        />
      )}

      {showBeverageModal && (
        <AddBeverageModal
          table={showBeverageModal.table}
          session={showBeverageModal.session}
          onClose={() => setShowBeverageModal(null)}
          onSuccess={loadTables}
        />
      )}

      {showEndModal && (
        <EndSessionModal
          table={showEndModal.table}
          session={showEndModal.session}
          onClose={() => setShowEndModal(null)}
          onSuccess={loadTables}
        />
      )}
    </div>
  );
}

function TableCard({ table, session, isActive, onStartSession, onAddBeverage, onEndSession }) {
  const [selectedGameType, setSelectedGameType] = useState(1);
  const [playerName, setPlayerName] = useState('');
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!isActive || !session) return;

    const interval = setInterval(() => {
      const startTime = new Date(session.started_at);
      const now = new Date();
      const ms = now - startTime;
      setElapsed(ms);
    }, 1000);

    return () => clearInterval(interval);
  }, [isActive, session]);

  const formatTime = (ms) => {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const calculateCost = (ms, rate, billingType) => {
    if (billingType === 'per_frame') return rate;
    const hours = ms / 3600000;
    return Math.round(hours * rate);
  };

  const getCurrentRate = () => {
    const gameType = table.game_types?.find(gt => gt.id === selectedGameType);
    return gameType?.rate_per_hour || 0;
  };

  if (isActive && session) {
    const gameType = table.game_types?.find(gt => gt.id === session.game_type_id);
    const runningCost = calculateCost(elapsed, gameType?.rate_per_hour || 0, gameType?.billing_type);

    return (
      <div className="table-card active">
        <div className="table-card-header">
          <div className="table-header-left">
            <h3>{table.name}</h3>
            <span className="table-type-tag">{table.is_private ? 'Private' : 'Open'}</span>
          </div>
          <div className="status-indicator amber">
            <span className="status-dot"></span>
            <span>In session</span>
          </div>
        </div>

        <div className="table-card-body">
          <div className="game-type-badge" data-type={gameType?.name.toLowerCase().replace(' ', '')}>
            {gameType?.name}
          </div>

          {session.player_name && (
            <div className="player-info">
              <span className="player-label">Player</span>
              <span className="player-name">{session.player_name}</span>
            </div>
          )}

          <div className="timer-display">{formatTime(elapsed)}</div>

          <div className="cost-display">
            <span className="cost-label">{gameType?.billing_type === 'per_frame' ? 'Flat rate' : 'Running cost'}</span>
            <span className="cost-amount">Rs {runningCost.toLocaleString()}</span>
          </div>

          <div className="table-actions-row">
            <button
              className="btn-secondary"
              onClick={() => onAddBeverage(table, session)}
            >
              <Plus size={16} />
              Add Beverage
            </button>
            <button
              className="btn-coral"
              onClick={() => onEndSession(table, session)}
            >
              End Session
            </button>
          </div>
        </div>

        <div className="table-card-footer">
          <span className="rate-display">Rs {(gameType?.rate_per_hour || 0).toLocaleString()}{gameType?.billing_type === 'per_frame' ? ' flat' : '/hr'}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="table-card available">
      <div className="table-card-header">
        <div className="table-header-left">
          <h3>{table.name}</h3>
          <span className="table-type-tag">{table.is_private ? 'Private' : 'Open'}</span>
        </div>
        <div className="status-indicator green">
          <span className="status-dot"></span>
          <span>Available</span>
        </div>
      </div>

      <div className="table-card-body">
        <div className="form-group">
          <label>Game type</label>
          <select
            value={selectedGameType}
            onChange={(e) => setSelectedGameType(Number(e.target.value))}
            className="game-type-select"
          >
            {table.game_types?.map(gt => (
              <option key={gt.id} value={gt.id}>{gt.name}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <input
            type="text"
            placeholder="Player name (optional)"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            className="player-input"
          />
        </div>

        <button
          className="btn-emerald btn-large"
          onClick={() => onStartSession(table)}
        >
          <Play size={20} />
          Start Session
        </button>
      </div>

      <div className="table-card-footer">
        {(() => {
          const gt = table.game_types?.find(g => g.id === selectedGameType);
          return <span className="rate-display">Rs {getCurrentRate().toLocaleString()}{gt?.billing_type === 'per_frame' ? ' flat' : '/hr'}</span>;
        })()}
      </div>
    </div>
  );
}

function StartSessionModal({ table, onClose, onSuccess }) {
  const [selectedGameType, setSelectedGameType] = useState(null);
  const [playerName, setPlayerName] = useState('');
  const [memberId, setMemberId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [members, setMembers] = useState([]);
  const [showMemberDropdown, setShowMemberDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (table.game_types && table.game_types.length > 0) {
      setSelectedGameType(table.game_types[0].id);
    }
  }, [table]);

  useEffect(() => {
    if (searchQuery.length >= 2) {
      const timer = setTimeout(async () => {
        const result = await window.electron.invoke('members:getAll');
        if (result.success) {
          const filtered = result.data.filter(m =>
            m.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (m.phone && m.phone.includes(searchQuery))
          );
          setMembers(filtered);
          setShowMemberDropdown(filtered.length > 0);
        }
      }, 300);
      return () => clearTimeout(timer);
    } else {
      setShowMemberDropdown(false);
    }
  }, [searchQuery]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedGameType) return;

    setLoading(true);
    try {
      const result = await window.electron.invoke('sessions:start', {
        table_id: table.id,
        game_type_id: selectedGameType,
        player_name: playerName || null,
        member_id: memberId,
        started_at: new Date().toISOString()
      });

      if (result.success) {
        toast.success(`Session started on ${table.name}`);
        onSuccess();
        onClose();
      } else {
        toast.error(result.error || 'Failed to start session');
      }
    } catch (error) {
      toast.error('Failed to start session');
    } finally {
      setLoading(false);
    }
  };

  const selectMember = (member) => {
    setPlayerName(member.full_name);
    setMemberId(member.id);
    setSearchQuery('');
    setShowMemberDropdown(false);
  };

  const selectedGame = table.game_types?.find(gt => gt.id === selectedGameType);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal start-session-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Start Session</h2>
          <button className="modal-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          <div className="table-chip">{table.name}</div>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Game type</label>
              <div className="game-type-cards">
                {table.game_types?.map(gt => (
                  <div
                    key={gt.id}
                    className={`game-type-card ${selectedGameType === gt.id ? 'selected' : ''}`}
                    onClick={() => setSelectedGameType(gt.id)}
                  >
                    <span className="game-type-name">{gt.name}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label>Player name</label>
              <input
                type="text"
                placeholder="Enter player name"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                className="input"
              />
            </div>

            <div className="form-group">
              <label>Member search (optional)</label>
              <div className="member-search-wrapper">
                <input
                  type="text"
                  placeholder="Search by name or phone"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="input"
                />
                {showMemberDropdown && (
                  <div className="member-dropdown">
                    {members.map(member => (
                      <div
                        key={member.id}
                        className="member-option"
                        onClick={() => selectMember(member)}
                      >
                        <span className="member-name">{member.full_name}</span>
                        <span className="member-phone">{member.phone}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {selectedGame && (
              <div className="rate-preview">
                Rate: Rs {selectedGame.rate_per_hour.toLocaleString()}{selectedGame.billing_type === 'per_frame' ? ' flat' : '/hr'} · {table.is_private ? 'Private Room' : 'Open'} · {selectedGame.name}
              </div>
            )}

            <div className="modal-actions">
              <button type="button" className="btn-text" onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className="btn-emerald btn-large" disabled={loading}>
                {loading ? 'Starting...' : 'Start session'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

function AddBeverageModal({ table, session, onClose, onSuccess }) {
  const [beverages, setBeverages] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState({});
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadBeverages();
  }, []);

  const loadBeverages = async () => {
    const result = await window.electron.invoke('beverages:getAll');
    if (result.success) {
      setBeverages(result.data.filter(b => b.in_stock));
    }
  };

  const filteredBeverages = beverages.filter(b =>
    b.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const addToCart = (beverage) => {
    setCart(prev => ({
      ...prev,
      [beverage.id]: {
        ...beverage,
        qty: (prev[beverage.id]?.qty || 0) + 1
      }
    }));
  };

  const updateQty = (id, delta) => {
    setCart(prev => {
      const current = prev[id]?.qty || 0;
      const newQty = current + delta;
      if (newQty <= 0) {
        const { [id]: removed, ...rest } = prev;
        return rest;
      }
      return {
        ...prev,
        [id]: { ...prev[id], qty: newQty }
      };
    });
  };

  const getTotal = () => {
    return Object.values(cart).reduce((sum, item) => sum + (item.price * item.qty), 0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const items = Object.values(cart).map(item => ({
      beverage_id: item.id,
      qty: item.qty,
      unit_price: item.price
    }));

    if (items.length === 0) {
      toast.error('Add at least one item');
      return;
    }

    setLoading(true);
    try {
      const result = await window.electron.invoke('orders:addToSession', {
        session_id: session.id,
        items
      });

      if (result.success) {
        toast.success(`Order added to ${table.name}`);
        onSuccess();
        onClose();
      } else {
        toast.error(result.error || 'Failed to add order');
      }
    } catch (error) {
      toast.error('Failed to add order');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal add-beverage-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Add Beverage</h2>
          <button className="modal-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          <div className="table-chip amber">Adding to: {table.name}</div>

          <div className="form-group">
            <input
              type="text"
              placeholder="Search beverages..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input"
            />
          </div>

          <div className="beverage-list">
            {filteredBeverages.map(beverage => (
              <div key={beverage.id} className="beverage-item">
                <div className="beverage-info">
                  <span className="beverage-name">{beverage.name}</span>
                  <span className="beverage-price">Rs {beverage.price}</span>
                </div>
                {cart[beverage.id] ? (
                  <div className="qty-stepper">
                    <button onClick={() => updateQty(beverage.id, -1)}>−</button>
                    <span>{cart[beverage.id].qty}</span>
                    <button onClick={() => updateQty(beverage.id, 1)}>+</button>
                  </div>
                ) : (
                  <button className="btn-add" onClick={() => addToCart(beverage)}>
                    Add
                  </button>
                )}
              </div>
            ))}
          </div>

          {Object.keys(cart).length > 0 && (
            <div className="order-summary">
              <div className="summary-title">Order summary</div>
              {Object.values(cart).map(item => (
                <div key={item.id} className="summary-item">
                  <span>{item.qty}× {item.name}</span>
                  <span>Rs {(item.qty * item.price).toLocaleString()}</span>
                </div>
              ))}
              <div className="summary-total">
                <span>Order total</span>
                <span>Rs {getTotal().toLocaleString()}</span>
              </div>
            </div>
          )}

          <div className="modal-actions">
            <button type="button" className="btn-text" onClick={onClose}>
              Cancel
            </button>
            <button
              className="btn-emerald btn-large"
              onClick={handleSubmit}
              disabled={loading || Object.keys(cart).length === 0}
            >
              {loading ? 'Adding...' : 'Confirm order'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function EndSessionModal({ table, session, onClose, onSuccess }) {
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [discount, setDiscount] = useState('');
  const [discountReason, setDiscountReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [beverages, setBeverages] = useState([]);
  const [clubInfo, setClubInfo] = useState({ clubName: 'Cue Club Manager', address: '', currency: 'Rs' });
  const { toast } = useToast();

  useEffect(() => {
    loadSessionBeverages();
    loadClubInfo();
  }, []);

  const loadSessionBeverages = async () => {
    const result = await window.electron.invoke('orders:getBySession', session.id);
    if (result.success) {
      setBeverages(result.data);
    }
  };

  const loadClubInfo = async () => {
    const result = await window.electron.getSettings();
    if (result.success) {
      setClubInfo(result.data.general);
    }
  };

  const getNow = () => new Date();

  const getDuration = () => {
    const start = new Date(session.started_at);
    const end = getNow();
    const ms = end - start;
    const hours = Math.floor(ms / 3600000);
    const minutes = Math.floor((ms % 3600000) / 60000);
    return { hours, minutes, totalHours: ms / 3600000 };
  };

  const calculateCosts = () => {
    const duration = getDuration();
    const gameType = table.game_types?.find(gt => gt.id === session.game_type_id);
    const isPerFrame = gameType?.billing_type === 'per_frame';
    const gameCost = isPerFrame
      ? Math.round(gameType?.rate_per_hour || 0)
      : Math.round(duration.totalHours * (gameType?.rate_per_hour || 0));
    const beverageCost = beverages.reduce((sum, item) => sum + (item.unit_price * item.qty), 0);
    const discountAmount = parseInt(discount) || 0;
    const subtotal = gameCost + beverageCost;
    const total = Math.max(0, subtotal - discountAmount);
    return { gameCost, beverageCost, subtotal, total, duration, gameType, isPerFrame };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const result = await window.electron.invoke('sessions:end', {
        session_id: session.id,
        ended_at: new Date().toISOString(),
        payment_method: paymentMethod,
        discount: parseInt(discount) || 0,
        discount_reason: discountReason || null
      });
      if (result.success) {
        const costs = calculateCosts();
        toast.success(`Session closed · Rs ${costs.total.toLocaleString()} collected`);
        onSuccess();
        onClose();
      } else {
        toast.error(result.error || 'Failed to end session');
      }
    } catch {
      toast.error('Failed to end session');
    } finally {
      setLoading(false);
    }
  };

  const receiptDate = format(new Date(session.started_at), 'dd/MM/yyyy');
  const receiptTime = format(new Date(session.started_at), 'HH:mm');

  const handlePrint = async () => {
    const cur = clubInfo.currency || 'Rs';
    const bevRows = beverages.map(item =>
      `<div class="row"><span>${item.qty}x ${item.beverage_name}</span><span>${cur} ${(item.qty * item.unit_price).toLocaleString()}</span></div>`
    ).join('');
    const discountRow = parseInt(discount) > 0
      ? `<div class="row"><span>Discount${discountReason ? ` (${discountReason})` : ''}</span><span>-${cur} ${parseInt(discount).toLocaleString()}</span></div>`
      : '';
    const html = `
      <div class="shop-name">${clubInfo.clubName}</div>
      ${clubInfo.address ? `<div class="address">${clubInfo.address}</div>` : ''}
      <div class="title">CASH RECEIPT</div>
      <div class="dots"></div>
      <div class="row"><span>Date:</span><span>${receiptDate}</span></div>
      <div class="row"><span>Time:</span><span>${receiptTime}</span></div>
      <div class="row"><span>Table:</span><span>${table.name}</span></div>
      <div class="row"><span>Game:</span><span>${costs.gameType?.name}</span></div>
      ${session.player_name ? `<div class="row"><span>Player:</span><span>${session.player_name}</span></div>` : ''}
      <div class="row"><span>Duration:</span><span>${costs.duration.hours}h ${costs.duration.minutes}m</span></div>
      <div class="dots"></div>
      <div class="row"><span>${costs.isPerFrame ? `${costs.gameType?.name} (flat)` : 'Game time'}</span><span>${cur} ${costs.gameCost.toLocaleString()}</span></div>
      ${bevRows}
      ${discountRow}
      <div class="dots"></div>
      <div class="row total"><span>Total</span><span>${cur} ${costs.total.toLocaleString()}</span></div>
      <div class="row"><span>Cash</span><span>${paymentMethod}</span></div>
      <div class="dots"></div>
      <div class="thankyou">THANK YOU</div>
      <div class="barcode">||||| |||| |||||</div>
    `;
    await window.electron.printReceipt({ html });
  };

  const costs = calculateCosts();
  const { duration, gameType, isPerFrame } = costs;
  const startTime = format(new Date(session.started_at), 'h:mm a');
  const endTime = format(getNow(), 'h:mm a');

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal end-session-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="session-modal-title">
            <span className="session-modal-table">{table.name} · {gameType?.name}</span>
            <span className="session-active-badge">Active Session</span>
          </div>
          <button className="modal-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          <div className="session-info-grid">
            {session.player_name && (
              <div className="info-row">
                <span className="info-label">Player</span>
                <span className="info-value">{session.player_name}</span>
              </div>
            )}
            <div className="info-row">
              <span className="info-label">Duration</span>
              <span className="info-value">{duration.hours} hr {duration.minutes} min</span>
            </div>
            <div className="info-row">
              <span className="info-label">Start Time</span>
              <span className="info-value">{startTime}</span>
            </div>
            <div className="info-row">
              <span className="info-label">End Time</span>
              <span className="info-value">{endTime}</span>
            </div>
          </div>

          <div className="cost-breakdown">
            <div className="breakdown-row">
              <span>
                {isPerFrame
                  ? `${gameType?.name} · flat rate`
                  : `Game time: ${duration.totalHours.toFixed(2)} hrs × Rs ${gameType?.rate_per_hour || 0}/hr`}
              </span>
              <span>Rs {costs.gameCost.toLocaleString()}</span>
            </div>

            {beverages.length > 0 && (
              <>
                <div className="breakdown-row bev-summary">
                  <span>
                    Beverages: {beverages.map(i => `${i.qty}x ${i.beverage_name}`).join(', ')}
                  </span>
                  <span>Rs {costs.beverageCost.toLocaleString()}</span>
                </div>
              </>
            )}

            <div className="breakdown-divider" />

            <div className="breakdown-row subtotal">
              <span>Subtotal</span>
              <span>Rs {costs.subtotal.toLocaleString()}</span>
            </div>

            {parseInt(discount) > 0 && (
              <div className="breakdown-row discount">
                <span>Discount Applied</span>
                <span>−Rs {parseInt(discount).toLocaleString()}</span>
              </div>
            )}

            <div className="breakdown-row total-payable">
              <span>Total Amount Payable</span>
              <span>Rs {costs.total.toLocaleString()}</span>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Payment method</label>
              <div className="payment-methods">
                {['Cash', 'Card', 'Credit'].map(method => (
                  <button
                    key={method}
                    type="button"
                    className={`payment-method ${paymentMethod === method ? 'selected' : ''}`}
                    onClick={() => setPaymentMethod(method)}
                  >
                    {method}
                  </button>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label>Discount (optional)</label>
              <input
                type="number"
                placeholder="0"
                value={discount}
                onChange={(e) => setDiscount(e.target.value)}
                className="input"
              />
            </div>

            {parseInt(discount) > 0 && (
              <div className="form-group">
                <input
                  type="text"
                  placeholder="Reason for discount"
                  value={discountReason}
                  onChange={(e) => setDiscountReason(e.target.value)}
                  className="input"
                />
              </div>
            )}

            <div className="session-close-note">
              Confirming will mark the table as vacant and archive this session permanently.
            </div>

            <div className="modal-actions">
              <button type="button" className="btn-secondary btn-print" onClick={handlePrint}>
                <Printer size={15} />
                Print receipt
              </button>
              <button type="submit" className="btn-emerald btn-large" disabled={loading}>
                <CheckCircle size={16} />
                {loading ? 'Closing...' : 'Confirm & close session'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
