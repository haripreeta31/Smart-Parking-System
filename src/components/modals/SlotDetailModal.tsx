import React, { useState } from 'react';
import {
  X,
  Zap,
  Accessibility,
  Wrench,
  CheckCircle2,
  LogOut,
  PlusCircle,
  MapPin,
  CalendarCheck,
  Navigation,
} from 'lucide-react';
import { useParking } from '../../context/ParkingContext';
import { CAMPUS_BUILDINGS } from '../../data/initialData';

export const SlotDetailModal: React.FC = () => {
  const {
    currentUser,
    selectedSlotForModal,
    setSelectedSlotForModal,
    reservations,
    vacateSlot,
    toggleSlotMaintenance,
    setIsParkModalOpen,
    setPreselectedTypeForParkModal,
    setPreselectedSlotIdForParkModal,
    setActiveTab,
    setMapHighlightedSlotId,
    setPreselectedSlotForReservation,
    setLastCheckedInSlotId,
  } = useParking();

  const [busy, setBusy] = useState(false);

  if (!selectedSlotForModal) return null;

  const slot = selectedSlotForModal;
  const st = slot.status;
  const isAdmin = currentUser.role === 'admin';

  const activeReservation = reservations.find(
    (r) =>
      r.slotId === slot.id &&
      (r.status === 'confirmed' || r.status === 'checked_in')
  );

  const nearbyBuilding = CAMPUS_BUILDINGS.find((b) => b.id === slot.nearbyBuildingId);

  let durationFormatted = '0 mins';
  let accruedFee = 0;
  if (st === 'occupied' && slot.currentVehicle) {
    const entryDate = new Date(slot.currentVehicle.entryTime);
    const diffMs = Math.max(Date.now() - entryDate.getTime(), 60000);
    const diffMins = Math.round(diffMs / 60000);
    const hours = Math.floor(diffMins / 60);
    const mins = diffMins % 60;
    durationFormatted = `${hours > 0 ? `${hours} hr ` : ''}${mins} min`;
    const hoursBilled = Math.max(diffMins / 60, 0.5);
    accruedFee = Math.round(hoursBilled * slot.currentVehicle.ratePerHour * 100) / 100;
  }

  const handleCheckout = async () => {
    setBusy(true);
    await vacateSlot(slot.id);
    setBusy(false);
    setSelectedSlotForModal(null);
  };

  const handleParkHere = () => {
    setSelectedSlotForModal(null);
    setPreselectedTypeForParkModal(slot.vehicleType);
    setPreselectedSlotIdForParkModal(slot.id);
    setIsParkModalOpen(true);
  };

  const handleReserveHere = () => {
    setPreselectedSlotForReservation(slot.id);
    setSelectedSlotForModal(null);
    setActiveTab('reservations');
  };

  const handleShowOnMap = () => {
    setMapHighlightedSlotId(slot.id);
    setSelectedSlotForModal(null);
    setActiveTab('campus-map');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-md w-full overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-slate-900 font-mono">Slot {slot.slotNumber}</h3>
              <span className="text-xs text-slate-400">·</span>
              <span
                className={`text-xs font-semibold capitalize ${
                  st === 'occupied'
                    ? 'text-rose-600'
                    : st === 'reserved'
                    ? 'text-blue-600'
                    : st === 'maintenance'
                    ? 'text-amber-600'
                    : 'text-emerald-600'
                }`}
              >
                {st === 'maintenance' ? 'Temporarily Unavailable' : st}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">{slot.zoneName}</p>
          </div>

          <button
            onClick={() => setSelectedSlotForModal(null)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Campus Location & Nearby Buildings */}
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
            <div className="font-semibold text-slate-800 flex items-center justify-between">
              <span>Campus Location &amp; Landmark</span>
              <span className="capitalize text-slate-500">{slot.vehicleType} Bay</span>
            </div>
            <p className="text-slate-600">{slot.nearbyLandmark}</p>
            {nearbyBuilding && (
              <p className="text-slate-500 tabular-nums">
                Nearest Building: <strong>{nearbyBuilding.name}</strong> (
                {slot.distanceToBuildings[nearbyBuilding.id]}m walk)
              </p>
            )}
            <div className="flex items-center gap-3 pt-1 text-slate-600">
              {slot.isEvCharging && (
                <span className="inline-flex items-center gap-1 font-medium text-amber-700">
                  <Zap className="w-3.5 h-3.5" /> EV Charger
                </span>
              )}
              {slot.isHandicapped && (
                <span className="inline-flex items-center gap-1 font-medium text-blue-700">
                  <Accessibility className="w-3.5 h-3.5" /> Accessible Bay
                </span>
              )}
            </div>
          </div>

          {st === 'occupied' && slot.currentVehicle ? (
            <div className="space-y-3">
              <div className="p-4 rounded-xl border border-slate-200 space-y-2.5 text-xs tabular-nums">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">License Plate</span>
                  <span className="font-mono font-bold text-sm text-slate-900">
                    {slot.currentVehicle.licensePlate}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Driver</span>
                  <span className="font-semibold text-slate-800">
                    {slot.currentVehicle.driverName}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Check-In Time</span>
                  <span className="text-slate-800">
                    {new Date(slot.currentVehicle.entryTime).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Elapsed / Accrued Fee</span>
                  <span className="font-bold text-emerald-700">
                    {durationFormatted} · ${accruedFee.toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <button
                  onClick={() => {
                    setLastCheckedInSlotId(slot.id);
                    setSelectedSlotForModal(null);
                    setActiveTab('find-vehicle');
                  }}
                  className="flex items-center justify-center gap-1.5 py-2.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-800 font-semibold text-xs transition-colors"
                >
                  <Navigation className="w-3.5 h-3.5" />
                  <span>Walking Route</span>
                </button>
                <button
                  disabled={busy}
                  onClick={handleCheckout}
                  className="flex items-center justify-center gap-1.5 py-2.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Checkout (${accruedFee.toFixed(2)})</span>
                </button>
              </div>
            </div>
          ) : st === 'reserved' ? (
            <div className="space-y-3">
              <div className="p-4 rounded-xl bg-blue-50/60 border border-blue-200 text-xs space-y-1.5">
                <div className="font-bold text-blue-900 flex items-center gap-1.5">
                  <CalendarCheck className="w-4 h-4 text-blue-600" />
                  <span>Active Reservation Hold</span>
                </div>
                {activeReservation ? (
                  <>
                    <p className="text-blue-800">
                      Reserved for <strong>{activeReservation.driverName}</strong> (
                      <span className="font-mono">{activeReservation.licensePlate}</span>)
                    </p>
                    <p className="text-blue-700 font-mono">
                      QR Pass: {activeReservation.qrPassCode}
                    </p>
                  </>
                ) : (
                  <p className="text-blue-800">Reserved for scheduled campus transit or booking.</p>
                )}
              </div>

              <button
                onClick={() => {
                  setSelectedSlotForModal(null);
                  setActiveTab('reservations');
                }}
                className="w-full py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition-colors"
              >
                Open QR Pass Check-In / Reservations
              </button>
            </div>
          ) : st === 'maintenance' ? (
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-1">
              <div className="font-bold flex items-center gap-1.5">
                <Wrench className="w-4 h-4 text-amber-700" />
                <span>Temporarily Unavailable</span>
              </div>
              <p>{slot.maintenanceReason || 'Slot closed for scheduled campus maintenance.'}</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 flex items-center gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <div>
                  <div className="font-bold">Available for Check-In or Reservation</div>
                  <div className="text-emerald-700">Slot {slot.slotNumber} is open now.</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <button
                  onClick={handleParkHere}
                  className="flex items-center justify-center gap-1.5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition-colors"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Check-In Now</span>
                </button>
                <button
                  onClick={handleReserveHere}
                  className="flex items-center justify-center gap-1.5 py-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs transition-colors"
                >
                  <CalendarCheck className="w-4 h-4" />
                  <span>Book QR Pass</span>
                </button>
              </div>
            </div>
          )}

          {/* Footer actions */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <button
              onClick={handleShowOnMap}
              className="text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1"
            >
              <MapPin className="w-3.5 h-3.5" />
              <span>Locate on Campus Map</span>
            </button>

            {isAdmin && st !== 'occupied' && (
              <button
                disabled={busy}
                onClick={async () => {
                  setBusy(true);
                  await toggleSlotMaintenance(slot.id);
                  setBusy(false);
                }}
                className="text-slate-600 hover:text-slate-900 flex items-center gap-1 font-medium"
              >
                <Wrench className="w-3.5 h-3.5" />
                <span>{st === 'maintenance' ? 'Restore Available' : 'Set Unavailable'}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
