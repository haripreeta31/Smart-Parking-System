import React, { useState, useMemo } from 'react';
import {
  Bus,
  PlusCircle,
  Clock,
  CheckCircle2,
  XCircle,
  Lock,
  Wrench,
  CalendarCheck,
} from 'lucide-react';
import { useParking } from '../../context/ParkingContext';
import type { BusSchedule } from '../../types';

const toLocalDatetime = (d: Date) => {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`;
};

export const BusManagementView: React.FC = () => {
  const {
    currentUser,
    switchUser,
    slots,
    busSchedules,
    stats,
    createBusSchedule,
    updateBusSchedule,
    setSelectedSlotForModal,
  } = useParking();

  const isAdmin = currentUser.role === 'admin';

  const [statusFilter, setStatusFilter] = useState<'ALL' | BusSchedule['status']>('ALL');
  const [showAddForm, setShowAddForm] = useState<boolean>(false);

  // New bus schedule form state
  const [routeNumber, setRouteNumber] = useState('R-305');
  const [routeName, setRouteName] = useState('East Science Park Shuttle');
  const [busPlate, setBusPlate] = useState('BUS-7410-ES');
  const [busModel, setBusModel] = useState('BYD K9M Electric Shuttle');
  const [operatorName, setOperatorName] = useState('Campus Transit Authority');
  const [driverName, setDriverName] = useState('samuel Horton');
  const [bayId, setBayId] = useState('BUS-07');
  const [arrivalLocal, setArrivalLocal] = useState(() =>
    toLocalDatetime(new Date(Date.now() + 60 * 60000))
  );
  const [departureLocal, setDepartureLocal] = useState(() =>
    toLocalDatetime(new Date(Date.now() + 180 * 60000))
  );
  const [formFeedback, setFormFeedback] = useState<{ ok: boolean; msg: string } | null>(null);

  // Dedicated bus bays (separate from car/bike parking!)
  const busBays = useMemo(
    () => slots.filter((s) => s.vehicleType === 'bus'),
    [slots]
  );

  const filteredSchedules = useMemo(() => {
    return busSchedules.filter((b) => statusFilter === 'ALL' || b.status === statusFilter);
  }, [busSchedules, statusFilter]);

  const handleCreateSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormFeedback(null);
    const res = await createBusSchedule({
      routeNumber,
      routeName,
      busPlate,
      busModel,
      operatorName,
      driverName,
      bayId,
      arrivalTime: new Date(arrivalLocal).toISOString(),
      departureTime: new Date(departureLocal).toISOString(),
      passengerCapacity: 48,
    });

    if (res.success) {
      setFormFeedback({ ok: true, msg: res.message });
      setShowAddForm(false);
    } else {
      setFormFeedback({ ok: false, msg: res.message });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div>
          <p className="text-xs font-medium text-slate-500">
            Zone E Dedicated Heavy-Vehicle Terminal · Segregated from Car &amp; Bike Lots
          </p>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight mt-0.5">
            Bus Parking &amp; Transit Bay Management
          </h2>
          <p className="text-sm text-slate-600 mt-1">
            Monitor dedicated Bus Bays BUS-01 through BUS-20, campus shuttle arrival/departure schedules, and conflict-free bay assignments.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          {isAdmin ? (
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold transition-colors whitespace-nowrap"
            >
              <PlusCircle className="w-4 h-4" />
              <span>{showAddForm ? 'Close Schedule Form' : 'Schedule Bus Arrival'}</span>
            </button>
          ) : (
            <div className="flex items-center gap-2 text-xs text-slate-600 bg-slate-100 px-3 py-2 rounded-lg">
              <Lock className="w-3.5 h-3.5 text-slate-500" />
              <span>Read-Only Mode ({currentUser.role})</span>
              <button
                onClick={() => switchUser('usr-admin-1')}
                className="text-blue-600 hover:underline font-semibold ml-1"
              >
                Switch to Admin
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Bus KPI Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 tabular-nums">
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <span className="text-xs font-medium text-slate-500 block">Total Bus Bays (Zone E)</span>
          <div className="text-2xl font-bold text-slate-900 mt-1">{stats.busStats.totalSpaces}</div>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <span className="text-xs font-medium text-emerald-600 block">Available Bus Bays</span>
          <div className="text-2xl font-bold text-emerald-600 mt-1">
            {stats.busStats.availableSpaces}
          </div>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <span className="text-xs font-medium text-rose-600 block">Arrived / Occupied</span>
          <div className="text-2xl font-bold text-rose-600 mt-1">
            {stats.busStats.occupiedSpaces}
          </div>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <span className="text-xs font-medium text-blue-600 block">Scheduled / Reserved</span>
          <div className="text-2xl font-bold text-blue-600 mt-1">
            {stats.busStats.reservedSpaces}
          </div>
        </div>
      </div>

      {formFeedback && (
        <div
          className={`p-3.5 rounded-xl border text-xs font-semibold ${
            formFeedback.ok
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          {formFeedback.msg}
        </div>
      )}

      {/* Admin Add Bus Schedule Form */}
      {isAdmin && showAddForm && (
        <form
          onSubmit={handleCreateSchedule}
          className="bg-white border border-slate-200 rounded-xl p-5 space-y-4"
        >
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-base font-bold text-slate-900">
              Assign Bus Arrival &amp; Departure Schedule
            </h3>
            <p className="text-xs text-slate-500">
              Overlapping bus schedules on the same bay are automatically blocked by server validation.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Route Number *</label>
              <input
                type="text"
                value={routeNumber}
                onChange={(e) => setRouteNumber(e.target.value)}
                className="w-full px-3 py-2 text-xs font-mono font-bold bg-slate-50 border border-slate-200 rounded-lg uppercase"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Route Name *</label>
              <input
                type="text"
                value={routeName}
                onChange={(e) => setRouteName(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Bus Plate *</label>
              <input
                type="text"
                value={busPlate}
                onChange={(e) => setBusPlate(e.target.value.toUpperCase())}
                className="w-full px-3 py-2 text-xs font-mono font-bold bg-slate-50 border border-slate-200 rounded-lg uppercase"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Assigned Bus Bay *</label>
              <select
                value={bayId}
                onChange={(e) => setBayId(e.target.value)}
                className="w-full px-3 py-2 text-xs font-mono font-bold bg-slate-50 border border-slate-200 rounded-lg"
              >
                {busBays
                  .filter((b) => b.status !== 'maintenance')
                  .map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.slotNumber} ({b.status})
                    </option>
                  ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Scheduled Arrival *
              </label>
              <input
                type="datetime-local"
                value={arrivalLocal}
                onChange={(e) => setArrivalLocal(e.target.value)}
                className="w-full px-3 py-2 text-xs font-mono bg-slate-50 border border-slate-200 rounded-lg"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Scheduled Departure *
              </label>
              <input
                type="datetime-local"
                value={departureLocal}
                onChange={(e) => setDepartureLocal(e.target.value)}
                className="w-full px-3 py-2 text-xs font-mono bg-slate-50 border border-slate-200 rounded-lg"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Operator</label>
              <input
                type="text"
                value={operatorName}
                onChange={(e) => setOperatorName(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Driver Name</label>
              <input
                type="text"
                value={driverName}
                onChange={(e) => setDriverName(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold"
            >
              Confirm Bus Bay Schedule
            </button>
          </div>
        </form>
      )}

      {/* Visual Bus Bay Terminal Grid (BUS-01 .. BUS-20) */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Bus className="w-4 h-4 text-amber-600" />
              <span>Zone E Bus Terminal Platforms (BUS-01 to BUS-20)</span>
            </h3>
            <p className="text-xs text-slate-500">
              Click any bus bay to inspect stationed coach details or maintenance status
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-10 gap-2.5">
          {busBays.map((bay) => {
            const st = bay.status;
            const cls =
              st === 'occupied'
                ? 'bg-rose-50 border-rose-300 text-rose-900'
                : st === 'reserved'
                ? 'bg-blue-50 border-blue-300 text-blue-900'
                : st === 'maintenance'
                ? 'bg-amber-50 border-amber-300 text-amber-900'
                : 'bg-emerald-50 border-emerald-300 text-emerald-900';

            return (
              <button
                key={bay.id}
                onClick={() => setSelectedSlotForModal(bay)}
                className={`p-3 rounded-lg border text-left transition-colors flex flex-col justify-between min-h-24 ${cls}`}
              >
                <div className="text-xs font-mono font-bold">{bay.slotNumber}</div>
                <div className="my-1">
                  {st === 'occupied' && bay.currentVehicle ? (
                    <div className="text-[10px] font-mono font-bold truncate">
                      {bay.currentVehicle.licensePlate}
                    </div>
                  ) : st === 'reserved' ? (
                    <div className="text-[10px] font-semibold flex items-center gap-1">
                      <CalendarCheck className="w-3 h-3 shrink-0" /> Scheduled
                    </div>
                  ) : st === 'maintenance' ? (
                    <div className="text-[10px] font-semibold flex items-center gap-1">
                      <Wrench className="w-3 h-3 shrink-0" /> Service
                    </div>
                  ) : (
                    <div className="text-[10px] font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 shrink-0" /> Available
                    </div>
                  )}
                </div>
                <div className="text-[9px] opacity-75 capitalize">
                  {st === 'occupied' ? 'Arrived' : st}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Bus Arrival & Departure Schedule Board */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Bus Arrival &amp; Departure Schedule Board
            </h3>
            <p className="text-xs text-slate-500">
              Real-time status tracking: Scheduled, Arrived, Departed, and Cancelled
            </p>
          </div>

          <div className="flex items-center bg-slate-100 p-1 rounded-lg text-xs font-medium">
            {(['ALL', 'scheduled', 'arrived', 'departed', 'cancelled'] as const).map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-2.5 py-1 rounded-md capitalize whitespace-nowrap transition-colors ${
                  statusFilter === st
                    ? 'bg-white text-slate-900 font-semibold shadow-2xs'
                    : 'text-slate-600'
                }`}
              >
                {st === 'ALL' ? 'All' : st}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs tabular-nums">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 font-semibold">
                <th className="pb-2.5 pr-3">Route</th>
                <th className="pb-2.5 px-3">Bus Plate / Coach</th>
                <th className="pb-2.5 px-3">Bay</th>
                <th className="pb-2.5 px-3">Arrival</th>
                <th className="pb-2.5 px-3">Departure</th>
                <th className="pb-2.5 px-3">Status</th>
                {isAdmin && <th className="pb-2.5 pl-3 text-right">Admin Dispatch Controls</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredSchedules.map((b) => (
                <tr key={b.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3 pr-3">
                    <div className="font-mono font-bold text-slate-900">{b.routeNumber}</div>
                    <div className="text-[11px] text-slate-500">{b.routeName}</div>
                  </td>
                  <td className="py-3 px-3">
                    <div className="font-mono font-semibold text-slate-900">{b.busPlate}</div>
                    <div className="text-[11px] text-slate-500">{b.operatorName}</div>
                  </td>
                  <td className="py-3 px-3 font-mono font-bold text-slate-900">
                    {isAdmin && (b.status === 'scheduled' || b.status === 'arrived') ? (
                      <select
                        aria-label={`Reassign bay for ${b.routeNumber}`}
                        value={b.bayId}
                        onChange={(e) => updateBusSchedule(b.id, { bayId: e.target.value })}
                        className="px-2 py-1 text-xs font-mono bg-slate-50 border border-slate-200 rounded"
                      >
                        {busBays
                          .filter((bay) => bay.status !== 'maintenance')
                          .map((bay) => (
                            <option key={bay.id} value={bay.id}>
                              {bay.slotNumber}
                            </option>
                          ))}
                      </select>
                    ) : (
                      b.bayNumber
                    )}
                  </td>
                  <td className="py-3 px-3 text-slate-700">
                    {new Date(b.arrivalTime).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </td>
                  <td className="py-3 px-3 text-slate-700">
                    {new Date(b.departureTime).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </td>
                  <td className="py-3 px-3">
                    <span
                      className={`inline-flex items-center gap-1 font-semibold capitalize ${
                        b.status === 'arrived'
                          ? 'text-emerald-700'
                          : b.status === 'scheduled'
                          ? 'text-blue-700'
                          : b.status === 'cancelled'
                          ? 'text-rose-600'
                          : 'text-slate-500'
                      }`}
                    >
                      {b.status === 'arrived' ? (
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      ) : b.status === 'cancelled' ? (
                        <XCircle className="w-3.5 h-3.5" />
                      ) : (
                        <Clock className="w-3.5 h-3.5" />
                      )}
                      <span>{b.status}</span>
                    </span>
                  </td>
                  {isAdmin && (
                    <td className="py-3 pl-3 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        {b.status === 'scheduled' && (
                          <>
                            <button
                              onClick={() => updateBusSchedule(b.id, { status: 'arrived' })}
                              className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white font-semibold whitespace-nowrap"
                            >
                              Mark Arrived
                            </button>
                            <button
                              onClick={() => updateBusSchedule(b.id, { status: 'cancelled' })}
                              className="px-2.5 py-1 rounded border border-rose-200 text-rose-700 hover:bg-rose-50 font-semibold whitespace-nowrap"
                            >
                              Cancel
                            </button>
                          </>
                        )}
                        {b.status === 'arrived' && (
                          <button
                            onClick={() => updateBusSchedule(b.id, { status: 'departed' })}
                            className="px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 text-white font-semibold whitespace-nowrap"
                          >
                            Mark Departed
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
