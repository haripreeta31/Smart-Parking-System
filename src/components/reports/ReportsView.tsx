import React, { useState, useMemo } from 'react';
import {
  Download,
  Search,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import { useParking } from '../../context/ParkingContext';
import type { VehicleEntryLog } from '../../types';

export const ReportsView: React.FC = () => {
  const { logs, slots } = useParking();

  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchFilter, setSearchFilter] = useState<string>('');

  const allLogs: VehicleEntryLog[] = useMemo(() => {
    const activeFromSlots: VehicleEntryLog[] = slots
      .filter((s) => s.status === 'occupied' && s.currentVehicle)
      .map((s) => ({
        id: `LOG-ACT-${s.id}`,
        ticketNumber: s.currentVehicle!.ticketNumber,
        licensePlate: s.currentVehicle!.licensePlate,
        vehicleType: s.vehicleType,
        slotId: s.id,
        zoneId: s.zoneId,
        floor: s.floor,
        driverName: s.currentVehicle!.driverName,
        entryTime: s.currentVehicle!.entryTime,
        paymentStatus: 'pending',
        status: 'active',
      }));

    const existingTickets = new Set(activeFromSlots.map((a) => a.ticketNumber));
    const history = logs.filter((l) => !existingTickets.has(l.ticketNumber));

    return [...activeFromSlots, ...history];
  }, [slots, logs]);

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

  const metrics = useMemo(() => {
    const completed = allLogs.filter((l) => l.status === 'completed');
    const totalCollected = completed.reduce((acc, curr) => acc + (curr.feeAmount || 0), 0);
    const avgDuration =
      completed.length > 0
        ? Math.round(
            completed.reduce((acc, curr) => acc + (curr.durationMinutes || 0), 0) / completed.length
          )
        : 120;

    const now = Date.now();
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
    const headers = [
      'Ticket Number',
      'License Plate',
      'Category',
      'Slot ID',
      'Zone',
      'Entry Time',
      'Exit Time',
      'Duration (mins)',
      'Fee ($)',
      'Status',
    ];
    const rows = filteredLogs.map((l) => [
      l.ticketNumber,
      l.licensePlate,
      l.vehicleType.toUpperCase(),
      l.slotId,
      l.zoneId || l.floor,
      l.entryTime,
      l.exitTime || 'Active',
      l.durationMinutes || '-',
      l.feeAmount ? l.feeAmount.toFixed(2) : 'Accruing',
      l.status.toUpperCase(),
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `campus_parking_logs_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <p className="text-xs font-medium text-slate-500">Audit &amp; Session Ledger</p>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight mt-0.5">
            Session Activity &amp; Revenue Logs
          </h2>
          <p className="text-sm text-slate-600 mt-1">
            Complete check-in/check-out audit trail across all campus zones with CSV export.
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs transition-colors whitespace-nowrap"
        >
          <Download className="w-4 h-4" />
          <span>Download CSV</span>
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 tabular-nums">
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <span className="text-xs font-medium text-slate-500 block">Total Sessions</span>
          <div className="text-2xl font-bold text-slate-900 mt-1">{metrics.totalTurnoverCount}</div>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <span className="text-xs font-medium text-emerald-600 block">Settled Revenue</span>
          <div className="text-2xl font-bold text-emerald-600 mt-1">
            ${metrics.totalCollected.toFixed(2)}
          </div>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <span className="text-xs font-medium text-blue-600 block">Active Accrued</span>
          <div className="text-2xl font-bold text-blue-600 mt-1">
            ${metrics.activeProjected.toFixed(2)}
          </div>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <span className="text-xs font-medium text-slate-500 block">Average Stay</span>
          <div className="text-2xl font-bold text-slate-900 mt-1">
            {metrics.avgDurationMinutes} mins
          </div>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search ticket, plate, or slot..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-600"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-3 py-2 text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg text-slate-700"
            >
              <option value="ALL">All Categories</option>
              <option value="car">Cars</option>
              <option value="bike">Bikes</option>
              <option value="staff">Staff Vehicles</option>
              <option value="visitor">Visitors</option>
              <option value="bus">Buses</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg text-slate-700"
            >
              <option value="ALL">All Sessions</option>
              <option value="active">Active (Parked)</option>
              <option value="completed">Completed (Departed)</option>
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-5">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs tabular-nums">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 font-semibold">
                <th className="pb-2.5 pr-4">Ticket #</th>
                <th className="pb-2.5 px-4">Category</th>
                <th className="pb-2.5 px-4">License Plate</th>
                <th className="pb-2.5 px-4">Slot</th>
                <th className="pb-2.5 px-4">Entry Time</th>
                <th className="pb-2.5 px-4">Exit Time</th>
                <th className="pb-2.5 px-4">Duration</th>
                <th className="pb-2.5 px-4">Fee</th>
                <th className="pb-2.5 pl-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLogs.map((log) => {
                const isCompleted = log.status === 'completed';
                return (
                  <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-2.5 pr-4 font-mono font-semibold text-slate-800">
                      {log.ticketNumber}
                    </td>
                    <td className="py-2.5 px-4 capitalize text-slate-700">{log.vehicleType}</td>
                    <td className="py-2.5 px-4 font-mono font-bold text-slate-900">
                      {log.licensePlate}
                    </td>
                    <td className="py-2.5 px-4 font-mono text-slate-800">{log.slotId}</td>
                    <td className="py-2.5 px-4 text-slate-600">
                      {new Date(log.entryTime).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="py-2.5 px-4 text-slate-600">
                      {log.exitTime
                        ? new Date(log.exitTime).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        : '—'}
                    </td>
                    <td className="py-2.5 px-4 text-slate-600">
                      {log.durationMinutes ? `${log.durationMinutes} mins` : 'Active'}
                    </td>
                    <td className="py-2.5 px-4 font-mono font-semibold text-slate-900">
                      {log.feeAmount ? `$${log.feeAmount.toFixed(2)}` : 'Accruing'}
                    </td>
                    <td className="py-2.5 pl-4 text-right">
                      <span
                        className={`inline-flex items-center gap-1 font-semibold ${
                          isCompleted ? 'text-emerald-700' : 'text-blue-700'
                        }`}
                      >
                        {isCompleted ? (
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        ) : (
                          <Clock className="w-3.5 h-3.5" />
                        )}
                        <span>{isCompleted ? 'Completed' : 'Parked'}</span>
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
