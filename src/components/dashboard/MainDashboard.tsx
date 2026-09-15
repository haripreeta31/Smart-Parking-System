import React from 'react';
import {
  Car,
  Bus,
  Bike,
  PieChart,
  ArrowRight,
  TrendingUp,
  Clock,
  Layers,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  PlusCircle,
  ShieldAlert,
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
  BarChart,
  Bar,
  Cell,
} from 'recharts';

export const MainDashboard: React.FC = () => {
  const { stats, setActiveTab, slots, logs, setIsParkModalOpen, setSelectedSlotForModal } = useParking();

  // Floor stats
  const floorBreakdown = React.useMemo(() => {
    const floors: Array<{ id: string; name: string; total: number; occupied: number; free: number; types: string }> = [
      { id: 'G', name: 'Ground Floor (Cars & Heavy Buses)', total: 0, occupied: 0, free: 0, types: 'Cars, Buses, Bikes' },
      { id: 'F1', name: 'Level 1 (North Car Deck)', total: 0, occupied: 0, free: 0, types: 'Cars' },
      { id: 'F2', name: 'Level 2 (South Car Deck)', total: 0, occupied: 0, free: 0, types: 'Cars' },
      { id: 'F3', name: 'Level 3 (Two-Wheeler Rooftop Deck)', total: 0, occupied: 0, free: 0, types: 'Bikes' },
    ];

    slots.forEach((s) => {
      const match = floors.find((f) => f.id === s.floor);
      if (match) {
        match.total += 1;
        if (s.status === 'occupied') match.occupied += 1;
        else match.free += 1;
      }
    });

    return floors;
  }, [slots]);

  // Recent 5 active parked vehicles
  const recentParked = React.useMemo(() => {
    return slots
      .filter((s) => s.status === 'occupied' && s.currentVehicle)
      .slice(0, 5);
  }, [slots]);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Banner / System Status Summary */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-6 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200/60">
              Facility Overview
            </span>
            <span className="text-xs text-slate-400">• Real-Time Automated Sensors</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Central Parking Hub Dashboard
          </h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Monitor real-time vehicle allocation, space availability, and category-level occupancy across all levels.
          </p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <button
            id="main-quick-park-btn"
            onClick={() => setIsParkModalOpen(true)}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold text-sm transition-all shadow-xs"
          >
            <PlusCircle className="w-4 h-4" />
            Quick Entry
          </button>
          <button
            id="main-view-slots-btn"
            onClick={() => setActiveTab('slots')}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-sm transition-all"
          >
            <Layers className="w-4 h-4" />
            Interactive Slots
          </button>
        </div>
      </div>

      {/* 4 MAIN DASHBOARD CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {/* CARD 1: CARS */}
        <div
          id="main-card-cars"
          onClick={() => setActiveTab('cars')}
          className="group bg-white border border-slate-200/80 hover:border-blue-400/80 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all duration-200 cursor-pointer relative overflow-hidden flex flex-col justify-between"
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50/60 rounded-bl-full pointer-events-none -z-0 group-hover:scale-110 transition-transform" />

          <div>
            <div className="flex items-center justify-between relative z-10 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-11 h-11 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                  <Car className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 leading-tight">Cars</h3>
                  <p className="text-xs text-slate-500">Standard &amp; EV bays</p>
                </div>
              </div>
              <span className="p-1 rounded-lg text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all">
                <ArrowRight className="w-4 h-4" />
              </span>
            </div>

            {/* Main numbers requested in prompt */}
            <div className="space-y-2.5 relative z-10">
              <div className="flex items-baseline justify-between">
                <span className="text-xs font-semibold text-slate-500">Currently Parked</span>
                <span className="text-2xl font-extrabold text-slate-900 tracking-tight">
                  {stats.carStats.occupiedSpaces}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 py-2 border-y border-slate-100 text-xs">
                <div>
                  <span className="text-slate-500 block">Total Spaces</span>
                  <span className="font-bold text-slate-800 text-sm">{stats.carStats.totalSpaces}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Available</span>
                  <span className="font-bold text-emerald-600 text-sm">{stats.carStats.availableSpaces}</span>
                </div>
              </div>

              {/* Progress bar */}
              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="text-slate-500">Occupancy</span>
                  <span className="text-blue-600 font-bold">{stats.carStats.occupancyPercentage}%</span>
                </div>
                <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-600 rounded-full transition-all duration-500"
                    style={{ width: `${stats.carStats.occupancyPercentage}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-blue-600 font-semibold group-hover:underline">
            <span>Open Car Dashboard</span>
            <span>&rarr;</span>
          </div>
        </div>

        {/* CARD 2: BUSES */}
        <div
          id="main-card-buses"
          onClick={() => setActiveTab('buses')}
          className="group bg-white border border-slate-200/80 hover:border-amber-400/80 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all duration-200 cursor-pointer relative overflow-hidden flex flex-col justify-between"
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-50/60 rounded-bl-full pointer-events-none -z-0 group-hover:scale-110 transition-transform" />

          <div>
            <div className="flex items-center justify-between relative z-10 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-11 h-11 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 group-hover:bg-amber-600 group-hover:text-white transition-colors">
                  <Bus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 leading-tight">Buses</h3>
                  <p className="text-xs text-slate-500">Heavy vehicle zone</p>
                </div>
              </div>
              <span className="p-1 rounded-lg text-slate-400 group-hover:text-amber-600 group-hover:translate-x-0.5 transition-all">
                <ArrowRight className="w-4 h-4" />
              </span>
            </div>

            {/* Main numbers requested in prompt */}
            <div className="space-y-2.5 relative z-10">
              <div className="flex items-baseline justify-between">
                <span className="text-xs font-semibold text-slate-500">Currently Parked</span>
                <span className="text-2xl font-extrabold text-slate-900 tracking-tight">
                  {stats.busStats.occupiedSpaces}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 py-2 border-y border-slate-100 text-xs">
                <div>
                  <span className="text-slate-500 block">Total Spaces</span>
                  <span className="font-bold text-slate-800 text-sm">{stats.busStats.totalSpaces}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Available</span>
                  <span className="font-bold text-emerald-600 text-sm">{stats.busStats.availableSpaces}</span>
                </div>
              </div>

              {/* Progress bar */}
              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="text-slate-500">Occupancy</span>
                  <span className="text-amber-600 font-bold">{stats.busStats.occupancyPercentage}%</span>
                </div>
                <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber-500 rounded-full transition-all duration-500"
                    style={{ width: `${stats.busStats.occupancyPercentage}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-amber-600 font-semibold group-hover:underline">
            <span>Open Bus Dashboard</span>
            <span>&rarr;</span>
          </div>
        </div>

        {/* CARD 3: BIKES */}
        <div
          id="main-card-bikes"
          onClick={() => setActiveTab('bikes')}
          className="group bg-white border border-slate-200/80 hover:border-purple-400/80 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all duration-200 cursor-pointer relative overflow-hidden flex flex-col justify-between"
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-purple-50/60 rounded-bl-full pointer-events-none -z-0 group-hover:scale-110 transition-transform" />

          <div>
            <div className="flex items-center justify-between relative z-10 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-11 h-11 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600 group-hover:bg-purple-600 group-hover:text-white transition-colors">
                  <Bike className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 leading-tight">Bikes</h3>
                  <p className="text-xs text-slate-500">Two-wheeler bays</p>
                </div>
              </div>
              <span className="p-1 rounded-lg text-slate-400 group-hover:text-purple-600 group-hover:translate-x-0.5 transition-all">
                <ArrowRight className="w-4 h-4" />
              </span>
            </div>

            {/* Main numbers requested in prompt */}
            <div className="space-y-2.5 relative z-10">
              <div className="flex items-baseline justify-between">
                <span className="text-xs font-semibold text-slate-500">Currently Parked</span>
                <span className="text-2xl font-extrabold text-slate-900 tracking-tight">
                  {stats.bikeStats.occupiedSpaces}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 py-2 border-y border-slate-100 text-xs">
                <div>
                  <span className="text-slate-500 block">Total Spaces</span>
                  <span className="font-bold text-slate-800 text-sm">{stats.bikeStats.totalSpaces}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Available</span>
                  <span className="font-bold text-emerald-600 text-sm">{stats.bikeStats.availableSpaces}</span>
                </div>
              </div>

              {/* Progress bar */}
              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="text-slate-500">Occupancy</span>
                  <span className="text-purple-600 font-bold">{stats.bikeStats.occupancyPercentage}%</span>
                </div>
                <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-purple-600 rounded-full transition-all duration-500"
                    style={{ width: `${stats.bikeStats.occupancyPercentage}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-purple-600 font-semibold group-hover:underline">
            <span>Open Bike Dashboard</span>
            <span>&rarr;</span>
          </div>
        </div>

        {/* CARD 4: OVERALL PARKING */}
        <div
          id="main-card-overall"
          onClick={() => setActiveTab('overall')}
          className="group bg-gradient-to-br from-slate-900 to-slate-800 text-white border border-slate-800 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all duration-200 cursor-pointer relative overflow-hidden flex flex-col justify-between"
        >
          <div className="absolute top-0 right-0 w-28 h-28 bg-emerald-500/10 rounded-bl-full pointer-events-none -z-0" />

          <div>
            <div className="flex items-center justify-between relative z-10 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-11 h-11 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-emerald-400 group-hover:bg-emerald-500 group-hover:text-slate-950 transition-colors">
                  <PieChart className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white leading-tight">Overall Parking</h3>
                  <p className="text-xs text-slate-400">All Vehicle Types</p>
                </div>
              </div>
              <span className="p-1 rounded-lg text-slate-400 group-hover:text-emerald-400 group-hover:translate-x-0.5 transition-all">
                <ArrowRight className="w-4 h-4" />
              </span>
            </div>

            {/* Requested exact fields */}
            <div className="space-y-2.5 relative z-10">
              <div className="flex items-baseline justify-between">
                <span className="text-xs font-semibold text-slate-300">Total Parked</span>
                <span className="text-2xl font-extrabold text-white tracking-tight">
                  {stats.totalOccupied} <span className="text-sm font-normal text-slate-400">/ {stats.totalSpaces}</span>
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 py-2 border-y border-slate-700/80 text-xs">
                <div>
                  <span className="text-slate-400 block">Available</span>
                  <span className="font-bold text-emerald-400 text-sm">{stats.totalAvailable}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Can Park</span>
                  <span className="font-bold text-emerald-400 text-sm">{stats.canPark} more</span>
                </div>
              </div>

              {/* Progress bar */}
              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="text-slate-300">Overall Occupancy</span>
                  <span className="text-emerald-400 font-bold">{stats.overallOccupancyPercentage}%</span>
                </div>
                <div className="w-full h-2.5 bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                    style={{ width: `${stats.overallOccupancyPercentage}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-700/80 flex items-center justify-between text-xs text-emerald-400 font-semibold group-hover:underline">
            <span>Detailed Overall Analytics</span>
            <span>&rarr;</span>
          </div>
        </div>
      </div>

      {/* MID SECTION: Quick Traffic Trend Chart & Live Floor Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Hourly Traffic Chart */}
        <div className="lg:col-span-2 bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">Today&apos;s Parking Occupancy Trend</h3>
              <p className="text-xs text-slate-500">Hourly vehicle inflow &amp; active accumulation</p>
            </div>
            <div className="flex items-center gap-3 text-xs font-semibold">
              <span className="flex items-center gap-1.5 text-blue-600">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-600" /> Cars
              </span>
              <span className="flex items-center gap-1.5 text-amber-600">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Buses
              </span>
              <span className="flex items-center gap-1.5 text-purple-600">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-600" /> Bikes
              </span>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={HOURLY_TRAFFIC_DATA} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="carGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="busGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="bikeGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#9333ea" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#9333ea" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="time" stroke="#94a3b8" fontSize={12} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    border: 'none',
                    borderRadius: '0.75rem',
                    color: '#fff',
                    fontSize: '12px',
                    padding: '8px 12px',
                  }}
                  itemStyle={{ color: '#fff' }}
                />
                <Area type="monotone" dataKey="cars" stroke="#2563eb" strokeWidth={2} fillOpacity={1} fill="url(#carGrad)" name="Cars" />
                <Area type="monotone" dataKey="buses" stroke="#f59e0b" strokeWidth={2} fillOpacity={1} fill="url(#busGrad)" name="Buses" />
                <Area type="monotone" dataKey="bikes" stroke="#9333ea" strokeWidth={2} fillOpacity={1} fill="url(#bikeGrad)" name="Bikes" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Floor Level Status */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-bold text-slate-900">Level Allocation</h3>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                4 Levels
              </span>
            </div>
            <p className="text-xs text-slate-500 mb-4">Capacity distribution across multi-story zones</p>

            <div className="space-y-3.5">
              {floorBreakdown.map((floor) => {
                const pct = floor.total > 0 ? Math.round((floor.occupied / floor.total) * 100) : 0;
                return (
                  <div key={floor.id} className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <div className="flex items-center justify-between text-xs font-semibold mb-1.5">
                      <span className="text-slate-900">{floor.name}</span>
                      <span className="text-slate-600">
                        {floor.occupied} / {floor.total}{' '}
                        <span className="text-emerald-600 font-bold">({floor.free} free)</span>
                      </span>
                    </div>
                    <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          pct > 80 ? 'bg-rose-500' : pct > 60 ? 'bg-amber-500' : 'bg-blue-600'
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <button
            onClick={() => setActiveTab('slots')}
            className="mt-4 w-full py-2.5 text-xs font-bold text-blue-600 hover:text-blue-700 bg-blue-50/70 hover:bg-blue-100/70 rounded-xl transition-colors flex items-center justify-center gap-1.5"
          >
            <span>Open Interactive Floor Maps</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* BOTTOM SECTION: Recently Parked Live Grid & Quick Slot Matrix Preview */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">Live Active Vehicles</h3>
            <p className="text-xs text-slate-500">Currently parked vehicles with assigned slot and driver contacts</p>
          </div>
          <button
            onClick={() => setActiveTab('slots')}
            className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
          >
            View all {stats.totalOccupied} parked vehicles &rarr;
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider">
                <th className="pb-3 px-2">Slot</th>
                <th className="pb-3 px-2">Vehicle Type</th>
                <th className="pb-3 px-2">License Plate</th>
                <th className="pb-3 px-2">Driver / Contact</th>
                <th className="pb-3 px-2">Check-in Time</th>
                <th className="pb-3 px-2 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recentParked.map((slot) => {
                const Icon = slot.vehicleType === 'car' ? Car : slot.vehicleType === 'bus' ? Bus : Bike;
                const typeColor =
                  slot.vehicleType === 'car'
                    ? 'text-blue-700 bg-blue-50'
                    : slot.vehicleType === 'bus'
                    ? 'text-amber-700 bg-amber-50'
                    : 'text-purple-700 bg-purple-50';

                return (
                  <tr key={slot.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-2">
                      <span className="font-bold text-slate-900 px-2 py-1 bg-slate-100 rounded-lg">
                        {slot.slotNumber}
                      </span>
                    </td>
                    <td className="py-3 px-2">
                      <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full font-semibold ${typeColor}`}>
                        <Icon className="w-3.5 h-3.5" />
                        <span className="capitalize">{slot.vehicleType}</span>
                      </span>
                    </td>
                    <td className="py-3 px-2 font-mono font-bold text-slate-800">
                      {slot.currentVehicle?.licensePlate}
                    </td>
                    <td className="py-3 px-2">
                      <div className="font-semibold text-slate-800">{slot.currentVehicle?.driverName}</div>
                      <div className="text-[11px] text-slate-400">{slot.currentVehicle?.driverPhone}</div>
                    </td>
                    <td className="py-3 px-2 text-slate-500">
                      {slot.currentVehicle ? new Date(slot.currentVehicle.entryTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}
                    </td>
                    <td className="py-3 px-2 text-right">
                      <button
                        onClick={() => setSelectedSlotForModal(slot)}
                        className="px-2.5 py-1 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                      >
                        Manage Slot
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
