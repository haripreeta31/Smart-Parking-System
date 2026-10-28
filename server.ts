import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import {
  createSeedDatabase,
  DEMO_USERS,
  CAMPUS_ZONES,
} from './src/data/initialData.ts';
import {
  hasTimeWindowOverlap,
  isSlotAvailableForWindow,
} from './src/utils/recommendation.ts';
import type {
  ParkingDatabaseState,
  UserSession,
  UserRole,
  VehicleType,
  SlotStatus,
  Reservation,
  WaitlistEntry,
  BusSchedule,
  ParkingIssue,
  IssueCategory,
  IssueStatus,
  CampusZoneId,
  NotificationItem,
  VehicleEntryLog,
} from './src/types.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;
const DB_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DB_DIR, 'campus-parking-db.json');
const SERVER_HMAC_SECRET =
  process.env.PARKING_HMAC_SECRET || 'campus-smart-parking-internal-hmac-2026';

function signToken(payload: string): string {
  return crypto
    .createHmac('sha256', SERVER_HMAC_SECRET)
    .update(payload)
    .digest('hex')
    .slice(0, 16)
    .toUpperCase();
}

function createUserToken(userId: string, role: UserRole): string {
  const sig = signToken(`${userId}:${role}`);
  return `${userId}.${role}.${sig}`;
}

function verifyUserToken(authHeader?: string): Omit<UserSession, 'token'> | null {
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  const raw = authHeader.slice(7).trim();
  const parts = raw.split('.');
  if (parts.length !== 3) return null;
  const [userId, role, sig] = parts;
  const expected = signToken(`${userId}:${role}`);
  if (sig !== expected) return null;
  const found = DEMO_USERS.find((u) => u.id === userId && u.role === role);
  return found || null;
}

let dbCache: ParkingDatabaseState | null = null;
let writeQueue: Promise<void> = Promise.resolve();

async function loadDb(): Promise<ParkingDatabaseState> {
  if (dbCache) return dbCache;
  try {
    await fs.mkdir(DB_DIR, { recursive: true });
    const raw = await fs.readFile(DB_FILE, 'utf-8');
    const parsed = JSON.parse(raw) as ParkingDatabaseState;
    if (!parsed || !Array.isArray(parsed.slots) || !Array.isArray(parsed.reservations)) {
      throw new Error('Malformed DB state');
    }
    dbCache = parsed;
    return dbCache;
  } catch {
    dbCache = createSeedDatabase();
    await persistDb(dbCache);
    return dbCache;
  }
}

async function persistDb(state: ParkingDatabaseState): Promise<void> {
  dbCache = state;
  writeQueue = writeQueue.then(async () => {
    try {
      await fs.mkdir(DB_DIR, { recursive: true });
      const tmpFile = `${DB_FILE}.tmp`;
      await fs.writeFile(tmpFile, JSON.stringify(state, null, 2), 'utf-8');
      await fs.rename(tmpFile, DB_FILE);
    } catch (err) {
      console.error('Failed to persist parking DB:', err);
    }
  });
  return writeQueue;
}

function getRateForType(db: ParkingDatabaseState, type: VehicleType): number {
  switch (type) {
    case 'car':
      return db.settings.carHourlyRate;
    case 'bike':
      return db.settings.bikeHourlyRate;
    case 'staff':
      return db.settings.staffHourlyRate;
    case 'visitor':
      return db.settings.visitorHourlyRate;
    case 'bus':
      return db.settings.busHourlyRate;
  }
}

