import React, { useState, useMemo } from 'react';
import {
  Car,
  Bus,
  Bike,
  Briefcase,
  Users,
  Search,
  Zap,
  Accessibility,
  CheckCircle2,
  PlusCircle,
  Wrench,
  CalendarCheck,
} from 'lucide-react';
import { useParking } from '../../context/ParkingContext';
import type { ParkingSlot } from '../../types';
import { CAMPUS_ZONES } from '../../data/initialData';

export const ParkingSlotsView: React.FC = () => {
  const {
    slots,
    stats,
    setSelectedSlotForModal,
    setIsParkModalOpen,
    setPreselectedTypeForParkModal,
    setPreselectedSlotIdForParkModal,
  } = useParking();

  const [selectedZone, setSelectedZone] = useState<string>('ALL');
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const filteredSlots = useMemo(() => {
    return slots.filter((slot) => {
      if (selectedZone !== 'ALL' && slot.zoneId !== selectedZone) return false;
      if (selectedType !== 'ALL' && slot.vehicleType !== selectedType) return false;
      if (selectedStatus !== 'ALL' && slot.status !== selectedStatus) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const slotMatch = slot.slotNumber.toLowerCase().includes(q) || slot.id.toLowerCase().includes(q);
        const plateMatch = slot.currentVehicle?.licensePlate.toLowerCase().includes(q);
        const driverMatch = slot.currentVehicle?.driverName?.toLowerCase().includes(q);
        if (!slotMatch && !plateMatch && !driverMatch) return false;
      }

      return true;
    });
  }, [slots, selectedZone, selectedType, selectedStatus, searchQuery]);

  const handleSlotClick = (slot: ParkingSlot) => {
    if (slot.status === 'available') {
      setPreselectedTypeForParkModal(slot.vehicleType);
      setPreselectedSlotIdForParkModal(slot.id);
      setIsParkModalOpen(true);
    } else {
      setSelectedSlotForModal(slot);
    }
  };

  const getCategoryIcon = (type: ParkingSlot['vehicleType']) => {
    switch (type) {
      case 'car':
        return Car;
      case 'bike':
        return Bike;
      case 'staff':
        return Briefcase;
      case 'visitor':
        return Users;
      case 'bus':
        return Bus;
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <p className="text-xs font-medium text-slate-500">Campus Bay Directory</p>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight mt-0.5">
            All Campus Parking Slots ({slots.length} Bays)
          </h2>
          <p className="text-sm text-slate-600 mt-1">
            Filter across Zones A–E, 5 vehicle classifications, and live slot statuses.
          </p>
        </div>

        <button
          onClick={() => {
            setPreselectedTypeForParkModal('car');
            setPreselectedSlotIdForParkModal(null);
            setIsParkModalOpen(true);
          }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition-colors whitespace-nowrap"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Walk-In Check-In</span>
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search slot (e.g. A-08, ST-05), plate, or driver..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-600"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={selectedZone}
              onChange={(e) => setSelectedZone(e.target.value)}
              className="px-3 py-2 text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg text-slate-700"
            >
              <option value="ALL">All Campus Zones</option>
              {CAMPUS_ZONES.map((z) => (
                <option key={z.id} value={z.id}>
                  {z.name}
                </option>
              ))}
            </select>

            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="px-3 py-2 text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg text-slate-700"
            >
              <option value="ALL">All Categories</option>
              <option value="car">Cars ({stats.carStats.totalSpaces})</option>
              <option value="bike">Bikes ({stats.bikeStats.totalSpaces})</option>
              <option value="staff">Staff Vehicles ({stats.staffStats.totalSpaces})</option>
              <option value="visitor">Visitors ({stats.visitorStats.totalSpaces})</option>
              <option value="bus">Buses ({stats.busStats.totalSpaces})</option>
            </select>

            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3 py-2 text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg text-slate-700"
            >
              <option value="ALL">All Statuses</option>
              <option value="available">Available ({stats.totalAvailable})</option>
              <option value="occupied">Occupied ({stats.totalOccupied})</option>
              <option value="reserved">Reserved ({stats.totalReserved})</option>
              <option value="maintenance">Temporarily Unavailable ({stats.totalMaintenance})</option>
            </select>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100 text-xs text-slate-600 tabular-nums">
          <div className="flex items-center gap-4 flex-wrap">
            <span className="inline-flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-xs bg-emerald-500 inline-block" /> Available ({stats.totalAvailable})
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-xs bg-rose-500 inline-block" /> Occupied ({stats.totalOccupied})
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-xs bg-blue-500 inline-block" /> Reserved ({stats.totalReserved})
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-xs bg-amber-400 inline-block" /> Temporarily Unavailable ({stats.totalMaintenance})
            </span>
          </div>
          <div>
            Showing <strong>{filteredSlots.length}</strong> of {slots.length} slots
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="bg-white border border-slate-200 rounded-xl p-5">
        {filteredSlots.length === 0 ? (
          <div className="p-12 text-center text-sm text-slate-500 bg-slate-50 rounded-lg border border-dashed border-slate-200">
            No parking slots match the selected filters.
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-2.5">
            {filteredSlots.map((slot) => {
              const st = slot.status;
              const Icon = getCategoryIcon(slot.vehicleType);
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
                  id={`slot-matrix-${slot.id}`}
                  onClick={() => handleSlotClick(slot)}
                  className={`p-2.5 rounded-lg border text-left transition-colors flex flex-col justify-between min-h-24 ${styleClass}`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="text-xs font-mono font-bold">{slot.slotNumber}</span>
                    <div className="flex items-center gap-1">
                      <Icon className="w-3 h-3 opacity-70" />
                      {slot.isEvCharging && <Zap className="w-3 h-3 text-amber-600" />}
                      {slot.isHandicapped && <Accessibility className="w-3 h-3 text-blue-600" />}
                    </div>
                  </div>

                  <div className="my-1">
                    {st === 'maintenance' ? (
                      <div className="text-[10px] font-semibold text-amber-800 flex items-center gap-1">
                        <Wrench className="w-3 h-3 shrink-0" /> Unavailable
                      </div>
                    ) : st === 'reserved' ? (
                      <div className="text-[10px] font-semibold text-blue-700 flex items-center gap-1">
                        <CalendarCheck className="w-3 h-3 shrink-0" /> Reserved
                      </div>
                    ) : st === 'occupied' && slot.currentVehicle ? (
                      <div>
                        <div className="text-[11px] font-mono font-bold truncate text-slate-900">
                          {slot.currentVehicle.licensePlate}
                        </div>
                        <div className="text-[9px] text-slate-600 truncate">
                          {slot.currentVehicle.driverName}
                        </div>
                      </div>
                    ) : (
                      <div className="text-[11px] font-semibold text-emerald-700 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 shrink-0" /> Available
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-[9px] text-slate-500 pt-1 border-t border-slate-200/50">
                    <span>{slot.zoneId.replace('ZONE_', 'Z-')}</span>
                    <span className="font-semibold">{st === 'available' ? '+ Park' : 'Details'}</span>
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
