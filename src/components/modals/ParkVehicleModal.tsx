import React, { useState, useEffect } from 'react';
import {
  X,
  Car,
  Bus,
  Bike,
  CheckCircle2,
  AlertCircle,
  Zap,
  Sparkles,
  Layers,
} from 'lucide-react';
import { useParking } from '../../context/ParkingContext';
import { VehicleType, ParkingSlot } from '../../types';

export const ParkVehicleModal: React.FC = () => {
  const {
    isParkModalOpen,
    setIsParkModalOpen,
    preselectedTypeForParkModal,
    setPreselectedTypeForParkModal,
    preselectedSlotIdForParkModal,
    setPreselectedSlotIdForParkModal,
    slots,
    parkVehicle,
    settings,
  } = useParking();

  const [type, setType] = useState<VehicleType>('car');
  const [slotId, setSlotId] = useState<string>('');
  const [licensePlate, setLicensePlate] = useState<string>('');
  const [model, setModel] = useState<string>('');
  const [driverName, setDriverName] = useState<string>('');
  const [driverPhone, setDriverPhone] = useState<string>('');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (preselectedTypeForParkModal) {
      setType(preselectedTypeForParkModal);
    }
  }, [preselectedTypeForParkModal]);

  // Available slots for selected vehicle type
  const availableSlots = React.useMemo(() => {
    return slots.filter((s) => s.vehicleType === type && s.status === 'available');
  }, [slots, type]);

  useEffect(() => {
    if (preselectedSlotIdForParkModal) {
      const match = slots.find((s) => s.id === preselectedSlotIdForParkModal && s.status === 'available');
      if (match) {
        setSlotId(match.id);
        setType(match.vehicleType);
        return;
      }
    }
    if (availableSlots.length > 0 && (!slotId || !availableSlots.some((s) => s.id === slotId))) {
      setSlotId(availableSlots[0].id);
    }
  }, [availableSlots, preselectedSlotIdForParkModal, slots, slotId]);

  if (!isParkModalOpen) return null;

  const handleGenerateSamplePlate = () => {
    const letters = 'ABCDEFGHJKLMNPRSTUVWXYZ';
    const prefix = type === 'car' ? 'CA' : type === 'bus' ? 'BU' : 'BK';
    const r1 = letters[Math.floor(Math.random() * letters.length)];
    const r2 = letters[Math.floor(Math.random() * letters.length)];
    const num = Math.floor(1000 + Math.random() * 9000);
    setLicensePlate(`${prefix}-${num}-${r1}${r2}`);
    if (!driverName) setDriverName('Alexander Morgan');
    if (!driverPhone) setDriverPhone('+1 (555) 349-2180');
    if (!model) {
      setModel(
        type === 'car'
          ? 'Tesla Model Y (Deep Blue)'
          : type === 'bus'
          ? 'Mercedes-Benz Tourismo Coach'
          : 'Kawasaki Z900 (Metallic Spark)'
      );
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!licensePlate.trim()) {
      setError('Please enter a vehicle license plate number.');
      return;
    }
    if (!slotId) {
      setError('Please choose an available parking slot.');
      return;
    }

    const result = parkVehicle({
      type,
      slotId,
      licensePlate,
      model: model || undefined,
      driverName: driverName || undefined,
      driverPhone: driverPhone || undefined,
    });

    if (result.success) {
      setIsParkModalOpen(false);
      setPreselectedTypeForParkModal(null);
      setPreselectedSlotIdForParkModal(null);
      setLicensePlate('');
      setModel('');
      setDriverName('');
      setDriverPhone('');
    } else {
      setError(result.message);
    }
  };

  const rate =
    type === 'car'
      ? settings.carHourlyRate
      : type === 'bus'
      ? settings.busHourlyRate
      : settings.bikeHourlyRate;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden animate-in zoom-in-95">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Check-in / Park Vehicle</h3>
            <p className="text-xs text-slate-500">Assign an available bay and issue a parking ticket</p>
          </div>
          <button
            onClick={() => {
              setIsParkModalOpen(false);
              setPreselectedTypeForParkModal(null);
              setPreselectedSlotIdForParkModal(null);
            }}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Vehicle Type Selection */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1.5">Select Vehicle Classification</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => {
                  setType('car');
                  setSlotId('');
                }}
                className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition-all text-xs font-bold ${
                  type === 'car'
                    ? 'bg-blue-50 border-blue-500 text-blue-700 ring-2 ring-blue-500/20'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Car className="w-5 h-5" />
                <span>Car (${settings.carHourlyRate}/hr)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setType('bus');
                  setSlotId('');
                }}
                className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition-all text-xs font-bold ${
                  type === 'bus'
                    ? 'bg-amber-50 border-amber-500 text-amber-700 ring-2 ring-amber-500/20'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Bus className="w-5 h-5" />
                <span>Bus (${settings.busHourlyRate}/hr)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setType('bike');
                  setSlotId('');
                }}
                className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition-all text-xs font-bold ${
                  type === 'bike'
                    ? 'bg-purple-50 border-purple-500 text-purple-700 ring-2 ring-purple-500/20'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Bike className="w-5 h-5" />
                <span>Bike (${settings.bikeHourlyRate}/hr)</span>
              </button>
            </div>
          </div>

          {/* Assigned Slot Picker */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-700">Assign Parking Slot</label>
              <span className="text-xs text-emerald-600 font-semibold">
                {availableSlots.length} available
              </span>
            </div>

            {availableSlots.length === 0 ? (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-medium">
                No slots currently available for {type.toUpperCase()}!
              </div>
            ) : (
              <select
                value={slotId}
                onChange={(e) => setSlotId(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-mono font-semibold"
              >
                {availableSlots.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.slotNumber} • {s.floorName} {s.isEvCharging ? '⚡ (EV Charging)' : ''}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* License Plate Input + Quick Auto-Fill */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-700">License Registration Plate *</label>
              <button
                type="button"
                onClick={handleGenerateSamplePlate}
                className="text-[11px] font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
              >
                <Sparkles className="w-3 h-3" /> Auto-fill Sample Plate
              </button>
            </div>
            <input
              type="text"
              placeholder="e.g. CA-4829-KL"
              value={licensePlate}
              onChange={(e) => setLicensePlate(e.target.value.toUpperCase())}
              className="w-full px-3.5 py-2.5 text-sm font-mono font-bold bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500 uppercase placeholder:normal-case placeholder:font-normal"
            />
          </div>

          {/* Vehicle Model */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1.5">Vehicle Make &amp; Model (Optional)</label>
            <input
              type="text"
              placeholder="e.g. Toyota RAV4 (Silver)"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Driver Name & Phone */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1.5">Driver Name</label>
              <input
                type="text"
                placeholder="e.g. John Doe"
                value={driverName}
                onChange={(e) => setDriverName(e.target.value)}
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1.5">Contact Phone</label>
              <input
                type="text"
                placeholder="+1 (555) 000-0000"
                value={driverPhone}
                onChange={(e) => setDriverPhone(e.target.value)}
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setIsParkModalOpen(false)}
              className="px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={availableSlots.length === 0}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 text-white font-bold text-sm shadow-xs transition-all"
            >
              <CheckCircle2 className="w-4 h-4" />
              Confirm &amp; Issue Ticket
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
