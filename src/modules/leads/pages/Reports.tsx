import { useState } from 'react';
import { useReports } from '../api/reports';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, 
  PieChart, Pie, Cell, LineChart, Line 
} from 'recharts';

export default function ReportsDashboard() {
  const [dateRange, setDateRange] = useState('this-month');
  const { data, isLoading } = useReports(dateRange);

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  if (isLoading) return <div className="p-4 flex justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>;

  // Fallback mocks if backend is not wired yet
  const stats = data?.stats || { total: 0, won: 0, lost: 0, conversionRate: '0%', avgDays: 0 };
  const stageData = data?.stageData || [];
  const sourceData = data?.sourceData || [];
  const categoryData = data?.categoryData || [];
  const weeklyData = data?.weeklyData || [];
  const followUpData = data?.followUpData || [];

  return (
    <div className="p-4 bg-gray-50 dark:bg-zinc-900 min-h-full pb-24 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold dark:text-white">Reports</h1>
        <select 
          value={dateRange}
          onChange={(e) => setDateRange(e.target.value)}
          className="p-2 border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 rounded-md shadow-sm dark:text-gray-200"
        >
          <option value="this-week">This Week</option>
          <option value="this-month">This Month</option>
          <option value="last-30">Last 30 Days</option>
          <option value="custom">Custom</option>
        </select>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard title="Total Leads" value={stats.total} />
        <StatCard title="Won" value={stats.won} color="text-green-600 dark:text-green-400" />
        <StatCard title="Lost" value={stats.lost} color="text-red-600 dark:text-red-400" />
        <StatCard title="Conversion" value={stats.conversionRate} />
        <StatCard title="Avg Days to Close" value={stats.avgDays} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title="Leads by Stage">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={stageData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.2} />
              <XAxis dataKey="name" stroke="#6b7280" fontSize={12} />
              <YAxis stroke="#6b7280" fontSize={12} />
              <RechartsTooltip />
              <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Leads by Source">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={sourceData} cx="50%" cy="50%" outerRadius={80} fill="#8884d8" dataKey="value" label>
                {sourceData.map((_entry: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <RechartsTooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Leads by Category">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={categoryData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.2} />
              <XAxis dataKey="name" stroke="#6b7280" fontSize={12} />
              <YAxis stroke="#6b7280" fontSize={12} />
              <RechartsTooltip />
              <Bar dataKey="value" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Calls & Chats per Week">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={weeklyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.2} />
              <XAxis dataKey="week" stroke="#6b7280" fontSize={12} />
              <YAxis stroke="#6b7280" fontSize={12} />
              <RechartsTooltip />
              <Legend />
              <Line type="monotone" dataKey="calls" stroke="#3b82f6" strokeWidth={2} />
              <Line type="monotone" dataKey="chats" stroke="#10b981" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Follow-ups: Completed vs Missed">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={followUpData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.2} />
              <XAxis type="number" stroke="#6b7280" fontSize={12} />
              <YAxis dataKey="name" type="category" stroke="#6b7280" fontSize={12} width={80} />
              <RechartsTooltip />
              <Legend />
              <Bar dataKey="completed" stackId="a" fill="#10b981" />
              <Bar dataKey="missed" stackId="a" fill="#ef4444" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </div>
  );
}

function StatCard({ title, value, color = 'text-gray-900 dark:text-gray-100' }: { title: string, value: string | number, color?: string }) {
  return (
    <div className="bg-white dark:bg-zinc-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-zinc-700">
      <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{title}</h3>
      <p className={`text-2xl font-bold mt-1 ${color}`}>{value}</p>
    </div>
  );
}

function ChartCard({ title, children }: { title: string, children: React.ReactNode }) {
  return (
    <div className="bg-white dark:bg-zinc-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-zinc-700 h-80 flex flex-col">
      <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">{title}</h3>
      <div className="flex-1 min-h-0">
        {children}
      </div>
    </div>
  );
}
