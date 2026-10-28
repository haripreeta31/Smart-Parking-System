import React, { useState, useEffect } from 'react';
import {
  DollarSign,
  Save,
  CheckCircle2,
  Sliders,
  Lock,
  ShieldAlert,
} from 'lucide-react';
import { useParking } from '../../context/ParkingContext';

export const SettingsView: React.FC = () => {
  const { settings, updateSettings, currentUser, switchUser } = useParking();

  const [carRate, setCarRate] = useState<number>(settings.carHourlyRate);
  const [bikeRate, setBikeRate] = useState<number>(settings.bikeHourlyRate);
  const [staffRate, setStaffRate] = useState<number>(settings.staffHourlyRate);
  const [visitorRate, setVisitorRate] = useState<number>(settings.visitorHourlyRate);
  const [busRate, setBusRate] = useState<number>(settings.busHourlyRate);
  const [sysName, setSysName] = useState<string>(settings.systemName);
  const [gateMode, setGateMode] = useState<'auto' | 'manual'>(settings.gateMode);
  const [overstay, setOverstay] = useState<number>(settings.overstayLimitHours);
  const [gracePeriod, setGracePeriod] = useState<number>(settings.gracePeriodMinutes);
  const [savedAlert, setSavedAlert] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');

  useEffect(() => {
    setCarRate(settings.carHourlyRate);
    setBikeRate(settings.bikeHourlyRate);
    setStaffRate(settings.staffHourlyRate);
    setVisitorRate(settings.visitorHourlyRate);
    setBusRate(settings.busHourlyRate);
    setSysName(settings.systemName);
    setGateMode(settings.gateMode);
    setOverstay(settings.overstayLimitHours);
    setGracePeriod(settings.gracePeriodMinutes);
  }, [settings]);

  const isAdmin = currentUser.role === 'admin';

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    const result = await updateSettings({
      carHourlyRate: Number(carRate),
      bikeHourlyRate: Number(bikeRate),
      staffHourlyRate: Number(staffRate),
      visitorHourlyRate: Number(visitorRate),
      busHourlyRate: Number(busRate),
      systemName: sysName,
      gateMode,
      overstayLimitHours: Number(overstay),
      gracePeriodMinutes: Number(gracePeriod),
    });

    if (result.success) {
      setSavedAlert(true);
      setTimeout(() => setSavedAlert(false), 3000);
    } else {
      setErrorMsg(result.message);
    }
  };

  if (!isAdmin) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-8 max-w-2xl mx-auto text-center space-y-4">
        <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
          <Lock className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">Administrator Permission Required</h2>
        <p className="text-sm text-slate-600">
          You are currently signed in as <strong>{currentUser.name}</strong> ({currentUser.role}). Only authorized Campus Administrators can modify parking tariffs, arrival grace periods, and gate policies.
        </p>
        <div className="flex items-center justify-center gap-3 pt-2">
          <button
            onClick={() => switchUser('usr-admin-1')}
            className="px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition-colors"
          >
            Switch to Admin Account (John Cooper)
          </button>
          <button
            onClick={async () => {
              const res = await updateSettings({ gracePeriodMinutes: 30 });
              if (!res.success) setErrorMsg(res.message);
            }}
            className="px-4 py-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors"
          >
            Test Server 403 Rejection
          </button>
        </div>
        {errorMsg && (
          <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-center justify-center gap-2">
            <ShieldAlert className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6">
        <p className="text-xs font-medium text-slate-500">Administrator Configuration</p>
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight mt-0.5">
          Facility, Tariffs &amp; Reservation Grace Period
        </h2>
        <p className="text-sm text-slate-600 mt-1">
          Configure hourly category rates, reservation no-show grace periods, and overstay thresholds.
        </p>
      </div>

      {savedAlert && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-3 text-emerald-800 text-xs font-semibold">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Configuration saved on server and synchronized across all calculations.</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-semibold">
          {errorMsg}
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        <div className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 space-y-4">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-emerald-600" />
            <span>Hourly Category Tariffs ($/hr)</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {[
              { label: 'Cars', val: carRate, set: setCarRate },
              { label: 'Bikes', val: bikeRate, set: setBikeRate },
              { label: 'Staff Vehicles', val: staffRate, set: setStaffRate },
              { label: 'Visitors', val: visitorRate, set: setVisitorRate },
              { label: 'Buses', val: busRate, set: setBusRate },
            ].map((item) => (
              <div key={item.label}>
                <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                  {item.label}
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">
                    $
                  </span>
                  <input
                    type="number"
                    step="0.25"
                    min="0"
                    value={item.val}
                    onChange={(e) => item.set(parseFloat(e.target.value) || 0)}
                    className="w-full pl-7 pr-3 py-2 text-sm font-mono font-semibold bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-600 tabular-nums"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 space-y-4">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Sliders className="w-4 h-4 text-blue-600" />
            <span>Reservation Grace Period &amp; Gate Rules</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                Facility Display Name
              </label>
              <input
                type="text"
                value={sysName}
                onChange={(e) => setSysName(e.target.value)}
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                Reservation Check-In Grace Period (Minutes)
              </label>
              <input
                type="number"
                min="1"
                max="120"
                value={gracePeriod}
                onChange={(e) => setGracePeriod(parseInt(e.target.value) || 15)}
                className="w-full px-3.5 py-2 text-sm font-mono bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-600 tabular-nums"
              />
              <span className="text-[11px] text-slate-500 mt-1 block">
                Unclaimed reservations exceeding this grace window are released for waitlisted users.
              </span>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                Gate Operation Mode
              </label>
              <select
                value={gateMode}
                onChange={(e) => setGateMode(e.target.value as 'auto' | 'manual')}
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden"
              >
                <option value="auto">QR Pass &amp; Digital Gate Verification</option>
                <option value="manual">Manual Attendant Verification</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                Overstay Alert Threshold (Hours)
              </label>
              <input
                type="number"
                min="1"
                max="72"
                value={overstay}
                onChange={(e) => setOverstay(parseInt(e.target.value) || 12)}
                className="w-full px-3.5 py-2 text-sm font-mono bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden tabular-nums"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition-colors"
          >
            <Save className="w-4 h-4" />
            <span>Save Configuration</span>
          </button>
        </div>
      </form>
    </div>
  );
};
