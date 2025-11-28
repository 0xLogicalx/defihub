import { Hono } from 'hono';
import { serve } from '@hono/node-server';
import { cors } from 'hono/cors';
import Database from 'better-sqlite3';
import { BigNumber } from 'bignumber.js';

const app = new Hono();
const db = new Database('derivatives.db');

app.use('/*', cors());

db.exec(`
  CREATE TABLE IF NOT EXISTS perpetuals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    symbol TEXT NOT NULL,
    index_price TEXT NOT NULL,
    mark_price TEXT NOT NULL,
    funding_rate REAL DEFAULT 0,
    open_interest TEXT DEFAULT '0',
    volume_24h TEXT DEFAULT '0'
  );

  CREATE TABLE IF NOT EXISTS positions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_address TEXT NOT NULL,
    symbol TEXT NOT NULL,
    size TEXT NOT NULL,
    side TEXT NOT NULL,
    entry_price TEXT NOT NULL,
    leverage INTEGER NOT NULL,
    margin TEXT NOT NULL,
    liquidation_price TEXT NOT NULL,
    unrealized_pnl TEXT DEFAULT '0',
    status TEXT DEFAULT 'open',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

const perpCount = db.prepare('SELECT COUNT(*) as count FROM perpetuals').get();
if (perpCount.count === 0) {
  const insert = db.prepare(`
    INSERT INTO perpetuals (symbol, index_price, mark_price, funding_rate, open_interest, volume_24h)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  
  insert.run('ETH-PERP', '2500.00', '2501.20', 0.01, '50000000', '200000000');
  insert.run('BTC-PERP', '45000.00', '45050.00', 0.008, '150000000', '800000000');
  insert.run('SOL-PERP', '100.00', '100.50', 0.02, '20000000', '50000000');
}

app.get('/', (c) => {
  return c.json({ 
    service: '📊 DeFiHub Derivatives',
    version: '1.0.0',
    endpoints: ['/perpetuals', '/open', '/close', '/positions', '/liquidate']
  });
});

app.get('/perpetuals', (c) => {
  const perps = db.prepare('SELECT * FROM perpetuals').all();
  return c.json({ perpetuals: perps });
});

app.post('/open', async (c) => {
  const { userAddress, symbol, size, side, leverage, margin } = await c.req.json();
  
  const perp = db.prepare('SELECT * FROM perpetuals WHERE symbol = ?').get(symbol);
  if (!perp) {
    return c.json({ error: 'Market not found' }, 404);
  }
  
  const entryPrice = new BigNumber(perp.mark_price);
  const marginBN = new BigNumber(margin);
  const leverageBN = new BigNumber(leverage);
  
  // Calculate liquidation price
  const liquidationDistance = side === 'long' 
    ? marginBN.dividedBy(new BigNumber(size)).dividedBy(leverageBN)
    : marginBN.dividedBy(new BigNumber(size)).multipliedBy(leverageBN);
  
  const liquidationPrice = side === 'long'
    ? entryPrice.minus(liquidationDistance)
    : entryPrice.plus(liquidationDistance);
  
  const insert = db.prepare(`
    INSERT INTO positions (user_address, symbol, size, side, entry_price, leverage, margin, liquidation_price)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  
  const result = insert.run(
    userAddress, symbol, size, side, entryPrice.toFixed(), leverage, margin, liquidationPrice.toFixed()
  );
  
  return c.json({ 
    success: true, 
    positionId: result.lastInsertRowid,
    liquidationPrice: liquidationPrice.toFixed()
  });
});

app.get('/positions/:address', (c) => {
  const { address } = c.req.param();
  const positions = db.prepare('SELECT * FROM positions WHERE user_address = ? AND status = ?').all(address, 'open');
  return c.json({ positions });
});

const port = 3004;
console.log(`📊 Derivatives Service running on port ${port}`);

serve({ fetch: app.fetch, port });

