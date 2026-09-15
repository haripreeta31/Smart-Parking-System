import React from 'react';
import {
  PieChart as PieChartIcon,
  Car,
  Bus,
  Bike,
  TrendingUp,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  Zap,
  BarChart3,
  Layers,
} from 'lucide-react';
import { useParking } from '../../context/ParkingContext';
import { HOURLY_TRAFFIC_DATA } from '../../data/initialData';
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
  const { stats, setActiveTab, slots } = useParking();

  // Vehicle Distribution Donut Data
  const distributionData = [
    { name: 'Cars', value: stats.carStats.occupiedSpaces, color: '#2563eb', total: stats.carStats.totalSpaces },
    { name: 'Buses', value: stats.busStats.occupiedSpaces, color: '#f59e0b', total: stats.busStats.totalSpaces },
    { name: 'Bikes', value: stats.bikeStats.occupiedSpaces, color: '#9333ea', total: stats.bikeStats.totalSpaces },
  ];

  // Capacity vs Occupied Comparison Bar Data
  const comparisonData = [
    {
      category: 'Cars',
      Occupied: stats.carStats.occupiedSpaces,
      Available: stats.carStats.availableSpaces,
      Total: stats.carStats.totalSpaces,
    },
    {
      category: 'Buses',
      Occupied: stats.busStats.occupiedSpaces,
      Available: stats.busStats.availableSpaces,
      Total: stats.busStats.totalSpaces,
    },
    {
      category: 'Bikes',
      Occupied: stats.bikeStats.occupiedSpaces,
      Available: stats.bikeStats.availableSpaces,
      Total: stats.bikeStats.totalSpaces,
    },
  ];

  // Overall Occupancy Donut (Occupied vs Free)
  const occupancyDonutData = [
    { name: 'Occupied', value: stats.totalOccupied, color: '#0ea5e9' },
    { name: 'Available (Can Park)', value: stats.totalAvailable, color: '#10b981' },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Banner */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-5 sm:p-6 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200/60">
              Facility Analytics
            </span>
            <span className="text-xs text-slate-400">• Comprehensive Facility Report</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Overall Parking Dashboard &amp; Analytics
          </h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Holistic cross-category capacity metrics, vehicle distribution breakdowns, and availability forecasting.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <div className="text-xs text-slate-400 uppercase font-semibold">Remaining Space</div>
            <div className="text-xl font-black text-emerald-600">+{stats.canPark} Vehicles</div>
          </div>
          <button
            onClick={() => setActiveTab('slots')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm transition-all shadow-xs"
          >
            <Layers className="w-4 h-4" />
            View Slot Matrix
          </button>
        </div>
      </div>

      {/* CORE STATS GRID (All User Prompt Requested Items) */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-4">
        {/* 1. Total Parking Capacity */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs">
          <div className="text-xs font-semibold text-slate-500">Total Parking Capacity</div>
          <div className="text-3xl font-extrabold text-slate-900 mt-1">{stats.totalSpaces}</div>
          <div className="text-[11px] text-slate-400 mt-1">100% facility bays</div>
        </div>

        {/* 2. Total Vehicles Parked */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs">
          <div className="text-xs font-semibold text-blue-600">Total Vehicles Parked</div>
          <div className="text-3xl font-extrabold text-blue-600 mt-1">{stats.totalOccupied}</div>
          <div className="text-[11px] text-slate-400 mt-1">Across all categories</div>
        </div>

        {/* 3. Total Available Spaces */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs">
          <div className="text-xs font-semibold text-emerald-600">Total Available Spaces</div>
          <div className="text-3xl font-extrabold text-emerald-600 mt-1">{stats.totalAvailable}</div>
          <div className="text-[11px] text-slate-400 mt-1">Unoccupied ready slots</div>
        </div>

        {/* 4. Remaining Capacity / How Many More Vehicles Can Park */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs">
          <div className="text-xs font-semibold text-slate-700">Remaining Parking Capacity</div>
          <div className="text-3xl font-extrabold text-slate-900 mt-1">
            {stats.canPark} <span className="text-sm font-semibold text-emerald-600">Can Park</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Accepting incoming traffic</div>
        </div>
      </div>

      {/* CATEGORY BREAKDOWN CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Cars Parked */}
        <div
          onClick={() => setActiveTab('cars')}
          className="bg-blue-50/50 hover:bg-blue-50 border border-blue-100 rounded-2xl p-4 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center">
                <Car className="w-4 h-4" />
              </div>
              <span className="text-sm font-bold text-slate-900">Cars Parked</span>
            </div>
            <ArrowRight className="w-4 h-4 text-blue-600 group-hover:translate-x-1 transition-transform" />
          </div>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-extrabold text-blue-700">{stats.carStats.occupiedSpaces}</span>
            <span className="text-xs font-semibold text-slate-600">
              {stats.carStats.occupiedSpaces} / {stats.carStats.totalSpaces} ({stats.carStats.occupancyPercentage}%)
            </span>
          </div>
          <div className="w-full h-1.5 bg-blue-200/70 rounded-full overflow-hidden mt-2">
            <div
              className="h-full bg-blue-600 rounded-full"
              style={{ width: `${stats.carStats.occupancyPercentage}%` }}
            />
          </div>
        </div>

        {/* Buses Parked */}
        <div
          onClick={() => setActiveTab('buses')}
          className="bg-amber-50/50 hover:bg-amber-50 border border-amber-100 rounded-2xl p-4 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-amber-500 text-white flex items-center justify-center">
                <Bus className="w-4 h-4" />
              </div>
              <span className="text-sm font-bold text-slate-900">Buses Parked</span>
            </div>
            <ArrowRight className="w-4 h-4 text-amber-600 group-hover:translate-x-1 transition-transform" />
          </div>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-extrabold text-amber-700">{stats.busStats.occupiedSpaces}</span>
            <span className="text-xs font-semibold text-slate-600">
              {stats.busStats.occupiedSpaces} / {stats.busStats.totalSpaces} ({stats.busStats.occupancyPercentage}%)
            </span>
          </div>
          <div className="w-full h-1.5 bg-amber-200/70 rounded-full overflow-hidden mt-2">
            <div
              className="h-full bg-amber-500 rounded-full"
              style={{ width: `${stats.busStats.occupancyPercentage}%` }}
            />
          </div>
        </div>

        {/* Bikes Parked */}
        <div
          onClick={() => setActiveTab('bikes')}
          className="bg-purple-50/50 hover:bg-purple-50 border border-purple-100 rounded-2xl p-4 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-purple-600 text-white flex items-center justify-center">
                <Bike className="w-4 h-4" />
              </div>
              <span className="text-sm font-bold text-slate-900">Bikes Parked</span>
            </div>
            <ArrowRight className="w-4 h-4 text-purple-600 group-hover:translate-x-1 transition-transform" />
          </div>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-extrabold text-purple-700">{stats.bikeStats.occupiedSpaces}</span>
            <span className="text-xs font-semibold text-slate-600">
              {stats.bikeStats.occupiedSpaces} / {stats.bikeStats.totalSpaces} ({stats.bikeStats.occupancyPercentage}%)
            </span>
          </div>
          <div className="w-full h-1.5 bg-purple-200/70 rounded-full overflow-hidden mt-2">
            <div
              className="h-full bg-purple-600 rounded-full"
              style={{ width: `${stats.bikeStats.occupancyPercentage}%` }}
            />
          </div>
        </div>
      </div>

      {/* CHARTS SECTION: Vehicle Distribution & Parking Occupancy Donut */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Occupancy Donut Chart (5 cols) */}
        <div className="lg:col-span-5 bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-base font-bold text-slate-900">Overall Parking Occupancy</h3>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                {stats.overallOccupancyPercentage}% Utilized
              </span>
            </div>
            <p className="text-xs text-slate-500 mb-4">Total parked vehicles vs total available capacity</p>

            <div className="h-64 relative flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={occupancyDonutData}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={95}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {occupancyDonutData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderRadius: '0.75rem',
                      border: 'none',
                      color: '#fff',
                      fontSize: '12px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>

              {/* Center Donut Label */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-3xl font-black text-slate-900">{stats.overallOccupancyPercentage}%</span>
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Occupancy</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-4 border-t border-slate-100 text-xs">
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center gap-2">
              <span className="w-3 h-3 rounded-md bg-sky-500 shrink-0" />
              <div>
                <span className="text-slate-500 block">Occupied</span>
                <span className="font-bold text-slate-900">{stats.totalOccupied} vehicles</span>
              </div>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center gap-2">
              <span className="w-3 h-3 rounded-md bg-emerald-500 shrink-0" />
              <div>
                <span className="text-slate-500 block">Available (Can Park)</span>
                <span className="font-bold text-emerald-600">+{stats.totalAvailable} spaces</span>
              </div>
            </div>
          </div>
        </div>

        {/* Vehicle Distribution Chart (7 cols) */}
        <div className="lg:col-span-7 bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-base font-bold text-slate-900">Vehicle Distribution &amp; Capacity Ratio</h3>
              <span className="text-xs font-semibold text-slate-500">Live Breakdown</span>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              Side-by-side comparison of Occupied vs Available bays across vehicle classifications
            </p>

            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={comparisonData}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                  barSize={32}
                >
                  <XAxis dataKey="category" stroke="#94a3b8" fontSize={12} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderRadius: '0.75rem',
                      border: 'none',
                      color: '#fff',
                      fontSize: '12px',
                    }}
                  />
                  <Legend
                    verticalAlign="top"
                    align="right"
                    wrapperStyle={{ fontSize: '12px', paddingBottom: '10px' }}
                  />
                  <Bar dataKey="Occupied" fill="#2563eb" radius={[4, 4, 0, 0]} name="Occupied Bays" />
                  <Bar dataKey="Available" fill="#10b981" radius={[4, 4, 0, 0]} name="Available Bays" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 pt-4 border-t border-slate-100 text-xs text-center">
            <div className="p-2 rounded-xl bg-blue-50/60">
              <span className="text-blue-700 font-semibold block">Cars Share</span>
              <span className="font-bold text-slate-900 text-sm">
                {Math.round((stats.carStats.occupiedSpaces / stats.totalOccupied) * 100)}% of parked
              </span>
            </div>
            <div className="p-2 rounded-xl bg-amber-50/60">
              <span className="text-amber-700 font-semibold block">Buses Share</span>
              <span className="font-bold text-slate-900 text-sm">
                {Math.round((stats.busStats.occupiedSpaces / stats.totalOccupied) * 100)}% of parked
              </span>
            </div>
            <div className="p-2 rounded-xl bg-purple-50/60">
              <span className="text-purple-700 font-semibold block">Bikes Share</span>
              <span className="font-bold text-slate-900 text-sm">
                {Math.round((stats.bikeStats.occupiedSpaces / stats.totalOccupied) * 100)}% of parked
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* HOURLY FLOW ANALYSIS */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">Facility Operating Hours Traffic Accumulation</h3>
            <p className="text-xs text-slate-500">Hourly vehicle count progression through main entry gates</p>
          </div>
          <div className="text-xs text-slate-500 font-medium">Peak Hour: 12:00 PM - 2:00 PM (147 Vehicles)</div>
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-9 gap-2">
          {HOURLY_TRAFFIC_DATA.map((h) => {
            const isPeak = h.total >= 135;
            return (
              <div
                key={h.time}
                className={`p-3 rounded-xl border text-center transition-all ${
                  isPeak
                    ? 'bg-rose-50/60 border-rose-200 text-rose-900'
                    : 'bg-slate-50 border-slate-100 text-slate-700'
                }`}
              >
                <div className="text-[11px] font-semibold text-slate-400">{h.time}</div>
                <div className="text-base font-extrabold my-0.5">{h.total}</div>
                <div className="text-[10px] text-slate-500">
                  {h.cars}C • {h.buses}B • {h.bikes}K
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
