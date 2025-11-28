import { Hono } from 'hono';
import { serve } from '@hono/node-server';
import { cors } from 'hono/cors';
import Database from 'better-sqlite3';
import { BigNumber } from 'bignumber.js';

const app = new Hono();
const db = new Database('analytics.db');

app.use('/*', cors());

db.exec(`
  CREATE TABLE IF NOT EXISTS prices (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    asset TEXT NOT NULL,
    price TEXT NOT NULL,
    volume_24h TEXT DEFAULT '0',
    market_cap TEXT DEFAULT '0',
    change_24h REAL DEFAULT 0,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS protocol_stats (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tvl TEXT DEFAULT '0',
    volume_24h TEXT DEFAULT '0',
    users_count INTEGER DEFAULT 0,
    transactions_count INTEGER DEFAULT 0,
    revenue_24h TEXT DEFAULT '0',
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS user_analytics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_address TEXT NOT NULL,
    total_value TEXT DEFAULT '0',
    pnl TEXT DEFAULT '0',
    trades_count INTEGER DEFAULT 0,
    last_active DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

// Seed price data
const priceCount = db.prepare('SELECT COUNT(*) as count FROM prices').get();
if (priceCount.count === 0) {
  const insert = db.prepare(`
    INSERT INTO prices (asset, price, volume_24h, market_cap, change_24h)
    VALUES (?, ?, ?, ?, ?)
  `);
  
  insert.run('ETH', '2500.00', '50000000', '300000000000', 2.5);
  insert.run('BTC', '45000.00', '150000000', '900000000000', 1.8);
  insert.run('USDC', '1.00', '80000000', '30000000000', 0.01);
  insert.run('USDT', '1.00', '120000000', '90000000000', -0.02);
}

// Seed protocol stats
const statsCount = db.prepare('SELECT COUNT(*) as count FROM protocol_stats').get();
if (statsCount.count === 0) {
  db.prepare(`
    INSERT INTO protocol_stats (tvl, volume_24h, users_count, transactions_count, revenue_24h)
    VALUES (?, ?, ?, ?, ?)
  `).run('500000000', '100000000', 15000, 50000, '500000');
}

app.get('/', (c) => {
  return c.json({ 
    service: '📈 DeFiHub Analytics',
    version: '1.0.0',
    endpoints: ['/prices', '/stats', '/user/:address', '/historical']
  });
});

app.get('/prices', (c) => {
  const prices = db.prepare('SELECT * FROM prices ORDER BY market_cap DESC').all();
  return c.json({ prices });
});

app.get('/prices/:asset', (c) => {
  const { asset } = c.req.param();
  const price = db.prepare('SELECT * FROM prices WHERE asset = ? ORDER BY timestamp DESC LIMIT 1').get(asset);
  
  if (!price) {
    return c.json({ error: 'Asset not found' }, 404);
  }
  
  return c.json({ price });
});

app.get('/stats', (c) => {
  const stats = db.prepare('SELECT * FROM protocol_stats ORDER BY timestamp DESC LIMIT 1').get();
  const prices = db.prepare('SELECT COUNT(*) as assets_count FROM prices').get();
  
  return c.json({
    ...stats,
    assets_tracked: prices.assets_count
  });
});

app.get('/user/:address', (c) => {
  const { address } = c.req.param();
  let analytics = db.prepare('SELECT * FROM user_analytics WHERE user_address = ?').get(address);
  
  if (!analytics) {
    // Create default analytics
    db.prepare(`
      INSERT INTO user_analytics (user_address, total_value, pnl, trades_count)
      VALUES (?, ?, ?, ?)
    `).run(address, '0', '0', 0);
    
    analytics = { user_address: address, total_value: '0', pnl: '0', trades_count: 0 };
  }
  
  return c.json({ analytics });
});

app.get('/historical/:asset', (c) => {
  const { asset } = c.req.param();
  const { interval = '1h', limit = 100 } = c.req.query();
  
  const historical = db.prepare(`
    SELECT * FROM prices 
    WHERE asset = ? 
    ORDER BY timestamp DESC 
    LIMIT ?
  `).all(asset, limit);
  
  return c.json({ 
    asset,
    interval,
    data: historical
  });
});

const port = 3005;
console.log(`📈 Analytics Service running on port ${port}`);

serve({ fetch: app.fetch, port });

