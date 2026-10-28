import React, { useState, useMemo, useEffect } from 'react';
import QRCode from 'qrcode';
import {
  CalendarCheck,
  QrCode,
  ShieldCheck,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Users,
  RefreshCw,
} from 'lucide-react';
import { useParking } from '../../context/ParkingContext';
import { CAMPUS_BUILDINGS, CAMPUS_ZONES } from '../../data/initialData';
import { isSlotAvailableForWindow, recommendBestSlots } from '../../utils/recommendation';
import type { VehicleType, CampusZoneId, Reservation } from '../../types';

const toLocalDatetimeValue = (date: Date) => {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours()
  )}:${pad(date.getMinutes())}`;
};

export const ReservationsView: React.FC = () => {
  const {
    currentUser,
    slots,
    reservations,
    waitlist,
    settings,
    preselectedSlotForReservation,
    setPreselectedSlotForReservation,
    createReservation,
    validateOrActionQrPass,
    cancelReservation,
    processNoShows,
    joinWaitlist,
    leaveWaitlist,
  } = useParking();

  // Booking form state
  const [vehicleType, setVehicleType] = useState<VehicleType>(currentUser.defaultVehicleType);
  const [targetBuildingId, setTargetBuildingId] = useState<string>('BLD_ENGINEERING');
  const [startLocal, setStartLocal] = useState<string>(() =>
    toLocalDatetimeValue(new Date(Date.now() + 15 * 60000))
  );
  const [durationHours, setDurationHours] = useState<number>(2);
  const [slotId, setSlotId] = useState<string>('');
  const [licensePlate, setLicensePlate] = useState<string>(currentUser.defaultPlate);
  const [vehicleModel, setVehicleModel] = useState<string>('');
  const [bookingMsg, setBookingMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Selected reservation for QR Pass display
  const [selectedPassResId, setSelectedPassResId] = useState<string>('RES-1002');
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [passListFilter, setPassListFilter] = useState<'active' | 'all' | 'history'>('active');

  // Gate QR Validator state
  const [gateInputCode, setGateInputCode] = useState<string>('SMP-PASS-1002-CONF742');
  const [gateResult, setGateResult] = useState<{
    ok: boolean;
    code?: string;
    message: string;
    reservation?: Reservation;
  } | null>(null);

  // Waitlist form state
  const [wlVehicleType, setWlVehicleType] = useState<VehicleType>('car');
  const [wlZoneId, setWlZoneId] = useState<CampusZoneId | 'ANY'>('ZONE_B');
  const [wlPlate, setWlPlate] = useState<string>(currentUser.defaultPlate);

  useEffect(() => {
    setLicensePlate(currentUser.defaultPlate);
    setWlPlate(currentUser.defaultPlate);
  }, [currentUser]);

  const startIso = useMemo(() => {
    const d = new Date(startLocal);
    return Number.isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();
  }, [startLocal]);

  const endIso = useMemo(() => {
    const d = new Date(new Date(startIso).getTime() + durationHours * 3600 * 1000);
    return d.toISOString();
  }, [startIso, durationHours]);

  // Slots available for the requested time window (prevents overlapping bookings)
  const eligibleSlots = useMemo(() => {
    return slots.filter((s) => {
      if (s.vehicleType !== vehicleType) return false;
      return isSlotAvailableForWindow(s, reservations, startIso, endIso).available;
    });
  }, [slots, reservations, vehicleType, startIso, endIso]);

  const recommendedForBooking = useMemo(() => {
    const recs = recommendBestSlots(
      slots,
      reservations,
      {
        buildingId: targetBuildingId,
        gateId: 'GATE_A',
        vehicleType,
        startTime: startIso,
        endTime: endIso,
      },
      1
    );
    return recs[0] || null;
  }, [slots, reservations, targetBuildingId, vehicleType, startIso, endIso]);

  useEffect(() => {
    if (preselectedSlotForReservation) {
      const pre = slots.find((s) => s.id === preselectedSlotForReservation);
      if (pre) {
        setVehicleType(pre.vehicleType);
        setSlotId(pre.id);
        setPreselectedSlotForReservation(null);
        return;
      }
    }
    if (recommendedForBooking && (!slotId || !eligibleSlots.some((s) => s.id === slotId))) {
      setSlotId(recommendedForBooking.slot.id);
    } else if (eligibleSlots.length > 0 && !eligibleSlots.some((s) => s.id === slotId)) {
      setSlotId(eligibleSlots[0].id);
    } else if (eligibleSlots.length === 0) {
      setSlotId('');
    }
  }, [preselectedSlotForReservation, recommendedForBooking, eligibleSlots, slots, slotId, setPreselectedSlotForReservation]);

  const activePassReservation = useMemo(
    () => reservations.find((r) => r.id === selectedPassResId) || reservations[0] || null,
    [reservations, selectedPassResId]
  );

  useEffect(() => {
    if (!activePassReservation) {
      setQrDataUrl('');
      return;
    }
    const qrPayload = JSON.stringify({
      passCode: activePassReservation.qrPassCode,
      reservationId: activePassReservation.id,
      slot: activePassReservation.slotNumber,
      plate: activePassReservation.licensePlate,
    });
    QRCode.toDataURL(qrPayload, {
      width: 200,
      margin: 1,
      color: { dark: '#0f172a', light: '#ffffff' },
    })
      .then((url) => setQrDataUrl(url))
      .catch(() => setQrDataUrl(''));
  }, [activePassReservation]);

  const filteredReservations = useMemo(() => {
    return reservations.filter((r) => {
      if (passListFilter === 'active') {
        return r.status === 'confirmed' || r.status === 'checked_in';
      }
      if (passListFilter === 'history') {
        return r.status !== 'confirmed' && r.status !== 'checked_in';
      }
      return true;
    });
  }, [reservations, passListFilter]);

  const handleCreateBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    setBookingMsg(null);
    if (!slotId) {
      setBookingMsg({ ok: false, text: 'No available slot selected for this window.' });
      return;
    }
    setSubmitting(true);
    const res = await createReservation({
      slotId,
      vehicleType,
      licensePlate,
      vehicleModel: vehicleModel || undefined,
      driverName: currentUser.name,
      driverPhone: currentUser.phone,
      targetBuildingId,
      startTime: startIso,
      endTime: endIso,
    });
    setSubmitting(false);

    if (res.success && res.data) {
      setSelectedPassResId(res.data.id);
      setGateInputCode(res.data.qrPassCode);
      setBookingMsg({ ok: true, text: res.message });
    } else {
      setBookingMsg({ ok: false, text: res.message });
    }
  };

  const handleGateAction = async (action: 'verify' | 'checkin' | 'checkout') => {
    const res = await validateOrActionQrPass(gateInputCode, action);
    setGateResult({
      ok: res.success,
      code: res.code,
      message: res.message,
      reservation: res.data,
    });
  };

  const activeWaitlist = useMemo(
    () => waitlist.filter((w) => w.status === 'waiting' || w.status === 'notified'),
    [waitlist]
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div>
          <p className="text-xs font-medium text-slate-500">
            Server-Validated Conflict Control · Arrival Grace Period: {settings.gracePeriodMinutes} mins
          </p>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight mt-0.5">
            Smart Reservations, QR Parking Pass &amp; Waitlist
          </h2>
          <p className="text-sm text-slate-600 mt-1">
            Reserve available slots without time overlaps, generate cryptographic QR parking passes, validate gate entry/exit, and manage automated waitlist releases.
          </p>
        </div>

        <button
          id="run-noshow-sweep-btn"
          onClick={() => processNoShows()}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition-colors whitespace-nowrap shrink-0"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Release Overdue No-Show Passes</span>
        </button>
      </div>

      {/* TOP SPLIT: Booking Form (7 cols) + Active QR Pass Card (5 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Booking Form */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-5 space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <CalendarCheck className="w-4 h-4 text-blue-600" />
              <span>Reserve a Campus Parking Slot</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Overlapping bookings on the same slot are blocked on both client and backend server.
            </p>
          </div>

          {bookingMsg && (
            <div
              className={`p-3 rounded-lg border text-xs font-semibold flex items-center gap-2 ${
                bookingMsg.ok
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  : 'bg-rose-50 border-rose-200 text-rose-800'
              }`}
            >
              {bookingMsg.ok ? (
                <CheckCircle2 className="w-4 h-4 shrink-0" />
              ) : (
                <XCircle className="w-4 h-4 shrink-0" />
              )}
              <span>{bookingMsg.text}</span>
            </div>
          )}

          <form onSubmit={handleCreateBooking} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Vehicle Category
                </label>
                <select
                  value={vehicleType}
                  onChange={(e) => {
                    setVehicleType(e.target.value as VehicleType);
                    setSlotId('');
                  }}
                  className="w-full px-3 py-2 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-lg"
                >
                  <option value="car">Car (${settings.carHourlyRate}/hr)</option>
                  <option value="bike">Bike (${settings.bikeHourlyRate}/hr)</option>
                  <option value="staff">Staff Vehicle (${settings.staffHourlyRate}/hr)</option>
                  <option value="visitor">Visitor (${settings.visitorHourlyRate}/hr)</option>
                  <option value="bus">Bus (${settings.busHourlyRate}/hr)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Nearest Campus Building
                </label>
                <select
                  value={targetBuildingId}
                  onChange={(e) => setTargetBuildingId(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-lg"
                >
                  {CAMPUS_BUILDINGS.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Arrival Date &amp; Time
                </label>
                <input
                  type="datetime-local"
                  value={startLocal}
                  onChange={(e) => setStartLocal(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-mono bg-slate-50 border border-slate-200 rounded-lg"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Booking Duration
                </label>
                <select
                  value={durationHours}
                  onChange={(e) => setDurationHours(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-lg"
                >
                  <option value={1}>1 Hour</option>
                  <option value={2}>2 Hours</option>
                  <option value={3}>3 Hours</option>
                  <option value={4}>4 Hours</option>
                  <option value={6}>6 Hours</option>
                  <option value={8}>8 Hours (Full Academic Day)</option>
                </select>
              </div>
            </div>

            {recommendedForBooking && (
              <div className="p-2.5 rounded-lg bg-blue-50/70 border border-blue-200 text-xs text-blue-900 flex items-center justify-between gap-2">
                <span>{recommendedForBooking.reasonSummary}</span>
                <button
                  type="button"
                  onClick={() => setSlotId(recommendedForBooking.slot.id)}
                  className="px-2.5 py-1 rounded bg-blue-600 text-white font-semibold whitespace-nowrap shrink-0"
                >
                  Select {recommendedForBooking.slot.slotNumber}
                </button>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <div className="flex items-center justify-between mb-1 text-xs">
                  <label className="font-semibold text-slate-700">Available Non-Overlapping Slot</label>
                  <span className="text-emerald-600 font-semibold tabular-nums">
                    {eligibleSlots.length} open
                  </span>
                </div>
                {eligibleSlots.length === 0 ? (
                  <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs">
                    All {vehicleType} bays are booked in this window. Join the Smart Waitlist below!
                  </div>
                ) : (
                  <select
                    value={slotId}
                    onChange={(e) => setSlotId(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-mono font-bold bg-slate-50 border border-slate-200 rounded-lg"
                  >
                    {eligibleSlots.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.slotNumber} · {s.zoneId.replace('ZONE_', 'Zone ')} (
                        {s.distanceToBuildings[targetBuildingId]}m walk)
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Vehicle License Plate *
                </label>
                <input
                  type="text"
                  value={licensePlate}
                  onChange={(e) => setLicensePlate(e.target.value.toUpperCase())}
                  placeholder="CA-8412-HP"
                  className="w-full px-3 py-2 text-xs font-mono font-bold bg-slate-50 border border-slate-200 rounded-lg uppercase"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Vehicle Make / Model (Optional)
              </label>
              <input
                type="text"
                value={vehicleModel}
                onChange={(e) => setVehicleModel(e.target.value)}
                placeholder="e.g. Honda Civic Hybrid"
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg"
              />
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
              <span className="text-xs text-slate-500">
                Grace period: Check in within <strong>{settings.gracePeriodMinutes} mins</strong> of start time.
              </span>
              <button
                type="submit"
                disabled={eligibleSlots.length === 0 || submitting}
                className="px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold text-xs transition-colors whitespace-nowrap"
              >
                {submitting ? 'Validating...' : 'Confirm & Generate QR Pass'}
              </button>
            </div>
          </form>
        </div>

        {/* Digital QR Parking Pass Viewer */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-5 flex flex-col justify-between">
          {activePassReservation ? (
            <>
              <div>
                <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
                  <div>
                    <span className="text-xs font-medium text-slate-500">Digital QR Parking Pass</span>
                    <h3 className="text-base font-bold text-slate-900 font-mono">
                      {activePassReservation.id} · Slot {activePassReservation.slotNumber}
                    </h3>
                  </div>
                  <span
                    className={`text-xs font-bold capitalize px-2.5 py-1 rounded-md ${
                      activePassReservation.status === 'confirmed'
                        ? 'bg-blue-50 text-blue-700'
                        : activePassReservation.status === 'checked_in'
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {activePassReservation.status.replace('_', ' ')}
                  </span>
                </div>

                <div className="flex flex-col items-center p-4 rounded-xl bg-slate-50 border border-slate-200">
                  {qrDataUrl ? (
                    <img
                      src={qrDataUrl}
                      alt={`QR Parking Pass ${activePassReservation.qrPassCode}`}
                      referrerPolicy="no-referrer"
                      className="w-40 h-40 rounded-lg border border-slate-200 bg-white p-2"
                    />
                  ) : (
                    <div className="w-40 h-40 rounded-lg border border-slate-200 bg-white flex items-center justify-center">
                      <QrCode className="w-12 h-12 text-slate-400" />
                    </div>
                  )}
                  <div className="mt-2.5 font-mono text-xs font-bold text-slate-900 tracking-wide">
                    {activePassReservation.qrPassCode}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    {activePassReservation.driverName} · {activePassReservation.licensePlate}
                  </div>
                </div>

                <div className="mt-4 space-y-1.5 text-xs tabular-nums">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Zone</span>
                    <span className="font-semibold text-slate-800">
                      {activePassReservation.zoneName}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Window</span>
                    <span className="font-medium text-slate-800">
                      {new Date(activePassReservation.startTime).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}{' '}
                      –{' '}
                      {new Date(activePassReservation.endTime).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Grace Window</span>
                    <span className="text-slate-700">
                      {activePassReservation.gracePeriodMinutes} mins past start
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-4 mt-4 border-t border-slate-100 flex flex-wrap items-center gap-2">
                {activePassReservation.status === 'confirmed' && (
                  <>
                    <button
                      onClick={() => {
                        setGateInputCode(activePassReservation.qrPassCode);
                        validateOrActionQrPass(activePassReservation.qrPassCode, 'checkin');
                      }}
                      className="flex-1 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-colors"
                    >
                      QR Check-In
                    </button>
                    <button
                      onClick={() => cancelReservation(activePassReservation.id)}
                      className="flex-1 py-2 rounded-lg border border-rose-200 text-rose-700 hover:bg-rose-50 text-xs font-semibold transition-colors"
                    >
                      Cancel Pass
                    </button>
                  </>
                )}
                {activePassReservation.status === 'checked_in' && (
                  <button
                    onClick={() => {
                      setGateInputCode(activePassReservation.qrPassCode);
                      validateOrActionQrPass(activePassReservation.qrPassCode, 'checkout');
                    }}
                    className="w-full py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold transition-colors"
                  >
                    QR Check-Out &amp; Settle Fee
                  </button>
                )}
              </div>
            </>
          ) : null}
        </div>
      </div>

      {/* SERVER-SIDE QR PASS VALIDATOR & GATE TERMINAL */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Gate QR Pass Validator (Server-Side Verification)</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Enter any QR Pass token or select a test preset below to verify how the server rejects invalid, expired, cancelled, overdue, or already-used passes.
            </p>
          </div>
        </div>

        {/* Quick Test Presets */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          <span className="text-slate-500 font-medium mr-1">Test Pass Presets:</span>
          {[
            { label: 'Valid Confirmed (RES-1002)', code: 'SMP-PASS-1002-CONF742' },
            { label: 'Checked-In Active (RES-1001)', code: 'SMP-PASS-1001-ACTIVE88' },
            { label: 'Grace Exceeded (RES-1004)', code: 'SMP-PASS-1004-OVERDUE' },
            { label: 'Expired Pass (RES-1005)', code: 'SMP-PASS-1005-EXPIRED' },
            { label: 'Cancelled Pass (RES-1006)', code: 'SMP-PASS-1006-CANCEL0' },
            { label: 'Already Used (RES-1007)', code: 'SMP-PASS-1007-USED999' },
            { label: 'Invalid / Forged Code', code: 'SMP-PASS-9999-FORGED00' },
          ].map((preset) => (
            <button
              key={preset.code}
              type="button"
              onClick={() => {
                setGateInputCode(preset.code);
                setGateResult(null);
              }}
              className={`px-2.5 py-1 rounded-md border text-[11px] font-medium transition-colors whitespace-nowrap ${
                gateInputCode === preset.code
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
          <input
            type="text"
            value={gateInputCode}
            onChange={(e) => setGateInputCode(e.target.value.toUpperCase())}
            placeholder="Enter QR Pass Code (e.g. SMP-PASS-1002-CONF742)"
            className="flex-1 px-3.5 py-2 text-sm font-mono font-bold bg-slate-50 border border-slate-200 rounded-lg uppercase"
          />
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleGateAction('verify')}
              className="px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold whitespace-nowrap"
            >
              Verify Pass
            </button>
            <button
              type="button"
              onClick={() => handleGateAction('checkin')}
              className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold whitespace-nowrap"
            >
              Gate Check-In
            </button>
            <button
              type="button"
              onClick={() => handleGateAction('checkout')}
              className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold whitespace-nowrap"
            >
              Gate Check-Out
            </button>
          </div>
        </div>

        {gateResult && (
          <div
            className={`p-3.5 rounded-lg border text-xs flex items-start gap-2.5 ${
              gateResult.ok
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                : 'bg-rose-50 border-rose-200 text-rose-900'
            }`}
          >
            {gateResult.ok ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            )}
            <div>
              <div className="font-bold">
                Server Response {gateResult.code ? `(${gateResult.code})` : ''}
              </div>
              <p className="mt-0.5">{gateResult.message}</p>
            </div>
          </div>
        )}
      </div>

      {/* RESERVATIONS TABLE + SMART WAITLIST */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* All Reservations List (7 cols) */}
        <div className="xl:col-span-7 bg-white border border-slate-200 rounded-xl p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <h3 className="text-base font-bold text-slate-900">Reservations Ledger</h3>
            <div className="flex items-center bg-slate-100 p-1 rounded-lg text-xs font-medium">
              {(['active', 'all', 'history'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setPassListFilter(tab)}
                  className={`px-3 py-1 rounded-md capitalize transition-colors ${
                    passListFilter === tab
                      ? 'bg-white text-slate-900 font-semibold shadow-2xs'
                      : 'text-slate-600'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs tabular-nums">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 font-semibold">
                  <th className="pb-2.5 pr-3">Pass / ID</th>
                  <th className="pb-2.5 px-3">Slot</th>
                  <th className="pb-2.5 px-3">Driver / Plate</th>
                  <th className="pb-2.5 px-3">Window</th>
                  <th className="pb-2.5 px-3">Status</th>
                  <th className="pb-2.5 pl-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredReservations.map((r) => (
                  <tr
                    key={r.id}
                    onClick={() => setSelectedPassResId(r.id)}
                    className={`cursor-pointer hover:bg-slate-50 transition-colors ${
                      selectedPassResId === r.id ? 'bg-blue-50/40' : ''
                    }`}
                  >
                    <td className="py-2.5 pr-3">
                      <div className="font-mono font-bold text-slate-900">{r.id}</div>
                      <div className="text-[10px] font-mono text-slate-500">{r.qrPassCode}</div>
                    </td>
                    <td className="py-2.5 px-3 font-mono font-semibold text-slate-900">
                      {r.slotNumber}
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="font-semibold text-slate-800">{r.driverName}</div>
                      <div className="font-mono text-[11px] text-slate-500">{r.licensePlate}</div>
                    </td>
                    <td className="py-2.5 px-3 text-slate-600">
                      {new Date(r.startTime).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="py-2.5 px-3 capitalize font-semibold">
                      <span
                        className={
                          r.status === 'confirmed'
                            ? 'text-blue-600'
                            : r.status === 'checked_in'
                            ? 'text-emerald-600'
                            : r.status === 'cancelled' || r.status === 'no_show'
                            ? 'text-rose-600'
                            : 'text-slate-500'
                        }
                      >
                        {r.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-2.5 pl-3 text-right">
                      {r.status === 'confirmed' && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            cancelReservation(r.id);
                          }}
                          className="text-rose-600 hover:underline font-semibold"
                        >
                          Cancel
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Smart Waitlist Queue & Join Form (5 cols) */}
        <div className="xl:col-span-5 bg-white border border-slate-200 rounded-xl p-5 space-y-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-600" />
              <span>Smart Waitlist Queue</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              When a slot opens via checkout, cancellation, or no-show release, the next eligible user on the waitlist is automatically assigned the slot and notified in-app.
            </p>
          </div>

          <form
            onSubmit={async (e) => {
              e.preventDefault();
              await joinWaitlist({
                vehicleType: wlVehicleType,
                preferredZoneId: wlZoneId,
                licensePlate: wlPlate,
              });
            }}
            className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 space-y-3"
          >
            <div className="text-xs font-bold text-slate-800">Join Waitlist</div>
            <div className="grid grid-cols-3 gap-2">
              <select
                value={wlVehicleType}
                onChange={(e) => setWlVehicleType(e.target.value as VehicleType)}
                className="px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-md font-medium"
              >
                <option value="car">Car</option>
                <option value="bike">Bike</option>
                <option value="staff">Staff</option>
                <option value="visitor">Visitor</option>
              </select>

              <select
                value={wlZoneId}
                onChange={(e) => setWlZoneId(e.target.value as CampusZoneId | 'ANY')}
                className="px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-md font-medium"
              >
                <option value="ANY">Any Zone</option>
                {CAMPUS_ZONES.filter((z) => z.id !== 'ZONE_E').map((z) => (
                  <option key={z.id} value={z.id}>
                    {z.shortName}
                  </option>
                ))}
              </select>

              <input
                type="text"
                value={wlPlate}
                onChange={(e) => setWlPlate(e.target.value.toUpperCase())}
                placeholder="Plate"
                className="px-2.5 py-1.5 text-xs font-mono font-bold bg-white border border-slate-200 rounded-md uppercase"
              />
            </div>
            <button
              type="submit"
              className="w-full py-2 rounded-md bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition-colors"
            >
              Join Waitlist Queue
            </button>
          </form>

          <div className="space-y-2">
            {activeWaitlist.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-500 border border-dashed border-slate-200 rounded-lg">
                No users currently waiting in queue.
              </div>
            ) : (
              activeWaitlist.map((w, idx) => (
                <div
                  key={w.id}
                  className="p-3 rounded-lg border border-slate-200 flex items-center justify-between gap-2 text-xs"
                >
                  <div>
                    <div className="font-bold text-slate-900">
                      #{idx + 1} · {w.userName} ({w.licensePlate})
                    </div>
                    <div className="text-[11px] text-slate-500 capitalize">
                      {w.vehicleType} · Zone: {w.preferredZoneId === 'ANY' ? 'Any' : w.preferredZoneId.replace('ZONE_', 'Zone ')}
                    </div>
                    {w.status === 'notified' && w.offeredSlotId && (
                      <div className="text-[11px] font-semibold text-emerald-700 mt-0.5">
                        Assigned Slot {w.offeredSlotId} (Reservation {w.offeredReservationId})
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className={`font-semibold capitalize ${
                        w.status === 'notified' ? 'text-emerald-600' : 'text-amber-600'
                      }`}
                    >
                      {w.status === 'notified' ? 'Slot Allocated' : 'Waiting'}
                    </span>
                    {w.status === 'waiting' && (
                      <button
                        onClick={() => leaveWaitlist(w.id)}
                        className="text-slate-400 hover:text-rose-600"
                        title="Remove from waitlist"
                      >
                        <XCircle className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
