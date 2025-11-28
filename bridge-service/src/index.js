import { Hono } from 'hono';
import { serve } from '@hono/node-server';
import { cors } from 'hono/cors';
import Database from 'better-sqlite3';
import { BigNumber } from 'bignumber.js';

const app = new Hono();
const db = new Database('bridge.db');

app.use('/*', cors());

db.exec(`
  CREATE TABLE IF NOT EXISTS chains (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    chain_id INTEGER NOT NULL,
    rpc_url TEXT NOT NULL,
    native_token TEXT NOT NULL,
    is_active BOOLEAN DEFAULT 1
  );

  CREATE TABLE IF NOT EXISTS transfers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_address TEXT NOT NULL,
    from_chain INTEGER NOT NULL,
    to_chain INTEGER NOT NULL,
    token TEXT NOT NULL,
    amount TEXT NOT NULL,
    fee TEXT NOT NULL,
    tx_hash TEXT,
    status TEXT DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    completed_at DATETIME
  );
`);

// Seed chains
const chainCount = db.prepare('SELECT COUNT(*) as count FROM chains').get();
if (chainCount.count === 0) {
  const insert = db.prepare(`
    INSERT INTO chains (name, chain_id, rpc_url, native_token)
    VALUES (?, ?, ?, ?)
  `);
  
  insert.run('Ethereum', 1, 'https://eth-mainnet.g.alchemy.com', 'ETH');
  insert.run('Polygon', 137, 'https://polygon-rpc.com', 'MATIC');
  insert.run('Arbitrum', 42161, 'https://arb1.arbitrum.io/rpc', 'ETH');
  insert.run('Optimism', 10, 'https://mainnet.optimism.io', 'ETH');
  insert.run('BSC', 56, 'https://bsc-dataseed.binance.org', 'BNB');
  insert.run('Avalanche', 43114, 'https://api.avax.network/ext/bc/C/rpc', 'AVAX');
}

app.get('/', (c) => {
  return c.json({ 
    service: '🌉 DeFiHub Bridge',
    version: '1.0.0',
    endpoints: ['/chains', '/quote', '/transfer', '/status/:id']
  });
});

app.get('/chains', (c) => {
  const chains = db.prepare('SELECT * FROM chains WHERE is_active = 1').all();
  return c.json({ chains });
});

app.post('/quote', async (c) => {
  const { fromChain, toChain, token, amount } = await c.req.json();
  
  const amountBN = new BigNumber(amount);
  const baseFee = amountBN.multipliedBy(0.001); // 0.1% base fee
  const gasFee = new BigNumber(0.005); // $5 gas estimate
  const totalFee = baseFee.plus(gasFee);
  const amountAfterFee = amountBN.minus(totalFee);
  
  return c.json({
    amountOut: amountAfterFee.toFixed(6),
    fee: totalFee.toFixed(6),
    estimatedTime: '5-10 minutes',
    route: [fromChain, toChain]
  });
});

app.post('/transfer', async (c) => {
  const { userAddress, fromChain, toChain, token, amount } = await c.req.json();
  
  const quote = await fetch('http://localhost:3006/quote', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fromChain, toChain, token, amount })
  }).then(r => r.json());
  
  const insert = db.prepare(`
    INSERT INTO transfers (user_address, from_chain, to_chain, token, amount, fee, status)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  
  const result = insert.run(
    userAddress, fromChain, toChain, token, amount, quote.fee, 'processing'
  );
  
  // Simulate async processing
  setTimeout(() => {
    db.prepare('UPDATE transfers SET status = ?, completed_at = ? WHERE id = ?')
      .run('completed', new Date().toISOString(), result.lastInsertRowid);
  }, 5000);
  
  return c.json({ 
    success: true, 
    transferId: result.lastInsertRowid,
    estimatedTime: quote.estimatedTime
  });
});

app.get('/status/:id', (c) => {
  const { id } = c.req.param();
  const transfer = db.prepare('SELECT * FROM transfers WHERE id = ?').get(id);
  
  if (!transfer) {
    return c.json({ error: 'Transfer not found' }, 404);
  }
  
  return c.json({ transfer });
});

app.get('/transfers/:address', (c) => {
  const { address } = c.req.param();
  const transfers = db.prepare('SELECT * FROM transfers WHERE user_address = ? ORDER BY created_at DESC').all(address);
  return c.json({ transfers });
});

const port = 3006;
console.log(`🌉 Bridge Service running on port ${port}`);

serve({ fetch: app.fetch, port });

