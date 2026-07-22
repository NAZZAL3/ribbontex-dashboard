import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { initDb, getDb } from './db.js';
import { ammanNow, ammanToday, ammanDateDaysAgo } from './timezone.js';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const clientDist = path.join(__dirname, '..', 'client', 'dist');

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'ribbontex-change-this-secret';
const OWNER_PASSWORD = process.env.OWNER_PASSWORD || 'RibbontexOwner2026!';
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || 'http://localhost:5173';

initDb();

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || origin.startsWith('http://localhost:') || origin === CLIENT_ORIGIN) {
        callback(null, true);
      } else {
        callback(null, CLIENT_ORIGIN);
      }
    },
    credentials: true,
  })
);
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});

function authMiddleware(req, res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  try {
    req.user = jwt.verify(header.slice(7), JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

function ownerMiddleware(req, res, next) {
  const ownerHeader = req.headers['x-owner-token'];
  if (!ownerHeader) {
    return res.status(403).json({ error: 'Owner access required' });
  }
  try {
    const payload = jwt.verify(ownerHeader, JWT_SECRET);
    if (payload.role !== 'owner') {
      return res.status(403).json({ error: 'Owner access required' });
    }
    next();
  } catch {
    return res.status(403).json({ error: 'Owner access required' });
  }
}

app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password required' });
  }

  const db = getDb();
  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, {
    expiresIn: '7d',
  });
  res.json({ token, username: user.username });
});

app.get('/api/auth/me', authMiddleware, (req, res) => {
  res.json({ username: req.user.username });
});

app.post('/api/auth/owner', authMiddleware, (req, res) => {
  const { password } = req.body;
  if (!password || password !== OWNER_PASSWORD) {
    return res.status(401).json({ error: 'Invalid owner password' });
  }
  const ownerToken = jwt.sign({ role: 'owner' }, JWT_SECRET, { expiresIn: '8h' });
  res.json({ ownerToken });
});

app.get('/api/orders', authMiddleware, (req, res) => {
  const db = getDb();
  const { status, search, from, to } = req.query;

  let query = 'SELECT * FROM orders WHERE 1=1';
  const params = [];

  if (status && status !== 'all') {
    query += ' AND status = ?';
    params.push(status);
  }
  if (search) {
    query += ' AND (order_number LIKE ? OR city LIKE ? OR area LIKE ? OR customer_phone LIKE ? OR street LIKE ?)';
    const term = `%${search}%`;
    params.push(term, term, term, term, term);
  }
  if (from) {
    query += ' AND date(created_at) >= date(?)';
    params.push(from);
  }
  if (to) {
    query += ' AND date(created_at) <= date(?)';
    params.push(to);
  }

  query += ' ORDER BY created_at DESC';
  const orders = db.prepare(query).all(...params);
  res.json(orders);
});