function pushNotification(
  db: ParkingDatabaseState,
  notif: Omit<NotificationItem, 'id' | 'timestamp' | 'createdAtIso' | 'read'>
) {
  const item: NotificationItem = {
    ...notif,
    id: `notif-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    timestamp: 'Just now',
    createdAtIso: new Date().toISOString(),
    read: false,
  };
  db.notifications.unshift(item);
  if (db.notifications.length > 60) {
    db.notifications = db.notifications.slice(0, 60);
  }
}

/**
 * Atomically checks if any waiting user on the waitlist matches a newly freed slot.
 * Prevents double allocation by immediately reserving the slot and linking it to a new confirmed reservation.
 */
function promoteWaitlistForFreedSlot(db: ParkingDatabaseState, slotId: string): WaitlistEntry | null {
  const slot = db.slots.find((s) => s.id === slotId);
  if (!slot || slot.status !== 'available') return null;

  // Find earliest waiting user matching vehicleType and optional preferredZoneId
  const candidate = db.waitlist.find(
    (w) =>
      w.status === 'waiting' &&
      w.vehicleType === slot.vehicleType &&
      (w.preferredZoneId === 'ANY' || w.preferredZoneId === slot.zoneId)
  );

  if (!candidate) return null;

  const now = new Date();
  const startIso =
    new Date(candidate.desiredStartTime).getTime() > now.getTime()
      ? candidate.desiredStartTime
      : now.toISOString();
  const endIso =
    new Date(candidate.desiredEndTime).getTime() > new Date(startIso).getTime()
      ? candidate.desiredEndTime
      : new Date(new Date(startIso).getTime() + 2 * 60 * 60 * 1000).toISOString();

  // Ensure no overlapping reservation exists on this slot
  const check = isSlotAvailableForWindow(slot, db.reservations, startIso, endIso);
  if (!check.available) return null;

  const resNum = 1000 + db.reservations.length + 1;
  const resId = `RES-${resNum}`;
  const qrPassCode = `SMP-PASS-${resNum}-${signToken(`${resId}:${slot.id}:${candidate.licensePlate}`).slice(0, 8)}`;

  const autoRes: Reservation = {
    id: resId,
    qrPassCode,
    slotId: slot.id,
    slotNumber: slot.slotNumber,
    zoneId: slot.zoneId,
    zoneName: slot.zoneName,
    vehicleType: slot.vehicleType,
    licensePlate: candidate.licensePlate,
    driverName: candidate.userName,
    driverPhone: candidate.userPhone,
    driverRole: candidate.userRole,
    userId: candidate.userId,
    targetBuildingId: candidate.targetBuildingId,
    startTime: startIso,
    endTime: endIso,
    status: 'confirmed',
    gracePeriodMinutes: db.settings.gracePeriodMinutes,
    createdAt: now.toISOString(),
  };

  db.reservations.unshift(autoRes);
  slot.status = 'reserved';
  slot.activeReservationId = resId;

  candidate.status = 'notified';
  candidate.offeredSlotId = slot.id;
  candidate.offeredReservationId = resId;
  candidate.notifiedAt = now.toISOString();

  pushNotification(db, {
    title: `Waitlist Slot Allocated — ${slot.slotNumber}`,
    message: `${candidate.userName} (${candidate.licensePlate}) has been assigned newly available Slot ${slot.slotNumber} (${qrPassCode}).`,
    type: 'waitlist',
    targetUserRole: 'all',
  });

  return candidate;
}

interface AuthedRequest extends Request {
  user?: Omit<UserSession, 'token'>;
}

function requireAuth(req: AuthedRequest, res: Response, next: NextFunction) {
  const user = verifyUserToken(req.headers.authorization);
  if (!user) {
    res.status(401).json({
      success: false,
      message: 'Authentication required. Please select a valid campus session.',
    });
    return;
  }
  req.user = user;
  next();
}

function requireAdmin(req: AuthedRequest, res: Response, next: NextFunction) {
  const user = verifyUserToken(req.headers.authorization);
  if (!user) {
    res.status(401).json({
      success: false,
      message: 'Authentication required.',
    });
    return;
  }
  if (user.role !== 'admin') {
    res.status(403).json({
      success: false,
      message: `Access Denied: "${user.name}" (${user.role.toUpperCase()}) is not authorized to perform administrator actions.`,
    });
    return;
  }
  req.user = user;
  next();
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '2mb' }));

  // Ensure DB is initialized on boot
  await loadDb();

  // --- AUTH ENDPOINTS ---
  app.get('/api/auth/users', (_req, res) => {
    res.json({ success: true, users: DEMO_USERS });
  });

  app.post('/api/auth/login', (req, res) => {
    const { userId } = req.body as { userId?: string };
    const found = DEMO_USERS.find((u) => u.id === userId) || DEMO_USERS[0];
    const token = createUserToken(found.id, found.role);
    const session: UserSession = { ...found, token };
    res.json({ success: true, session });
  });

  // --- STATE SYNC ---
  app.get('/api/state', async (_req, res) => {
    const db = await loadDb();
    res.json({ success: true, state: db });
  });

  // --- DIRECT PARK / CHECK-IN ---
  app.post('/api/park', requireAuth, async (req: AuthedRequest, res) => {
    const db = await loadDb();
    const { type, slotId, licensePlate, model, driverName, driverPhone } = req.body as {
      type?: VehicleType;
      slotId?: string;
      licensePlate?: string;
      model?: string;
      driverName?: string;
      driverPhone?: string;
    };

    if (!type || !slotId || !licensePlate || !licensePlate.trim()) {
      res.status(400).json({
        success: false,
        message: 'Vehicle category, parking slot, and license plate are required.',
      });
      return;
    }

    const cleanPlate = licensePlate.toUpperCase().trim();
    if (!/^[A-Z0-9-]{3,15}$/.test(cleanPlate)) {
      res.status(400).json({
        success: false,
        message: 'Invalid license plate format (use 3–15 alphanumeric characters or hyphens).',
      });
      return;
    }

    const slot = db.slots.find((s) => s.id === slotId);
    if (!slot) {
      res.status(404).json({ success: false, message: 'Selected parking slot does not exist.' });
      return;
    }
    if (slot.status === 'occupied') {
      res.status(409).json({
        success: false,
        message: `Slot ${slot.slotNumber} is already occupied by ${slot.currentVehicle?.licensePlate || 'another vehicle'}.`,
      });
      return;
    }
    if (slot.status === 'maintenance') {
      res.status(409).json({
        success: false,
        message: `Slot ${slot.slotNumber} is temporarily unavailable due to maintenance.`,
      });
      return;
    }
    if (slot.status === 'reserved') {
      res.status(409).json({
        success: false,
        message: `Slot ${slot.slotNumber} is reserved. Use QR Pass Check-In for reserved bays.`,
      });
      return;
    }

    const rate = getRateForType(db, slot.vehicleType);
    const entryTime = new Date().toISOString();
    const ticketNumber = `TK-${slot.vehicleType.toUpperCase().slice(0, 1)}-${Math.floor(1000 + Math.random() * 9000)}`;

    slot.status = 'occupied';
    slot.currentVehicle = {
      licensePlate: cleanPlate,
      model: model?.trim() || `${slot.vehicleType.toUpperCase()} Standard`,
      driverName: driverName?.trim() || req.user?.name || 'Campus Driver',
      driverPhone: driverPhone?.trim() || req.user?.phone || '+1 (555) 000-0000',
      driverRole: req.user?.role || 'student',
      entryTime,
      ticketNumber,
      ratePerHour: rate,
    };

    const newLog: VehicleEntryLog = {
      id: `LOG-${Date.now()}`,
      ticketNumber,
      licensePlate: cleanPlate,
      vehicleType: slot.vehicleType,
      slotId: slot.id,
      zoneId: slot.zoneId,
      floor: slot.floor,
      driverName: slot.currentVehicle.driverName,
      entryTime,
      paymentStatus: 'pending',
      status: 'active',
    };
    db.logs.unshift(newLog);

    pushNotification(db, {
      title: `Vehicle Checked In — Slot ${slot.slotNumber}`,
      message: `${cleanPlate} parked at ${slot.zoneName} (${slot.nearbyLandmark}).`,
      type: 'entry',
      targetUserRole: 'all',
    });

    await persistDb(db);
    res.json({
      success: true,
      message: `Vehicle ${cleanPlate} checked into Slot ${slot.slotNumber}.`,
      state: db,
    });
  });

  // --- VACATE / CHECK-OUT ---
  app.post('/api/vacate', requireAuth, async (req: AuthedRequest, res) => {
    const db = await loadDb();
    const { slotId } = req.body as { slotId?: string };
    const slot = db.slots.find((s) => s.id === slotId);

    if (!slot || slot.status !== 'occupied' || !slot.currentVehicle) {
      res.status(400).json({ success: false, message: 'Slot is not currently occupied.' });
      return;
    }

    const vehicle = slot.currentVehicle;
    const exitTime = new Date();
    const entryDate = new Date(vehicle.entryTime);
    const durationMs = Math.max(exitTime.getTime() - entryDate.getTime(), 60000);
    const durationMinutes = Math.round(durationMs / 60000);
    const hoursBilled = Math.max(durationMinutes / 60, 0.5);
    const feeAmount = Math.round(hoursBilled * vehicle.ratePerHour * 100) / 100;

    // Complete any linked active reservation
    if (vehicle.reservationId) {
      const linkedRes = db.reservations.find((r) => r.id === vehicle.reservationId);
      if (linkedRes && linkedRes.status === 'checked_in') {
        linkedRes.status = 'completed';
        linkedRes.checkedOutAt = exitTime.toISOString();
        linkedRes.feeAmount = feeAmount;
      }
    }

    // Also update any matching bus schedule if bus bay
    if (slot.vehicleType === 'bus') {
      const activeBus = db.busSchedules.find(
        (b) => b.bayId === slot.id && b.status === 'arrived'
      );
      if (activeBus) {
        activeBus.status = 'departed';
      }
    }

    const completedLog: VehicleEntryLog = {
      id: `LOG-${Date.now()}`,
      ticketNumber: vehicle.ticketNumber,
      licensePlate: vehicle.licensePlate,
      vehicleType: slot.vehicleType,
      slotId: slot.id,
      zoneId: slot.zoneId,
      floor: slot.floor,
      driverName: vehicle.driverName,
      entryTime: vehicle.entryTime,
      exitTime: exitTime.toISOString(),
      durationMinutes,
      feeAmount,
      paymentStatus: 'paid',
      status: 'completed',
      reservationId: vehicle.reservationId,
    };

    db.logs = [
      completedLog,
      ...db.logs.filter((l) => l.ticketNumber !== vehicle.ticketNumber),
    ];

    slot.status = 'available';
    slot.currentVehicle = undefined;
    slot.activeReservationId = undefined;

    pushNotification(db, {
      title: `Checkout Completed — Slot ${slot.slotNumber}`,
      message: `${vehicle.licensePlate} departed after ${durationMinutes} mins. Fee $${feeAmount.toFixed(2)} settled.`,
      type: 'exit',
      targetUserRole: 'all',
    });

    // Promote waitlist if someone is waiting for this vehicleType/zone
    const promoted = promoteWaitlistForFreedSlot(db, slot.id);

    await persistDb(db);
    res.json({
      success: true,
      message: promoted
        ? `Checked out ${vehicle.licensePlate} ($${feeAmount.toFixed(2)}). Slot automatically allocated to waitlisted user ${promoted.userName}!`
        : `Checked out ${vehicle.licensePlate}. Total fee: $${feeAmount.toFixed(2)}.`,
      log: completedLog,
      state: db,
    });
  });

  // --- CREATE SMART RESERVATION & QR PASS ---
  app.post('/api/reservations', requireAuth, async (req: AuthedRequest, res) => {
    const db = await loadDb();
    const {
      slotId,
      vehicleType,
      licensePlate,
      vehicleModel,
      driverName,
      driverPhone,
      targetBuildingId,
      startTime,
      endTime,
    } = req.body as {
      slotId?: string;
      vehicleType?: VehicleType;
      licensePlate?: string;
      vehicleModel?: string;
      driverName?: string;
      driverPhone?: string;
      targetBuildingId?: string;
      startTime?: string;
      endTime?: string;
    };

    if (!slotId || !vehicleType || !licensePlate?.trim() || !startTime || !endTime) {
      res.status(400).json({
        success: false,
        message: 'Slot, vehicle type, license plate, start time, and end time are required.',
      });
      return;
    }

    const cleanPlate = licensePlate.toUpperCase().trim();
    if (!/^[A-Z0-9-]{3,15}$/.test(cleanPlate)) {
      res.status(400).json({
        success: false,
        message: 'Invalid license plate format.',
      });
      return;
    }

    const slot = db.slots.find((s) => s.id === slotId);
    if (!slot) {
      res.status(404).json({ success: false, message: 'Parking slot not found.' });
      return;
    }

    if (slot.vehicleType !== vehicleType) {
      res.status(400).json({
        success: false,
        message: `Slot ${slot.slotNumber} is designated for ${slot.vehicleType.toUpperCase()} vehicles only.`,
      });
      return;
    }

    // Server-side conflict check!
    const availability = isSlotAvailableForWindow(slot, db.reservations, startTime, endTime);
    if (!availability.available) {
      res.status(409).json({
        success: false,
        message: availability.reason || 'Selected slot is unavailable for the requested period.',
      });
      return;
    }

    const resNum = 1000 + db.reservations.length + 1 + Math.floor(Math.random() * 50);
    const resId = `RES-${resNum}`;
    const sig = signToken(`${resId}:${slot.id}:${cleanPlate}:${startTime}`).slice(0, 8);
    const qrPassCode = `SMP-PASS-${resNum}-${sig}`;

    const newReservation: Reservation = {
      id: resId,
      qrPassCode,
      slotId: slot.id,
      slotNumber: slot.slotNumber,
      zoneId: slot.zoneId,
      zoneName: slot.zoneName,
      vehicleType,
      licensePlate: cleanPlate,
      vehicleModel: vehicleModel?.trim(),
      driverName: driverName?.trim() || req.user?.name || 'Campus User',
      driverPhone: driverPhone?.trim() || req.user?.phone || '+1 (555) 000-0000',
      driverRole: req.user?.role || 'student',
      userId: req.user?.id || 'usr-guest',
      targetBuildingId,
      startTime,
      endTime,
      status: 'confirmed',
      gracePeriodMinutes: db.settings.gracePeriodMinutes,
      createdAt: new Date().toISOString(),
    };

    db.reservations.unshift(newReservation);

    // Synchronize slot status if currently available
    if (slot.status === 'available') {
      slot.status = 'reserved';
      slot.activeReservationId = resId;
    }

    // Update today's booking counter in dailyHistory
    const todayIso = new Date().toISOString().slice(0, 10);
    const todayHist = db.dailyHistory.find((d) => d.date === todayIso);
    if (todayHist) {
      todayHist.bookingsCount += 1;
    }

    pushNotification(db, {
      title: `Reservation Confirmed — Slot ${slot.slotNumber}`,
      message: `QR Pass ${qrPassCode} issued to ${newReservation.driverName} (${cleanPlate}).`,
      type: 'reservation',
      targetUserRole: 'all',
    });

    await persistDb(db);
    res.json({
      success: true,
      message: `Reservation ${resId} confirmed! QR Pass generated for Slot ${slot.slotNumber}.`,
      reservation: newReservation,
      state: db,
    });
  });

  // --- SERVER-SIDE QR PASS VALIDATION, CHECK-IN & CHECK-OUT ---
  app.post('/api/reservations/validate-qr', requireAuth, async (req: AuthedRequest, res) => {
    const db = await loadDb();
    const { qrPassCode, action } = req.body as {
      qrPassCode?: string;
      action?: 'verify' | 'checkin' | 'checkout';
    };

    if (!qrPassCode || !qrPassCode.trim()) {
      res.status(400).json({ success: false, message: 'Please enter or scan a QR Pass code.' });
      return;
    }

    const code = qrPassCode.trim().toUpperCase();
    const reservation = db.reservations.find((r) => r.qrPassCode.toUpperCase() === code);

    if (!reservation) {
      res.status(404).json({
        success: false,
        code: 'INVALID_PASS',
        message: `Rejected: QR Pass "${code}" is invalid or unrecognized by the server.`,
      });
      return;
    }

    // Reject cancelled, expired, no-show, or already-used passes
    if (reservation.status === 'cancelled') {
      res.status(400).json({
        success: false,
        code: 'CANCELLED_PASS',
        message: `Rejected: Reservation ${reservation.id} was cancelled and this QR pass is void.`,
        reservation,
      });
      return;
    }

    if (reservation.status === 'expired') {
      res.status(400).json({
        success: false,
        code: 'EXPIRED_PASS',
        message: `Rejected: QR Pass for ${reservation.id} has expired.`,
        reservation,
      });
      return;
    }

    if (reservation.status === 'no_show') {
      res.status(400).json({
        success: false,
        code: 'NOSHOW_PASS',
        message: `Rejected: Reservation ${reservation.id} exceeded the ${reservation.gracePeriodMinutes}-minute arrival grace period and was released.`,
        reservation,
      });
      return;
    }

    if (reservation.status === 'completed') {
      res.status(400).json({
        success: false,
        code: 'ALREADY_USED',
        message: `Rejected: QR Pass for ${reservation.id} has already been used and checked out.`,
        reservation,
      });
      return;
    }

    const now = new Date();
    const endMs = new Date(reservation.endTime).getTime();
    const startMs = new Date(reservation.startTime).getTime();
    const graceMs = reservation.gracePeriodMinutes * 60 * 1000;

    // Dynamic expiration & grace-period check for 'confirmed' passes
    if (reservation.status === 'confirmed') {
      if (now.getTime() > endMs) {
        reservation.status = 'expired';
        const slot = db.slots.find((s) => s.id === reservation.slotId);
        if (slot && slot.status === 'reserved' && slot.activeReservationId === reservation.id) {
          slot.status = 'available';
          slot.activeReservationId = undefined;
          promoteWaitlistForFreedSlot(db, slot.id);
        }
        await persistDb(db);
        res.status(400).json({
          success: false,
          code: 'EXPIRED_PASS',
          message: `Rejected: Reservation ${reservation.id} booking window ended at ${new Date(reservation.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.`,
          reservation,
          state: db,
        });
        return;
      }

      if (now.getTime() > startMs + graceMs) {
        reservation.status = 'no_show';
        const slot = db.slots.find((s) => s.id === reservation.slotId);
        if (slot && slot.status === 'reserved' && slot.activeReservationId === reservation.id) {
          slot.status = 'available';
          slot.activeReservationId = undefined;
          promoteWaitlistForFreedSlot(db, slot.id);
        }
        const todayHist = db.dailyHistory[db.dailyHistory.length - 1];
        if (todayHist) todayHist.noShowCount += 1;

        await persistDb(db);
        res.status(400).json({
          success: false,
          code: 'GRACE_EXCEEDED',
          message: `Rejected: Arrival grace period (${reservation.gracePeriodMinutes} mins) exceeded. Slot ${reservation.slotNumber} has been released.`,
          reservation,
          state: db,
        });
        return;
      }
    }

    if (!action || action === 'verify') {
      res.json({
        success: true,
        code: 'VALID_PASS',
        message: `Valid QR Pass (${reservation.status.toUpperCase()}) for Slot ${reservation.slotNumber} — ${reservation.licensePlate}.`,
        reservation,
      });
      return;
    }

    const slot = db.slots.find((s) => s.id === reservation.slotId);
    if (!slot) {
      res.status(404).json({ success: false, message: 'Assigned slot not found.' });
      return;
    }

    if (action === 'checkin') {
      if (reservation.status === 'checked_in') {
        res.status(400).json({
          success: false,
          code: 'ALREADY_CHECKED_IN',
          message: `Pass ${reservation.qrPassCode} is already checked in at Slot ${reservation.slotNumber}. Use Check-Out when departing.`,
          reservation,
        });
        return;
      }
      if (slot.status === 'occupied') {
        res.status(409).json({
          success: false,
          message: `Slot ${slot.slotNumber} is currently occupied. Please contact gate attendant.`,
        });
        return;
      }

      const entryIso = now.toISOString();
      const rate = getRateForType(db, reservation.vehicleType);
      const ticketNumber = `TK-QR-${reservation.id.replace('RES-', '')}`;

      reservation.status = 'checked_in';
      reservation.checkedInAt = entryIso;

      slot.status = 'occupied';
      slot.activeReservationId = reservation.id;
      slot.currentVehicle = {
        licensePlate: reservation.licensePlate,
        model: reservation.vehicleModel || `${reservation.vehicleType.toUpperCase()} Reserved`,
        driverName: reservation.driverName,
        driverPhone: reservation.driverPhone,
        driverRole: reservation.driverRole,
        entryTime: entryIso,
        ticketNumber,
        ratePerHour: rate,
        reservationId: reservation.id,
      };

      db.logs.unshift({
        id: `LOG-${Date.now()}`,
        ticketNumber,
        licensePlate: reservation.licensePlate,
        vehicleType: reservation.vehicleType,
        slotId: slot.id,
        zoneId: slot.zoneId,
        floor: slot.floor,
        driverName: reservation.driverName,
        entryTime: entryIso,
        paymentStatus: 'pending',
        status: 'active',
        reservationId: reservation.id,
      });

      pushNotification(db, {
        title: `QR Pass Check-In — Slot ${slot.slotNumber}`,
        message: `${reservation.driverName} (${reservation.licensePlate}) checked in with QR Pass ${reservation.qrPassCode}.`,
        type: 'entry',
        targetUserRole: 'all',
      });

      await persistDb(db);
      res.json({
        success: true,
        code: 'CHECKED_IN',
        message: `Check-In successful! Proceed to ${slot.zoneName}, Slot ${slot.slotNumber}.`,
        reservation,
        state: db,
      });
      return;
    }

    if (action === 'checkout') {
      if (reservation.status !== 'checked_in') {
        res.status(400).json({
          success: false,
          message: `Cannot check out: Reservation ${reservation.id} has not checked in yet.`,
          reservation,
        });
        return;
      }

      const entryMs = new Date(reservation.checkedInAt || reservation.startTime).getTime();
      const durationMinutes = Math.max(1, Math.round((now.getTime() - entryMs) / 60000));
      const rate = getRateForType(db, reservation.vehicleType);
      const feeAmount = Math.round(Math.max(durationMinutes / 60, 0.5) * rate * 100) / 100;

      reservation.status = 'completed';
      reservation.checkedOutAt = now.toISOString();
      reservation.feeAmount = feeAmount;

      const ticketNumber = slot.currentVehicle?.ticketNumber || `TK-QR-${reservation.id.replace('RES-', '')}`;

      const completedLog: VehicleEntryLog = {
        id: `LOG-${Date.now()}`,
        ticketNumber,
        licensePlate: reservation.licensePlate,
        vehicleType: reservation.vehicleType,
        slotId: slot.id,
        zoneId: slot.zoneId,
        floor: slot.floor,
        driverName: reservation.driverName,
        entryTime: reservation.checkedInAt || reservation.startTime,
        exitTime: now.toISOString(),
        durationMinutes,
        feeAmount,
        paymentStatus: 'paid',
        status: 'completed',
        reservationId: reservation.id,
      };

      db.logs = [
        completedLog,
        ...db.logs.filter((l) => l.ticketNumber !== ticketNumber),
      ];

      slot.status = 'available';
      slot.currentVehicle = undefined;
      slot.activeReservationId = undefined;

      const promoted = promoteWaitlistForFreedSlot(db, slot.id);

      pushNotification(db, {
        title: `QR Pass Check-Out — Slot ${slot.slotNumber}`,
        message: `${reservation.licensePlate} checked out via QR Pass. Fee: $${feeAmount.toFixed(2)}.`,
        type: 'exit',
        targetUserRole: 'all',
      });

      await persistDb(db);
      res.json({
        success: true,
        code: 'CHECKED_OUT',
        message: promoted
          ? `Check-Out complete ($${feeAmount.toFixed(2)}). Freed Slot ${slot.slotNumber} assigned to waitlisted user ${promoted.userName}.`
          : `Check-Out complete! Duration: ${durationMinutes} mins, Fee: $${feeAmount.toFixed(2)}.`,
        reservation,
        state: db,
      });
    }
  });

  // --- CANCEL RESERVATION ---
  app.post('/api/reservations/:id/cancel', requireAuth, async (req: AuthedRequest, res) => {
    const db = await loadDb();
    const reservation = db.reservations.find((r) => r.id === req.params.id);

    if (!reservation) {
      res.status(404).json({ success: false, message: 'Reservation not found.' });
      return;
    }

    if (
      req.user?.role !== 'admin' &&
      reservation.userId !== req.user?.id &&
      reservation.driverName !== req.user?.name
    ) {
      res.status(403).json({
        success: false,
        message: 'You can only cancel your own reservations unless signed in as Administrator.',
      });
      return;
    }

    if (reservation.status !== 'confirmed') {
      res.status(400).json({
        success: false,
        message: `Only confirmed upcoming reservations can be cancelled (current status: ${reservation.status}).`,
      });
      return;
    }

    reservation.status = 'cancelled';
    const todayHist = db.dailyHistory[db.dailyHistory.length - 1];
    if (todayHist) todayHist.cancelledCount += 1;

    let promoted: WaitlistEntry | null = null;
    const slot = db.slots.find((s) => s.id === reservation.slotId);
    if (slot && slot.status === 'reserved') {
      // Check if any other confirmed reservation still holds this slot right now
      const otherConfirmed = db.reservations.find(
        (r) => r.id !== reservation.id && r.slotId === slot.id && r.status === 'confirmed'
      );
      if (otherConfirmed) {
        slot.activeReservationId = otherConfirmed.id;
      } else {
        slot.status = 'available';
        slot.activeReservationId = undefined;
        promoted = promoteWaitlistForFreedSlot(db, slot.id);
      }
    }

    pushNotification(db, {
      title: `Reservation Cancelled — ${reservation.id}`,
      message: `Slot ${reservation.slotNumber} reservation cancelled by ${req.user?.name}.`,
      type: 'info',
      targetUserRole: 'all',
    });

    await persistDb(db);
    res.json({
      success: true,
      message: promoted
        ? `Reservation ${reservation.id} cancelled. Slot ${reservation.slotNumber} reassigned to waitlisted user ${promoted.userName}!`
        : `Reservation ${reservation.id} cancelled and Slot ${reservation.slotNumber} is now available.`,
      state: db,
    });
  });

  // --- PROCESS NO-SHOWS & EXPIRED RESERVATIONS ---
  app.post('/api/reservations/process-noshows', requireAuth, async (_req, res) => {
    const db = await loadDb();
    const now = Date.now();
    let releasedCount = 0;
    let promotedCount = 0;

    for (const r of db.reservations) {
      if (r.status !== 'confirmed') continue;
      const startMs = new Date(r.startTime).getTime();
      const endMs = new Date(r.endTime).getTime();
      const graceMs = (r.gracePeriodMinutes || db.settings.gracePeriodMinutes) * 60 * 1000;

      if (now > endMs) {
        r.status = 'expired';
        releasedCount++;
        const todayHist = db.dailyHistory[db.dailyHistory.length - 1];
        if (todayHist) todayHist.expiredCount += 1;
      } else if (now > startMs + graceMs) {
        r.status = 'no_show';
        releasedCount++;
        const todayHist = db.dailyHistory[db.dailyHistory.length - 1];
        if (todayHist) todayHist.noShowCount += 1;
      } else {
        continue;
      }

      const slot = db.slots.find((s) => s.id === r.slotId);
      if (slot && slot.status === 'reserved') {
        const otherActive = db.reservations.find(
          (o) => o.id !== r.id && o.slotId === slot.id && o.status === 'confirmed'
        );
        if (otherActive) {
          slot.activeReservationId = otherActive.id;
        } else {
          slot.status = 'available';
          slot.activeReservationId = undefined;
          const promoted = promoteWaitlistForFreedSlot(db, slot.id);
          if (promoted) promotedCount++;
        }
      }
    }

    if (releasedCount > 0) {
      pushNotification(db, {
        title: `Grace Period Sweep — ${releasedCount} No-Show/Expired Released`,
        message: `Released ${releasedCount} overdue reservation(s)${
          promotedCount > 0 ? ` and allocated ${promotedCount} bay(s) to waitlisted drivers.` : '.'
        }`,
        type: 'warning',
        targetUserRole: 'all',
      });
      await persistDb(db);
    }

    res.json({
      success: true,
      releasedCount,
      promotedCount,
      message:
        releasedCount > 0
          ? `Released ${releasedCount} overdue reservation(s) exceeding the ${db.settings.gracePeriodMinutes}-minute grace period${
              promotedCount > 0 ? ` and promoted ${promotedCount} waitlisted driver(s)` : ''
            }.`
          : `All active reservations are within their ${db.settings.gracePeriodMinutes}-minute arrival grace period.`,
      state: db,
    });
  });

  // --- WAITLIST ENDPOINTS ---
  app.post('/api/waitlist', requireAuth, async (req: AuthedRequest, res) => {
    const db = await loadDb();
    const {
      vehicleType,
      preferredZoneId,
      licensePlate,
      userName,
      userPhone,
      targetBuildingId,
      desiredStartTime,
      desiredEndTime,
    } = req.body as {
      vehicleType?: VehicleType;
      preferredZoneId?: CampusZoneId | 'ANY';
      licensePlate?: string;
      userName?: string;
      userPhone?: string;
      targetBuildingId?: string;
      desiredStartTime?: string;
      desiredEndTime?: string;
    };

    if (!vehicleType || !licensePlate?.trim()) {
      res.status(400).json({
        success: false,
        message: 'Vehicle category and license plate are required to join the waitlist.',
      });
      return;
    }

    const cleanPlate = licensePlate.toUpperCase().trim();
    const duplicate = db.waitlist.find(
      (w) => w.licensePlate === cleanPlate && w.status === 'waiting'
    );
    if (duplicate) {
      res.status(409).json({
        success: false,
        message: `Vehicle ${cleanPlate} is already on the active waitlist (${duplicate.id}).`,
      });
      return;
    }

    const now = new Date();
    const entry: WaitlistEntry = {
      id: `WL-${200 + db.waitlist.length + 1}`,
      userId: req.user?.id || 'usr-guest',
      userName: userName?.trim() || req.user?.name || 'Campus User',
      userRole: req.user?.role || 'student',
      userPhone: userPhone?.trim() || req.user?.phone || '+1 (555) 000-0000',
      licensePlate: cleanPlate,
      vehicleType,
      preferredZoneId: preferredZoneId || 'ANY',
      targetBuildingId,
      desiredStartTime: desiredStartTime || now.toISOString(),
      desiredEndTime:
        desiredEndTime || new Date(now.getTime() + 2 * 60 * 60 * 1000).toISOString(),
      joinedAt: now.toISOString(),
      status: 'waiting',
    };

    db.waitlist.push(entry);

    pushNotification(db, {
      title: `Waitlist Joined — ${entry.id}`,
      message: `${entry.userName} (${cleanPlate}) joined ${vehicleType.toUpperCase()} waitlist.`,
      type: 'waitlist',
      targetUserRole: 'all',
    });

    await persistDb(db);
    res.json({
      success: true,
      message: `Added ${cleanPlate} to the waitlist. You will receive an in-app notification as soon as an eligible slot opens.`,
      entry,
      state: db,
    });
  });

  app.delete('/api/waitlist/:id', requireAuth, async (req: AuthedRequest, res) => {
    const db = await loadDb();
    const item = db.waitlist.find((w) => w.id === req.params.id);
    if (!item) {
      res.status(404).json({ success: false, message: 'Waitlist entry not found.' });
      return;
    }
    item.status = 'cancelled';
    await persistDb(db);
    res.json({ success: true, message: 'Removed from waitlist.', state: db });
  });

  // --- BUS PARKING MANAGEMENT (ADMIN ONLY MUTATIONS) ---
  app.post('/api/bus-schedules', requireAdmin, async (req: AuthedRequest, res) => {
    const db = await loadDb();
    const {
      routeNumber,
      routeName,
      busPlate,
      busModel,
      operatorName,
      driverName,
      driverPhone,
      bayId,
      arrivalTime,
      departureTime,
      passengerCapacity,
      notes,
    } = req.body as Partial<BusSchedule>;

    if (!routeNumber?.trim() || !routeName?.trim() || !busPlate?.trim() || !bayId || !arrivalTime || !departureTime) {
      res.status(400).json({
        success: false,
        message: 'Route number, route name, bus plate, bus bay, arrival time, and departure time are required.',
      });
      return;
    }

    if (new Date(departureTime).getTime() <= new Date(arrivalTime).getTime()) {
      res.status(400).json({
        success: false,
        message: 'Scheduled departure time must be after arrival time.',
      });
      return;
    }

    const baySlot = db.slots.find((s) => s.id === bayId && s.vehicleType === 'bus');
    if (!baySlot) {
      res.status(404).json({ success: false, message: 'Selected Bus Bay does not exist.' });
      return;
    }

    if (baySlot.status === 'maintenance') {
      res.status(409).json({
        success: false,
        message: `Bus Bay ${baySlot.slotNumber} is currently out of service for maintenance.`,
      });
      return;
    }

    // Prevent overlapping reservations for the same bus bay!
    const overlap = db.busSchedules.find((b) => {
      if (b.bayId !== bayId) return false;
      if (b.status === 'cancelled' || b.status === 'departed') return false;
      return hasTimeWindowOverlap(arrivalTime, departureTime, b.arrivalTime, b.departureTime);
    });

    if (overlap) {
      res.status(409).json({
        success: false,
        message: `Schedule conflict on ${baySlot.slotNumber}: overlaps with ${overlap.routeNumber} (${overlap.busPlate}).`,
      });
      return;
    }

    const newSched: BusSchedule = {
      id: `BSCHED-${String(db.busSchedules.length + 10)}`,
      routeNumber: routeNumber.trim().toUpperCase(),
      routeName: routeName.trim(),
      busPlate: busPlate.trim().toUpperCase(),
      busModel: busModel?.trim() || 'Campus Transit Coach',
      operatorName: operatorName?.trim() || 'Campus Transit Authority',
      driverName: driverName?.trim() || 'Assigned Transit Driver',
      driverPhone: driverPhone?.trim() || '+1 (555) 400-1000',
      bayId: baySlot.id,
      bayNumber: baySlot.slotNumber,
      arrivalTime,
      departureTime,
      status: 'scheduled',
      passengerCapacity: Number(passengerCapacity) || 48,
      notes: notes?.trim(),
    };

    db.busSchedules.unshift(newSched);

    if (baySlot.status === 'available') {
      baySlot.status = 'reserved';
    }

    pushNotification(db, {
      title: `Bus Bay Scheduled — ${baySlot.slotNumber}`,
      message: `${newSched.routeNumber} (${newSched.busPlate}) assigned to ${baySlot.slotNumber}.`,
      type: 'info',
      targetUserRole: 'all',
    });

    await persistDb(db);
    res.json({
      success: true,
      message: `Scheduled ${newSched.routeNumber} at Bus Bay ${baySlot.slotNumber}.`,
      schedule: newSched,
      state: db,
    });
  });

  app.patch('/api/bus-schedules/:id', requireAdmin, async (req: AuthedRequest, res) => {
    const db = await loadDb();
    const sched = db.busSchedules.find((b) => b.id === req.params.id);
    if (!sched) {
      res.status(404).json({ success: false, message: 'Bus schedule not found.' });
      return;
    }

    const { status, bayId } = req.body as {
      status?: BusSchedule['status'];
      bayId?: string;
    };

    // Optional bay reassignment check
    if (bayId && bayId !== sched.bayId) {
      const targetBay = db.slots.find((s) => s.id === bayId && s.vehicleType === 'bus');
      if (!targetBay || targetBay.status === 'maintenance') {
        res.status(400).json({ success: false, message: 'Target bus bay is unavailable.' });
        return;
      }
      const conflict = db.busSchedules.find(
        (b) =>
          b.id !== sched.id &&
          b.bayId === bayId &&
          b.status !== 'cancelled' &&
          b.status !== 'departed' &&
          hasTimeWindowOverlap(sched.arrivalTime, sched.departureTime, b.arrivalTime, b.departureTime)
      );
      if (conflict) {
        res.status(409).json({
          success: false,
          message: `Cannot reassign to ${targetBay.slotNumber}: overlaps with ${conflict.routeNumber}.`,
        });
        return;
      }

      // Free previous bay if not used by another active bus
      const oldBay = db.slots.find((s) => s.id === sched.bayId);
      if (oldBay) {
        oldBay.status = 'available';
        oldBay.currentVehicle = undefined;
      }
      sched.bayId = targetBay.id;
      sched.bayNumber = targetBay.slotNumber;
    }

    const baySlot = db.slots.find((s) => s.id === sched.bayId);

    if (status) {
      sched.status = status;
      if (baySlot) {
        if (status === 'arrived') {
          baySlot.status = 'occupied';
          baySlot.currentVehicle = {
            licensePlate: sched.busPlate,
            model: `${sched.routeNumber} • ${sched.busModel}`,
            driverName: sched.driverName,
            driverPhone: sched.driverPhone,
            driverRole: 'staff',
            entryTime: new Date().toISOString(),
            ticketNumber: `TK-BUS-${sched.id}`,
            ratePerHour: db.settings.busHourlyRate,
          };
        } else if (status === 'departed' || status === 'cancelled') {
          const otherActive = db.busSchedules.find(
            (b) => b.id !== sched.id && b.bayId === baySlot.id && (b.status === 'arrived' || b.status === 'scheduled')
          );
          if (!otherActive) {
            baySlot.status = 'available';
            baySlot.currentVehicle = undefined;
          } else if (otherActive.status === 'scheduled') {
            baySlot.status = 'reserved';
            baySlot.currentVehicle = undefined;
          }
        } else if (status === 'scheduled' && baySlot.status === 'available') {
          baySlot.status = 'reserved';
        }
      }
    }

    pushNotification(db, {
      title: `Bus Dispatch Updated — ${sched.routeNumber}`,
      message: `Bay ${sched.bayNumber} status updated to ${sched.status.toUpperCase()}.`,
      type: 'info',
      targetUserRole: 'all',
    });

    await persistDb(db);
    res.json({
      success: true,
      message: `Updated ${sched.routeNumber} (${sched.bayNumber}) to ${sched.status}.`,
      state: db,
    });
  });

  // --- PARKING ALERTS & ISSUE REPORTING ---
  app.post('/api/issues', requireAuth, async (req: AuthedRequest, res) => {
    const db = await loadDb();
    const { category, slotId, zoneId, severity, title, description } = req.body as {
      category?: IssueCategory;
      slotId?: string;
      zoneId?: CampusZoneId;
      severity?: 'low' | 'medium' | 'high';
      title?: string;
      description?: string;
    };

    if (!category || !zoneId || !title?.trim() || !description?.trim()) {
      res.status(400).json({
        success: false,
        message: 'Issue category, parking zone, summary title, and description are required.',
      });
      return;
    }

    const nowIso = new Date().toISOString();
    const reporterName = req.user?.name || 'Campus User';
    const reporterRole = req.user?.role || 'student';

    const newIssue: ParkingIssue = {
      id: `ISS-${400 + db.issues.length + 1}`,
      category,
      slotId: slotId || undefined,
      zoneId,
      severity: severity || 'medium',
      title: title.trim(),
      description: description.trim(),
      reportedBy: reporterName,
      reporterRole,
      createdAt: nowIso,
      updatedAt: nowIso,
      status: 'open',
      history: [
        {
          timestamp: nowIso,
          status: 'open',
          actorName: reporterName,
          actorRole: reporterRole,
          note: 'Issue submitted via Campus Parking Issue Reporter.',
        },
      ],
    };

    db.issues.unshift(newIssue);

    pushNotification(db, {
      title: `New Issue Reported — ${newIssue.id}`,
      message: `${newIssue.title} (${slotId ? `Slot ${slotId}` : CAMPUS_ZONES.find((z) => z.id === zoneId)?.shortName || zoneId})`,
      type: 'warning',
      targetUserRole: 'all',
    });

    await persistDb(db);
    res.json({
      success: true,
      message: `Issue ${newIssue.id} submitted for administrator review.`,
      issue: newIssue,
      state: db,
    });
  });

  app.patch('/api/issues/:id/status', requireAdmin, async (req: AuthedRequest, res) => {
    const db = await loadDb();
    const issue = db.issues.find((i) => i.id === req.params.id);
    if (!issue) {
      res.status(404).json({ success: false, message: 'Reported issue not found.' });
      return;
    }

    const { status, note, markSlotMaintenance } = req.body as {
      status?: IssueStatus;
      note?: string;
      markSlotMaintenance?: boolean;
    };

    if (!status) {
      res.status(400).json({ success: false, message: 'Target status is required.' });
      return;
    }

    const nowIso = new Date().toISOString();
    issue.status = status;
    issue.updatedAt = nowIso;
    issue.history.push({
      timestamp: nowIso,
      status,
      actorName: req.user?.name || 'Administrator',
      actorRole: 'admin',
      note:
        note?.trim() ||
        (status === 'resolved'
          ? 'Verified and resolved by Campus Parking Operations.'
          : `Status updated to ${status.replace('_', ' ')}.`),
    });

    // Synchronize slot maintenance status if requested
    if (issue.slotId) {
      const slot = db.slots.find((s) => s.id === issue.slotId);
      if (slot) {
        if (markSlotMaintenance && slot.status === 'available') {
          slot.status = 'maintenance';
          slot.maintenanceReason = `Issue ${issue.id}: ${issue.title}`;
        } else if (status === 'resolved' && slot.status === 'maintenance') {
          slot.status = 'available';
          slot.maintenanceReason = undefined;
          promoteWaitlistForFreedSlot(db, slot.id);
        }
      }
    }

    await persistDb(db);
    res.json({
      success: true,
      message: `Issue ${issue.id} updated to ${status.replace('_', ' ').toUpperCase()}.`,
      issue,
      state: db,
    });
  });

  app.post('/api/alerts/simulate', requireAuth, async (req: AuthedRequest, res) => {
    const db = await loadDb();
    const { scenario } = req.body as { scenario?: string };

    const scenarios: Record<string, { title: string; message: string }> = {
      overstay: {
        title: '[Simulated Event] Overstay Threshold Reached — Zone B',
        message: 'Simulated demonstration alert: Vehicle CA-5559-GW in Slot B-02 exceeded 4-hour visitor limit.',
      },
      blocked: {
        title: '[Simulated Event] Delivery Van Obstruction — Zone A',
        message: 'Simulated demonstration alert: Temporary loading obstruction near North Academic Lot walkway.',
      },
      peak: {
        title: '[Simulated Event] Lecture Changeover Surge',
        message: 'Simulated demonstration alert: High inflow expected at Gate A over the next 20 minutes.',
      },
    };

    const chosen = scenarios[scenario || 'overstay'] || scenarios.overstay;
    pushNotification(db, {
      title: chosen.title,
      message: chosen.message,
      type: 'warning',
      targetUserRole: 'all',
      isSimulated: true,
    });

    await persistDb(db);
    res.json({
      success: true,
      message: 'Simulated demonstration alert added to notifications feed.',
      state: db,
    });
  });

  // --- MAINTENANCE & SETTINGS (ADMIN ONLY) ---
  app.patch('/api/slots/:id/maintenance', requireAdmin, async (req: AuthedRequest, res) => {
    const db = await loadDb();
    const slot = db.slots.find((s) => s.id === req.params.id);
    if (!slot) {
      res.status(404).json({ success: false, message: 'Slot not found.' });
      return;
    }
    if (slot.status === 'occupied') {
      res.status(400).json({
        success: false,
        message: 'Cannot place an occupied slot into maintenance until the vehicle checks out.',
      });
      return;
    }

    const { reason } = req.body as { reason?: string };

    if (slot.status === 'maintenance') {
      slot.status = 'available' as SlotStatus;
      slot.maintenanceReason = undefined;
      promoteWaitlistForFreedSlot(db, slot.id);
    } else {
      slot.status = 'maintenance' as SlotStatus;
      slot.maintenanceReason = reason?.trim() || 'Scheduled facility maintenance';
      slot.activeReservationId = undefined;
    }

    await persistDb(db);
    res.json({
      success: true,
      message:
        slot.status === 'maintenance'
          ? `Slot ${slot.slotNumber} marked Temporarily Unavailable.`
          : `Slot ${slot.slotNumber} restored to Available.`,
      state: db,
    });
  });

  app.put('/api/settings', requireAdmin, async (req: AuthedRequest, res) => {
    const db = await loadDb();
    const updates = req.body as Partial<ParkingDatabaseState['settings']>;

    db.settings = {
      ...db.settings,
      ...updates,
      carHourlyRate: Math.max(0.25, Number(updates.carHourlyRate ?? db.settings.carHourlyRate)),
      bikeHourlyRate: Math.max(0.25, Number(updates.bikeHourlyRate ?? db.settings.bikeHourlyRate)),
      staffHourlyRate: Math.max(0, Number(updates.staffHourlyRate ?? db.settings.staffHourlyRate)),
      visitorHourlyRate: Math.max(0.25, Number(updates.visitorHourlyRate ?? db.settings.visitorHourlyRate)),
      busHourlyRate: Math.max(0.5, Number(updates.busHourlyRate ?? db.settings.busHourlyRate)),
      gracePeriodMinutes: Math.max(1, Math.min(120, Number(updates.gracePeriodMinutes ?? db.settings.gracePeriodMinutes))),
      overstayLimitHours: Math.max(1, Math.min(72, Number(updates.overstayLimitHours ?? db.settings.overstayLimitHours))),
    };

    await persistDb(db);
    res.json({
      success: true,
      message: 'Facility configuration and grace period settings saved.',
      state: db,
    });
  });

  // --- ADMIN ANALYTICS ENDPOINT (SERVER PROTECTED) ---
  app.get('/api/admin/analytics', requireAdmin, async (_req, res) => {
    const db = await loadDb();
    const totalSlots = db.slots.length;
    const availableSlots = db.slots.filter((s) => s.status === 'available').length;
    const occupiedSlots = db.slots.filter((s) => s.status === 'occupied').length;
    const reservedSlots = db.slots.filter((s) => s.status === 'reserved').length;

    const cancelledBookings = db.reservations.filter((r) => r.status === 'cancelled').length;
    const expiredBookings = db.reservations.filter((r) => r.status === 'expired').length;
    const noShowBookings = db.reservations.filter((r) => r.status === 'no_show').length;

    const busSlots = db.slots.filter((s) => s.vehicleType === 'bus');
    const busOccupiedOrReserved = busSlots.filter(
      (s) => s.status === 'occupied' || s.status === 'reserved'
    ).length;

    res.json({
      success: true,
      summary: {
        totalSlots,
        availableSlots,
        occupiedSlots,
        reservedSlots,
        cancelledBookings,
        expiredBookings,
        noShowBookings,
        busBayUtilizationPct:
          busSlots.length > 0 ? Math.round((busOccupiedOrReserved / busSlots.length) * 100) : 0,
      },
      dailyHistory: db.dailyHistory,
    });
  });

  // --- VITE MIDDLEWARE OR PRODUCTION STATIC ---
  const isProd = process.env.NODE_ENV === 'production';
  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Smart Campus Parking Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Server failed to start:', err);
  process.exit(1);
});
