import { Hono } from 'hono';
import { serve } from '@hono/node-server';
import { cors } from 'hono/cors';
import Database from 'better-sqlite3';
import { BigNumber } from 'bignumber.js';
import { ethers } from 'ethers';

const app = new Hono();
const db = new Database('trading.db');

app.use('/*', cors());

// Initialize database
db.exec(`
  CREATE TABLE IF NOT EXISTS trades (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_address TEXT NOT NULL,
    token_in TEXT NOT NULL,
    token_out TEXT NOT NULL,
    amount_in TEXT NOT NULL,
    amount_out TEXT NOT NULL,
    price TEXT NOT NULL,
    dex TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS pools (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    token_a TEXT NOT NULL,
    token_b TEXT NOT NULL,
    liquidity TEXT DEFAULT '0',
    volume_24h TEXT DEFAULT '0',
    fee REAL DEFAULT 0.3
  );
`);

// Seed pools
const poolCount = db.prepare('SELECT COUNT(*) as count FROM pools').get();
if (poolCount.count === 0) {
  const insert = db.prepare(`
    INSERT INTO pools (token_a, token_b, liquidity, volume_24h, fee)
    VALUES (?, ?, ?, ?, ?)
  `);
  
  insert.run('ETH', 'USDC', '10000000', '5000000', 0.3);
  insert.run('ETH', 'USDT', '8000000', '4000000', 0.3);
  insert.run('ETH', 'DAI', '6000000', '3000000', 0.3);
  insert.run('USDC', 'USDT', '15000000', '8000000', 0.05);
}

app.get('/', (c) => {
  return c.json({ 
    service: '🔄 DeFiHub Trading Engine',
    version: '1.0.0',
    endpoints: ['/pools', '/quote', '/swap', '/trades']
  });
});

app.get('/pools', (c) => {
  const pools = db.prepare('SELECT * FROM pools').all();
  return c.json({ pools });
});

app.post('/quote', async (c) => {
  const { tokenIn, tokenOut, amountIn } = await c.req.json();
  
  const pool = db.prepare(`
    SELECT * FROM pools 
    WHERE (token_a = ? AND token_b = ?) 
       OR (token_a = ? AND token_b = ?)
  `).get(tokenIn, tokenOut, tokenOut, tokenIn);
  
  if (!pool) {
    return c.json({ error: 'Pool not found' }, 404);
  }
  
  // Simple AMM calculation
  const amountInBN = new BigNumber(amountIn);
  const fee = new BigNumber(pool.fee).dividedBy(100);
  const amountAfterFee = amountInBN.multipliedBy(new BigNumber(1).minus(fee));
  const amountOut = amountAfterFee.multipliedBy(0.95); // Simplified calculation
  
  return c.json({
    amountOut: amountOut.toFixed(6),
    priceImpact: '0.5',
    fee: pool.fee,
    route: [tokenIn, tokenOut]
  });
});

app.post('/swap', async (c) => {
  const { userAddress, tokenIn, tokenOut, amountIn } = await c.req.json();
  
  const quote = await fetch('http://localhost:3000/quote', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tokenIn, tokenOut, amountIn })
  }).then(r => r.json());
  
  const insert = db.prepare(`
    INSERT INTO trades (user_address, token_in, token_out, amount_in, amount_out, price, dex, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  
  const price = new BigNumber(quote.amountOut).dividedBy(amountIn).toFixed(6);
  const result = insert.run(
    userAddress, tokenIn, tokenOut, amountIn, quote.amountOut, price, 'UniswapV3', 'completed'
  );
  
  return c.json({ 
    success: true, 
    tradeId: result.lastInsertRowid,
    amountOut: quote.amountOut
  });
});

app.get('/trades/:address', (c) => {
  const { address } = c.req.param();
  const trades = db.prepare('SELECT * FROM trades WHERE user_address = ? ORDER BY created_at DESC').all(address);
  return c.json({ trades });
});

const port = 3001;
console.log(`🔄 Trading Engine running on port ${port}`);

serve({ fetch: app.fetch, port });

