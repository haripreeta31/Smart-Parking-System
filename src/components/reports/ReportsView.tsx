import React, { useState, useMemo } from 'react';
import {
  FileBarChart,
  Download,
  Search,
  Filter,
  DollarSign,
  Clock,
  Car,
  Bus,
  Bike,
  CheckCircle2,
  Calendar,
  Layers,
} from 'lucide-react';
import { useParking } from '../../context/ParkingContext';
import { VehicleEntryLog, VehicleType } from '../../types';

export const ReportsView: React.FC = () => {
  const { logs, slots, stats } = useParking();

  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchFilter, setSearchFilter] = useState<string>('');

  // Combined logs (from slots current parked + historical logs)
  const allLogs: VehicleEntryLog[] = useMemo(() => {
    // Current parked vehicles formatted as active logs
    const activeFromSlots: VehicleEntryLog[] = slots
      .filter((s) => s.status === 'occupied' && s.currentVehicle)
      .map((s) => ({
        id: `LOG-ACT-${s.id}`,
        ticketNumber: s.currentVehicle!.ticketNumber,
        licensePlate: s.currentVehicle!.licensePlate,
        vehicleType: s.vehicleType,
        slotId: s.id,
        floor: s.floor,
        entryTime: s.currentVehicle!.entryTime,
        paymentStatus: 'pending',
        status: 'active',
      }));

    // Merge with historical logs (deduplicating by ticketNumber)
    const existingTickets = new Set(activeFromSlots.map((a) => a.ticketNumber));
    const history = logs.filter((l) => !existingTickets.has(l.ticketNumber));

    return [...activeFromSlots, ...history];
  }, [slots, logs]);

  // Filtered
  const filteredLogs = useMemo(() => {
    return allLogs.filter((log) => {
      if (typeFilter !== 'ALL' && log.vehicleType !== typeFilter) return false;
      if (statusFilter !== 'ALL' && log.status !== statusFilter) return false;
      if (searchFilter.trim()) {
        const q = searchFilter.toLowerCase().trim();
        const plateMatch = log.licensePlate.toLowerCase().includes(q);
        const ticketMatch = log.ticketNumber.toLowerCase().includes(q);
        const slotMatch = log.slotId.toLowerCase().includes(q);
        if (!plateMatch && !ticketMatch && !slotMatch) return false;
      }
      return true;
    });
  }, [allLogs, typeFilter, statusFilter, searchFilter]);

  // Financial & Operational KPI Calculations
  const metrics = useMemo(() => {
    const completed = allLogs.filter((l) => l.status === 'completed');
    const totalCollected = completed.reduce((acc, curr) => acc + (curr.feeAmount || 0), 0);
    const avgDuration =
      completed.length > 0
        ? Math.round(
            completed.reduce((acc, curr) => acc + (curr.durationMinutes || 0), 0) / completed.length
          )
        : 120;

    // Projected active revenue
    const now = new Date().getTime();
    const activeProjected = slots
      .filter((s) => s.status === 'occupied' && s.currentVehicle)
      .reduce((acc, s) => {
        const durHours = Math.max(
          (now - new Date(s.currentVehicle!.entryTime).getTime()) / (1000 * 60 * 60),
          0.5
        );
        return acc + durHours * s.currentVehicle!.ratePerHour;
      }, 0);

    return {
      totalCollected: Math.round(totalCollected * 100) / 100,
      activeProjected: Math.round(activeProjected * 100) / 100,
      totalTurnoverCount: allLogs.length,
      avgDurationMinutes: avgDuration,
    };
  }, [allLogs, slots]);

  const handleExportCSV = () => {
    const headers = ['Ticket Number', 'License Plate', 'Vehicle Type', 'Slot ID', 'Floor', 'Entry Time', 'Exit Time', 'Duration (mins)', 'Fee ($)', 'Status'];
    const rows = filteredLogs.map((l) => [
      l.ticketNumber,
      l.licensePlate,
      l.vehicleType.toUpperCase(),
      l.slotId,
      l.floor,
      l.entryTime,
      l.exitTime || 'In Facility',
      l.durationMinutes || '-',
      l.feeAmount ? l.feeAmount.toFixed(2) : 'Pending',
      l.status.toUpperCase(),
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `parking_report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Header */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-5 sm:p-6 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200/60">
              Operations &amp; Audit
            </span>
            <span className="text-xs text-slate-400">• Financial &amp; Vehicle Logs</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Facility Activity Reports &amp; Logs
          </h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Audit logs for vehicle check-ins, departures, parking duration, and revenue records.
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm transition-all shadow-xs"
        >
          <Download className="w-4 h-4" />
          Export Report (.CSV)
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 block">Total Vehicles Handled</span>
          <div className="text-2xl font-extrabold text-slate-900 mt-1">{metrics.totalTurnoverCount}</div>
          <span className="text-[11px] text-slate-400 mt-1 block">Active + Completed sessions</span>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs">
          <span className="text-xs font-semibold text-emerald-600 block">Collected Revenue</span>
          <div className="text-2xl font-extrabold text-emerald-600 mt-1">${metrics.totalCollected.toFixed(2)}</div>
          <span className="text-[11px] text-slate-400 mt-1 block">Paid exits today</span>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs">
          <span className="text-xs font-semibold text-blue-600 block">Active Accrued Fees</span>
          <div className="text-2xl font-extrabold text-blue-600 mt-1">${metrics.activeProjected.toFixed(2)}</div>
          <span className="text-[11px] text-slate-400 mt-1 block">Currently parked vehicles</span>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs">
          <span className="text-xs font-semibold text-purple-600 block">Avg Duration</span>
          <div className="text-2xl font-extrabold text-purple-600 mt-1">{metrics.avgDurationMinutes} mins</div>
          <span className="text-[11px] text-slate-400 mt-1 block">~{(metrics.avgDurationMinutes / 60).toFixed(1)} hrs per vehicle</span>
        </div>
      </div>

      {/* Filter toolbar */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by ticket, plate, slot..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-3 py-2 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:outline-hidden"
            >
              <option value="ALL">All Vehicle Types</option>
              <option value="car">Cars</option>
              <option value="bus">Buses</option>
              <option value="bike">Bikes</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:outline-hidden"
            >
              <option value="ALL">All Sessions</option>
              <option value="active">Active (Parked)</option>
              <option value="completed">Completed (Departed)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider">
                <th className="pb-3 px-2">Ticket #</th>
                <th className="pb-3 px-2">Type</th>
                <th className="pb-3 px-2">License Plate</th>
                <th className="pb-3 px-2">Slot / Level</th>
                <th className="pb-3 px-2">Entry Time</th>
                <th className="pb-3 px-2">Exit Time</th>
                <th className="pb-3 px-2">Duration</th>
                <th className="pb-3 px-2">Fee</th>
                <th className="pb-3 px-2 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLogs.map((log) => {
                const Icon = log.vehicleType === 'car' ? Car : log.vehicleType === 'bus' ? Bus : Bike;
                const isCompleted = log.status === 'completed';

                return (
                  <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-2 font-mono font-bold text-slate-800">
                      {log.ticketNumber}
                    </td>
                    <td className="py-3 px-2">
                      <span className="inline-flex items-center gap-1 font-semibold text-slate-700 uppercase">
                        <Icon className="w-3.5 h-3.5" />
                        {log.vehicleType}
                      </span>
                    </td>
                    <td className="py-3 px-2 font-mono font-bold text-slate-900">
                      {log.licensePlate}
                    </td>
                    <td className="py-3 px-2">
                      <span className="font-semibold text-slate-800">{log.slotId}</span>{' '}
                      <span className="text-slate-400">({log.floor})</span>
                    </td>
                    <td className="py-3 px-2 text-slate-600">
                      {new Date(log.entryTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="py-3 px-2 text-slate-600">
                      {log.exitTime
                        ? new Date(log.exitTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                        : '—'}
                    </td>
                    <td className="py-3 px-2 text-slate-600">
                      {log.durationMinutes ? `${log.durationMinutes} mins` : 'Active'}
                    </td>
                    <td className="py-3 px-2 font-bold text-slate-900">
                      {log.feeAmount ? `$${log.feeAmount.toFixed(2)}` : 'Accruing'}
                    </td>
                    <td className="py-3 px-2 text-right">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                          isCompleted
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-blue-50 text-blue-700 border border-blue-200'
                        }`}
                      >
                        {isCompleted ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                        {isCompleted ? 'Completed' : 'Parked'}
                      </span>
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
