import React, { useState, useMemo } from 'react';
import {
  Navigation,
  MapPin,
  Clock,
  Search,
  LogOut,
  CheckCircle2,
  Footprints,
  PlusCircle,
} from 'lucide-react';
import { useParking } from '../../context/ParkingContext';
import { CAMPUS_BUILDINGS, CAMPUS_GATES, CAMPUS_ZONES } from '../../data/initialData';

export const FindMyVehicleView: React.FC = () => {
  const {
    currentUser,
    slots,
    lastCheckedInSlotId,
    setLastCheckedInSlotId,
    vacateSlot,
    setIsParkModalOpen,
    setActiveTab,
    setMapHighlightedSlotId,
  } = useParking();

  const [startingPointId, setStartingPointId] = useState<string>('BLD_LIBRARY');
  const [plateSearch, setPlateSearch] = useState<string>('');
  const [checkingOut, setCheckingOut] = useState<boolean>(false);

  // All currently parked vehicles
  const occupiedSlots = useMemo(
    () => slots.filter((s) => s.status === 'occupied' && s.currentVehicle),
    [slots]
  );

  // Active sessions belonging to current user (or matching plate search)
  const myParkedSlots = useMemo(() => {
    return occupiedSlots.filter(
      (s) =>
        s.currentVehicle?.driverName?.toLowerCase() === currentUser.name.toLowerCase() ||
        s.currentVehicle?.licensePlate.toUpperCase() === currentUser.defaultPlate.toUpperCase() ||
        s.id === lastCheckedInSlotId
    );
  }, [occupiedSlots, currentUser, lastCheckedInSlotId]);

  // Active selected parked vehicle slot
  const activeSessionSlot = useMemo(() => {
    if (plateSearch.trim()) {
      const q = plateSearch.trim().toLowerCase();
      const found = occupiedSlots.find(
        (s) =>
          s.currentVehicle?.licensePlate.toLowerCase().includes(q) ||
          s.slotNumber.toLowerCase() === q ||
          s.currentVehicle?.ticketNumber.toLowerCase().includes(q)
      );
      if (found) return found;
    }
    if (lastCheckedInSlotId) {
      const saved = occupiedSlots.find((s) => s.id === lastCheckedInSlotId);
      if (saved) return saved;
    }
    return myParkedSlots[0] || occupiedSlots[0] || null;
  }, [plateSearch, lastCheckedInSlotId, occupiedSlots, myParkedSlots]);

  const startLocations = useMemo(
    () => [
      ...CAMPUS_BUILDINGS.map((b) => ({
        id: b.id,
        name: b.name,
        coordinates: b.coordinates,
      })),
      ...CAMPUS_GATES.map((g) => ({
        id: g.id,
        name: g.name,
        coordinates: g.coordinates,
      })),
    ],
    []
  );

  const selectedOrigin = useMemo(
    () => startLocations.find((l) => l.id === startingPointId) || startLocations[0],
    [startLocations, startingPointId]
  );

  // Simulated campus pedestrian pathway calculation (orthogonal campus walkway waypoints)
  const routeDetails = useMemo(() => {
    if (!activeSessionSlot || !selectedOrigin) return null;
    const start = selectedOrigin.coordinates;
    const end = activeSessionSlot.coordinates;

    // Route along central campus spine (x=485) or cross-avenue (y=295) for realistic campus walkway path
    const mid1 = { x: start.x, y: 295 };
    const mid2 = { x: end.x, y: 295 };

    const seg1 = Math.hypot(mid1.x - start.x, mid1.y - start.y);
    const seg2 = Math.hypot(mid2.x - mid1.x, mid2.y - mid1.y);
    const seg3 = Math.hypot(end.x - mid2.x, end.y - mid2.y);

    const walkMeters = Math.max(25, Math.round((seg1 + seg2 + seg3) * 0.62));
    const walkMinutes = Math.max(1, Math.round(walkMeters / 75));

    const steps = [
      `Depart ${selectedOrigin.name} and enter the paved Campus Pedestrian Spine.`,
      `Follow signs toward ${activeSessionSlot.zoneName} (${activeSessionSlot.floorName}).`,
      `Pass ${activeSessionSlot.nearbyLandmark} and proceed to Row ${activeSessionSlot.slotNumber.split('-')[0]}.`,
      `Arrive at Slot ${activeSessionSlot.slotNumber} (${activeSessionSlot.currentVehicle?.licensePlate}).`,
    ];

    return {
      pointsSvg: `${start.x},${start.y} ${mid1.x},${mid1.y} ${mid2.x},${mid2.y} ${end.x},${end.y}`,
      walkMeters,
      walkMinutes,
      steps,
    };
  }, [activeSessionSlot, selectedOrigin]);

  let elapsedText = '0 mins';
  let accruedFee = 0;
  if (activeSessionSlot?.currentVehicle) {
    const mins = Math.max(
      1,
      Math.round((Date.now() - new Date(activeSessionSlot.currentVehicle.entryTime).getTime()) / 60000)
    );
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    elapsedText = `${h > 0 ? `${h}h ` : ''}${m}m`;
    accruedFee =
      Math.round(
        Math.max(mins / 60, 0.5) * activeSessionSlot.currentVehicle.ratePerHour * 100
      ) / 100;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div>
          <p className="text-xs font-medium text-slate-500">
            Active Session Locator · Simulated Campus Pedestrian Navigation
          </p>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight mt-0.5">
            Find My Parked Vehicle
          </h2>
          <p className="text-sm text-slate-600 mt-1">
            View your saved check-in parking bay, nearby campus landmark, and step-by-step walking route from any campus building.
          </p>
        </div>

        {/* Lookup by Plate or Switch Active Session */}
        <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Lookup plate (e.g. CA-8412-HP) or slot..."
              value={plateSearch}
              onChange={(e) => setPlateSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-600"
            />
          </div>
          {myParkedSlots.length > 0 && (
            <button
              onClick={() => {
                setPlateSearch('');
                setLastCheckedInSlotId(myParkedSlots[0].id);
              }}
              className="px-3.5 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold whitespace-nowrap"
            >
              My Latest Session ({myParkedSlots[0].slotNumber})
            </button>
          )}
        </div>
      </div>

      {!activeSessionSlot || !activeSessionSlot.currentVehicle ? (
        <div className="bg-white border border-slate-200 rounded-xl p-10 text-center space-y-3">
          <Navigation className="w-8 h-8 text-slate-400 mx-auto" />
          <h3 className="text-base font-bold text-slate-900">No Active Parked Vehicle Found</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Check in a vehicle via Walk-In Check-In or QR Pass Check-In, and your assigned parking slot will automatically appear here.
          </p>
          <button
            onClick={() => setIsParkModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 text-white text-xs font-semibold"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Check In Vehicle</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
          {/* Left Column: Vehicle & Route Instructions (5 cols) */}
          <div className="xl:col-span-5 space-y-5">
            {/* Active Session Card */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
              <div className="flex items-start justify-between border-b border-slate-100 pb-3">
                <div>
                  <span className="text-xs font-semibold text-emerald-700 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Active Parking Session
                  </span>
                  <h3 className="text-2xl font-bold font-mono text-slate-900 mt-1">
                    {activeSessionSlot.currentVehicle.licensePlate}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {activeSessionSlot.currentVehicle.model} · Driver:{' '}
                    {activeSessionSlot.currentVehicle.driverName}
                  </p>
                </div>

                <div className="text-right">
                  <span className="text-[11px] text-slate-500 block">Assigned Bay</span>
                  <span className="text-xl font-bold font-mono text-blue-600">
                    {activeSessionSlot.slotNumber}
                  </span>
                </div>
              </div>

              <div className="space-y-2 text-xs tabular-nums">
                <div className="flex justify-between">
                  <span className="text-slate-500">Parking Zone</span>
                  <span className="font-semibold text-slate-900">{activeSessionSlot.zoneName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Deck / Level</span>
                  <span className="font-semibold text-slate-900">
                    {activeSessionSlot.floorName}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Nearby Landmark</span>
                  <span className="font-semibold text-slate-900 text-right max-w-[220px]">
                    {activeSessionSlot.nearbyLandmark}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Check-In Time</span>
                  <span className="text-slate-800">
                    {new Date(activeSessionSlot.currentVehicle.entryTime).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}{' '}
                    ({elapsedText} elapsed)
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Current Accrued Fee</span>
                  <span className="font-mono font-bold text-slate-900">
                    ${accruedFee.toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 grid grid-cols-2 gap-2.5">
                <button
                  onClick={() => {
                    setMapHighlightedSlotId(activeSessionSlot.id);
                    setActiveTab('campus-map');
                  }}
                  className="flex items-center justify-center gap-1.5 py-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs transition-colors"
                >
                  <MapPin className="w-3.5 h-3.5" />
                  <span>Inspect on Map</span>
                </button>
                <button
                  disabled={checkingOut}
                  onClick={async () => {
                    setCheckingOut(true);
                    await vacateSlot(activeSessionSlot.id);
                    setCheckingOut(false);
                  }}
                  className="flex items-center justify-center gap-1.5 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Check Out (${accruedFee.toFixed(2)})</span>
                </button>
              </div>
            </div>

            {/* Walking Route Planner */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
              <div>
                <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Footprints className="w-4 h-4 text-blue-600" />
                  <span>Walking Route to Parked Vehicle</span>
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Select your current location on campus to display simulated pedestrian directions.
                </p>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                  Starting Campus Point
                </label>
                <select
                  value={startingPointId}
                  onChange={(e) => setStartingPointId(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-lg"
                >
                  {startLocations.map((loc) => (
                    <option key={loc.id} value={loc.id}>
                      {loc.name}
                    </option>
                  ))}
                </select>
              </div>

              {routeDetails && (
                <>
                  <div className="grid grid-cols-2 gap-3 p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs tabular-nums">
                    <div>
                      <span className="text-slate-500 block">Walking Distance</span>
                      <span className="text-base font-bold text-slate-900">
                        ~{routeDetails.walkMeters} meters
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Estimated Walk Time</span>
                      <span className="text-base font-bold text-blue-600">
                        {routeDetails.walkMinutes} min walk
                      </span>
                    </div>
                  </div>

                  <ol className="space-y-2 text-xs text-slate-700">
                    {routeDetails.steps.map((step, i) => (
                      <li key={i} className="flex items-start gap-2.5">
                        <span className="w-5 h-5 rounded-full bg-slate-900 text-white text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                          {i + 1}
                        </span>
                        <span>{step}</span>
                      </li>
                    ))}
                  </ol>
                </>
              )}
            </div>
          </div>

          {/* Right Column: Simulated Campus Route Map (7 cols) */}
          <div className="xl:col-span-7 bg-white border border-slate-200 rounded-xl p-5 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Simulated Campus Pedestrian Navigation Map
                </h3>
                <p className="text-xs text-slate-500">
                  Showing route from <strong>{selectedOrigin.name}</strong> to{' '}
                  <strong>Slot {activeSessionSlot.slotNumber}</strong> (Simulated map — not live GPS)
                </p>
              </div>
              <span className="text-xs font-mono font-semibold text-blue-700">
                Target: {activeSessionSlot.slotNumber}
              </span>
            </div>

            <div className="w-full overflow-x-auto rounded-lg border border-slate-200 bg-slate-50">
              <svg
                viewBox="0 0 1000 620"
                className="w-full min-w-[600px] h-auto block"
                role="img"
                aria-label="Simulated Campus Route to Parked Vehicle"
              >
                <rect x="0" y="0" width="1000" height="620" fill="#f8fafc" />

                {/* Campus Walkways */}
                <path
                  d="M 485 35 L 485 590 M 90 295 L 910 295 M 90 135 L 910 135 M 90 430 L 910 430"
                  stroke="#e2e8f0"
                  strokeWidth="14"
                  strokeLinecap="round"
                  fill="none"
                />

                {/* Zones */}
                {CAMPUS_ZONES.map((z) => {
                  const isVehicleZone = z.id === activeSessionSlot.zoneId;
                  return (
                    <g key={z.id}>
                      <rect
                        x={z.bounds.x}
                        y={z.bounds.y}
                        width={z.bounds.width}
                        height={z.bounds.height}
                        rx="10"
                        fill={isVehicleZone ? '#eff6ff' : '#ffffff'}
                        stroke={isVehicleZone ? '#2563eb' : '#cbd5e1'}
                        strokeWidth={isVehicleZone ? '2' : '1.2'}
                      />
                      <text
                        x={z.bounds.x + 12}
                        y={z.bounds.y + 16}
                        fill="#334155"
                        fontSize="10"
                        fontWeight="700"
                      >
                        {z.name}
                      </text>
                    </g>
                  );
                })}

                {/* Buildings */}
                {CAMPUS_BUILDINGS.map((b) => {
                  const isOrigin = b.id === selectedOrigin.id;
                  return (
                    <g
                      key={b.id}
                      transform={`translate(${b.coordinates.x}, ${b.coordinates.y})`}
                      onClick={() => setStartingPointId(b.id)}
                      className="cursor-pointer"
                    >
                      <rect
                        x="-78"
                        y="-22"
                        width="156"
                        height="44"
                        rx="8"
                        fill={isOrigin ? '#0f172a' : '#475569'}
                      />
                      <text
                        x="0"
                        y="-2"
                        textAnchor="middle"
                        fill="#ffffff"
                        fontSize="10"
                        fontWeight="700"
                      >
                        {b.shortName}
                      </text>
                      <text x="0" y="12" textAnchor="middle" fill="#cbd5e1" fontSize="8.5">
                        {isOrigin ? 'You Are Here' : 'Click to Start Here'}
                      </text>
                    </g>
                  );
                })}

                {/* Highlighted Pedestrian Route */}
                {routeDetails && (
                  <>
                    <polyline
                      points={routeDetails.pointsSvg}
                      fill="none"
                      stroke="#2563eb"
                      strokeWidth="5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeDasharray="10 6"
                    />
                    <circle
                      cx={selectedOrigin.coordinates.x}
                      cy={selectedOrigin.coordinates.y}
                      r="9"
                      fill="#0f172a"
                      stroke="#ffffff"
                      strokeWidth="2.5"
                    />
                  </>
                )}

                {/* Destination Parked Vehicle Marker */}
                <g
                  transform={`translate(${activeSessionSlot.coordinates.x}, ${activeSessionSlot.coordinates.y})`}
                >
                  <circle cx="0" cy="0" r="16" fill="#16a34a" opacity="0.22" />
                  <circle cx="0" cy="0" r="9" fill="#16a34a" stroke="#ffffff" strokeWidth="2.5" />
                  <rect x="-52" y="-36" width="104" height="22" rx="5" fill="#0f172a" />
                  <text
                    x="0"
                    y="-21"
                    textAnchor="middle"
                    fill="#ffffff"
                    fontSize="10"
                    fontWeight="700"
                  >
                    {activeSessionSlot.slotNumber} ({activeSessionSlot.currentVehicle.licensePlate})
                  </text>
                </g>
              </svg>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
