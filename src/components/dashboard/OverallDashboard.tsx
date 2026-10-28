import React from 'react';
import {
  Car,
  Bus,
  Bike,
  Briefcase,
  Users,
  ArrowRight,
  Layers,
} from 'lucide-react';
import { useParking } from '../../context/ParkingContext';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from 'recharts';

export const OverallDashboard: React.FC = () => {
  const { stats, setActiveTab } = useParking();

  const comparisonData = [
    {
      category: 'Cars',
      Occupied: stats.carStats.occupiedSpaces,
      Reserved: stats.carStats.reservedSpaces,
      Available: stats.carStats.availableSpaces,
    },
    {
      category: 'Bikes',
      Occupied: stats.bikeStats.occupiedSpaces,
      Reserved: stats.bikeStats.reservedSpaces,
      Available: stats.bikeStats.availableSpaces,
    },
    {
      category: 'Staff',
      Occupied: stats.staffStats.occupiedSpaces,
      Reserved: stats.staffStats.reservedSpaces,
      Available: stats.staffStats.availableSpaces,
    },
    {
      category: 'Visitors',
      Occupied: stats.visitorStats.occupiedSpaces,
      Reserved: stats.visitorStats.reservedSpaces,
      Available: stats.visitorStats.availableSpaces,
    },
    {
      category: 'Buses',
      Occupied: stats.busStats.occupiedSpaces,
      Reserved: stats.busStats.reservedSpaces,
      Available: stats.busStats.availableSpaces,
    },
  ];

  const occupancyDonutData = [
    { name: 'Occupied', value: stats.totalOccupied, color: '#dc2626' },
    { name: 'Reserved', value: stats.totalReserved, color: '#2563eb' },
    { name: 'Available', value: stats.totalAvailable, color: '#16a34a' },
    { name: 'Unavailable', value: stats.totalMaintenance, color: '#d97706' },
  ];

  const categories = [
    { id: 'cars', label: 'Cars', icon: Car, st: stats.carStats, color: 'text-blue-600' },
    { id: 'bikes', label: 'Bikes', icon: Bike, st: stats.bikeStats, color: 'text-purple-600' },
    { id: 'staff', label: 'Staff Vehicles', icon: Briefcase, st: stats.staffStats, color: 'text-indigo-600' },
    { id: 'visitors', label: 'Visitors', icon: Users, st: stats.visitorStats, color: 'text-teal-600' },
    { id: 'bus-management', label: 'Buses', icon: Bus, st: stats.busStats, color: 'text-amber-600' },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <p className="text-xs font-medium text-slate-500">Cross-Category Campus Summary</p>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight mt-0.5">
            Overall Campus Parking Summary
          </h2>
          <p className="text-sm text-slate-600 mt-1">
            Synchronized capacity breakdown across all 200 bays, active reservations, and category shares.
          </p>
        </div>

        <button
          onClick={() => setActiveTab('slots')}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs transition-colors whitespace-nowrap"
        >
          <Layers className="w-4 h-4" />
          <span>View All Slots Matrix</span>
        </button>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 tabular-nums">
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="text-xs font-medium text-slate-500">Total Campus Capacity</div>
          <div className="text-2xl font-bold text-slate-900 mt-1">{stats.totalSpaces}</div>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="text-xs font-medium text-rose-600">Occupied Spaces</div>
          <div className="text-2xl font-bold text-rose-600 mt-1">{stats.totalOccupied}</div>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="text-xs font-medium text-blue-600">Reserved Spaces</div>
          <div className="text-2xl font-bold text-blue-600 mt-1">{stats.totalReserved}</div>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="text-xs font-medium text-emerald-600">Available Spaces</div>
          <div className="text-2xl font-bold text-emerald-600 mt-1">{stats.totalAvailable}</div>
        </div>
      </div>

      {/* Category Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 tabular-nums">
        {categories.map((c) => {
          const Icon = c.icon;
          return (
            <div
              key={c.id}
              onClick={() => setActiveTab(c.id)}
              className="bg-white border border-slate-200 hover:border-slate-400 rounded-xl p-4 cursor-pointer transition-colors"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Icon className={`w-4 h-4 ${c.color}`} />
                  <span className="text-xs font-bold text-slate-900">{c.label}</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
              </div>
              <div className="text-xl font-bold text-slate-900 mt-1">
                {c.st.occupiedSpaces}{' '}
                <span className="text-xs font-normal text-slate-500">/ {c.st.totalSpaces}</span>
              </div>
              <div className="text-[11px] text-slate-500 mt-1">
                {c.st.availableSpaces} free · {c.st.reservedSpaces} reserved
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-5">
          <h3 className="text-base font-bold text-slate-900 mb-1">Campus Slot State Breakdown</h3>
          <p className="text-xs text-slate-500 mb-4">Occupied, Reserved, Available, and Unavailable</p>
          <div className="h-64 relative flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={occupancyDonutData}
                  cx="50%"
                  cy="50%"
                  innerRadius={65}
                  outerRadius={90}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {occupancyDonutData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none tabular-nums">
              <span className="text-2xl font-bold text-slate-900">
                {stats.overallOccupancyPercentage}%
              </span>
              <span className="text-xs text-slate-500">Occupied</span>
            </div>
          </div>
        </div>

        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-5">
          <h3 className="text-base font-bold text-slate-900 mb-1">
            Category Allocation Comparison
          </h3>
          <p className="text-xs text-slate-500 mb-4">
            Occupied vs Reserved vs Available slots across all 5 campus vehicle categories
          </p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={comparisonData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="category" stroke="#94a3b8" fontSize={12} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Bar dataKey="Occupied" fill="#dc2626" radius={[3, 3, 0, 0]} />
                <Bar dataKey="Reserved" fill="#2563eb" radius={[3, 3, 0, 0]} />
                <Bar dataKey="Available" fill="#16a34a" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
