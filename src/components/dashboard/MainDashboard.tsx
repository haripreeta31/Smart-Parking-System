import React from 'react';
import {
  Car,
  Bus,
  Bike,
  Briefcase,
  Users,
  ArrowRight,
  MapPin,
  CalendarCheck,
  Navigation,
  AlertTriangle,
  PlusCircle,
  Clock,
  CheckCircle2,
} from 'lucide-react';
import { useParking } from '../../context/ParkingContext';
import { HOURLY_TRAFFIC_DATA } from '../../data/initialData';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

export const MainDashboard: React.FC = () => {
  const {
    stats,
    setActiveTab,
    slots,
    logs,
    reservations,
    notifications,
    issues,
    setIsParkModalOpen,
    setSelectedSlotForModal,
  } = useParking();

  const categoryCards = [
    {
      id: 'cars',
      title: 'Cars',
      subtitle: 'General student & campus bays',
      icon: Car,
      data: stats.carStats,
      accentText: 'text-blue-600',
      barColor: 'bg-blue-600',
    },
    {
      id: 'bikes',
      title: 'Bikes',
      subtitle: 'Zone C mobility & EV two-wheelers',
      icon: Bike,
      data: stats.bikeStats,
      accentText: 'text-purple-600',
      barColor: 'bg-purple-600',
    },
    {
      id: 'staff',
      title: 'Staff Vehicles',
      subtitle: 'Faculty & administration rows',
      icon: Briefcase,
      data: stats.staffStats,
      accentText: 'text-indigo-600',
      barColor: 'bg-indigo-600',
    },
    {
      id: 'visitors',
      title: 'Visitors',
      subtitle: 'Guest & medical plaza bays',
      icon: Users,
      data: stats.visitorStats,
      accentText: 'text-teal-600',
      barColor: 'bg-teal-600',
    },
    {
      id: 'bus-management',
      title: 'Buses',
      subtitle: 'Zone E dedicated transit terminal',
      icon: Bus,
      data: stats.busStats,
      accentText: 'text-amber-600',
      barColor: 'bg-amber-500',
    },
  ];

  // Unified recent parking activity combining active check-ins, completed sessions, and recent reservations
  const recentActivity = React.useMemo(() => {
    const activeEntries = slots
      .filter((s) => s.status === 'occupied' && s.currentVehicle)
      .slice(0, 5)
      .map((s) => ({
        id: `act-${s.id}`,
        slotId: s.id,
        slotNumber: s.slotNumber,
        zoneName: s.zoneName,
        plate: s.currentVehicle!.licensePlate,
        category: s.vehicleType,
        driver: s.currentVehicle!.driverName || 'Campus Driver',
        eventLabel: 'Checked In (Parked)',
        timeIso: s.currentVehicle!.entryTime,
        slotRef: s,
      }));

    const recentCompleted = logs
      .filter((l) => l.status === 'completed')
      .slice(0, 3)
      .map((l) => ({
        id: l.id,
        slotId: l.slotId,
        slotNumber: l.slotId,
        zoneName: l.zoneId || 'Campus Lot',
        plate: l.licensePlate,
        category: l.vehicleType,
        driver: l.driverName || 'Completed Session',
        eventLabel: `Checked Out ($${(l.feeAmount || 0).toFixed(2)})`,
        timeIso: l.exitTime || l.entryTime,
        slotRef: slots.find((s) => s.id === l.slotId) || null,
      }));

    return [...activeEntries, ...recentCompleted]
      .sort((a, b) => new Date(b.timeIso).getTime() - new Date(a.timeIso).getTime())
      .slice(0, 7);
  }, [slots, logs]);

  const openIssues = React.useMemo(
    () => issues.filter((i) => i.status !== 'resolved').slice(0, 4),
    [issues]
  );

  const upcomingConfirmedCount = React.useMemo(
    () => reservations.filter((r) => r.status === 'confirmed').length,
    [reservations]
  );

  return (
    <div className="space-y-6">
      {/* Hero Workspace Header */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div>
          <p className="text-xs font-medium text-slate-500">
            Campus Mobility Control · Zones A–E Synchronized
          </p>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight mt-0.5">
            Smart Campus Parking Dashboard
          </h2>
          <p className="text-sm text-slate-600 mt-1 max-w-2xl">
            Live slot inventory, QR pass reservations, campus zone navigation, and category allocation across Cars, Bikes, Staff, Visitors, and Transit Buses.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
          <button
            id="main-open-map-btn"
            onClick={() => setActiveTab('campus-map')}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs transition-colors whitespace-nowrap shrink-0"
          >
            <MapPin className="w-4 h-4" />
            <span>Campus Map &amp; Recommender</span>
          </button>
          <button
            id="main-reserve-qr-btn"
            onClick={() => setActiveTab('reservations')}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition-colors whitespace-nowrap shrink-0"
          >
            <CalendarCheck className="w-4 h-4" />
            <span>Book Slot &amp; QR Pass</span>
          </button>
          <button
            id="main-find-vehicle-btn"
            onClick={() => setActiveTab('find-vehicle')}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs transition-colors whitespace-nowrap shrink-0"
          >
            <Navigation className="w-4 h-4" />
            <span>Find My Vehicle</span>
          </button>
          <button
            id="main-quick-park-btn"
            onClick={() => setIsParkModalOpen(true)}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs transition-colors whitespace-nowrap shrink-0"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Walk-In Check-In</span>
          </button>
        </div>
      </div>

      {/* Primary KPI Strip (All Synchronized Numbers) */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="text-xs font-medium text-slate-500">Total Parking Slots</div>
          <div className="text-2xl font-bold text-slate-900 mt-1 tabular-nums">
            {stats.totalSpaces}
          </div>
          <div className="text-xs text-slate-500 mt-1 tabular-nums">
            5 campus zones · {stats.totalMaintenance} unavailable
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="text-xs font-medium text-slate-500">Available Slots</div>
          <div className="text-2xl font-bold text-emerald-600 mt-1 tabular-nums">
            {stats.totalAvailable}
          </div>
          <div className="text-xs text-slate-500 mt-1 tabular-nums">
            Ready for immediate booking
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="text-xs font-medium text-slate-500">Occupied Slots</div>
          <div className="text-2xl font-bold text-rose-600 mt-1 tabular-nums">
            {stats.totalOccupied}
          </div>
          <div className="text-xs text-slate-500 mt-1 tabular-nums">
            Active checked-in vehicles
          </div>
        </div>

        <div
          onClick={() => setActiveTab('reservations')}
          className="bg-white border border-slate-200 hover:border-blue-400 rounded-xl p-4 cursor-pointer transition-colors"
        >
          <div className="text-xs font-medium text-slate-500">Active Reservations</div>
          <div className="text-2xl font-bold text-blue-600 mt-1 tabular-nums">
            {stats.activeReservationsCount}
          </div>
          <div className="text-xs text-slate-500 mt-1 tabular-nums">
            {upcomingConfirmedCount} awaiting arrival · {stats.waitlistWaitingCount} waitlisted
          </div>
        </div>

        <div
          onClick={() => setActiveTab('overall')}
          className="col-span-2 md:col-span-1 bg-white border border-slate-200 hover:border-slate-400 rounded-xl p-4 cursor-pointer transition-colors"
        >
          <div className="flex items-center justify-between text-xs font-medium text-slate-500">
            <span>Parking Occupancy</span>
            <span className="font-mono font-bold text-slate-900 tabular-nums">
              {stats.overallOccupancyPercentage}%
            </span>
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-1 tabular-nums">
            {stats.overallOccupancyPercentage}%
          </div>
          <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden mt-2">
            <div
              className="h-full bg-blue-600 rounded-full transition-all duration-300"
              style={{ width: `${Math.min(stats.overallOccupancyPercentage, 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* 5 Vehicle Categories Breakdown */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-slate-900">
            Vehicle Categories Allocation
          </h3>
          <button
            onClick={() => setActiveTab('slots')}
            className="text-xs font-semibold text-blue-600 hover:text-blue-700 whitespace-nowrap"
          >
            View All 200 Slots &rarr;
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {categoryCards.map((cat) => {
            const Icon = cat.icon;
            return (
              <div
                key={cat.id}
                id={`main-card-${cat.id}`}
                onClick={() => setActiveTab(cat.id)}
                className="group bg-white border border-slate-200 hover:border-slate-400 rounded-xl p-4 cursor-pointer transition-colors flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Icon className={`w-4 h-4 ${cat.accentText}`} />
                      <h4 className="text-sm font-bold text-slate-900">{cat.title}</h4>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-800 transition-colors" />
                  </div>
                  <p className="text-xs text-slate-500 mb-3">{cat.subtitle}</p>

                  <div className="space-y-1.5 text-xs tabular-nums">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Available</span>
                      <span className="font-bold text-emerald-600">
                        {cat.data.availableSpaces}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Occupied</span>
                      <span className="font-bold text-slate-900">
                        {cat.data.occupiedSpaces} / {cat.data.totalSpaces}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Reserved</span>
                      <span className="font-semibold text-blue-600">
                        {cat.data.reservedSpaces}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-slate-100">
                  <div className="flex justify-between text-xs mb-1 tabular-nums">
                    <span className="text-slate-500">Occupancy</span>
                    <span className={`font-bold ${cat.accentText}`}>
                      {cat.data.occupancyPercentage}%
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${cat.barColor} rounded-full transition-all duration-300`}
                      style={{ width: `${cat.data.occupancyPercentage}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Mid Row: Occupancy Chart + Alerts & Open Issues */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Hourly Occupancy Trend */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Campus Hourly Occupancy Profile
                </h3>
                <p className="text-xs text-slate-500">
                  Historical campus traffic baseline across Cars, Bikes, Staff, Visitors, and Buses
                </p>
              </div>
              <button
                onClick={() => setActiveTab('insights')}
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 whitespace-nowrap"
              >
                Open Demand Forecast &rarr;
              </button>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={HOURLY_TRAFFIC_DATA}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="dashTotalGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563eb" stopOpacity={0.28} />
                      <stop offset="95%" stopColor="#2563eb" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="time" stroke="#94a3b8" fontSize={12} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      border: 'none',
                      borderRadius: '0.5rem',
                      color: '#fff',
                      fontSize: '12px',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="cars"
                    stackId="1"
                    stroke="#2563eb"
                    fill="#3b82f6"
                    fillOpacity={0.2}
                    name="Cars"
                  />
                  <Area
                    type="monotone"
                    dataKey="bikes"
                    stackId="1"
                    stroke="#9333ea"
                    fill="#a855f7"
                    fillOpacity={0.2}
                    name="Bikes"
                  />
                  <Area
                    type="monotone"
                    dataKey="staff"
                    stackId="1"
                    stroke="#4f46e5"
                    fill="#6366f1"
                    fillOpacity={0.2}
                    name="Staff"
                  />
                  <Area
                    type="monotone"
                    dataKey="visitors"
                    stackId="1"
                    stroke="#0d9488"
                    fill="#14b8a6"
                    fillOpacity={0.2}
                    name="Visitors"
                  />
                  <Area
                    type="monotone"
                    dataKey="buses"
                    stackId="1"
                    stroke="#d97706"
                    fill="#f59e0b"
                    fillOpacity={0.25}
                    name="Buses"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
            <span>Cars · Bikes · Staff · Visitors · Buses</span>
            <span>Peak Campus Hours: 10:00 AM – 2:00 PM</span>
          </div>
        </div>

        {/* Alerts & Notifications Feed */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-bold text-slate-900">Alerts &amp; Notifications</h3>
              <button
                onClick={() => setActiveTab('issues')}
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 whitespace-nowrap"
              >
                Manage ({stats.openIssuesCount} open)
              </button>
            </div>

            <div className="space-y-3">
              {openIssues.map((iss) => (
                <div
                  key={iss.id}
                  onClick={() => setActiveTab('issues')}
                  className="p-3 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-900 flex items-center gap-1.5">
                      <AlertTriangle
                        className={`w-3.5 h-3.5 shrink-0 ${
                          iss.severity === 'high' ? 'text-rose-600' : 'text-amber-600'
                        }`}
                      />
                      <span className="truncate">{iss.title}</span>
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1">
                    {iss.id} · {iss.slotId ? `Slot ${iss.slotId}` : iss.zoneId} · Status:{' '}
                    <span className="capitalize font-medium text-slate-700">
                      {iss.status.replace('_', ' ')}
                    </span>
                  </div>
                </div>
              ))}

              {notifications.slice(0, 3).map((n) => (
                <div key={n.id} className="p-3 rounded-lg border border-slate-100 text-xs">
                  <div className="flex items-center justify-between font-semibold text-slate-800">
                    <span className="truncate">{n.title}</span>
                    <span className="text-[11px] font-normal text-slate-400 shrink-0 ml-2">
                      {n.timestamp}
                    </span>
                  </div>
                  <p className="text-slate-600 mt-0.5 text-[11px]">{n.message}</p>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={() => setActiveTab('issues')}
            className="mt-4 w-full py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
          >
            Report a Parking Issue
          </button>
        </div>
      </div>

      {/* Recent Parking Activity Table */}
      <div className="bg-white border border-slate-200 rounded-xl p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">Recent Parking Activity</h3>
            <p className="text-xs text-slate-500">
              Latest check-ins, check-outs, and active campus bay assignments
            </p>
          </div>
          <button
            onClick={() => setActiveTab('reports')}
            className="text-xs font-semibold text-blue-600 hover:text-blue-700 whitespace-nowrap"
          >
            Full Session Logs &rarr;
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs tabular-nums">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 font-semibold">
                <th className="pb-2.5 pr-4">Slot</th>
                <th className="pb-2.5 px-4">Category</th>
                <th className="pb-2.5 px-4">License Plate</th>
                <th className="pb-2.5 px-4">Driver</th>
                <th className="pb-2.5 px-4">Activity Status</th>
                <th className="pb-2.5 px-4">Timestamp</th>
                <th className="pb-2.5 pl-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recentActivity.map((act) => (
                <tr key={act.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-2.5 pr-4 font-mono font-semibold text-slate-900">
                    {act.slotNumber}
                  </td>
                  <td className="py-2.5 px-4 capitalize text-slate-700">{act.category}</td>
                  <td className="py-2.5 px-4 font-mono font-semibold text-slate-900">
                    {act.plate}
                  </td>
                  <td className="py-2.5 px-4 text-slate-700">{act.driver}</td>
                  <td className="py-2.5 px-4">
                    <span className="inline-flex items-center gap-1.5 text-slate-700 font-medium">
                      {act.eventLabel.includes('Checked Out') ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <Clock className="w-3.5 h-3.5 text-blue-600" />
                      )}
                      <span>{act.eventLabel}</span>
                    </span>
                  </td>
                  <td className="py-2.5 px-4 text-slate-500">
                    {new Date(act.timeIso).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </td>
                  <td className="py-2.5 pl-4 text-right">
                    {act.slotRef && (
                      <button
                        onClick={() => setSelectedSlotForModal(act.slotRef)}
                        className="px-2.5 py-1 text-xs font-semibold text-blue-600 hover:bg-blue-50 rounded-md transition-colors whitespace-nowrap"
                      >
                        Inspect Bay
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
