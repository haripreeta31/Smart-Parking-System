import React, { useState } from 'react';
import {
  Settings,
  DollarSign,
  Car,
  Bus,
  Bike,
  Shield,
  Save,
  CheckCircle2,
  RefreshCw,
  Bell,
  Sliders,
} from 'lucide-react';
import { useParking } from '../../context/ParkingContext';

export const SettingsView: React.FC = () => {
  const { settings, updateSettings } = useParking();

  const [carRate, setCarRate] = useState<number>(settings.carHourlyRate);
  const [busRate, setBusRate] = useState<number>(settings.busHourlyRate);
  const [bikeRate, setBikeRate] = useState<number>(settings.bikeHourlyRate);
  const [sysName, setSysName] = useState<string>(settings.systemName);
  const [gateMode, setGateMode] = useState<'auto' | 'manual'>(settings.gateMode);
  const [overstay, setOverstay] = useState<number>(settings.overstayLimitHours);
  const [savedAlert, setSavedAlert] = useState<boolean>(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings({
      carHourlyRate: Number(carRate),
      busHourlyRate: Number(busRate),
      bikeHourlyRate: Number(bikeRate),
      systemName: sysName,
      gateMode,
      overstayLimitHours: Number(overstay),
    });
    setSavedAlert(true);
    setTimeout(() => setSavedAlert(false), 3000);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300 max-w-4xl">
      {/* Header */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-5 sm:p-6 shadow-xs flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-slate-100 text-slate-700">
              System Configuration
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Facility &amp; Tariff Settings
          </h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Configure hourly parking tariffs, automation barrier preferences, and operational rules.
          </p>
        </div>
      </div>

      {savedAlert && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-3 text-emerald-800 text-sm font-semibold animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          Settings updated successfully! Changes applied to all active calculations.
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Section 1: Hourly Pricing Tariffs */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-emerald-600" />
            Vehicle Hourly Tariff Rates ($/hr)
          </h3>
          <p className="text-xs text-slate-500">
            Rates are automatically applied when calculating parking duration fees at checkout.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            {/* Car Rate */}
            <div className="p-4 rounded-xl border border-blue-100 bg-blue-50/40">
              <label className="text-xs font-bold text-blue-900 flex items-center gap-2 mb-2">
                <Car className="w-4 h-4 text-blue-600" /> Car Hourly Rate
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                <input
                  type="number"
                  step="0.25"
                  min="0.5"
                  value={carRate}
                  onChange={(e) => setCarRate(parseFloat(e.target.value))}
                  className="w-full pl-8 pr-4 py-2 text-sm font-bold bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <span className="text-[11px] text-slate-400 mt-1 block">Default: $4.00 / hr</span>
            </div>

            {/* Bus Rate */}
            <div className="p-4 rounded-xl border border-amber-100 bg-amber-50/40">
              <label className="text-xs font-bold text-amber-900 flex items-center gap-2 mb-2">
                <Bus className="w-4 h-4 text-amber-600" /> Bus Hourly Rate
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                <input
                  type="number"
                  step="0.50"
                  min="1"
                  value={busRate}
                  onChange={(e) => setBusRate(parseFloat(e.target.value))}
                  className="w-full pl-8 pr-4 py-2 text-sm font-bold bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                />
              </div>
              <span className="text-[11px] text-slate-400 mt-1 block">Default: $10.00 / hr</span>
            </div>

            {/* Bike Rate */}
            <div className="p-4 rounded-xl border border-purple-100 bg-purple-50/40">
              <label className="text-xs font-bold text-purple-900 flex items-center gap-2 mb-2">
                <Bike className="w-4 h-4 text-purple-600" /> Bike Hourly Rate
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                <input
                  type="number"
                  step="0.25"
                  min="0.25"
                  value={bikeRate}
                  onChange={(e) => setBikeRate(parseFloat(e.target.value))}
                  className="w-full pl-8 pr-4 py-2 text-sm font-bold bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <span className="text-[11px] text-slate-400 mt-1 block">Default: $1.50 / hr</span>
            </div>
          </div>
        </div>

        {/* Section 2: Gate & Automation Preferences */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Sliders className="w-5 h-5 text-blue-600" />
            Gate Controls &amp; Facility Metadata
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1.5">
                Facility Display Name
              </label>
              <input
                type="text"
                value={sysName}
                onChange={(e) => setSysName(e.target.value)}
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1.5">
                Barrier Gate Operation Mode
              </label>
              <select
                value={gateMode}
                onChange={(e) => setGateMode(e.target.value as 'auto' | 'manual')}
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden"
              >
                <option value="auto">Automated ANPR &amp; Sensor Dispatch</option>
                <option value="manual">Manual Attendant Verification</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1.5">
                Overstay Alert Threshold (Hours)
              </label>
              <input
                type="number"
                min="1"
                max="72"
                value={overstay}
                onChange={(e) => setOverstay(parseInt(e.target.value))}
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden"
              />
            </div>
          </div>
        </div>

        {/* Save button */}
        <div className="flex justify-end">
          <button
            type="submit"
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-sm shadow-xs transition-all"
          >
            <Save className="w-4 h-4" />
            Save Configuration Changes
          </button>
        </div>
      </form>
    </div>
  );
};
