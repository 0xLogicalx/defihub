import { useState, useEffect } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { LineChart, Line, BarChart, Bar, PieChart, Pie, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts'
import BigNumber from 'bignumber.js'
import axios from 'axios'

const queryClient = new QueryClient()

const chartData = [
  { name: 'Jan', tvl: 400, volume: 240 },
  { name: 'Feb', tvl: 450, volume: 280 },
  { name: 'Mar', tvl: 500, volume: 320 },
  { name: 'Apr', tvl: 550, volume: 360 },
  { name: 'May', tvl: 600, volume: 400 },
  { name: 'Jun', tvl: 650, volume: 450 },
]

const assetData = [
  { name: 'ETH', value: 40 },
  { name: 'USDC', value: 30 },
  { name: 'DAI', value: 20 },
  { name: 'Other', value: 10 },
]

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444']

function AnalyticsDashboard() {
  const [stats, setStats] = useState<any>(null)

  useEffect(() => {
    axios.get('http://localhost:3005/stats').then(res => setStats(res.data))
  }, [])

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-12">
          <h1 className="text-5xl font-bold mb-4">📊 DeFiHub Analytics</h1>
          <p className="text-xl opacity-90">Real-time protocol statistics and market intelligence</p>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6">
            <div className="text-sm opacity-70 mb-2">Total TVL</div>
            <div className="text-3xl font-bold">${stats ? new BigNumber(stats.tvl).dividedBy(1e6).toFixed(1) : '0'}M</div>
            <div className="text-sm text-green-400 mt-2">+12.5%</div>
          </div>
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6">
            <div className="text-sm opacity-70 mb-2">24h Volume</div>
            <div className="text-3xl font-bold">${stats ? new BigNumber(stats.volume_24h).dividedBy(1e6).toFixed(1) : '0'}M</div>
            <div className="text-sm text-green-400 mt-2">+8.2%</div>
          </div>
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6">
            <div className="text-sm opacity-70 mb-2">Total Users</div>
            <div className="text-3xl font-bold">{stats?.users_count.toLocaleString() || '0'}</div>
            <div className="text-sm text-green-400 mt-2">+5.3%</div>
          </div>
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6">
            <div className="text-sm opacity-70 mb-2">24h Revenue</div>
            <div className="text-3xl font-bold">${stats ? new BigNumber(stats.revenue_24h).dividedBy(1e3).toFixed(1) : '0'}K</div>
            <div className="text-sm text-green-400 mt-2">+15.7%</div>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6">
            <h2 className="text-2xl font-bold mb-4">TVL & Volume Trend</h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff20" />
                <XAxis dataKey="name" stroke="#fff" />
                <YAxis stroke="#fff" />
                <Tooltip contentStyle={{ background: '#1f2937', border: 'none', borderRadius: '8px' }} />
                <Legend />
                <Line type="monotone" dataKey="tvl" stroke="#3b82f6" strokeWidth={2} />
                <Line type="monotone" dataKey="volume" stroke="#10b981" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6">
            <h2 className="text-2xl font-bold mb-4">Asset Distribution</h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={assetData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {assetData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Additional Stats */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6">
          <h2 className="text-2xl font-bold mb-4">Top Assets by Volume</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff20" />
              <XAxis dataKey="name" stroke="#fff" />
              <YAxis stroke="#fff" />
              <Tooltip contentStyle={{ background: '#1f2937', border: 'none', borderRadius: '8px' }} />
              <Bar dataKey="volume" fill="#8b5cf6" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AnalyticsDashboard />
    </QueryClientProvider>
  )
}

