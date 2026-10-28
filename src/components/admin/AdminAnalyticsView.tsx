import React, { useState, useMemo, useEffect } from 'react';
import {
  Download,
  Lock,
  ShieldAlert,
  BarChart3,
} from 'lucide-react';
import { useParking } from '../../context/ParkingContext';
import { HOURLY_TRAFFIC_DATA } from '../../data/initialData';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from 'recharts';

export const AdminAnalyticsView: React.FC = () => {
  const {
    currentUser,
    switchUser,
    stats,
    reservations,
    dailyHistory,
    busSchedules,
  } = useParking();

  const isAdmin = currentUser.role === 'admin';

  const [startDate, setStartDate] = useState<string>(() => {
    return dailyHistory[0]?.date || '';
  });
  const [endDate, setEndDate] = useState<string>(() => {
    return dailyHistory[dailyHistory.length - 1]?.date || '';
  });
  const [serverAuthTestError, setServerAuthTestError] = useState<string>('');

  useEffect(() => {
    if (dailyHistory.length > 0 && !startDate) {
      setStartDate(dailyHistory[0].date);
      setEndDate(dailyHistory[dailyHistory.length - 1].date);
    }
  }, [dailyHistory, startDate]);

  const filteredHistory = useMemo(() => {
    return dailyHistory.filter((d) => {
      if (startDate && d.date < startDate) return false;
      if (endDate && d.date > endDate) return false;
      return true;
    });
  }, [dailyHistory, startDate, endDate]);

  const summaryMetrics = useMemo(() => {
    const histBookings = filteredHistory.reduce((s, d) => s + d.bookingsCount, 0);
    const liveCancelled = reservations.filter((r) => r.status === 'cancelled').length;
    const liveExpired = reservations.filter((r) => r.status === 'expired').length;
    const liveNoShows = reservations.filter((r) => r.status === 'no_show').length;

    const histCancelled = filteredHistory.reduce((s, d) => s + d.cancelledCount, 0) + liveCancelled;
    const histExpired = filteredHistory.reduce((s, d) => s + d.expiredCount, 0) + liveExpired;
    const histNoShows = filteredHistory.reduce((s, d) => s + d.noShowCount, 0) + liveNoShows;

    const noShowRate =
      histBookings > 0 ? Math.round((histNoShows / histBookings) * 1000) / 10 : 0;

    const busUtilized = stats.busStats.occupiedSpaces + stats.busStats.reservedSpaces;
    const busUtilizationPct =
      stats.busStats.totalSpaces > 0
        ? Math.round((busUtilized / stats.busStats.totalSpaces) * 100)
        : 0;

    return {
      totalBookings: histBookings,
      cancelled: histCancelled,
      expired: histExpired,
      noShows: histNoShows,
      noShowRate,
      busUtilizationPct,
      activeBusRoutes: busSchedules.filter((b) => b.status === 'arrived' || b.status === 'scheduled').length,
    };
  }, [filteredHistory, reservations, stats, busSchedules]);

  const categoryPieData = [
    { name: 'Cars', value: stats.carStats.occupiedSpaces, color: '#2563eb' },
    { name: 'Bikes', value: stats.bikeStats.occupiedSpaces, color: '#9333ea' },
    { name: 'Staff Vehicles', value: stats.staffStats.occupiedSpaces, color: '#4f46e5' },
    { name: 'Visitors', value: stats.visitorStats.occupiedSpaces, color: '#0d9488' },
    { name: 'Buses', value: stats.busStats.occupiedSpaces, color: '#d97706' },
  ];

  const handleExportAnalyticsCSV = () => {
    const headers = [
      'Date',
      'Day',
      'Daily Bookings',
      'Avg Occupancy (%)',
      'Peak Occupancy (%)',
      'Completed Sessions',
      'Cancelled',
      'Expired',
      'No-Shows',
    ];
    const rows = filteredHistory.map((d) => [
      d.date,
      d.dayName,
      d.bookingsCount,
      d.avgOccupancyPct,
      d.peakOccupancyPct,
      d.completedSessions,
      d.cancelledCount,
      d.expiredCount,
      d.noShowCount,
    ]);

    const csv =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const link = document.createElement('a');
    link.setAttribute('href', encodeURI(csv));
    link.setAttribute('download', `campus_admin_analytics_${endDate || 'export'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!isAdmin) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-8 max-w-2xl mx-auto text-center space-y-4">
        <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
          <Lock className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">Restricted Administrator Analytics</h2>
        <p className="text-sm text-slate-600">
          Current role: <strong className="capitalize">{currentUser.role}</strong> ({currentUser.name}). Access to executive booking metrics, no-show audits, and CSV exports is restricted to Campus Administrators on both the client and backend server.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <button
            onClick={() => switchUser('usr-admin-1')}
            className="px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition-colors"
          >
            Switch to Administrator (John Cooper)
          </button>
          <button
            onClick={async () => {
              const res = await fetch('/api/admin/analytics', {
                headers: { Authorization: `Bearer ${currentUser.token}` },
              });
              const json = await res.json();
              if (!json.success) setServerAuthTestError(json.message);
            }}
            className="px-4 py-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors"
          >
            Verify Backend API 403 Protection
          </button>
        </div>
        {serverAuthTestError && (
          <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-center justify-center gap-2">
            <ShieldAlert className="w-4 h-4 shrink-0" />
            <span>{serverAuthTestError}</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div>
          <p className="text-xs font-medium text-slate-500">
            Executive Operations Console · Administrator Access Verified
          </p>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight mt-0.5">
            Administrator Parking Analytics
          </h2>
          <p className="text-sm text-slate-600 mt-1">
            Comprehensive metrics covering space availability, daily booking volume, no-show rates, cancelled/expired passes, category distribution, and bus terminal utilization.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-slate-500 font-medium">From:</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-2.5 py-1.5 font-mono text-xs bg-slate-50 border border-slate-200 rounded-lg"
            />
            <span className="text-slate-500 font-medium">To:</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-2.5 py-1.5 font-mono text-xs bg-slate-50 border border-slate-200 rounded-lg"
            />
          </div>

          <button
            onClick={handleExportAnalyticsCSV}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition-colors whitespace-nowrap"
          >
            <Download className="w-4 h-4" />
            <span>Export Analytics CSV</span>
          </button>
        </div>
      </div>

      {/* 6 Core Admin KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 tabular-nums">
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <span className="text-xs font-medium text-slate-500 block">Available / Total</span>
          <div className="text-xl font-bold text-slate-900 mt-1">
            {stats.totalAvailable} / {stats.totalSpaces}
          </div>
          <span className="text-[11px] text-emerald-600">
            {stats.overallOccupancyPercentage}% occupied
          </span>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <span className="text-xs font-medium text-slate-500 block">Period Bookings</span>
          <div className="text-xl font-bold text-blue-600 mt-1">{summaryMetrics.totalBookings}</div>
          <span className="text-[11px] text-slate-500">{filteredHistory.length} days selected</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <span className="text-xs font-medium text-slate-500 block">Cancelled Passes</span>
          <div className="text-xl font-bold text-slate-900 mt-1">{summaryMetrics.cancelled}</div>
          <span className="text-[11px] text-slate-500">Released to pool</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <span className="text-xs font-medium text-slate-500 block">Expired Bookings</span>
          <div className="text-xl font-bold text-amber-600 mt-1">{summaryMetrics.expired}</div>
          <span className="text-[11px] text-slate-500">Window elapsed</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <span className="text-xs font-medium text-slate-500 block">No-Show Count</span>
          <div className="text-xl font-bold text-rose-600 mt-1">{summaryMetrics.noShows}</div>
          <span className="text-[11px] text-rose-600">{summaryMetrics.noShowRate}% no-show rate</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <span className="text-xs font-medium text-slate-500 block">Bus Bay Utilization</span>
          <div className="text-xl font-bold text-amber-600 mt-1">
            {summaryMetrics.busUtilizationPct}%
          </div>
          <span className="text-[11px] text-slate-500">
            {summaryMetrics.activeBusRoutes} active schedules
          </span>
        </div>
      </div>

      {/* Charts Row 1: Daily Bookings & Occupancy Trend + Category Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-5">
          <h3 className="text-base font-bold text-slate-900 mb-1">
            Daily Booking Volume &amp; Occupancy Trends
          </h3>
          <p className="text-xs text-slate-500 mb-4">
            Daily reservation volume alongside average occupancy (%)
          </p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={filteredHistory}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <XAxis
                  dataKey="date"
                  tickFormatter={(v: string) => v.slice(5)}
                  stroke="#94a3b8"
                  fontSize={11}
                  tickLine={false}
                />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Area
                  type="monotone"
                  dataKey="bookingsCount"
                  stroke="#2563eb"
                  fill="#dbeafe"
                  name="Daily Bookings"
                />
                <Area
                  type="monotone"
                  dataKey="avgOccupancyPct"
                  stroke="#0f172a"
                  fill="#e2e8f0"
                  name="Avg Occupancy %"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-5">
          <h3 className="text-base font-bold text-slate-900 mb-1">
            Active Vehicle Category Distribution
          </h3>
          <p className="text-xs text-slate-500 mb-4">
            Cars, Bikes, Staff Vehicles, Visitors, and Buses
          </p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryPieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {categoryPieData.map((entry, idx) => (
                    <Cell key={idx} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Charts Row 2: Peak Parking Hours + No-Show / Cancellation Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2 mb-1">
            <BarChart3 className="w-4 h-4 text-blue-600" />
            <span>Peak Campus Parking Hours</span>
          </h3>
          <p className="text-xs text-slate-500 mb-4">
            Hourly total parked accumulation (12:00 PM peak = 169 vehicles)
          </p>
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={HOURLY_TRAFFIC_DATA}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <XAxis dataKey="time" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                <Tooltip />
                <Bar dataKey="total" fill="#1e293b" name="Total Vehicles" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <h3 className="text-base font-bold text-slate-900 mb-1">
            Cancellations, Expirations &amp; No-Show Trend
          </h3>
          <p className="text-xs text-slate-500 mb-4">
            Daily reservation attrition metrics across selected date window
          </p>
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={filteredHistory}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <XAxis
                  dataKey="date"
                  tickFormatter={(v: string) => v.slice(5)}
                  stroke="#94a3b8"
                  fontSize={11}
                  tickLine={false}
                />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Bar dataKey="cancelledCount" fill="#64748b" name="Cancelled" radius={[2, 2, 0, 0]} />
                <Bar dataKey="expiredCount" fill="#d97706" name="Expired" radius={[2, 2, 0, 0]} />
                <Bar dataKey="noShowCount" fill="#dc2626" name="No-Show" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
