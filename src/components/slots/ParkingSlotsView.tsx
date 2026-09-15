import React, { useState, useMemo } from 'react';
import {
  Grid3X3,
  Car,
  Bus,
  Bike,
  Search,
  Filter,
  Zap,
  Accessibility,
  CheckCircle2,
  AlertCircle,
  PlusCircle,
  Wrench,
  Sparkles,
} from 'lucide-react';
import { useParking } from '../../context/ParkingContext';
import { VehicleType, SlotStatus, ParkingSlot } from '../../types';

export const ParkingSlotsView: React.FC = () => {
  const {
    slots,
    stats,
    setSelectedSlotForModal,
    setIsParkModalOpen,
    setPreselectedTypeForParkModal,
    setPreselectedSlotIdForParkModal,
  } = useParking();

  const [selectedFloor, setSelectedFloor] = useState<string>('ALL');
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const floors = [
    { id: 'ALL', name: 'All Levels (G, 1, 2, 3)' },
    { id: 'G', name: 'Ground Floor (Cars, Buses, Bikes)' },
    { id: 'F1', name: 'Level 1 (North Car Deck)' },
    { id: 'F2', name: 'Level 2 (South Car Deck)' },
    { id: 'F3', name: 'Level 3 (Two-Wheeler Rooftop)' },
  ];

  const filteredSlots = useMemo(() => {
    return slots.filter((slot) => {
      if (selectedFloor !== 'ALL' && slot.floor !== selectedFloor) return false;
      if (selectedType !== 'ALL' && slot.vehicleType !== selectedType) return false;
      if (selectedStatus !== 'ALL' && slot.status !== selectedStatus) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const slotMatch = slot.slotNumber.toLowerCase().includes(q) || slot.id.toLowerCase().includes(q);
        const plateMatch = slot.currentVehicle?.licensePlate.toLowerCase().includes(q);
        const modelMatch = slot.currentVehicle?.model?.toLowerCase().includes(q);
        const driverMatch = slot.currentVehicle?.driverName?.toLowerCase().includes(q);
        if (!slotMatch && !plateMatch && !modelMatch && !driverMatch) return false;
      }

      return true;
    });
  }, [slots, selectedFloor, selectedType, selectedStatus, searchQuery]);

  const handleSlotClick = (slot: ParkingSlot) => {
    if (slot.status === 'occupied' || slot.status === 'maintenance') {
      setSelectedSlotForModal(slot);
    } else {
      setPreselectedTypeForParkModal(slot.vehicleType);
      setPreselectedSlotIdForParkModal(slot.id);
      setIsParkModalOpen(true);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Banner */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-5 sm:p-6 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200/60">
              Interactive Grid Matrix
            </span>
            <span className="text-xs text-slate-400">• Multi-Story Bay Navigator</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            All Facility Parking Slots ({slots.length} Total)
          </h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Real-time multi-level parking bay view. Filter by vehicle type, floor deck, or availability status.
          </p>
        </div>

        <button
          onClick={() => {
            setPreselectedTypeForParkModal('car');
            setPreselectedSlotIdForParkModal(null);
            setIsParkModalOpen(true);
          }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold text-sm transition-all shadow-xs"
        >
          <PlusCircle className="w-4 h-4" />
          Assign &amp; Park Vehicle
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-5 shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by slot (e.g. C-101), plate, or driver..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Floor Filter */}
            <select
              value={selectedFloor}
              onChange={(e) => setSelectedFloor(e.target.value)}
              className="px-3 py-2 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:outline-hidden"
            >
              {floors.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </select>

            {/* Vehicle Type Filter */}
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="px-3 py-2 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:outline-hidden"
            >
              <option value="ALL">All Vehicle Types</option>
              <option value="car">Cars (120 bays)</option>
              <option value="bus">Buses (20 bays)</option>
              <option value="bike">Bikes (60 bays)</option>
            </select>

            {/* Status Filter */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3 py-2 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:outline-hidden"
            >
              <option value="ALL">All Statuses</option>
              <option value="available">Available ({stats.totalAvailable})</option>
              <option value="occupied">Occupied ({stats.totalOccupied})</option>
              <option value="maintenance">Maintenance</option>
            </select>
          </div>
        </div>

        {/* Legend & Stats strip */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 text-xs">
          <div className="flex items-center gap-4 flex-wrap">
            <span className="text-slate-400 font-bold uppercase text-[10px]">Legend:</span>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-md bg-emerald-500 inline-block" />
              <span className="font-semibold text-slate-700">Available ({stats.totalAvailable})</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-md bg-rose-500 inline-block" />
              <span className="font-semibold text-slate-700">Occupied ({stats.totalOccupied})</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-md bg-amber-500 inline-block" />
              <span className="font-semibold text-slate-700">Maintenance</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-500" />
              <span className="text-slate-600">EV Charger</span>
            </div>
          </div>

          <div className="text-xs text-slate-500">
            Showing <strong className="text-slate-900">{filteredSlots.length}</strong> of {slots.length} slots
          </div>
        </div>
      </div>

      {/* Grid of Slots */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs">
        {filteredSlots.length === 0 ? (
          <div className="p-12 text-center text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
            No parking slots match the selected filters. Try changing your search query or reset filters.
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-2.5">
            {filteredSlots.map((slot) => {
              const isOccupied = slot.status === 'occupied';
              const isMaintenance = slot.status === 'maintenance';
              const Icon = slot.vehicleType === 'car' ? Car : slot.vehicleType === 'bus' ? Bus : Bike;

              return (
                <button
                  key={slot.id}
                  id={`slot-matrix-${slot.id}`}
                  onClick={() => handleSlotClick(slot)}
                  className={`group relative p-2.5 rounded-xl border text-left transition-all duration-150 flex flex-col justify-between min-h-24 ${
                    isMaintenance
                      ? 'bg-amber-50/80 border-amber-300 text-amber-900'
                      : isOccupied
                      ? 'bg-rose-50/70 hover:bg-rose-100/90 border-rose-200 text-rose-900 hover:border-rose-400'
                      : 'bg-emerald-50/70 hover:bg-emerald-100/90 border-emerald-200 text-emerald-900 hover:border-emerald-400'
                  } shadow-2xs hover:shadow-sm`}
                >
                  {/* Top: Slot Number & Category Icon */}
                  <div className="flex items-center justify-between w-full">
                    <span
                      className={`text-xs font-mono font-bold px-1.5 py-0.5 rounded-md ${
                        isMaintenance
                          ? 'bg-amber-200 text-amber-900'
                          : isOccupied
                          ? 'bg-rose-200 text-rose-900'
                          : 'bg-emerald-200 text-emerald-900'
                      }`}
                    >
                      {slot.slotNumber}
                    </span>

                    <div className="flex items-center gap-1">
                      <Icon className="w-3 h-3 opacity-60" />
                      {slot.isEvCharging && <Zap className="w-3 h-3 text-amber-500" title="EV Bay" />}
                    </div>
                  </div>

                  {/* Middle Content */}
                  <div className="my-1">
                    {isMaintenance ? (
                      <div className="text-[10px] font-semibold text-amber-700 flex items-center gap-1">
                        <Wrench className="w-3 h-3" /> Service
                      </div>
                    ) : isOccupied && slot.currentVehicle ? (
                      <div>
                        <div className="text-[11px] font-mono font-bold truncate text-slate-900">
                          {slot.currentVehicle.licensePlate}
                        </div>
                        <div className="text-[9px] text-slate-500 truncate mt-0.5">
                          {slot.currentVehicle.driverName || 'Parked'}
                        </div>
                      </div>
                    ) : (
                      <div className="text-[11px] font-semibold text-emerald-700 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        Available
                      </div>
                    )}
                  </div>

                  {/* Bottom: Floor Tag */}
                  <div className="flex items-center justify-between text-[9px] text-slate-400 pt-1 border-t border-slate-200/40">
                    <span>{slot.floor}</span>
                    <span className="font-semibold group-hover:underline">
                      {isOccupied ? 'Manage' : '+ Park'}
                    </span>
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
