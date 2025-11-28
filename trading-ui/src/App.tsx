import { useState, useEffect } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import BigNumber from 'bignumber.js'
import axios from 'axios'

const queryClient = new QueryClient()

function TradingInterface() {
  const [pools, setPools] = useState([])
  const [tokenIn, setTokenIn] = useState('ETH')
  const [tokenOut, setTokenOut] = useState('USDC')
  const [amountIn, setAmountIn] = useState('')

  useEffect(() => {
    axios.get('http://localhost:3001/pools').then(res => setPools(res.data.pools))
  }, [])

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold mb-4">💹 DeFiHub Trading</h1>
          <p className="text-xl opacity-90">Advanced DEX aggregator with best rates</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Trading Form */}
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6">
            <h2 className="text-2xl font-bold mb-4">Swap Tokens</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm mb-2">From</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={amountIn}
                    onChange={(e) => setAmountIn(e.target.value)}
                    placeholder="0.0"
                    className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white"
                  />
                  <select 
                    value={tokenIn}
                    onChange={(e) => setTokenIn(e.target.value)}
                    className="bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white"
                  >
                    <option>ETH</option>
                    <option>USDC</option>
                    <option>USDT</option>
                    <option>DAI</option>
                  </select>
                </div>
              </div>

              <div className="text-center">
                <button className="text-2xl">⇅</button>
              </div>

              <div>
                <label className="block text-sm mb-2">To</label>
                <select 
                  value={tokenOut}
                  onChange={(e) => setTokenOut(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white"
                >
                  <option>USDC</option>
                  <option>ETH</option>
                  <option>USDT</option>
                  <option>DAI</option>
                </select>
              </div>

              <button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold py-4 px-6 rounded-lg transition-all">
                Swap Now
              </button>
            </div>

            <div className="mt-6 space-y-2 text-sm opacity-80">
              <div className="flex justify-between">
                <span>Rate:</span>
                <span>1 ETH = 2,500 USDC</span>
              </div>
              <div className="flex justify-between">
                <span>Fee:</span>
                <span>0.3%</span>
              </div>
              <div className="flex justify-between">
                <span>Price Impact:</span>
                <span className="text-green-400">&lt;0.1%</span>
              </div>
            </div>
          </div>

          {/* Market Stats */}
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6">
            <h2 className="text-2xl font-bold mb-4">Market Overview</h2>
            <div className="space-y-3">
              <div className="bg-white/5 rounded-lg p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <div className="text-sm opacity-70">ETH/USDC</div>
                    <div className="text-2xl font-bold">$2,500.00</div>
                  </div>
                  <div className="text-green-400 text-xl">+2.5%</div>
                </div>
              </div>

              <div className="bg-white/5 rounded-lg p-4">
                <div className="text-sm opacity-70 mb-1">24h Volume</div>
                <div className="text-xl font-bold">$125.5M</div>
              </div>

              <div className="bg-white/5 rounded-lg p-4">
                <div className="text-sm opacity-70 mb-1">TVL</div>
                <div className="text-xl font-bold">$45.2M</div>
              </div>
            </div>
          </div>
        </div>

        {/* Liquidity Pools */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6">
          <h2 className="text-2xl font-bold mb-4">Liquidity Pools</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {pools.slice(0, 4).map((pool: any) => (
              <div key={pool.id} className="bg-white/5 rounded-lg p-4">
                <div className="text-lg font-bold mb-2">{pool.token_a}/{pool.token_b}</div>
                <div className="text-sm opacity-70">Fee: {pool.fee}%</div>
                <div className="text-sm opacity-70">
                  TVL: ${new BigNumber(pool.liquidity).toFormat(0)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TradingInterface />
    </QueryClientProvider>
  )
}

