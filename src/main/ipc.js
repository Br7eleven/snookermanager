import { ipcMain } from 'electron';
import db from './db.js';
import bcrypt from 'bcryptjs';
import Store from 'electron-store';

const store = new Store();

export function setupIpcHandlers() {
  ipcMain.handle('auth:login', (event, { username, password }) => {
    try {
      const user = db.prepare('SELECT * FROM staff WHERE username = ? AND is_active = 1').get(username);
      if (!user) {
        return { success: false, error: 'Invalid credentials' };
      }
      const isValid = bcrypt.compareSync(password, user.password_hash);
      if (!isValid) {
        return { success: false, error: 'Invalid credentials' };
      }
      const { password_hash, ...userWithoutPassword } = user;
      return { success: true, user: userWithoutPassword };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: 'Login failed' };
    }
  });

  ipcMain.handle('auth:logout', () => {
    return { success: true };
  });

  // Remember username handlers
  ipcMain.handle('auth:rememberUsername', (event, username) => {
    try {
      store.set('rememberedUsername', username);
      return { success: true };
    } catch (error) {
      console.error('Failed to remember username:', error);
      return { success: false };
    }
  });

  ipcMain.handle('auth:forgetUsername', () => {
    try {
      store.delete('rememberedUsername');
      return { success: true };
    } catch (error) {
      console.error('Failed to forget username:', error);
      return { success: false };
    }
  });

  ipcMain.handle('auth:getRememberedUsername', () => {
    try {
      const username = store.get('rememberedUsername');
      return { success: true, username };
    } catch (error) {
      console.error('Failed to get remembered username:', error);
      return { success: false, username: null };
    }
  });

  ipcMain.handle('tables:getAll', () => {
    try {
      const tables = db.prepare(`
        SELECT t.*,
          (SELECT COUNT(*) FROM sessions WHERE table_id = t.id AND ended_at IS NULL) as active_sessions
        FROM tables t
        ORDER BY t.id
      `).all();

      tables.forEach(table => {
        table.is_private = table.type === 'private';
        const gameTypes = db.prepare(`
          SELECT id, name, rate_per_hour FROM game_types WHERE table_id = ? ORDER BY id
        `).all(table.id);
        table.game_types = gameTypes;
      });

      return { success: true, data: tables };
    } catch (error) {
      console.error('tables:getAll error:', error);
      return { success: false, error: 'Failed to fetch tables' };
    }
  });

  ipcMain.handle('tables:updateStatus', (event, { tableId, status }) => {
    try {
      db.prepare('UPDATE tables SET status = ? WHERE id = ?').run(status, tableId);
      return { success: true };
    } catch (error) {
      return { success: false, error: 'Failed to update table status' };
    }
  });

  ipcMain.handle('sessions:start', (event, { table_id, game_type_id, player_name, member_id, started_at }) => {
    try {
      const result = db.prepare(`
        INSERT INTO sessions (table_id, game_type_id, player_name, member_id, started_at)
        VALUES (?, ?, ?, ?, ?)
      `).run(table_id, game_type_id, player_name || null, member_id || null, started_at);
      db.prepare('UPDATE tables SET status = ? WHERE id = ?').run('in_session', table_id);
      return { success: true, sessionId: result.lastInsertRowid };
    } catch (error) {
      console.error('sessions:start error:', error);
      return { success: false, error: 'Failed to start session' };
    }
  });

  ipcMain.handle('sessions:end', (event, { session_id, ended_at, payment_method, discount, discount_reason }) => {
    try {
      const session = db.prepare('SELECT table_id FROM sessions WHERE id = ?').get(session_id);
      db.prepare(`
        UPDATE sessions SET ended_at = ? WHERE id = ?
      `).run(ended_at, session_id);

      if (payment_method) {
        const beverageCost = db.prepare(`
          SELECT COALESCE(SUM(qty * unit_price), 0) as total FROM order_items WHERE session_id = ?
        `).get(session_id).total;

        const sessionData = db.prepare(`
          SELECT s.started_at, gt.rate_per_hour
          FROM sessions s
          JOIN game_types gt ON s.game_type_id = gt.id
          WHERE s.id = ?
        `).get(session_id);

        const startTime = new Date(sessionData.started_at);
        const endTime = new Date(ended_at);
        const hours = (endTime - startTime) / 3600000;
        const gameCost = Math.round(hours * sessionData.rate_per_hour);
        const totalAmount = gameCost + beverageCost - (discount || 0);

        db.prepare(`
          INSERT INTO payments (session_id, amount, method, discount)
          VALUES (?, ?, ?, ?)
        `).run(session_id, totalAmount, payment_method.toLowerCase(), discount || 0);

        db.prepare(`
          UPDATE sessions SET total_game_cost = ?, notes = ? WHERE id = ?
        `).run(gameCost, discount_reason || null, session_id);
      }

      const activeSessions = db.prepare(
        'SELECT COUNT(*) as count FROM sessions WHERE table_id = ? AND ended_at IS NULL'
      ).get(session.table_id);
      if (activeSessions.count === 0) {
        db.prepare('UPDATE tables SET status = ? WHERE id = ?').run('available', session.table_id);
      }
      return { success: true };
    } catch (error) {
      console.error('sessions:end error:', error);
      return { success: false, error: 'Failed to end session' };
    }
  });

  ipcMain.handle('sessions:getActive', () => {
    try {
      const sessions = db.prepare(`
        SELECT s.id, s.table_id, s.game_type_id, s.started_at, s.player_name,
          t.name as table_name,
          gt.name as game_type,
          gt.rate_per_hour
        FROM sessions s
        JOIN tables t ON s.table_id = t.id
        JOIN game_types gt ON s.game_type_id = gt.id
        WHERE s.ended_at IS NULL
        ORDER BY s.started_at DESC
      `).all();
      return { success: true, data: sessions };
    } catch (error) {
      console.error('sessions:getActive error:', error);
      return { success: false, error: 'Failed to fetch active sessions' };
    }
  });

  ipcMain.handle('beverages:getAll', () => {
    try {
      const beverages = db.prepare('SELECT * FROM beverages ORDER BY category, name').all();
      return { success: true, data: beverages };
    } catch (error) {
      return { success: false, error: 'Failed to fetch beverages' };
    }
  });

  ipcMain.handle('beverages:add', (event, { name, category, price }) => {
    try {
      const result = db.prepare('INSERT INTO beverages (name, category, price) VALUES (?, ?, ?)').run(name, category, price);
      return { success: true, id: result.lastInsertRowid };
    } catch (error) {
      return { success: false, error: 'Failed to add beverage' };
    }
  });

  ipcMain.handle('beverages:update', (event, { id, name, category, price, inStock }) => {
    try {
      db.prepare('UPDATE beverages SET name = ?, category = ?, price = ?, in_stock = ? WHERE id = ?')
        .run(name, category, price, inStock ? 1 : 0, id);
      return { success: true };
    } catch (error) {
      return { success: false, error: 'Failed to update beverage' };
    }
  });

  ipcMain.handle('beverages:delete', (event, { id }) => {
    try {
      db.prepare('DELETE FROM beverages WHERE id = ?').run(id);
      return { success: true };
    } catch (error) {
      return { success: false, error: 'Failed to delete beverage' };
    }
  });

  ipcMain.handle('orders:addToSession', (event, { session_id, items }) => {
    try {
      const insert = db.prepare('INSERT INTO order_items (session_id, beverage_id, qty, unit_price) VALUES (?, ?, ?, ?)');
      items.forEach(item => {
        insert.run(session_id, item.beverage_id, item.qty, item.unit_price);
      });
      return { success: true };
    } catch (error) {
      console.error('orders:addToSession error:', error);
      return { success: false, error: 'Failed to add order' };
    }
  });

  ipcMain.handle('orders:getBySession', (event, session_id) => {
    try {
      const orders = db.prepare(`
        SELECT oi.*, b.name as beverage_name
        FROM order_items oi
        JOIN beverages b ON oi.beverage_id = b.id
        WHERE oi.session_id = ?
      `).all(session_id);
      return { success: true, data: orders };
    } catch (error) {
      console.error('orders:getBySession error:', error);
      return { success: false, error: 'Failed to fetch orders' };
    }
  });

  ipcMain.handle('members:getAll', () => {
    try {
      const members = db.prepare('SELECT * FROM members ORDER BY full_name').all();
      return { success: true, data: members };
    } catch (error) {
      return { success: false, error: 'Failed to fetch members' };
    }
  });

  ipcMain.handle('members:add', (event, { fullName, phone, balance }) => {
    try {
      const result = db.prepare('INSERT INTO members (full_name, phone, balance) VALUES (?, ?, ?)')
        .run(fullName, phone || null, balance || 0);
      return { success: true, id: result.lastInsertRowid };
    } catch (error) {
      return { success: false, error: 'Failed to add member' };
    }
  });

  ipcMain.handle('members:update', (event, { id, fullName, phone, balance }) => {
    try {
      db.prepare('UPDATE members SET full_name = ?, phone = ?, balance = ? WHERE id = ?')
        .run(fullName, phone, balance, id);
      return { success: true };
    } catch (error) {
      return { success: false, error: 'Failed to update member' };
    }
  });

  ipcMain.handle('reports:getDaily', (event, { date }) => {
    try {
      const sessions = db.prepare(`
        SELECT s.*, t.name as table_name, gt.name as game_type_name,
          (SELECT SUM(qty * unit_price) FROM order_items WHERE session_id = s.id) as beverages_total
        FROM sessions s
        JOIN tables t ON s.table_id = t.id
        JOIN game_types gt ON s.game_type_id = gt.id
        WHERE DATE(s.started_at) = DATE(?)
        ORDER BY s.started_at DESC
      `).all(date);

      // Calculate aggregated metrics for dashboard
      let totalRevenue = 0;
      let beveragesSold = 0;
      const recentActivity = [];

      sessions.forEach(session => {
        const sessionTotal = (session.total_game_cost || 0) + (session.beverages_total || 0);
        totalRevenue += sessionTotal;

        const beverageItems = db.prepare(`
          SELECT SUM(qty) as total FROM order_items WHERE session_id = ?
        `).get(session.id);
        beveragesSold += beverageItems.total || 0;

        if (session.ended_at) {
          recentActivity.push({
            type: 'session-ended',
            message: `${session.table_name} session ended · Rs ${Math.round(sessionTotal).toLocaleString()}`,
            timestamp: session.ended_at,
          });
        }
      });

      // Add beverage orders to activity
      const recentOrders = db.prepare(`
        SELECT oi.*, b.name as beverage_name, t.name as table_name, s.started_at
        FROM order_items oi
        JOIN beverages b ON oi.beverage_id = b.id
        JOIN sessions s ON oi.session_id = s.id
        JOIN tables t ON s.table_id = t.id
        WHERE DATE(s.started_at) = DATE(?)
        ORDER BY oi.id DESC
        LIMIT 5
      `).all(date);

      recentOrders.forEach(order => {
        recentActivity.push({
          type: 'beverage',
          message: `${order.qty}x ${order.beverage_name} added to ${order.table_name}`,
          timestamp: order.started_at,
        });
      });

      // Sort activity by timestamp
      recentActivity.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

      return {
        success: true,
        data: {
          sessions,
          totalRevenue,
          revenueChange: 0, // TODO: Calculate vs yesterday
          beveragesSold,
          recentActivity: recentActivity.slice(0, 8),
        }
      };
    } catch (error) {
      console.error('Daily report error:', error);
      return { success: false, error: 'Failed to fetch report' };
    }
  });

  ipcMain.handle('reports:getRange', (event, { startDate, endDate }) => {
    try {
      const sessions = db.prepare(`
        SELECT s.*, t.name as table_name, gt.name as game_type_name,
          (SELECT SUM(qty * unit_price) FROM order_items WHERE session_id = s.id) as beverages_total
        FROM sessions s
        JOIN tables t ON s.table_id = t.id
        JOIN game_types gt ON s.game_type_id = gt.id
        WHERE DATE(s.started_at) BETWEEN DATE(?) AND DATE(?)
        ORDER BY s.started_at DESC
      `).all(startDate, endDate);
      return { success: true, data: sessions };
    } catch (error) {
      return { success: false, error: 'Failed to fetch report' };
    }
  });

  ipcMain.handle('settings:getTables', () => {
    try {
      const tables = db.prepare(`
        SELECT t.id, t.name, t.type,
          (SELECT json_group_array(json_object('id', id, 'name', name, 'rate_per_hour', rate_per_hour))
           FROM game_types WHERE table_id = t.id) as game_types
        FROM tables t
        ORDER BY t.id
      `).all();
      tables.forEach(table => {
        table.game_types = JSON.parse(table.game_types);
      });
      return { success: true, data: tables };
    } catch (error) {
      return { success: false, error: 'Failed to fetch tables' };
    }
  });

  ipcMain.handle('settings:updateRate', (event, { gameTypeId, rate }) => {
    try {
      db.prepare('UPDATE game_types SET rate_per_hour = ? WHERE id = ?').run(rate, gameTypeId);
      return { success: true };
    } catch (error) {
      return { success: false, error: 'Failed to update rate' };
    }
  });

  ipcMain.handle('staff:getAll', () => {
    try {
      const staff = db.prepare('SELECT id, full_name, username, role, is_active, created_at FROM staff ORDER BY created_at DESC').all();
      return { success: true, data: staff };
    } catch (error) {
      return { success: false, error: 'Failed to fetch staff' };
    }
  });

  ipcMain.handle('staff:add', (event, { fullName, username, password, role }) => {
    try {
      const passwordHash = bcrypt.hashSync(password, 10);
      const result = db.prepare('INSERT INTO staff (full_name, username, password_hash, role) VALUES (?, ?, ?, ?)')
        .run(fullName, username, passwordHash, role);
      return { success: true, id: result.lastInsertRowid };
    } catch (error) {
      return { success: false, error: 'Failed to add staff member' };
    }
  });

  ipcMain.handle('staff:update', (event, { id, fullName, username, role, isActive }) => {
    try {
      db.prepare('UPDATE staff SET full_name = ?, username = ?, role = ?, is_active = ? WHERE id = ?')
        .run(fullName, username, role, isActive ? 1 : 0, id);
      return { success: true };
    } catch (error) {
      return { success: false, error: 'Failed to update staff member' };
    }
  });

  ipcMain.handle('staff:delete', (event, { id }) => {
    try {
      db.prepare('DELETE FROM staff WHERE id = ?').run(id);
      return { success: true };
    } catch (error) {
      return { success: false, error: 'Failed to delete staff member' };
    }
  });

  // Reports handlers
  ipcMain.handle('reports:get', (event, filter) => {
    try {
      let dateCondition = '';
      const today = new Date().toISOString().split('T')[0];

      if (filter === 'today') {
        dateCondition = `DATE(s.started_at) = DATE('${today}')`;
      } else if (filter === 'week') {
        dateCondition = `DATE(s.started_at) >= DATE('${today}', '-7 days')`;
      } else if (filter === 'month') {
        dateCondition = `DATE(s.started_at) >= DATE('${today}', '-30 days')`;
      }

      // Get stats
      const statsQuery = db.prepare(`
        SELECT
          COALESCE(SUM((julianday(s.ended_at) - julianday(s.started_at)) * 24 * gt.rate_per_hour), 0) as total_revenue,
          COUNT(*) as total_sessions,
          ROUND(AVG((julianday(s.ended_at) - julianday(s.started_at)) * 24 * 60)) as avg_duration_minutes
        FROM sessions s
        JOIN game_types gt ON s.game_type_id = gt.id
        WHERE s.ended_at IS NOT NULL AND ${dateCondition}
      `).get();

      const popularGameQuery = db.prepare(`
        SELECT gt.name, COUNT(*) as count
        FROM sessions s
        JOIN game_types gt ON s.game_type_id = gt.id
        WHERE ${dateCondition}
        GROUP BY gt.name
        ORDER BY count DESC
        LIMIT 1
      `).get();

      const stats = {
        totalRevenue: Math.round(statsQuery.total_revenue || 0),
        totalSessions: statsQuery.total_sessions || 0,
        popularGame: popularGameQuery?.name || 'N/A',
        avgDuration: `${statsQuery.avg_duration_minutes || 0}m`
      };

      // Revenue by day (last 7 days)
      const revenueData = [];
      const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];

        const dayRevenue = db.prepare(`
          SELECT COALESCE(SUM((julianday(s.ended_at) - julianday(s.started_at)) * 24 * gt.rate_per_hour), 0) as amount
          FROM sessions s
          JOIN game_types gt ON s.game_type_id = gt.id
          WHERE s.ended_at IS NOT NULL AND DATE(s.started_at) = DATE(?)
        `).get(dateStr);

        revenueData.push({
          day: days[date.getDay()],
          amount: Math.round(dayRevenue.amount || 0)
        });
      }

      // Sessions by game type
      const gameTypeData = db.prepare(`
        SELECT gt.name, COUNT(*) as count
        FROM sessions s
        JOIN game_types gt ON s.game_type_id = gt.id
        WHERE ${dateCondition}
        GROUP BY gt.name
      `).all();

      // Session log
      const sessions = db.prepare(`
        SELECT
          s.id,
          s.started_at as date,
          t.name as table_name,
          gt.name as game,
          COALESCE(s.player_name, m.full_name, 'Guest') as player,
          printf('%02d:%02d',
            CAST((julianday(s.ended_at) - julianday(s.started_at)) * 24 AS INTEGER),
            CAST(((julianday(s.ended_at) - julianday(s.started_at)) * 24 * 60) % 60 AS INTEGER)
          ) as duration,
          ROUND((julianday(s.ended_at) - julianday(s.started_at)) * 24 * gt.rate_per_hour, 2) as cost,
          ROUND((julianday(s.ended_at) - julianday(s.started_at)) * 24 * gt.rate_per_hour +
            COALESCE((SELECT SUM(qty * unit_price) FROM order_items WHERE session_id = s.id), 0), 2) as total
        FROM sessions s
        JOIN tables t ON s.table_id = t.id
        JOIN game_types gt ON s.game_type_id = gt.id
        LEFT JOIN members m ON s.member_id = m.id
        WHERE s.ended_at IS NOT NULL AND ${dateCondition}
        ORDER BY s.started_at DESC
      `).all();

      return {
        success: true,
        data: { stats, revenueData, gameTypeData, sessions }
      };
    } catch (error) {
      console.error('reports:get error:', error);
      return { success: false, error: 'Failed to fetch reports' };
    }
  });

  ipcMain.handle('reports:exportSessionsCSV', async () => {
    try {
      const { dialog } = await import('electron');
      const { writeFileSync } = await import('fs');

      const result = await dialog.showSaveDialog({
        title: 'Export Sessions',
        defaultPath: 'sessions.csv',
        filters: [{ name: 'CSV', extensions: ['csv'] }]
      });

      if (result.canceled) return { success: false };

      const sessions = db.prepare(`
        SELECT
          s.started_at, s.ended_at,
          t.name as table, gt.name as game,
          COALESCE(s.player_name, m.full_name, 'Guest') as player,
          ROUND((julianday(s.ended_at) - julianday(s.started_at)) * 24 * gt.rate_per_hour, 2) as cost
        FROM sessions s
        JOIN tables t ON s.table_id = t.id
        JOIN game_types gt ON s.game_type_id = gt.id
        LEFT JOIN members m ON s.member_id = m.id
        WHERE s.ended_at IS NOT NULL
        ORDER BY s.started_at DESC
      `).all();

      const csv = [
        'Date,Table,Game,Player,Duration,Cost',
        ...sessions.map(s => `${s.started_at},${s.table},${s.game},${s.player},${s.ended_at},${s.cost}`)
      ].join('\n');

      writeFileSync(result.filePath, csv);
      return { success: true };
    } catch (error) {
      console.error('Export error:', error);
      return { success: false, error: 'Failed to export' };
    }
  });

  ipcMain.handle('reports:exportBusinessReportCSV', async () => {
    try {
      const { dialog } = await import('electron');
      const { writeFileSync } = await import('fs');

      const result = await dialog.showSaveDialog({
        title: 'Export Business Report',
        defaultPath: 'business-report.csv',
        filters: [{ name: 'CSV', extensions: ['csv'] }]
      });

      if (result.canceled) return { success: false };

      const report = db.prepare(`
        SELECT
          DATE(s.started_at) as date,
          COUNT(*) as sessions,
          ROUND(SUM((julianday(s.ended_at) - julianday(s.started_at)) * 24 * gt.rate_per_hour), 2) as revenue
        FROM sessions s
        JOIN game_types gt ON s.game_type_id = gt.id
        WHERE s.ended_at IS NOT NULL
        GROUP BY DATE(s.started_at)
        ORDER BY date DESC
      `).all();

      const csv = [
        'Date,Sessions,Revenue',
        ...report.map(r => `${r.date},${r.sessions},${r.revenue}`)
      ].join('\n');

      writeFileSync(result.filePath, csv);
      return { success: true };
    } catch (error) {
      console.error('Export error:', error);
      return { success: false, error: 'Failed to export' };
    }
  });

  // Settings handlers
  ipcMain.handle('settings:getAll', () => {
    try {
      const general = {
        clubName: store.get('clubName', 'Royal Snooker Lounge'),
        currency: store.get('currency', 'Rs'),
        address: store.get('address', ''),
        openingTime: store.get('openingTime', '10:00'),
        closingTime: store.get('closingTime', '02:00')
      };

      const tables = db.prepare(`
        SELECT
          t.id, t.name, t.type, t.status,
          (SELECT rate_per_hour FROM game_types WHERE table_id = t.id AND name LIKE '%Full Ball%') as fullBallPrice,
          (SELECT rate_per_hour FROM game_types WHERE table_id = t.id AND name LIKE '%8-Ball%') as eightBallPrice,
          (SELECT rate_per_hour FROM game_types WHERE table_id = t.id AND name LIKE '%9-Ball%') as nineBallPrice,
          (SELECT rate_per_hour FROM game_types WHERE table_id = t.id AND name LIKE '%Snooker%') as snookerPrice
        FROM tables t
        ORDER BY t.id
      `).all();

      const beverages = db.prepare('SELECT * FROM beverages ORDER BY name').all();
      const staff = db.prepare('SELECT id, full_name as name, role FROM staff WHERE is_active = 1 ORDER BY full_name').all();

      return {
        success: true,
        data: { general, tables, beverages, staff }
      };
    } catch (error) {
      console.error('settings:getAll error:', error);
      return { success: false, error: 'Failed to fetch settings' };
    }
  });

  ipcMain.handle('settings:saveGeneral', (event, settings) => {
    try {
      store.set('clubName', settings.clubName);
      store.set('currency', settings.currency);
      store.set('address', settings.address);
      store.set('openingTime', settings.openingTime);
      store.set('closingTime', settings.closingTime);
      return { success: true };
    } catch (error) {
      return { success: false, error: 'Failed to save settings' };
    }
  });

  ipcMain.handle('settings:saveTablesPricing', (event, tables) => {
    try {
      tables.forEach(table => {
        db.prepare('UPDATE tables SET status = ? WHERE id = ?').run(table.status, table.id);

        const gameTypes = [
          { pattern: '%Full Ball%', price: table.fullBallPrice },
          { pattern: '%8-Ball%', price: table.eightBallPrice },
          { pattern: '%9-Ball%', price: table.nineBallPrice },
          { pattern: '%Snooker%', price: table.snookerPrice }
        ];

        gameTypes.forEach(gt => {
          db.prepare(`
            UPDATE game_types SET rate_per_hour = ?
            WHERE table_id = ? AND name LIKE ?
          `).run(gt.price, table.id, gt.pattern);
        });
      });
      return { success: true };
    } catch (error) {
      console.error('saveTablesPricing error:', error);
      return { success: false, error: 'Failed to save pricing' };
    }
  });

  ipcMain.handle('settings:deleteBeverage', (event, id) => {
    try {
      db.prepare('DELETE FROM beverages WHERE id = ?').run(id);
      return { success: true };
    } catch (error) {
      return { success: false, error: 'Failed to delete beverage' };
    }
  });

  ipcMain.handle('settings:deleteStaff', (event, id) => {
    try {
      db.prepare('UPDATE staff SET is_active = 0 WHERE id = ?').run(id);
      return { success: true };
    } catch (error) {
      return { success: false, error: 'Failed to remove staff' };
    }
  });

  ipcMain.handle('settings:createBackup', async () => {
    try {
      const { dialog } = await import('electron');
      const { copyFileSync } = await import('fs');
      const { app } = await import('electron');
      const path = await import('path');

      const dbPath = path.join(app.getPath('userData'), 'database.db');
      const timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0];

      const result = await dialog.showSaveDialog({
        title: 'Create Backup',
        defaultPath: `backup-${timestamp}.db`,
        filters: [{ name: 'Database', extensions: ['db'] }]
      });

      if (result.canceled) return { success: false };

      copyFileSync(dbPath, result.filePath);
      return { success: true };
    } catch (error) {
      console.error('Backup error:', error);
      return { success: false, error: 'Failed to create backup' };
    }
  });

  ipcMain.handle('settings:restoreBackup', async () => {
    try {
      const { dialog } = await import('electron');
      const { copyFileSync } = await import('fs');
      const { app } = await import('electron');
      const path = await import('path');

      const result = await dialog.showOpenDialog({
        title: 'Restore Backup',
        filters: [{ name: 'Database', extensions: ['db'] }],
        properties: ['openFile']
      });

      if (result.canceled) return { success: false };

      const dbPath = path.join(app.getPath('userData'), 'database.db');
      copyFileSync(result.filePaths[0], dbPath);

      return { success: true };
    } catch (error) {
      console.error('Restore error:', error);
      return { success: false, error: 'Failed to restore backup' };
    }
  });

  console.log('IPC handlers registered');
}
