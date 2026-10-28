import React, { useState, useMemo, useEffect } from 'react';
import {
  MapPin,
  Compass,
  Accessibility,
  Zap,
  CheckCircle2,
  CalendarCheck,
  PlusCircle,
  Building2,
  SlidersHorizontal,
} from 'lucide-react';
import { useParking } from '../../context/ParkingContext';
import { CAMPUS_BUILDINGS, CAMPUS_GATES, CAMPUS_ZONES } from '../../data/initialData';
import { recommendBestSlots } from '../../utils/recommendation';
import type { VehicleType, CampusZoneId, ParkingSlot } from '../../types';

export const CampusMapView: React.FC = () => {
  const {
    slots,
    reservations,
    mapHighlightedSlotId,
    setMapHighlightedSlotId,
    setSelectedSlotForModal,
    setPreselectedTypeForParkModal,
    setPreselectedSlotIdForParkModal,
    setIsParkModalOpen,
    setPreselectedSlotForReservation,
    setActiveTab,
  } = useParking();

  // Map filters
  const [zoneFilter, setZoneFilter] = useState<CampusZoneId | 'ALL'>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<VehicleType | 'ALL'>('ALL');

  // Smart Slot Recommendation controls
  const [targetBuildingId, setTargetBuildingId] = useState<string>('BLD_ENGINEERING');
  const [entryGateId, setEntryGateId] = useState<'GATE_A' | 'GATE_B'>('GATE_A');
  const [recVehicleType, setRecVehicleType] = useState<VehicleType>('car');
  const [requireAccessible, setRequireAccessible] = useState<boolean>(false);
  const [preferEv, setPreferEv] = useState<boolean>(false);

  const recommendations = useMemo(
    () =>
      recommendBestSlots(
        slots,
        reservations,
        {
          buildingId: targetBuildingId,
          gateId: entryGateId,
          vehicleType: recVehicleType,
          requireAccessible,
          preferEv,
        },
        4
      ),
    [slots, reservations, targetBuildingId, entryGateId, recVehicleType, requireAccessible, preferEv]
  );

  const topRecommendation = recommendations[0] || null;

  const [selectedSlotId, setSelectedSlotId] = useState<string>(() => {
    return mapHighlightedSlotId || 'A-12';
  });

  useEffect(() => {
    if (mapHighlightedSlotId) {
      setSelectedSlotId(mapHighlightedSlotId);
    }
  }, [mapHighlightedSlotId]);

  const activeSlot: ParkingSlot | undefined = useMemo(
    () => slots.find((s) => s.id === selectedSlotId) || topRecommendation?.slot || slots[0],
    [slots, selectedSlotId, topRecommendation]
  );

  const selectedBuilding = useMemo(
    () => CAMPUS_BUILDINGS.find((b) => b.id === targetBuildingId) || CAMPUS_BUILDINGS[0],
    [targetBuildingId]
  );

  const visibleSlots = useMemo(() => {
    return slots.filter((s) => {
      if (zoneFilter !== 'ALL' && s.zoneId !== zoneFilter) return false;
      if (categoryFilter !== 'ALL' && s.vehicleType !== categoryFilter) return false;
      return true;
    });
  }, [slots, zoneFilter, categoryFilter]);

  const visibleIdSet = useMemo(() => new Set(visibleSlots.map((s) => s.id)), [visibleSlots]);

  const getSlotFill = (status: ParkingSlot['status']) => {
    switch (status) {
      case 'available':
        return '#16a34a'; // Green = Available
      case 'occupied':
        return '#dc2626'; // Red = Occupied
      case 'reserved':
        return '#2563eb'; // Blue = Reserved
      case 'maintenance':
        return '#d97706'; // Yellow/Amber = Temporarily Unavailable
    }
  };

  const getSlotStatusLabel = (status: ParkingSlot['status']) => {
    switch (status) {
      case 'available':
        return 'Available';
      case 'occupied':
        return 'Occupied';
      case 'reserved':
        return 'Reserved';
      case 'maintenance':
        return 'Temporarily Unavailable';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div>
          <p className="text-xs font-medium text-slate-500">
            Sample University Campus Spatial Layout · Zones A–E
          </p>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight mt-0.5">
            Interactive Campus Parking Map &amp; Slot Recommender
          </h2>
          <p className="text-sm text-slate-600 mt-1">
            Inspect all 200 campus parking bays in real time, filter by zone or vehicle category, and calculate the optimal available bay using deterministic distance scoring.
          </p>
        </div>

        {/* Map Filters */}
        <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-semibold mr-1">
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Filter Map:</span>
          </div>
          <select
            aria-label="Filter by parking zone"
            value={zoneFilter}
            onChange={(e) => setZoneFilter(e.target.value as CampusZoneId | 'ALL')}
            className="px-3 py-2 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
          >
            <option value="ALL">All Parking Zones (A–E)</option>
            {CAMPUS_ZONES.map((z) => (
              <option key={z.id} value={z.id}>
                {z.name}
              </option>
            ))}
          </select>

          <select
            aria-label="Filter by vehicle category"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value as VehicleType | 'ALL')}
            className="px-3 py-2 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
          >
            <option value="ALL">All Vehicle Categories</option>
            <option value="car">Cars</option>
            <option value="bike">Bikes</option>
            <option value="staff">Staff Vehicles</option>
            <option value="visitor">Visitors</option>
            <option value="bus">Buses</option>
          </select>
        </div>
      </div>

      {/* SMART SLOT RECOMMENDATION ENGINE */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Compass className="w-4 h-4 text-blue-600" />
              <span>Smart Slot Recommendation (Deterministic Distance &amp; Fit Scoring)</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Transparent multi-factor scoring based on building walking distance, gate proximity, category fit, and accessibility requirements.
            </p>
          </div>
          <span className="text-xs text-slate-500 font-mono whitespace-nowrap">
            Max Score: 100 pts (50 Building + 25 Gate + 15 Amenity + 10 Zone)
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Destination Building
            </label>
            <select
              value={targetBuildingId}
              onChange={(e) => setTargetBuildingId(e.target.value)}
              className="w-full px-3 py-2 text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg"
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
              Campus Entrance Gate
            </label>
            <select
              value={entryGateId}
              onChange={(e) => setEntryGateId(e.target.value as 'GATE_A' | 'GATE_B')}
              className="w-full px-3 py-2 text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg"
            >
              {CAMPUS_GATES.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Vehicle Category
            </label>
            <select
              value={recVehicleType}
              onChange={(e) => setRecVehicleType(e.target.value as VehicleType)}
              className="w-full px-3 py-2 text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg"
            >
              <option value="car">Car</option>
              <option value="bike">Bike</option>
              <option value="staff">Staff Vehicle</option>
              <option value="visitor">Visitor Vehicle</option>
              <option value="bus">Bus</option>
            </select>
          </div>

          <div className="flex items-end">
            <label className="flex items-center gap-2 px-3 py-2 w-full rounded-lg border border-slate-200 bg-slate-50 text-xs font-medium text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={requireAccessible}
                onChange={(e) => setRequireAccessible(e.target.checked)}
                className="rounded border-slate-300"
              />
              <Accessibility className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              <span className="truncate">Accessible Required</span>
            </label>
          </div>

          <div className="flex items-end">
            <label className="flex items-center gap-2 px-3 py-2 w-full rounded-lg border border-slate-200 bg-slate-50 text-xs font-medium text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={preferEv}
                onChange={(e) => setPreferEv(e.target.checked)}
                className="rounded border-slate-300"
              />
              <Zap className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <span className="truncate">Prefer EV Charger</span>
            </label>
          </div>
        </div>

        {/* Recommendation Banner */}
        {topRecommendation ? (
          <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{topRecommendation.reasonSummary}</span>
              </div>
              <div className="text-xs text-slate-600 tabular-nums">
                Zone: <strong>{topRecommendation.slot.zoneName}</strong> · Walk time: ~
                {topRecommendation.walkingMinutes} min ({topRecommendation.distanceToBuildingMeters}m) · Gate distance:{' '}
                {topRecommendation.distanceToGateMeters}m · Composite Score:{' '}
                <strong className="font-mono text-emerald-800">
                  {topRecommendation.totalScore}/100
                </strong>{' '}
                (Bldg {topRecommendation.scoreBreakdown.buildingProximity} + Gate{' '}
                {topRecommendation.scoreBreakdown.gateProximity} + Fit{' '}
                {topRecommendation.scoreBreakdown.accessibilityMatch +
                  topRecommendation.scoreBreakdown.zoneFit}
                )
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <button
                onClick={() => {
                  setSelectedSlotId(topRecommendation.slot.id);
                  setMapHighlightedSlotId(topRecommendation.slot.id);
                }}
                className="px-3 py-2 rounded-lg border border-emerald-300 bg-white hover:bg-emerald-50 text-emerald-900 text-xs font-semibold transition-colors whitespace-nowrap"
              >
                Highlight {topRecommendation.slot.slotNumber} on Map
              </button>
              <button
                onClick={() => {
                  setPreselectedSlotForReservation(topRecommendation.slot.id);
                  setActiveTab('reservations');
                }}
                className="px-3.5 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition-colors whitespace-nowrap"
              >
                Reserve {topRecommendation.slot.slotNumber} (QR Pass)
              </button>
              <button
                onClick={() => {
                  setPreselectedTypeForParkModal(topRecommendation.slot.vehicleType);
                  setPreselectedSlotIdForParkModal(topRecommendation.slot.id);
                  setIsParkModalOpen(true);
                }}
                className="px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-colors whitespace-nowrap"
              >
                Check-In Now
              </button>
            </div>
          </div>
        ) : (
          <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-amber-900">
            <div>
              <p className="font-bold">No matching available bays found for current criteria.</p>
              <p className="mt-0.5">
                Try relaxing the Accessible filter or join the Smart Waitlist for automatic allocation when a bay opens.
              </p>
            </div>
            <button
              onClick={() => setActiveTab('reservations')}
              className="px-3.5 py-2 rounded-lg bg-slate-900 text-white font-semibold whitespace-nowrap shrink-0"
            >
              Join Waitlist &rarr;
            </button>
          </div>
        )}
      </div>

      {/* MAP + SELECTED SLOT INSPECTOR */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* Visual SVG Campus Map (8 cols) */}
        <div className="xl:col-span-8 bg-white border border-slate-200 rounded-xl p-4 sm:p-5 space-y-3">
          {/* Map Legend */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100 text-xs">
            <div className="flex flex-wrap items-center gap-4">
              <span className="font-semibold text-slate-700">Slot Legend:</span>
              <span className="inline-flex items-center gap-1.5 text-slate-700">
                <span className="w-3 h-3 rounded-xs bg-[#16a34a] inline-block" /> Green = Available
              </span>
              <span className="inline-flex items-center gap-1.5 text-slate-700">
                <span className="w-3 h-3 rounded-xs bg-[#dc2626] inline-block" /> Red = Occupied
              </span>
              <span className="inline-flex items-center gap-1.5 text-slate-700">
                <span className="w-3 h-3 rounded-xs bg-[#2563eb] inline-block" /> Blue = Reserved
              </span>
              <span className="inline-flex items-center gap-1.5 text-slate-700">
                <span className="w-3 h-3 rounded-xs bg-[#d97706] inline-block" /> Yellow = Temporarily Unavailable
              </span>
            </div>
            <span className="text-slate-500 tabular-nums">
              {visibleSlots.length} bays shown
            </span>
          </div>

          {/* Responsive Campus SVG Canvas */}
          <div className="w-full overflow-x-auto rounded-lg border border-slate-200 bg-slate-50">
            <svg
              viewBox="0 0 1000 620"
              className="w-full min-w-[680px] h-auto block select-none"
              role="img"
              aria-label="Interactive Campus Parking Map"
            >
              {/* Campus Grounds Base */}
              <rect x="0" y="0" width="1000" height="620" fill="#f8fafc" />

              {/* Decorative Lawn / Quad Blocks */}
              <rect x="445" y="75" width="100" height="480" rx="8" fill="#ecfdf5" opacity="0.55" />
              <rect x="70" y="290" width="380" height="135" rx="8" fill="#f1f5f9" />

              {/* Campus Ring Roads & Entry Lanes */}
              <path
                d="M 485 20 L 485 595 M 75 135 L 925 135 M 75 295 L 925 295 M 75 430 L 925 430 M 640 430 L 640 600"
                stroke="#cbd5e1"
                strokeWidth="16"
                strokeLinecap="round"
                fill="none"
              />
              <path
                d="M 485 20 L 485 595 M 75 135 L 925 135 M 75 295 L 925 295 M 75 430 L 925 430 M 640 430 L 640 600"
                stroke="#ffffff"
                strokeWidth="1.5"
                strokeDasharray="6 6"
                fill="none"
              />

              {/* Entrance Gates */}
              {CAMPUS_GATES.map((gate) => (
                <g key={gate.id} transform={`translate(${gate.coordinates.x}, ${gate.coordinates.y})`}>
                  <rect x="-72" y="-14" width="144" height="28" rx="6" fill="#0f172a" />
                  <text
                    x="0"
                    y="4"
                    textAnchor="middle"
                    fill="#ffffff"
                    fontSize="10"
                    fontWeight="700"
                  >
                    {gate.id === 'GATE_A' ? 'GATE A (NORTH ENTRY)' : 'GATE B (TRANSIT SOUTH)'}
                  </text>
                </g>
              ))}

              {/* Parking Zones (A - E) */}
              {CAMPUS_ZONES.map((zone) => {
                const isZoneSelected = zoneFilter === 'ALL' || zoneFilter === zone.id;
                return (
                  <g key={zone.id} opacity={isZoneSelected ? 1 : 0.25}>
                    <rect
                      x={zone.bounds.x}
                      y={zone.bounds.y}
                      width={zone.bounds.width}
                      height={zone.bounds.height}
                      rx="10"
                      fill="#ffffff"
                      stroke="#94a3b8"
                      strokeWidth="1.5"
                    />
                    <text
                      x={zone.bounds.x + 10}
                      y={zone.bounds.y + 14}
                      fill="#334155"
                      fontSize="10"
                      fontWeight="700"
                    >
                      {zone.name}
                    </text>
                  </g>
                );
              })}

              {/* Campus Buildings */}
              {CAMPUS_BUILDINGS.map((bld) => {
                const isTarget = bld.id === targetBuildingId;
                return (
                  <g
                    key={bld.id}
                    transform={`translate(${bld.coordinates.x}, ${bld.coordinates.y})`}
                    onClick={() => setTargetBuildingId(bld.id)}
                    className="cursor-pointer"
                  >
                    <rect
                      x="-82"
                      y="-24"
                      width="164"
                      height="48"
                      rx="8"
                      fill={isTarget ? '#1e3a8a' : '#1e293b'}
                      stroke={isTarget ? '#3b82f6' : '#0f172a'}
                      strokeWidth={isTarget ? '2.5' : '1'}
                    />
                    <text
                      x="0"
                      y="-3"
                      textAnchor="middle"
                      fill="#ffffff"
                      fontSize="10.5"
                      fontWeight="700"
                    >
                      {bld.shortName}
                    </text>
                    <text
                      x="0"
                      y="12"
                      textAnchor="middle"
                      fill="#cbd5e1"
                      fontSize="8.5"
                    >
                      {isTarget ? 'Selected Destination' : 'Click to Set Target'}
                    </text>
                  </g>
                );
              })}

              {/* Walking Line between Active/Recommended Slot and Target Building */}
              {activeSlot && selectedBuilding && (
                <line
                  x1={activeSlot.coordinates.x}
                  y1={activeSlot.coordinates.y}
                  x2={selectedBuilding.coordinates.x}
                  y2={selectedBuilding.coordinates.y}
                  stroke="#0f172a"
                  strokeWidth="2"
                  strokeDasharray="5 4"
                />
              )}

              {/* All 200 Individual Parking Slots */}
              {slots.map((slot) => {
                const isVisible = visibleIdSet.has(slot.id);
                const isSelected = activeSlot?.id === slot.id;
                const isTopRec = topRecommendation?.slot.id === slot.id;
                const fill = getSlotFill(slot.status);

                return (
                  <g
                    key={slot.id}
                    transform={`translate(${slot.coordinates.x}, ${slot.coordinates.y})`}
                    opacity={isVisible ? 1 : 0.12}
                    onClick={() => {
                      setSelectedSlotId(slot.id);
                      setMapHighlightedSlotId(slot.id);
                    }}
                    className="cursor-pointer"
                  >
                    {(isSelected || isTopRec) && (
                      <rect
                        x="-11"
                        y="-9"
                        width="22"
                        height="18"
                        rx="4"
                        fill="none"
                        stroke={isSelected ? '#0f172a' : '#059669'}
                        strokeWidth="2.2"
                      />
                    )}
                    <rect
                      x="-8"
                      y="-6"
                      width="16"
                      height="12"
                      rx="2.5"
                      fill={fill}
                      stroke="#ffffff"
                      strokeWidth="1"
                    />
                    <title>
                      {`${slot.slotNumber} (${slot.vehicleType.toUpperCase()}) — ${getSlotStatusLabel(
                        slot.status
                      )}`}
                    </title>
                  </g>
                );
              })}
            </svg>
          </div>
        </div>

        {/* Selected Slot & Nearby Buildings Inspector (4 cols) */}
        <div className="xl:col-span-4 bg-white border border-slate-200 rounded-xl p-5 space-y-4">
          {activeSlot ? (
            <>
              <div className="flex items-start justify-between border-b border-slate-100 pb-3">
                <div>
                  <span className="text-xs font-medium text-slate-500">{activeSlot.zoneName}</span>
                  <h3 className="text-lg font-bold text-slate-900 font-mono mt-0.5">
                    Slot {activeSlot.slotNumber}
                  </h3>
                </div>
                <span
                  className={`text-xs font-bold px-2.5 py-1 rounded-md ${
                    activeSlot.status === 'available'
                      ? 'bg-emerald-50 text-emerald-700'
                      : activeSlot.status === 'occupied'
                      ? 'bg-rose-50 text-rose-700'
                      : activeSlot.status === 'reserved'
                      ? 'bg-blue-50 text-blue-700'
                      : 'bg-amber-50 text-amber-800'
                  }`}
                >
                  {getSlotStatusLabel(activeSlot.status)}
                </span>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Category</span>
                  <span className="font-semibold text-slate-900 capitalize">
                    {activeSlot.vehicleType}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Floor / Deck</span>
                  <span className="font-semibold text-slate-900">{activeSlot.floorName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Nearby Landmark</span>
                  <span className="font-medium text-slate-800 text-right max-w-[200px]">
                    {activeSlot.nearbyLandmark}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Amenities</span>
                  <span className="font-medium text-slate-800">
                    {[
                      activeSlot.isEvCharging ? 'EV Charger' : null,
                      activeSlot.isHandicapped ? 'Accessible' : null,
                    ]
                      .filter(Boolean)
                      .join(' · ') || 'Standard Bay'}
                  </span>
                </div>
              </div>

              {activeSlot.status === 'occupied' && activeSlot.currentVehicle && (
                <div className="p-3 rounded-lg bg-rose-50/60 border border-rose-200 text-xs space-y-1">
                  <div className="font-bold text-rose-900">
                    Occupied by {activeSlot.currentVehicle.licensePlate}
                  </div>
                  <div className="text-rose-800">
                    Driver: {activeSlot.currentVehicle.driverName}
                  </div>
                </div>
              )}

              {/* Distance to Nearby Campus Buildings */}
              <div className="pt-2 border-t border-slate-100">
                <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5 mb-2">
                  <Building2 className="w-3.5 h-3.5 text-slate-500" />
                  <span>Walking Distance to Campus Buildings</span>
                </h4>
                <div className="space-y-1.5 text-xs tabular-nums">
                  {CAMPUS_BUILDINGS.slice()
                    .sort(
                      (a, b) =>
                        (activeSlot.distanceToBuildings[a.id] || 999) -
                        (activeSlot.distanceToBuildings[b.id] || 999)
                    )
                    .map((b) => {
                      const dist = activeSlot.distanceToBuildings[b.id];
                      const isDest = b.id === targetBuildingId;
                      return (
                        <div
                          key={b.id}
                          className={`flex items-center justify-between py-1 px-2 rounded ${
                            isDest ? 'bg-blue-50 font-semibold text-blue-900' : 'text-slate-600'
                          }`}
                        >
                          <span className="truncate">{b.shortName}</span>
                          <span className="font-mono shrink-0 ml-2">
                            {dist}m (~{Math.max(1, Math.round(dist / 75))} min)
                          </span>
                        </div>
                      );
                    })}
                </div>
              </div>

              {/* Actions */}
              <div className="pt-2 border-t border-slate-100 grid grid-cols-2 gap-2">
                {activeSlot.status === 'available' ? (
                  <>
                    <button
                      onClick={() => {
                        setPreselectedTypeForParkModal(activeSlot.vehicleType);
                        setPreselectedSlotIdForParkModal(activeSlot.id);
                        setIsParkModalOpen(true);
                      }}
                      className="flex items-center justify-center gap-1.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition-colors"
                    >
                      <PlusCircle className="w-3.5 h-3.5" />
                      <span>Check-In</span>
                    </button>
                    <button
                      onClick={() => {
                        setPreselectedSlotForReservation(activeSlot.id);
                        setActiveTab('reservations');
                      }}
                      className="flex items-center justify-center gap-1.5 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs transition-colors"
                    >
                      <CalendarCheck className="w-3.5 h-3.5" />
                      <span>Reserve QR</span>
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => setSelectedSlotForModal(activeSlot)}
                    className="col-span-2 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition-colors"
                  >
                    <MapPin className="w-3.5 h-3.5" />
                    <span>Open Full Slot Actions &amp; Checkout</span>
                  </button>
                )}
              </div>
            </>
          ) : null}
        </div>
      </div>

      {/* Mobile-Friendly Quick Slot Selector Strip */}
      <div className="bg-white border border-slate-200 rounded-xl p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-slate-900">
            Quick Zone Bay Selector ({visibleSlots.length} Filtered Slots)
          </h3>
          <span className="text-xs text-slate-500">Tap any bay to highlight on campus map</span>
        </div>
        <div className="grid grid-cols-4 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-14 gap-1.5 max-h-52 overflow-y-auto pr-1">
          {visibleSlots.map((s) => {
            const selected = activeSlot?.id === s.id;
            const colorCls =
              s.status === 'available'
                ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                : s.status === 'occupied'
                ? 'bg-rose-50 border-rose-300 text-rose-900'
                : s.status === 'reserved'
                ? 'bg-blue-50 border-blue-300 text-blue-900'
                : 'bg-amber-50 border-amber-300 text-amber-900';

            return (
              <button
                key={s.id}
                onClick={() => setSelectedSlotId(s.id)}
                className={`py-1.5 px-1 rounded border text-[11px] font-mono font-semibold text-center transition-colors ${colorCls} ${
                  selected ? 'ring-2 ring-slate-900' : ''
                }`}
              >
                {s.slotNumber}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
