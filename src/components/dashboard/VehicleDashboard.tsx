import React, { useState, useMemo } from 'react';
import {
  Car,
  Bus,
  Bike,
  Briefcase,
  Users,
  PlusCircle,
  Zap,
  Accessibility,
  CheckCircle2,
  Search,
  ArrowLeft,
  Wrench,
  CalendarCheck,
} from 'lucide-react';
import type { VehicleType, ParkingSlot } from '../../types';
import { useParking } from '../../context/ParkingContext';

interface VehicleDashboardProps {
  vehicleType: VehicleType;
}

export const VehicleDashboard: React.FC<VehicleDashboardProps> = ({ vehicleType }) => {
  const {
    slots,
    stats,
    setActiveTab,
    setSelectedSlotForModal,
    setIsParkModalOpen,
    setPreselectedTypeForParkModal,
    setPreselectedSlotIdForParkModal,
  } = useParking();

  const [selectedZone, setSelectedZone] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<
    'ALL' | 'available' | 'occupied' | 'reserved' | 'maintenance'
  >('ALL');
  const [localSearch, setLocalSearch] = useState<string>('');

  const currentStats = {
    car: stats.carStats,
    bike: stats.bikeStats,
    staff: stats.staffStats,
    visitor: stats.visitorStats,
    bus: stats.busStats,
  }[vehicleType];

  const typeMeta = {
    car: {
      name: 'Car',
      plural: 'Cars',
      icon: Car,
      bgColor: 'bg-blue-600',
      textColor: 'text-blue-600',
    },
    bike: {
      name: 'Bike',
      plural: 'Bikes',
      icon: Bike,
      bgColor: 'bg-purple-600',
      textColor: 'text-purple-600',
    },
    staff: {
      name: 'Staff Vehicle',
      plural: 'Staff Vehicles',
      icon: Briefcase,
      bgColor: 'bg-indigo-600',
      textColor: 'text-indigo-600',
    },
    visitor: {
      name: 'Visitor Vehicle',
      plural: 'Visitors',
      icon: Users,
      bgColor: 'bg-teal-600',
      textColor: 'text-teal-600',
    },
    bus: {
      name: 'Bus',
      plural: 'Buses',
      icon: Bus,
      bgColor: 'bg-amber-600',
      textColor: 'text-amber-600',
    },
  }[vehicleType];

  const Icon = typeMeta.icon;

  const typeSlots = useMemo(
    () => slots.filter((s) => s.vehicleType === vehicleType),
    [slots, vehicleType]
  );

  const uniqueZones = useMemo(() => {
    const map = new Map<string, string>();
    typeSlots.forEach((s) => map.set(s.zoneId, s.zoneName));
    return Array.from(map.entries());
  }, [typeSlots]);

  const filteredSlots = useMemo(() => {
    return typeSlots.filter((slot) => {
      if (selectedZone !== 'ALL' && slot.zoneId !== selectedZone) return false;
      if (statusFilter !== 'ALL' && slot.status !== statusFilter) return false;
      if (localSearch.trim()) {
        const q = localSearch.toLowerCase().trim();
        const slotMatch = slot.slotNumber.toLowerCase().includes(q);
        const plateMatch = slot.currentVehicle?.licensePlate.toLowerCase().includes(q);
        const driverMatch = slot.currentVehicle?.driverName?.toLowerCase().includes(q);
        if (!slotMatch && !plateMatch && !driverMatch) return false;
      }
      return true;
    });
  }, [typeSlots, selectedZone, statusFilter, localSearch]);

  const handleSlotAction = (slot: ParkingSlot) => {
    if (slot.status === 'available') {
      setPreselectedTypeForParkModal(vehicleType);
      setPreselectedSlotIdForParkModal(slot.id);
      setIsParkModalOpen(true);
    } else {
      setSelectedSlotForModal(slot);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white border border-slate-200 rounded-xl p-5">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveTab('dashboard')}
            className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
            title="Back to Smart Dashboard"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <Icon className={`w-5 h-5 ${typeMeta.textColor}`} />
              <h2 className="text-xl font-bold text-slate-900">
                {typeMeta.plural} Parking View
              </h2>
              <span className="text-xs text-slate-500 font-mono tabular-nums">
                · ${currentStats.hourlyRate.toFixed(2)}/hr
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Live bay status, reservation locks, and check-in allocation
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          {vehicleType === 'bus' && (
            <button
              onClick={() => setActiveTab('bus-management')}
              className="px-3.5 py-2 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 whitespace-nowrap"
            >
              Bus Schedules &amp; Dispatch
            </button>
          )}
          <button
            id={`park-new-${vehicleType}-btn`}
            onClick={() => {
              setPreselectedTypeForParkModal(vehicleType);
              setPreselectedSlotIdForParkModal(null);
              setIsParkModalOpen(true);
            }}
            className={`flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg ${typeMeta.bgColor} text-white font-semibold text-xs hover:opacity-95 transition-opacity whitespace-nowrap`}
          >
            <PlusCircle className="w-4 h-4" />
            <span>Check-In {typeMeta.name}</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 tabular-nums">
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <span className="text-xs font-medium text-slate-500 block">Total Bays</span>
          <div className="text-2xl font-bold text-slate-900 mt-1">{currentStats.totalSpaces}</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <span className="text-xs font-medium text-emerald-600 block">Available</span>
          <div className="text-2xl font-bold text-emerald-600 mt-1">
            {currentStats.availableSpaces}
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <span className="text-xs font-medium text-rose-600 block">Occupied</span>
          <div className="text-2xl font-bold text-rose-600 mt-1">
            {currentStats.occupiedSpaces}
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <span className="text-xs font-medium text-blue-600 block">Reserved</span>
          <div className="text-2xl font-bold text-blue-600 mt-1">
            {currentStats.reservedSpaces}
          </div>
        </div>

        <div className="col-span-2 lg:col-span-1 bg-white border border-slate-200 rounded-xl p-4">
          <span className="text-xs font-medium text-slate-500 block">Occupancy Rate</span>
          <div className={`text-2xl font-bold mt-1 ${typeMeta.textColor}`}>
            {currentStats.occupancyPercentage}%
          </div>
        </div>
      </div>

      {/* Slot Grid */}
      <div className="bg-white border border-slate-200 rounded-xl p-5">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <div className="relative w-full lg:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search slot, plate, driver..."
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-600"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={selectedZone}
              onChange={(e) => setSelectedZone(e.target.value)}
              className="px-3 py-1.5 text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg text-slate-700"
            >
              <option value="ALL">All Campus Zones</option>
              {uniqueZones.map(([zId, zName]) => (
                <option key={zId} value={zId}>
                  {zName}
                </option>
              ))}
            </select>

            <div className="flex items-center bg-slate-100 p-1 rounded-lg text-xs font-medium">
              {(['ALL', 'available', 'occupied', 'reserved', 'maintenance'] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-2.5 py-1 rounded-md capitalize whitespace-nowrap transition-colors ${
                    statusFilter === st
                      ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {st === 'ALL' ? 'All' : st === 'maintenance' ? 'Unavailable' : st}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-4 py-3 text-xs text-slate-600">
          <span className="inline-flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-xs bg-emerald-500 inline-block" /> Available
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-xs bg-rose-500 inline-block" /> Occupied
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-xs bg-blue-500 inline-block" /> Reserved
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-xs bg-amber-400 inline-block" /> Temporarily Unavailable
          </span>
        </div>

        {filteredSlots.length === 0 ? (
          <div className="p-10 text-center text-sm text-slate-500 bg-slate-50 rounded-lg border border-dashed border-slate-200">
            No {typeMeta.plural.toLowerCase()} slots match the selected filters.
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2.5 mt-2">
            {filteredSlots.map((slot) => {
              const st = slot.status;
              const styleClass =
                st === 'occupied'
                  ? 'bg-rose-50/70 hover:bg-rose-100/80 border-rose-200 text-rose-900'
                  : st === 'reserved'
                  ? 'bg-blue-50/70 hover:bg-blue-100/80 border-blue-200 text-blue-900'
                  : st === 'maintenance'
                  ? 'bg-amber-50/80 hover:bg-amber-100/80 border-amber-300 text-amber-900'
                  : 'bg-emerald-50/70 hover:bg-emerald-100/80 border-emerald-200 text-emerald-900';

              return (
                <button
                  key={slot.id}
                  id={`slot-${slot.id}`}
                  onClick={() => handleSlotAction(slot)}
                  className={`p-2.5 rounded-lg border text-left transition-colors flex flex-col justify-between min-h-24 ${styleClass}`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="text-xs font-mono font-bold">{slot.slotNumber}</span>
                    <div className="flex items-center gap-1">
                      {slot.isEvCharging && <Zap className="w-3 h-3 text-amber-600" />}
                      {slot.isHandicapped && <Accessibility className="w-3 h-3 text-blue-600" />}
                    </div>
                  </div>

                  <div className="my-1.5">
                    {st === 'occupied' && slot.currentVehicle ? (
                      <div>
                        <div className="text-[11px] font-mono font-bold truncate text-slate-900">
                          {slot.currentVehicle.licensePlate}
                        </div>
                        <div className="text-[10px] text-slate-600 truncate">Occupied</div>
                      </div>
                    ) : st === 'reserved' ? (
                      <div className="text-[11px] font-semibold text-blue-700 flex items-center gap-1">
                        <CalendarCheck className="w-3 h-3 shrink-0" />
                        <span>Reserved</span>
                      </div>
                    ) : st === 'maintenance' ? (
                      <div className="text-[11px] font-semibold text-amber-800 flex items-center gap-1">
                        <Wrench className="w-3 h-3 shrink-0" />
                        <span>Unavailable</span>
                      </div>
                    ) : (
                      <div className="text-[11px] font-semibold text-emerald-700 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 shrink-0" />
                        <span>Available</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-slate-200/50">
                    <span>{slot.zoneId.replace('ZONE_', 'Zone ')}</span>
                    <span className="font-semibold">{st === 'available' ? '+ Park' : 'Inspect'}</span>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
