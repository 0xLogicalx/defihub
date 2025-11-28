import { Hono } from 'hono';
import { serve } from '@hono/node-server';
import { cors } from 'hono/cors';
import Database from 'better-sqlite3';
import { BigNumber } from 'bignumber.js';
import Decimal from 'decimal.js';

const app = new Hono();
const db = new Database('lending.db');

app.use('/*', cors());

// Initialize database
db.exec(`
  CREATE TABLE IF NOT EXISTS markets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    asset TEXT NOT NULL,
    total_supplied TEXT DEFAULT '0',
    total_borrowed TEXT DEFAULT '0',
    supply_apy REAL DEFAULT 0,
    borrow_apy REAL DEFAULT 0,
    collateral_factor REAL DEFAULT 0.75,
    liquidation_threshold REAL DEFAULT 0.85
  );

  CREATE TABLE IF NOT EXISTS positions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_address TEXT NOT NULL,
    asset TEXT NOT NULL,
    supplied TEXT DEFAULT '0',
    borrowed TEXT DEFAULT '0',
    collateral_value TEXT DEFAULT '0',
    health_factor REAL DEFAULT 1.0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS loans (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_address TEXT NOT NULL,
    asset TEXT NOT NULL,
    amount TEXT NOT NULL,
    collateral_asset TEXT NOT NULL,
    collateral_amount TEXT NOT NULL,
    interest_rate REAL NOT NULL,
    status TEXT DEFAULT 'active',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

// Seed markets
const marketCount = db.prepare('SELECT COUNT(*) as count FROM markets').get();
if (marketCount.count === 0) {
  const insert = db.prepare(`
    INSERT INTO markets (asset, total_supplied, total_borrowed, supply_apy, borrow_apy, collateral_factor)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  
  insert.run('ETH', '50000000', '30000000', 3.5, 5.2, 0.80);
  insert.run('USDC', '100000000', '60000000', 4.2, 6.8, 0.85);
  insert.run('USDT', '80000000', '50000000', 4.0, 6.5, 0.85);
  insert.run('DAI', '70000000', '40000000', 3.8, 6.2, 0.85);
  insert.run('WBTC', '30000000', '15000000', 2.5, 4.0, 0.75);
}

app.get('/', (c) => {
  return c.json({ 
    service: '💰 DeFiHub Lending Protocol',
    version: '1.0.0',
    endpoints: ['/markets', '/supply', '/borrow', '/positions', '/health']
  });
});

app.get('/markets', (c) => {
  const markets = db.prepare('SELECT * FROM markets').all();
  
  const marketsWithUtilization = markets.map(market => {
    const supplied = new BigNumber(market.total_supplied);
    const borrowed = new BigNumber(market.total_borrowed);
    const utilization = borrowed.dividedBy(supplied).multipliedBy(100);
    
    return {
      ...market,
      utilization: utilization.toFixed(2)
    };
  });
  
  return c.json({ markets: marketsWithUtilization });
});

app.post('/supply', async (c) => {
  const { userAddress, asset, amount } = await c.req.json();
  
  const market = db.prepare('SELECT * FROM markets WHERE asset = ?').get(asset);
  if (!market) {
    return c.json({ error: 'Market not found' }, 404);
  }
  
  // Update or create position
  const position = db.prepare('SELECT * FROM positions WHERE user_address = ? AND asset = ?').get(userAddress, asset);
  
  if (position) {
    const newSupplied = new BigNumber(position.supplied).plus(amount).toFixed();
    db.prepare('UPDATE positions SET supplied = ? WHERE id = ?').run(newSupplied, position.id);
  } else {
    db.prepare(`
      INSERT INTO positions (user_address, asset, supplied)
      VALUES (?, ?, ?)
    `).run(userAddress, asset, amount);
  }
  
  // Update market
  const newTotalSupplied = new BigNumber(market.total_supplied).plus(amount).toFixed();
  db.prepare('UPDATE markets SET total_supplied = ? WHERE asset = ?').run(newTotalSupplied, asset);
  
  return c.json({ success: true, supplied: amount });
});

app.post('/borrow', async (c) => {
  const { userAddress, asset, amount, collateralAsset } = await c.req.json();
  
  const market = db.prepare('SELECT * FROM markets WHERE asset = ?').get(asset);
  if (!market) {
    return c.json({ error: 'Market not found' }, 404);
  }
  
  const amountBN = new BigNumber(amount);
  const maxBorrow = amountBN.multipliedBy(market.collateral_factor);
  
  // Create loan
  const insert = db.prepare(`
    INSERT INTO loans (user_address, asset, amount, collateral_asset, collateral_amount, interest_rate, status)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  
  const result = insert.run(userAddress, asset, amount, collateralAsset, maxBorrow.toFixed(), market.borrow_apy, 'active');
  
  // Update market
  const newTotalBorrowed = new BigNumber(market.total_borrowed).plus(amount).toFixed();
  db.prepare('UPDATE markets SET total_borrowed = ? WHERE asset = ?').run(newTotalBorrowed, asset);
  
  return c.json({ 
    success: true, 
    loanId: result.lastInsertRowid,
    borrowed: amount 
  });
});

app.get('/positions/:address', (c) => {
  const { address } = c.req.param();
  const positions = db.prepare('SELECT * FROM positions WHERE user_address = ?').all(address);
  const loans = db.prepare('SELECT * FROM loans WHERE user_address = ? AND status = ?').all(address, 'active');
  
  return c.json({ positions, loans });
});

const port = 3002;
console.log(`💰 Lending Protocol running on port ${port}`);

serve({ fetch: app.fetch, port });

