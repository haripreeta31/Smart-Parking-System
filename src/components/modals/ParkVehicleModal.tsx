import React, { useState, useEffect } from 'react';
import {
  X,
  Car,
  Bus,
  Bike,
  Briefcase,
  Users,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { useParking } from '../../context/ParkingContext';
import type { VehicleType } from '../../types';

export const ParkVehicleModal: React.FC = () => {
  const {
    currentUser,
    isParkModalOpen,
    setIsParkModalOpen,
    preselectedTypeForParkModal,
    setPreselectedTypeForParkModal,
    preselectedSlotIdForParkModal,
    setPreselectedSlotIdForParkModal,
    slots,
    parkVehicle,
    settings,
    setActiveTab,
  } = useParking();

  const [type, setType] = useState<VehicleType>('car');
  const [slotId, setSlotId] = useState<string>('');
  const [licensePlate, setLicensePlate] = useState<string>('');
  const [model, setModel] = useState<string>('');
  const [driverName, setDriverName] = useState<string>('');
  const [driverPhone, setDriverPhone] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);

  useEffect(() => {
    if (isParkModalOpen) {
      setDriverName(currentUser.name);
      setDriverPhone(currentUser.phone);
      if (!licensePlate) {
        setLicensePlate(currentUser.defaultPlate);
      }
      if (preselectedTypeForParkModal) {
        setType(preselectedTypeForParkModal);
      } else {
        setType(currentUser.defaultVehicleType);
      }
      setError('');
    }
  }, [isParkModalOpen, preselectedTypeForParkModal, currentUser]);

  const availableSlots = React.useMemo(
    () => slots.filter((s) => s.vehicleType === type && s.status === 'available'),
    [slots, type]
  );

  useEffect(() => {
    if (preselectedSlotIdForParkModal) {
      const match = slots.find(
        (s) => s.id === preselectedSlotIdForParkModal && s.status === 'available'
      );
      if (match) {
        setSlotId(match.id);
        setType(match.vehicleType);
        return;
      }
    }
    if (availableSlots.length > 0 && (!slotId || !availableSlots.some((s) => s.id === slotId))) {
      setSlotId(availableSlots[0].id);
    } else if (availableSlots.length === 0) {
      setSlotId('');
    }
  }, [availableSlots, preselectedSlotIdForParkModal, slots, slotId]);

  if (!isParkModalOpen) return null;

  const handleAutoSample = () => {
    const letters = 'ABCDEFGHJKLMNPRSTUVWXYZ';
    const prefixMap: Record<VehicleType, string> = {
      car: 'CA',
      bike: 'BK',
      staff: 'ST',
      visitor: 'VS',
      bus: 'BUS',
    };
    const r1 = letters[Math.floor(Math.random() * letters.length)];
    const r2 = letters[Math.floor(Math.random() * letters.length)];
    const num = Math.floor(1000 + Math.random() * 9000);
    setLicensePlate(`${prefixMap[type]}-${num}-${r1}${r2}`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!licensePlate.trim()) {
      setError('Please enter a valid vehicle license plate.');
      return;
    }
    if (!slotId) {
      setError('No available slot selected.');
      return;
    }

    setSubmitting(true);
    const result = await parkVehicle({
      type,
      slotId,
      licensePlate,
      model: model || undefined,
      driverName: driverName || undefined,
      driverPhone: driverPhone || undefined,
    });
    setSubmitting(false);

    if (result.success) {
      setIsParkModalOpen(false);
      setPreselectedTypeForParkModal(null);
      setPreselectedSlotIdForParkModal(null);
      setModel('');
    } else {
      setError(result.message);
    }
  };

  const categories: Array<{ id: VehicleType; label: string; icon: React.ElementType; rate: number }> = [
    { id: 'car', label: 'Car', icon: Car, rate: settings.carHourlyRate },
    { id: 'bike', label: 'Bike', icon: Bike, rate: settings.bikeHourlyRate },
    { id: 'staff', label: 'Staff', icon: Briefcase, rate: settings.staffHourlyRate },
    { id: 'visitor', label: 'Visitor', icon: Users, rate: settings.visitorHourlyRate },
    { id: 'bus', label: 'Bus', icon: Bus, rate: settings.busHourlyRate },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-lg w-full overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div>
            <h3 className="text-base font-bold text-slate-900">Walk-In Check-In &amp; Slot Assignment</h3>
            <p className="text-xs text-slate-500">
              Saves your assigned slot automatically to Find My Vehicle
            </p>
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

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1.5">
              Vehicle Category
            </label>
            <div className="grid grid-cols-5 gap-1.5">
              {categories.map((c) => {
                const Icon = c.icon;
                const active = type === c.id;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => {
                      setType(c.id);
                      setSlotId('');
                    }}
                    className={`p-2 rounded-lg border flex flex-col items-center gap-1 text-[11px] font-semibold transition-colors ${
                      active
                        ? 'bg-blue-50 border-blue-600 text-blue-700'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{c.label}</span>
                    <span className="text-[10px] font-mono text-slate-500">${c.rate}/h</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5 text-xs">
              <label className="font-semibold text-slate-700">Available Campus Slot</label>
              <span className="text-emerald-600 font-semibold tabular-nums">
                {availableSlots.length} available
              </span>
            </div>

            {availableSlots.length === 0 ? (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-xs space-y-2">
                <p className="font-semibold">All {type.toUpperCase()} slots are currently occupied or reserved.</p>
                <button
                  type="button"
                  onClick={() => {
                    setIsParkModalOpen(false);
                    setActiveTab('reservations');
                  }}
                  className="px-3 py-1.5 rounded-md bg-slate-900 text-white text-xs font-semibold"
                >
                  Join Smart Waitlist &rarr;
                </button>
              </div>
            ) : (
              <select
                value={slotId}
                onChange={(e) => setSlotId(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg font-mono font-semibold"
              >
                {availableSlots.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.slotNumber} · {s.zoneName} {s.isEvCharging ? '(EV)' : ''}{' '}
                    {s.isHandicapped ? '(Accessible)' : ''}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-700">License Plate *</label>
              <button
                type="button"
                onClick={handleAutoSample}
                className="text-[11px] font-semibold text-blue-600 hover:text-blue-700"
              >
                Generate Sample Plate
              </button>
            </div>
            <input
              type="text"
              placeholder="e.g. CA-8412-HP"
              value={licensePlate}
              onChange={(e) => setLicensePlate(e.target.value.toUpperCase())}
              className="w-full px-3.5 py-2 text-sm font-mono font-bold bg-slate-50 border border-slate-200 rounded-lg uppercase"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1.5">
              Vehicle Make &amp; Model (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Toyota RAV4 Hybrid"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1.5">Driver Name</label>
              <input
                type="text"
                value={driverName}
                onChange={(e) => setDriverName(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1.5">Phone</label>
              <input
                type="text"
                value={driverPhone}
                onChange={(e) => setDriverPhone(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={() => setIsParkModalOpen(false)}
              className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={availableSlots.length === 0 || submitting}
              className="inline-flex items-center gap-1.5 px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold text-xs transition-colors"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{submitting ? 'Checking In...' : 'Confirm Check-In'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