function csvEscape(value) {
  const text = value == null ? '' : String(value);
  if (/[",\n\r]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

app.get('/api/customers/export', authMiddleware, (_req, res) => {
  const db = getDb();
  const customers = db
    .prepare(
      `SELECT
         customer_phone AS phone,
         COUNT(*) AS order_count,
         ROUND(SUM(CASE WHEN status != 'cancelled' THEN value ELSE 0 END), 2) AS total_spent,
         MIN(created_at) AS first_order,
         MAX(created_at) AS last_order,
         (
           SELECT area FROM orders o2
           WHERE o2.customer_phone = o.customer_phone
           ORDER BY o2.created_at DESC
           LIMIT 1
         ) AS last_location,
         GROUP_CONCAT(DISTINCT NULLIF(TRIM(area), '')) AS locations
       FROM orders o
       WHERE TRIM(customer_phone) != ''
       GROUP BY customer_phone
       ORDER BY order_count DESC, last_order DESC`
    )
    .all();

  const header = [
    'phone',
    'order_count',
    'total_spent_jd',
    'first_order',
    'last_order',
    'last_location',
    'locations',
  ];

  const lines = [
    header.join(','),
    ...customers.map((row) =>
      [
        csvEscape(row.phone),
        csvEscape(row.order_count),
        csvEscape(row.total_spent ?? 0),
        csvEscape(row.first_order),
        csvEscape(row.last_order),
        csvEscape(row.last_location ?? ''),
        csvEscape(row.locations ?? ''),
      ].join(',')
    ),
  ];

  const csv = `\uFEFF${lines.join('\n')}`;
  const stamp = ammanToday().replace(/-/g, '');
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="ribbontex-customers-${stamp}.csv"`);
  res.send(csv);
});

app.post('/api/orders', authMiddleware, (req, res) => {
  const { location, value, customerPhone, occasion, notes } = req.body;

  if (!location?.trim() || value == null || !customerPhone) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const db = getDb();
  const count = db.prepare('SELECT COUNT(*) as c FROM orders').get().c;
  const orderNumber = `RTN-${String(count + 1).padStart(4, '0')}`;

  const result = db
    .prepare(
      `INSERT INTO orders (order_number, city, area, street, value, customer_phone, delivery_company, occasion, notes, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')`
    )
    .run(
      orderNumber,
      '',
      location.trim(),
      '',
      Number(value),
      customerPhone.trim(),
      '',
      occasion?.trim() || 'general',
      notes?.trim() || ''
    );

  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(order);
});

app.patch('/api/orders/:id', authMiddleware, (req, res) => {
  const { status } = req.body;
  if (!['pending', 'delivered', 'cancelled'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }

  const db = getDb();
  const existing = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Order not found' });

  db.prepare('UPDATE orders SET status = ? WHERE id = ?').run(status, req.params.id);
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);
  res.json(order);
});

app.delete('/api/orders/:id', authMiddleware, (req, res) => {
  const db = getDb();
  const result = db.prepare('DELETE FROM orders WHERE id = ?').run(req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: 'Order not found' });
  res.json({ success: true });
});

app.get('/api/stats', authMiddleware, ownerMiddleware, (req, res) => {
  const db = getDb();
  const { period = '30' } = req.query;
  const days = Number(period) || 30;

  const summary = db
    .prepare(
      `SELECT
        COUNT(*) as totalOrders,
        COALESCE(SUM(CASE WHEN status != 'cancelled' THEN value ELSE 0 END), 0) as totalRevenue,
        COALESCE(AVG(CASE WHEN status != 'cancelled' THEN value END), 0) as avgOrderValue,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pendingOrders,
        SUM(CASE WHEN status = 'delivered' THEN 1 ELSE 0 END) as deliveredOrders
       FROM orders
       WHERE date(created_at) >= date('now', '-' || ? || ' days')`
    )
    .get(days);

  const byArea = db
    .prepare(
      `SELECT area, city, COUNT(*) as count, SUM(value) as revenue
       FROM orders
       WHERE status != 'cancelled' AND date(created_at) >= date('now', '-' || ? || ' days')
       GROUP BY area, city
       ORDER BY count DESC
       LIMIT 8`
    )
    .all(days);

  const byDay = db
    .prepare(
      `SELECT date(created_at) as date, COUNT(*) as orders, SUM(value) as revenue
       FROM orders
       WHERE status != 'cancelled' AND date(created_at) >= date('now', '-' || ? || ' days')
       GROUP BY date(created_at)
       ORDER BY date ASC`
    )
    .all(days);

  const byOccasion = db
    .prepare(
      `SELECT occasion, COUNT(*) as count, SUM(value) as revenue
       FROM orders
       WHERE status != 'cancelled' AND date(created_at) >= date('now', '-' || ? || ' days')
       GROUP BY occasion
       ORDER BY count DESC`
    )
    .all(days);

  const repeatCustomers = db
    .prepare(
      `SELECT customer_phone, COUNT(*) as orderCount, SUM(value) as totalSpent
       FROM orders
       WHERE status != 'cancelled'
       GROUP BY customer_phone
       HAVING orderCount > 1
       ORDER BY orderCount DESC
       LIMIT 10`
    )
    .all();

  res.json({ summary, byArea, byDay, byOccasion, repeatCustomers });
});

const NO_BUY_REASONS = ['browsing', 'price', 'not_found', 'come_back', 'other'];

function resolveNoBuyReason(reason, customReason) {
  if (reason === 'other') {
    const text = customReason?.trim();
    if (!text) return { error: 'Custom reason required' };
    return { value: `custom:${text}` };
  }
  if (NO_BUY_REASONS.includes(reason)) return { value: reason };
  return { error: 'Valid reason required' };
}

function isValidStoredReason(reason) {
  if (!reason) return false;
  if (NO_BUY_REASONS.includes(reason)) return true;
  return reason.startsWith('custom:') && reason.length > 7;
}

function getStoreAnalytics(db) {
  const today = ammanToday();
  const stats = db
    .prepare(
      `SELECT
        COUNT(*) as totalVisitors,
        SUM(CASE WHEN outcome = 'bought' THEN 1 ELSE 0 END) as totalBuyers,
        COALESCE(SUM(CASE WHEN outcome = 'bought' THEN value ELSE 0 END), 0) as revenueToday
       FROM store_visits
       WHERE date(created_at) = ?`
    )
    .get(today);

  const totalVisitors = stats.totalVisitors || 0;
  const totalBuyers = stats.totalBuyers || 0;

  return {
    totalVisitors,
    totalBuyers,
    conversionRate: totalVisitors > 0 ? (totalBuyers / totalVisitors) * 100 : 0,
    revenueToday: stats.revenueToday || 0,
    avgOrderValue: totalBuyers > 0 ? stats.revenueToday / totalBuyers : 0,
    noBuyCount: totalVisitors - totalBuyers,
    noBuyRate: totalVisitors > 0 ? ((totalVisitors - totalBuyers) / totalVisitors) * 100 : 0,
    byReason: db
      .prepare(
        `SELECT reason, COUNT(*) as count
         FROM store_visits
         WHERE date(created_at) = ? AND outcome = 'no_buy'
         GROUP BY reason ORDER BY count DESC`
      )
      .all(today),
    byHour: db
      .prepare(
        `SELECT strftime('%H', created_at) as hour,
          COUNT(*) as visitors,
          SUM(CASE WHEN outcome = 'bought' THEN 1 ELSE 0 END) as buyers,
          COALESCE(SUM(CASE WHEN outcome = 'bought' THEN value ELSE 0 END), 0) as revenue
         FROM store_visits
         WHERE date(created_at) = ?
         GROUP BY hour ORDER BY hour`
      )
      .all(today),
  };
}

app.post('/api/store-visits', authMiddleware, (req, res) => {
  const { outcome, value, reason, customReason } = req.body;

  if (!['bought', 'no_buy'].includes(outcome)) {
    return res.status(400).json({ error: 'Invalid outcome' });
  }

  if (outcome === 'bought') {
    if (value == null || Number(value) < 0) {
      return res.status(400).json({ error: 'Order value required' });
    }
  }

  let reasonToStore = null;
  if (outcome === 'no_buy') {
    const resolved = resolveNoBuyReason(reason, customReason);
    if (resolved.error) return res.status(400).json({ error: resolved.error });
    reasonToStore = resolved.value;
  }

  const db = getDb();
  const now = ammanNow();
  const result = db
    .prepare(
      `INSERT INTO store_visits (outcome, value, reason, created_at) VALUES (?, ?, ?, ?)`
    )
    .run(
      outcome,
      outcome === 'bought' ? Number(value) : null,
      outcome === 'no_buy' ? reasonToStore : null,
      now
    );

  const visit = db.prepare('SELECT * FROM store_visits WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(visit);
});

app.get('/api/store-visits/today-log', authMiddleware, (req, res) => {
  const db = getDb();
  const today = ammanToday();
  const visits = db
    .prepare(
      `SELECT * FROM store_visits
       WHERE date(created_at) = ?
       ORDER BY created_at DESC`
    )
    .all(today);
  res.json({ visits });
});

app.get('/api/store-visits/analytics', authMiddleware, ownerMiddleware, (req, res) => {
  const db = getDb();
  res.json(getStoreAnalytics(db));
});

function buildStoreHistory(db, days = 30) {
  const cutoff = ammanDateDaysAgo(days);
  const visits = db
    .prepare(
      `SELECT * FROM store_visits
       WHERE date(created_at) >= ?
       ORDER BY created_at DESC`
    )
    .all(cutoff);

  const dateMap = new Map();

  for (const visit of visits) {
    const date = visit.created_at.slice(0, 10);
    if (!dateMap.has(date)) {
      dateMap.set(date, { date, visits: [], hourMap: new Map() });
    }
    const day = dateMap.get(date);
    day.visits.push(visit);
    const hour = visit.created_at.slice(11, 13);
    if (!day.hourMap.has(hour)) day.hourMap.set(hour, []);
    day.hourMap.get(hour).push(visit);
  }

  const daysList = Array.from(dateMap.values())
    .map((day) => ({
      date: day.date,
      totalVisitors: day.visits.length,
      totalBuyers: day.visits.filter((v) => v.outcome === 'bought').length,
      revenue: day.visits
        .filter((v) => v.outcome === 'bought')
        .reduce((sum, v) => sum + (v.value || 0), 0),
      hours: Array.from(day.hourMap.entries())
        .sort((a, b) => b[0].localeCompare(a[0]))
        .map(([hour, hourVisits]) => ({
          hour,
          visits: hourVisits.sort((a, b) => b.created_at.localeCompare(a.created_at)),
        })),
    }))
    .sort((a, b) => b.date.localeCompare(a.date));

  return { days: daysList };
}

app.get('/api/store-visits/history', authMiddleware, ownerMiddleware, (req, res) => {
  const db = getDb();
  const days = Number(req.query.days) || 30;
  res.json(buildStoreHistory(db, days));
});

app.get('/api/store-visits/export', authMiddleware, ownerMiddleware, (req, res) => {
  const db = getDb();
  const days = Number(req.query.days) || 30;
  const cutoff = ammanDateDaysAgo(days);
  const visits = db
    .prepare(
      `SELECT id, outcome, value, reason, created_at
       FROM store_visits
       WHERE date(created_at) >= ?
       ORDER BY created_at DESC`
    )
    .all(cutoff);

  const header = ['id', 'date', 'time', 'outcome', 'value_jd', 'reason'];
  const lines = [
    header.join(','),
    ...visits.map((row) => {
      const created = String(row.created_at || '');
      const date = created.slice(0, 10);
      const time = created.slice(11, 19) || created.slice(11, 16);
      return [
        csvEscape(row.id),
        csvEscape(date),
        csvEscape(time),
        csvEscape(row.outcome),
        csvEscape(row.outcome === 'bought' ? row.value ?? 0 : ''),
        csvEscape(row.outcome === 'no_buy' ? row.reason ?? '' : ''),
      ].join(',');
    }),
  ];

  const csv = `\uFEFF${lines.join('\n')}`;
  const stamp = ammanToday().replace(/-/g, '');
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="ribbontex-store-history-${days}d-${stamp}.csv"`
  );
  res.send(csv);
});

app.patch('/api/store-visits/:id', authMiddleware, (req, res) => {
  const { outcome, value, reason, customReason, created_at } = req.body;
  const db = getDb();
  const existing = db.prepare('SELECT * FROM store_visits WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Visit not found' });

  const nextOutcome = outcome ?? existing.outcome;
  if (!['bought', 'no_buy'].includes(nextOutcome)) {
    return res.status(400).json({ error: 'Invalid outcome' });
  }

  let nextValue = nextOutcome === 'bought' ? Number(value ?? existing.value) : null;
  let nextReason = null;

  if (nextOutcome === 'bought') {
    if (nextValue == null || nextValue < 0 || Number.isNaN(nextValue)) {
      return res.status(400).json({ error: 'Order value required' });
    }
  } else {
    const reasonKey = reason ?? (existing.reason?.startsWith('custom:') ? 'other' : existing.reason);
    const resolved = resolveNoBuyReason(
      reasonKey,
      customReason ?? (existing.reason?.startsWith('custom:') ? existing.reason.slice(7) : undefined)
    );
    if (resolved.error) return res.status(400).json({ error: resolved.error });
    nextReason = resolved.value;
    nextValue = null;
  }

  const nextCreatedAt = created_at?.trim() || existing.created_at;
  if (!/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}(:\d{2})?$/.test(nextCreatedAt)) {
    return res.status(400).json({ error: 'Invalid date/time format' });
  }

  db.prepare(
    `UPDATE store_visits SET outcome = ?, value = ?, reason = ?, created_at = ? WHERE id = ?`
  ).run(nextOutcome, nextValue, nextReason, nextCreatedAt, req.params.id);

  const visit = db.prepare('SELECT * FROM store_visits WHERE id = ?').get(req.params.id);
  res.json(visit);
});

app.delete('/api/store-visits/:id', authMiddleware, (req, res) => {
  const db = getDb();
  const result = db.prepare('DELETE FROM store_visits WHERE id = ?').run(req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: 'Visit not found' });
  res.json({ success: true });
});

if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.get(/^(?!\/api).*/, (_req, res) => {
    res.sendFile(path.join(clientDist, 'index.html'));
  });
} else {
  app.get('/', (_req, res) => {
    res.redirect(CLIENT_ORIGIN);
  });
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Ribbontex API running on http://localhost:${PORT}`);
  if (fs.existsSync(clientDist)) {
    console.log(`Dashboard served at http://localhost:${PORT}`);
  } else {
    console.log(`Open the dashboard at ${CLIENT_ORIGIN} (run npm run dev from project root)`);
  }
});
