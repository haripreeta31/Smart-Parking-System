import React from 'react';
import {
  X,
  Car,
  Bus,
  Bike,
  Clock,
  DollarSign,
  User,
  Phone,
  Calendar,
  Zap,
  Accessibility,
  Wrench,
  CheckCircle2,
  LogOut,
  PlusCircle,
} from 'lucide-react';
import { useParking } from '../../context/ParkingContext';
import { ParkingSlot } from '../../types';

export const SlotDetailModal: React.FC = () => {
  const {
    selectedSlotForModal,
    setSelectedSlotForModal,
    vacateSlot,
    toggleSlotMaintenance,
    setIsParkModalOpen,
    setPreselectedTypeForParkModal,
    setPreselectedSlotIdForParkModal,
  } = useParking();

  if (!selectedSlotForModal) return null;

  const slot = selectedSlotForModal;
  const isOccupied = slot.status === 'occupied';
  const isMaintenance = slot.status === 'maintenance';
  const Icon = slot.vehicleType === 'car' ? Car : slot.vehicleType === 'bus' ? Bus : Bike;

  // Calculate duration & fee if occupied
  let durationFormatted = '0 mins';
  let accruedFee = 0;
  if (isOccupied && slot.currentVehicle) {
    const entryDate = new Date(slot.currentVehicle.entryTime);
    const now = new Date();
    const diffMs = Math.max(now.getTime() - entryDate.getTime(), 60000);
    const diffMins = Math.round(diffMs / (1000 * 60));
    const hours = Math.floor(diffMins / 60);
    const mins = diffMins % 60;
    durationFormatted = `${hours > 0 ? `${hours} hr ` : ''}${mins} min`;

    const hoursBilled = Math.max(diffMins / 60, 0.5);
    accruedFee = Math.round(hoursBilled * slot.currentVehicle.ratePerHour * 100) / 100;
  }

  const handleCheckout = () => {
    vacateSlot(slot.id);
    setSelectedSlotForModal(null);
  };

  const handleParkHere = () => {
    const sId = slot.id;
    const vType = slot.vehicleType;
    setSelectedSlotForModal(null);
    setPreselectedTypeForParkModal(vType);
    setPreselectedSlotIdForParkModal(sId);
    setIsParkModalOpen(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-mono font-bold text-sm">
              {slot.slotNumber}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900">Slot {slot.slotNumber}</h3>
                <span
                  className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                    isOccupied
                      ? 'bg-rose-100 text-rose-800'
                      : isMaintenance
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-emerald-100 text-emerald-800'
                  }`}
                >
                  {isOccupied ? 'Occupied' : isMaintenance ? 'Maintenance' : 'Available'}
                </span>
              </div>
              <p className="text-xs text-slate-500">{slot.floorName}</p>
            </div>
          </div>

          <button
            onClick={() => setSelectedSlotForModal(null)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          {/* Bay Amenities */}
          <div className="flex items-center gap-2 flex-wrap text-xs">
            <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 font-semibold flex items-center gap-1.5">
              <Icon className="w-3.5 h-3.5" />
              <span className="capitalize">{slot.vehicleType} Slot</span>
            </span>
            {slot.isEvCharging && (
              <span className="px-2.5 py-1 rounded-lg bg-amber-50 text-amber-700 border border-amber-200 font-semibold flex items-center gap-1">
                <Zap className="w-3.5 h-3.5 text-amber-500" />
                EV Supercharger Enabled
              </span>
            )}
            {slot.isHandicapped && (
              <span className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 border border-blue-200 font-semibold flex items-center gap-1">
                <Accessibility className="w-3.5 h-3.5 text-blue-500" />
                Accessible Reserved
              </span>
            )}
          </div>

          {/* Occupied Vehicle Information */}
          {isOccupied && slot.currentVehicle ? (
            <div className="space-y-3 pt-2">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    Registered Vehicle
                  </span>
                  <div className="text-xl font-black font-mono text-slate-900 mt-0.5">
                    {slot.currentVehicle.licensePlate}
                  </div>
                  <div className="text-xs text-slate-600 mt-0.5 font-medium">
                    {slot.currentVehicle.model}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200/60 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-semibold">Driver</span>
                    <span className="font-bold text-slate-800">{slot.currentVehicle.driverName}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-semibold">Contact</span>
                    <span className="font-semibold text-slate-700">{slot.currentVehicle.driverPhone}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200/60 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-semibold">Check-in Time</span>
                    <span className="font-semibold text-slate-800">
                      {new Date(slot.currentVehicle.entryTime).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-semibold">Elapsed Duration</span>
                    <span className="font-bold text-blue-600">{durationFormatted}</span>
                  </div>
                </div>

                <div className="p-3 bg-white rounded-xl border border-slate-200 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400">Current Accrued Fee</span>
                    <div className="text-base font-extrabold text-emerald-600">${accruedFee.toFixed(2)}</div>
                  </div>
                  <span className="text-xs text-slate-500 font-medium">
                    Rate: ${slot.currentVehicle.ratePerHour.toFixed(2)}/hr
                  </span>
                </div>
              </div>

              {/* Checkout / Release Button */}
              <button
                onClick={handleCheckout}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white font-bold text-sm shadow-xs transition-all"
              >
                <LogOut className="w-4 h-4" />
                Checkout &amp; Vacate Slot (${accruedFee.toFixed(2)})
              </button>
            </div>
          ) : (
            <div className="py-4 text-center space-y-3">
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl">
                <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto mb-1.5" />
                <h4 className="text-sm font-bold text-emerald-900">Bay is Ready &amp; Vacant</h4>
                <p className="text-xs text-emerald-700 mt-0.5">
                  Slot {slot.slotNumber} is available for immediate vehicle assignment.
                </p>
              </div>

              <button
                onClick={handleParkHere}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-sm shadow-xs transition-all"
              >
                <PlusCircle className="w-4 h-4" />
                Park a Vehicle Here
              </button>
            </div>
          )}

          {/* Maintenance toggle */}
          <div className="pt-2 border-t border-slate-100 flex justify-between items-center text-xs">
            <button
              onClick={() => toggleSlotMaintenance(slot.id)}
              className="text-slate-500 hover:text-slate-800 flex items-center gap-1.5 font-medium"
            >
              <Wrench className="w-3.5 h-3.5" />
              {isMaintenance ? 'Clear Maintenance (Set Available)' : 'Toggle Maintenance Mode'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
