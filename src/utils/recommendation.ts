import type {
  ParkingSlot,
  Reservation,
  SlotRecommendationResult,
  VehicleType,
  CampusZoneId,
} from '../types.ts';
import { CAMPUS_BUILDINGS, CAMPUS_GATES } from '../data/initialData.ts';

export interface RecommendationCriteria {
  buildingId: string;
  gateId: 'GATE_A' | 'GATE_B';
  vehicleType: VehicleType;
  requireAccessible?: boolean;
  preferEv?: boolean;
  startTime?: string;
  endTime?: string;
}

export function hasTimeWindowOverlap(
  startA: string,
  endA: string,
  startB: string,
  endB: string
): boolean {
  const sA = new Date(startA).getTime();
  const eA = new Date(endA).getTime();
  const sB = new Date(startB).getTime();
  const eB = new Date(endB).getTime();
  if (Number.isNaN(sA) || Number.isNaN(eA) || Number.isNaN(sB) || Number.isNaN(eB)) {
    return false;
  }
  return sA < eB && sB < eA;
}

export function isSlotAvailableForWindow(
  slot: ParkingSlot,
  reservations: Reservation[],
  startTime: string,
  endTime: string,
  excludeReservationId?: string
): { available: boolean; reason?: string } {
  if (slot.status === 'maintenance') {
    return { available: false, reason: 'Slot is temporarily unavailable due to maintenance.' };
  }

  const now = Date.now();
  const reqStart = new Date(startTime).getTime();
  const reqEnd = new Date(endTime).getTime();

  if (Number.isNaN(reqStart) || Number.isNaN(reqEnd) || reqEnd <= reqStart) {
    return { available: false, reason: 'End time must be after start time.' };
  }

  // If the slot is currently occupied and the requested start time is within the next 60 mins (or already active),
  // prevent immediate booking over an actively parked vehicle without known exit time
  if (slot.status === 'occupied' && reqStart <= now + 60 * 60 * 1000) {
    return {
      available: false,
      reason: `Slot ${slot.slotNumber} is currently occupied by an active vehicle.`,
    };
  }

  // Check active reservations (confirmed or checked_in) for overlapping time windows
  const conflict = reservations.find((r) => {
    if (excludeReservationId && r.id === excludeReservationId) return false;
    if (r.slotId !== slot.id) return false;
    if (r.status !== 'confirmed' && r.status !== 'checked_in') return false;
    return hasTimeWindowOverlap(startTime, endTime, r.startTime, r.endTime);
  });

  if (conflict) {
    return {
      available: false,
      reason: `Overlaps with existing reservation ${conflict.id} (${new Date(
        conflict.startTime
      ).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} – ${new Date(
        conflict.endTime
      ).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}).`,
    };
  }

  return { available: true };
}

/**
 * Transparent Deterministic Weighted Slot Scoring Algorithm
 * Total Score = 0..100 points:
 *  - Building Proximity (0..50 pts): Closer walking distance to target campus building yields higher points.
 *  - Entrance Gate Proximity (0..25 pts): Shorter drive from selected campus gate reduces campus traffic congestion.
 *  - Accessibility / Amenity Fit (0..15 pts): Matches accessible bay requirement or EV preference; penalizes using accessible bays unnecessarily when non-accessible bays exist.
 *  - Dedicated Zone Fit (0..10 pts): Bonus when slot lies in the building's primary designated zone.
 */
export function recommendBestSlots(
  slots: ParkingSlot[],
  reservations: Reservation[],
  criteria: RecommendationCriteria,
  limit = 5
): SlotRecommendationResult[] {
  const building =
    CAMPUS_BUILDINGS.find((b) => b.id === criteria.buildingId) || CAMPUS_BUILDINGS[0];
  const gate = CAMPUS_GATES.find((g) => g.id === criteria.gateId) || CAMPUS_GATES[0];

  const windowStart = criteria.startTime || new Date().toISOString();
  const windowEnd =
    criteria.endTime || new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString();

  const candidates = slots.filter((slot) => {
    if (slot.vehicleType !== criteria.vehicleType) return false;
    if (criteria.requireAccessible && !slot.isHandicapped) return false;

    // For immediate check-in/recommendation, require slot status === 'available'
    // or available in the requested future window
    const isImmediate = Math.abs(new Date(windowStart).getTime() - Date.now()) < 20 * 60 * 1000;
    if (isImmediate && slot.status !== 'available') return false;

    const check = isSlotAvailableForWindow(slot, reservations, windowStart, windowEnd);
    return check.available;
  });

  const scored: SlotRecommendationResult[] = candidates.map((slot) => {
    const distBld = slot.distanceToBuildings[building.id] ?? 220;
    const distGate = slot.distanceToGates[gate.id] ?? 220;

    // 1. Building proximity (0..50)
    const buildingProximity = Math.max(0, Math.min(50, Math.round(50 - (distBld - 20) * 0.14)));

    // 2. Gate proximity (0..25)
    const gateProximity = Math.max(0, Math.min(25, Math.round(25 - (distGate - 20) * 0.06)));

    // 3. Accessibility & EV fit (0..15)
    let accessibilityMatch = 10;
    if (criteria.requireAccessible && slot.isHandicapped) {
      accessibilityMatch = 15;
    } else if (!criteria.requireAccessible && slot.isHandicapped) {
      // Preserve accessible bays for users who need them unless they are the only ones left
      accessibilityMatch = 3;
    } else if (criteria.preferEv && slot.isEvCharging) {
      accessibilityMatch = 15;
    }

    // 4. Primary zone fit (0..10)
    const zoneFit =
      slot.zoneId === (building.nearestZoneId as CampusZoneId) ||
      slot.nearbyBuildingId === building.id
        ? 10
        : 5;

    const totalScore = Math.min(
      100,
      buildingProximity + gateProximity + accessibilityMatch + zoneFit
    );
    const walkingMinutes = Math.max(1, Math.round(distBld / 75));

    const traits: string[] = ['available'];
    if (criteria.requireAccessible && slot.isHandicapped) traits.push('accessible bay');
    if (criteria.preferEv && slot.isEvCharging) traits.push('EV charger ready');
    traits.push(`closest to ${building.name} (${distBld}m walk)`);

    const reasonSummary = `Recommended Slot ${slot.slotNumber} — ${traits.join(', ')}.`;

    return {
      slot,
      totalScore,
      distanceToBuildingMeters: distBld,
      distanceToGateMeters: distGate,
      walkingMinutes,
      scoreBreakdown: {
        buildingProximity,
        gateProximity,
        accessibilityMatch,
        zoneFit,
      },
      reasonSummary,
    };
  });

  scored.sort((a, b) => {
    if (b.totalScore !== a.totalScore) return b.totalScore - a.totalScore;
    return a.distanceToBuildingMeters - b.distanceToBuildingMeters;
  });

  return scored.slice(0, limit);
}
