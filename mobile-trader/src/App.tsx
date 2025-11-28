import { useState } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import BigNumber from 'bignumber.js'

const queryClient = new QueryClient()

const tabs = ['Trade', 'Portfolio', 'Markets', 'More']

function MobileTrader() {
  const [activeTab, setActiveTab] = useState(0)

  return (
    <div className="min-h-screen pb-20">
      {/* Header */}
      <div className="bg-white/10 backdrop-blur-lg p-4 sticky top-0 z-10">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">📱 DeFiHub</h1>
          <div className="flex gap-2">
            <button className="bg-white/10 px-3 py-2 rounded-lg">🔔</button>
            <button className="bg-white/10 px-3 py-2 rounded-lg">⚙️</button>
          </div>
        </div>
        
        {/* Balance */}
        <div className="mt-4 bg-white/5 rounded-xl p-4">
          <div className="text-sm opacity-70">Portfolio Value</div>
          <div className="text-3xl font-bold">$12,450.00</div>
          <div className="text-green-400 text-sm mt-1">+5.2% (24h)</div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {activeTab === 0 && (
          <div className="space-y-4">
            {/* Quick Trade */}
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-4">
              <h2 className="text-xl font-bold mb-4">Quick Swap</h2>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm mb-2 opacity-70">From</label>
                  <div className="bg-white/5 rounded-xl p-3 flex justify-between items-center">
                    <input type="text" placeholder="0.0" className="bg-transparent flex-1 text-xl outline-none" />
                    <button className="bg-blue-500 px-4 py-2 rounded-lg font-bold">ETH</button>
                  </div>
                </div>
                
                <div className="text-center py-2">
                  <button className="text-2xl">⇅</button>
                </div>

                <div>
                  <label className="block text-sm mb-2 opacity-70">To</label>
                  <div className="bg-white/5 rounded-xl p-3 flex justify-between items-center">
                    <div className="text-xl">0.0</div>
                    <button className="bg-green-500 px-4 py-2 rounded-lg font-bold">USDC</button>
                  </div>
                </div>

                <button className="w-full bg-gradient-to-r from-blue-500 to-purple-500 py-4 rounded-xl font-bold text-lg mt-4">
                  Swap
                </button>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white/10 backdrop-blur-lg rounded-xl p-4">
                <div className="text-xs opacity-70 mb-1">24h Volume</div>
                <div className="text-xl font-bold">$125M</div>
              </div>
              <div className="bg-white/10 backdrop-blur-lg rounded-xl p-4">
                <div className="text-xs opacity-70 mb-1">Gas Price</div>
                <div className="text-xl font-bold">25 Gwei</div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 1 && (
          <div className="space-y-4">
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-4">
              <h2 className="text-xl font-bold mb-4">Your Assets</h2>
              <div className="space-y-3">
                {[
                  { symbol: 'ETH', amount: '2.5', value: '$6,250', change: '+5.2%' },
                  { symbol: 'USDC', amount: '5,000', value: '$5,000', change: '0%' },
                  { symbol: 'UNI', amount: '150', value: '$1,200', change: '+8.5%' },
                ].map((asset, i) => (
                  <div key={i} className="bg-white/5 rounded-xl p-3 flex justify-between items-center">
                    <div>
                      <div className="font-bold">{asset.symbol}</div>
                      <div className="text-sm opacity-70">{asset.amount}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold">{asset.value}</div>
                      <div className={`text-sm ${asset.change.startsWith('+') ? 'text-green-400' : 'text-gray-400'}`}>
                        {asset.change}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 2 && (
          <div className="space-y-4">
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-4">
              <h2 className="text-xl font-bold mb-4">Top Markets</h2>
              <div className="space-y-3">
                {[
                  { pair: 'ETH/USDC', price: '$2,500', change: '+2.5%' },
                  { pair: 'BTC/USDC', price: '$45,000', change: '+1.8%' },
                  { pair: 'SOL/USDC', price: '$100', change: '+5.3%' },
                ].map((market, i) => (
                  <div key={i} className="bg-white/5 rounded-xl p-3 flex justify-between">
                    <div className="font-bold">{market.pair}</div>
                    <div className="text-right">
                      <div className="font-bold">{market.price}</div>
                      <div className="text-sm text-green-400">{market.change}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 3 && (
          <div className="space-y-4">
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-4">
              <h2 className="text-xl font-bold mb-4">More Options</h2>
              <div className="space-y-2">
                {['Settings', 'Help & Support', 'About', 'Logout'].map((item, i) => (
                  <button key={i} className="w-full bg-white/5 p-4 rounded-xl text-left font-semibold">
                    {item}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/10 backdrop-blur-lg border-t border-white/10">
        <div className="flex justify-around p-4">
          {tabs.map((tab, i) => (
            <button
              key={i}
              onClick={() => setActiveTab(i)}
              className={`flex flex-col items-center ${activeTab === i ? 'text-blue-400' : 'text-white/60'}`}
            >
              <div className="text-2xl mb-1">
                {i === 0 && '💹'}
                {i === 1 && '💼'}
                {i === 2 && '📊'}
                {i === 3 && '⚙️'}
              </div>
              <div className="text-xs font-semibold">{tab}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <MobileTrader />
    </QueryClientProvider>
  )
}

