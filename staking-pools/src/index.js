import { Hono } from 'hono';
import { serve } from '@hono/node-server';
import { cors } from 'hono/cors';
import Database from 'better-sqlite3';
import { BigNumber } from 'bignumber.js';

const app = new Hono();
const db = new Database('staking.db');

app.use('/*', cors());

db.exec(`
  CREATE TABLE IF NOT EXISTS pools (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    token TEXT NOT NULL,
    reward_token TEXT NOT NULL,
    apy REAL NOT NULL,
    tvl TEXT DEFAULT '0',
    min_stake TEXT DEFAULT '0',
    lock_period INTEGER DEFAULT 0,
    auto_compound BOOLEAN DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS stakes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    pool_id INTEGER NOT NULL,
    user_address TEXT NOT NULL,
    amount TEXT NOT NULL,
    rewards TEXT DEFAULT '0',
    staked_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    unlock_at DATETIME,
    FOREIGN KEY (pool_id) REFERENCES pools(id)
  );
`);

const poolCount = db.prepare('SELECT COUNT(*) as count FROM pools').get();
if (poolCount.count === 0) {
  const insert = db.prepare(`
    INSERT INTO pools (name, token, reward_token, apy, tvl, min_stake, lock_period, auto_compound)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  
  insert.run('ETH Flexible Pool', 'ETH', 'DFH', 5.5, '5000000', '0.1', 0, 0);
  insert.run('ETH 30-Day Locked', 'ETH', 'DFH', 9.2, '10000000', '0.5', 30, 0);
  insert.run('ETH Auto-Compound', 'ETH', 'ETH', 12.8, '15000000', '1.0', 90, 1);
  insert.run('USDC Stable', 'USDC', 'DFH', 8.5, '20000000', '100', 0, 0);
  insert.run('LP Farming', 'ETH-USDC-LP', 'DFH', 45.0, '8000000', '10', 60, 0);
  insert.run('DFH Governance', 'DFH', 'DFH', 25.0, '3000000', '100', 180, 1);
}

function calculateRewards(amount, apy, daysStaked) {
  const principal = new BigNumber(amount);
  const rate = new BigNumber(apy).dividedBy(100).dividedBy(365);
  const rewards = principal.multipliedBy(rate).multipliedBy(daysStaked);
  return rewards.toFixed(18);
}

app.get('/', (c) => {
  return c.json({ 
    service: '🔒 DeFiHub Staking Pools',
    version: '1.0.0',
    endpoints: ['/pools', '/stake', '/unstake', '/rewards', '/compound']
  });
});

app.get('/pools', (c) => {
  const pools = db.prepare('SELECT * FROM pools ORDER BY apy DESC').all();
  return c.json({ pools });
});

app.post('/stake', async (c) => {
  const { poolId, userAddress, amount } = await c.req.json();
  
  const pool = db.prepare('SELECT * FROM pools WHERE id = ?').get(poolId);
  if (!pool) {
    return c.json({ error: 'Pool not found' }, 404);
  }
  
  const unlockDate = new Date();
  unlockDate.setDate(unlockDate.getDate() + pool.lock_period);
  
  const insert = db.prepare(`
    INSERT INTO stakes (pool_id, user_address, amount, unlock_at)
    VALUES (?, ?, ?, ?)
  `);
  
  const result = insert.run(poolId, userAddress, amount, unlockDate.toISOString());
  
  const newTVL = new BigNumber(pool.tvl).plus(amount).toFixed();
  db.prepare('UPDATE pools SET tvl = ? WHERE id = ?').run(newTVL, poolId);
  
  return c.json({ success: true, stakeId: result.lastInsertRowid });
});

app.get('/rewards/:stakeId', (c) => {
  const { stakeId } = c.req.param();
  
  const stake = db.prepare(`
    SELECT s.*, p.apy, p.reward_token
    FROM stakes s 
    JOIN pools p ON s.pool_id = p.id 
    WHERE s.id = ?
  `).get(stakeId);
  
  if (!stake) {
    return c.json({ error: 'Stake not found' }, 404);
  }
  
  const stakedDate = new Date(stake.staked_at);
  const now = new Date();
  const daysStaked = Math.floor((now - stakedDate) / (1000 * 60 * 60 * 24));
  
  const rewards = calculateRewards(stake.amount, stake.apy, daysStaked);
  
  return c.json({
    stakeId: stake.id,
    rewards,
    rewardToken: stake.reward_token,
    daysStaked
  });
});

const port = 3003;
console.log(`🔒 Staking Pools running on port ${port}`);

serve({ fetch: app.fetch, port });

