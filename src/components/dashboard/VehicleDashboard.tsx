import React, { useState, useMemo } from 'react';
import {
  Car,
  Bus,
  Bike,
  PlusCircle,
  Zap,
  Accessibility,
  CheckCircle2,
  AlertCircle,
  Search,
  Filter,
  ArrowLeft,
  Clock,
  DollarSign,
  User,
  Phone,
} from 'lucide-react';
import { VehicleType, ParkingSlot, FloorLevel } from '../../types';
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

  const [selectedFloor, setSelectedFloor] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'available' | 'occupied'>('ALL');
  const [localSearch, setLocalSearch] = useState<string>('');

  const currentStats =
    vehicleType === 'car'
      ? stats.carStats
      : vehicleType === 'bus'
      ? stats.busStats
      : stats.bikeStats;

  const typeDetails = {
    car: {
      name: 'Car',
      plural: 'Cars',
      icon: Car,
      color: 'blue',
      bgColor: 'bg-blue-600',
      lightBg: 'bg-blue-50',
      textColor: 'text-blue-600',
      borderColor: 'border-blue-200',
      hourlyRate: stats.carStats.hourlyRate,
      floors: [
        { id: 'ALL', name: 'All Car Decks' },
        { id: 'G', name: 'Ground Floor' },
        { id: 'F1', name: 'Level 1 (North)' },
        { id: 'F2', name: 'Level 2 (South)' },
      ],
    },
    bus: {
      name: 'Bus',
      plural: 'Buses',
      icon: Bus,
      color: 'amber',
      bgColor: 'bg-amber-600',
      lightBg: 'bg-amber-50',
      textColor: 'text-amber-600',
      borderColor: 'border-amber-200',
      hourlyRate: stats.busStats.hourlyRate,
      floors: [
        { id: 'ALL', name: 'All Bus Bays' },
        { id: 'G', name: 'Ground Heavy Bay' },
      ],
    },
    bike: {
      name: 'Bike',
      plural: 'Bikes',
      icon: Bike,
      color: 'purple',
      bgColor: 'bg-purple-600',
      lightBg: 'bg-purple-50',
      textColor: 'text-purple-600',
      borderColor: 'border-purple-200',
      hourlyRate: stats.bikeStats.hourlyRate,
      floors: [
        { id: 'ALL', name: 'All Bike Decks' },
        { id: 'G', name: 'Ground Enclosure' },
        { id: 'F3', name: 'Level 3 Rooftop Deck' },
      ],
    },
  }[vehicleType];

  const Icon = typeDetails.icon;

  // Filter slots for this vehicle type
  const typeSlots = useMemo(() => {
    return slots.filter((s) => s.vehicleType === vehicleType);
  }, [slots, vehicleType]);

  // Apply floor, status, search filters
  const filteredSlots = useMemo(() => {
    return typeSlots.filter((slot) => {
      if (selectedFloor !== 'ALL' && slot.floor !== selectedFloor) return false;
      if (statusFilter !== 'ALL' && slot.status !== statusFilter) return false;
      if (localSearch.trim()) {
        const q = localSearch.toLowerCase().trim();
        const slotMatch = slot.slotNumber.toLowerCase().includes(q);
        const plateMatch = slot.currentVehicle?.licensePlate.toLowerCase().includes(q);
        const modelMatch = slot.currentVehicle?.model?.toLowerCase().includes(q);
        const driverMatch = slot.currentVehicle?.driverName?.toLowerCase().includes(q);
        if (!slotMatch && !plateMatch && !modelMatch && !driverMatch) return false;
      }
      return true;
    });
  }, [typeSlots, selectedFloor, statusFilter, localSearch]);

  const handleParkInSlot = (slot: ParkingSlot) => {
    if (slot.status === 'occupied') {
      setSelectedSlotForModal(slot);
    } else {
      setPreselectedTypeForParkModal(vehicleType);
      setPreselectedSlotIdForParkModal(slot.id);
      setIsParkModalOpen(true);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Breadcrumb & Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveTab('dashboard')}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
            title="Back to Main Dashboard"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className={`w-11 h-11 rounded-xl ${typeDetails.lightBg} border ${typeDetails.borderColor} flex items-center justify-center ${typeDetails.textColor}`}>
            <Icon className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-slate-900">{typeDetails.name} Parking Dashboard</h2>
              <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${typeDetails.lightBg} ${typeDetails.textColor}`}>
                ${typeDetails.hourlyRate.toFixed(2)}/hr
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Live bay monitoring, real-time availability and slot allocation matrix
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button
            id={`park-new-${vehicleType}-btn`}
            onClick={() => {
              setPreselectedTypeForParkModal(vehicleType);
              setPreselectedSlotIdForParkModal(null);
              setIsParkModalOpen(true);
            }}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl ${typeDetails.bgColor} text-white font-semibold text-sm shadow-xs hover:opacity-95 active:scale-98 transition-all`}
          >
            <PlusCircle className="w-4 h-4" />
            Park {typeDetails.name}
          </button>
        </div>
      </div>

      {/* KPI METRIC CARDS (Exact user specifications) */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        {/* Metric 1: Total Spaces */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 block">Total {typeDetails.name} Spaces</span>
          <div className="text-2xl font-extrabold text-slate-900 mt-1">{currentStats.totalSpaces}</div>
          <span className="text-[11px] text-slate-400 mt-1 block">Dedicated designated bays</span>
        </div>

        {/* Metric 2: Occupied Spaces */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs">
          <span className="text-xs font-semibold text-rose-600 block">Occupied Spaces</span>
          <div className="text-2xl font-extrabold text-rose-600 mt-1">{currentStats.occupiedSpaces}</div>
          <span className="text-[11px] text-slate-400 mt-1 block">Active parking sessions</span>
        </div>

        {/* Metric 3: Available Spaces */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs">
          <span className="text-xs font-semibold text-emerald-600 block">Available Spaces</span>
          <div className="text-2xl font-extrabold text-emerald-600 mt-1">{currentStats.availableSpaces}</div>
          <span className="text-[11px] text-slate-400 mt-1 block">Ready for entry</span>
        </div>

        {/* Metric 4: Number of vehicles currently parked */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs">
          <span className="text-xs font-semibold text-slate-700 block">Currently Parked</span>
          <div className="text-2xl font-extrabold text-slate-900 mt-1">{currentStats.occupiedSpaces}</div>
          <span className="text-[11px] text-slate-400 mt-1 block">{typeDetails.plural} inside facility</span>
        </div>

        {/* Metric 5: Parking Occupancy Percentage */}
        <div className="col-span-2 lg:col-span-1 bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs flex flex-col justify-between">
          <span className="text-xs font-semibold text-slate-500 block">Occupancy Percentage</span>
          <div className="flex items-baseline justify-between mt-1">
            <span className={`text-2xl font-extrabold ${typeDetails.textColor}`}>
              {currentStats.occupancyPercentage}%
            </span>
            <span className="text-xs text-slate-400">
              {currentStats.occupiedSpaces}/{currentStats.totalSpaces}
            </span>
          </div>
          <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden mt-2">
            <div
              className={`h-full ${typeDetails.bgColor} rounded-full transition-all duration-500`}
              style={{ width: `${currentStats.occupancyPercentage}%` }}
            />
          </div>
        </div>
      </div>

      {/* PARKING-SLOT VISUALIZATION SECTION */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs">
        {/* Controls & Filter Bar */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 pb-5 border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <span>{typeDetails.name} Parking Slot Visualization</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-normal">
                {filteredSlots.length} slots displayed
              </span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Click on an <span className="text-emerald-600 font-semibold">Available</span> slot to park or an <span className="text-rose-600 font-semibold">Occupied</span> slot to view vehicle details &amp; release.
            </p>
          </div>

          {/* Filters & Legend */}
          <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
            {/* Search */}
            <div className="relative flex-1 sm:w-48">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search slot or plate..."
                value={localSearch}
                onChange={(e) => setLocalSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-blue-500"
              />
            </div>

            {/* Floor filter */}
            <select
              value={selectedFloor}
              onChange={(e) => setSelectedFloor(e.target.value)}
              className="px-3 py-1.5 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-hidden"
            >
              {typeDetails.floors.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </select>

            {/* Status filter buttons */}
            <div className="flex items-center bg-slate-100 p-0.5 rounded-lg text-xs font-semibold">
              <button
                onClick={() => setStatusFilter('ALL')}
                className={`px-2.5 py-1 rounded-md transition-all ${
                  statusFilter === 'ALL' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setStatusFilter('available')}
                className={`px-2.5 py-1 rounded-md transition-all ${
                  statusFilter === 'available' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-500'
                }`}
              >
                Available ({typeSlots.filter((s) => s.status === 'available').length})
              </button>
              <button
                onClick={() => setStatusFilter('occupied')}
                className={`px-2.5 py-1 rounded-md transition-all ${
                  statusFilter === 'occupied' ? 'bg-rose-600 text-white shadow-xs' : 'text-slate-500'
                }`}
              >
                Occupied ({typeSlots.filter((s) => s.status === 'occupied').length})
              </button>
            </div>
          </div>
        </div>

        {/* Legend Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 py-3 px-3 my-4 bg-slate-50 border border-slate-200/70 rounded-xl text-xs">
          <div className="flex items-center gap-4 flex-wrap">
            <span className="text-slate-400 font-semibold uppercase text-[10px] tracking-wider">Legend:</span>
            <div className="flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 rounded-md bg-emerald-500 border border-emerald-600 inline-block" />
              <span className="font-semibold text-slate-700">Available Slot</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 rounded-md bg-rose-500 border border-rose-600 inline-block" />
              <span className="font-semibold text-slate-700">Occupied Slot</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-500" />
              <span className="text-slate-600">EV Charging Bay</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Accessibility className="w-3.5 h-3.5 text-blue-500" />
              <span className="text-slate-600">Accessible / Reserved</span>
            </div>
          </div>

          <div className="text-[11px] text-slate-500 font-medium">
            Tariff: <strong className="text-slate-800">${typeDetails.hourlyRate.toFixed(2)}/hour</strong>
          </div>
        </div>

        {/* Slot Grid Visualization */}
        {filteredSlots.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-sm bg-slate-50 rounded-xl border border-dashed border-slate-200">
            No parking slots match the selected filter criteria.
          </div>
        ) : (
          <div
            className={`grid gap-2.5 sm:gap-3 ${
              vehicleType === 'bus'
                ? 'grid-cols-2 sm:grid-cols-4 md:grid-cols-5'
                : vehicleType === 'bike'
                ? 'grid-cols-3 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8'
                : 'grid-cols-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-8'
            }`}
          >
            {filteredSlots.map((slot) => {
              const isOccupied = slot.status === 'occupied';

              return (
                <button
                  key={slot.id}
                  id={`slot-${slot.id}`}
                  onClick={() => handleParkInSlot(slot)}
                  className={`group relative p-2.5 rounded-xl border text-left transition-all duration-150 flex flex-col justify-between ${
                    vehicleType === 'bus' ? 'min-h-28' : 'min-h-22'
                  } ${
                    isOccupied
                      ? 'bg-rose-50/70 hover:bg-rose-100/90 border-rose-200 text-rose-900 hover:border-rose-400'
                      : 'bg-emerald-50/70 hover:bg-emerald-100/90 border-emerald-200 text-emerald-900 hover:border-emerald-400'
                  } shadow-2xs hover:shadow-sm`}
                >
                  {/* Top: Slot ID & Badge */}
                  <div className="flex items-center justify-between w-full">
                    <span
                      className={`text-xs font-mono font-bold px-1.5 py-0.5 rounded-md ${
                        isOccupied ? 'bg-rose-200/80 text-rose-900' : 'bg-emerald-200/80 text-emerald-900'
                      }`}
                    >
                      {slot.slotNumber}
                    </span>

                    <div className="flex items-center gap-1">
                      {slot.isEvCharging && <Zap className="w-3 h-3 text-amber-500" title="EV Charging" />}
                      {slot.isHandicapped && <Accessibility className="w-3 h-3 text-blue-500" title="Accessible" />}
                    </div>
                  </div>

                  {/* Center: Status / License Plate */}
                  <div className="my-1">
                    {isOccupied && slot.currentVehicle ? (
                      <div>
                        <div className="text-[11px] font-mono font-bold truncate text-slate-900">
                          {slot.currentVehicle.licensePlate}
                        </div>
                        <div className="text-[10px] text-slate-500 truncate mt-0.5">
                          {slot.currentVehicle.model || 'Parked'}
                        </div>
                      </div>
                    ) : (
                      <div className="text-[11px] font-semibold text-emerald-700 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        Available
                      </div>
                    )}
                  </div>

                  {/* Bottom: Floor Tag or Park Action */}
                  <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-200/40">
                    <span>{slot.floor}</span>
                    <span className="font-semibold group-hover:underline">
                      {isOccupied ? 'Details' : '+ Park'}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Active Vehicle Table for this type */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Active {typeDetails.plural} in Hub ({currentStats.occupiedSpaces})
            </h3>
            <p className="text-xs text-slate-500">Currently occupying designated {typeDetails.name.toLowerCase()} parking bays</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider">
                <th className="pb-3 px-2">Slot</th>
                <th className="pb-3 px-2">License Plate</th>
                <th className="pb-3 px-2">Vehicle Details</th>
                <th className="pb-3 px-2">Driver</th>
                <th className="pb-3 px-2">Check-in Time</th>
                <th className="pb-3 px-2">Floor</th>
                <th className="pb-3 px-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {typeSlots
                .filter((s) => s.status === 'occupied' && s.currentVehicle)
                .map((slot) => (
                  <tr key={slot.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-2">
                      <span className="font-bold font-mono text-slate-900 px-2 py-1 bg-slate-100 rounded-lg">
                        {slot.slotNumber}
                      </span>
                    </td>
                    <td className="py-3 px-2 font-mono font-bold text-slate-900">
                      {slot.currentVehicle?.licensePlate}
                    </td>
                    <td className="py-3 px-2 text-slate-600">
                      {slot.currentVehicle?.model}
                    </td>
                    <td className="py-3 px-2">
                      <div className="font-semibold text-slate-800">{slot.currentVehicle?.driverName}</div>
                      <div className="text-[11px] text-slate-400">{slot.currentVehicle?.driverPhone}</div>
                    </td>
                    <td className="py-3 px-2 text-slate-500">
                      {slot.currentVehicle ? new Date(slot.currentVehicle.entryTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}
                    </td>
                    <td className="py-3 px-2">
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[11px]">
                        {slot.floorName}
                      </span>
                    </td>
                    <td className="py-3 px-2 text-right">
                      <button
                        onClick={() => setSelectedSlotForModal(slot)}
                        className="px-2.5 py-1 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                      >
                        Manage / Checkout
                      </button>
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
