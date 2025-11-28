import { useState, useEffect } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import BigNumber from 'bignumber.js'
import axios from 'axios'

const queryClient = new QueryClient()

function LendingApp() {
  const [markets, setMarkets] = useState([])

  useEffect(() => {
    axios.get('http://localhost:3002/markets').then(res => setMarkets(res.data.markets))
  }, [])

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold mb-4">🏦 DeFiHub Lending</h1>
          <p className="text-xl opacity-90">Supply assets and earn interest or borrow against collateral</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 text-center">
            <div className="text-sm opacity-70 mb-2">Total Supplied</div>
            <div className="text-3xl font-bold">$500M</div>
          </div>
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 text-center">
            <div className="text-sm opacity-70 mb-2">Total Borrowed</div>
            <div className="text-3xl font-bold">$300M</div>
          </div>
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 text-center">
            <div className="text-sm opacity-70 mb-2">Active Users</div>
            <div className="text-3xl font-bold">25,000</div>
          </div>
        </div>

        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6">
          <h2 className="text-2xl font-bold mb-6">Markets</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left py-3 px-4">Asset</th>
                  <th className="text-right py-3 px-4">Supply APY</th>
                  <th className="text-right py-3 px-4">Borrow APY</th>
                  <th className="text-right py-3 px-4">Utilization</th>
                  <th className="text-right py-3 px-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {markets.map((market: any) => (
                  <tr key={market.id} className="border-b border-white/5 hover:bg-white/5">
                    <td className="py-4 px-4 font-bold">{market.asset}</td>
                    <td className="text-right py-4 px-4 text-green-400">{market.supply_apy}%</td>
                    <td className="text-right py-4 px-4 text-orange-400">{market.borrow_apy}%</td>
                    <td className="text-right py-4 px-4">{market.utilization}%</td>
                    <td className="text-right py-4 px-4">
                      <button className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg text-sm mr-2">
                        Supply
                      </button>
                      <button className="bg-orange-600 hover:bg-orange-700 px-4 py-2 rounded-lg text-sm">
                        Borrow
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <LendingApp />
    </QueryClientProvider>
  )
}

