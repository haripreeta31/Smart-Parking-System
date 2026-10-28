export type VehicleType = 'car' | 'bike' | 'staff' | 'visitor' | 'bus';

export type SlotStatus = 'available' | 'occupied' | 'reserved' | 'maintenance';

export type FloorLevel = 'G' | 'F1' | 'F2' | 'F3';

export type CampusZoneId = 'ZONE_A' | 'ZONE_B' | 'ZONE_C' | 'ZONE_D' | 'ZONE_E';

export type UserRole = 'admin' | 'student' | 'staff' | 'visitor';

export interface UserSession {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  department: string;
  defaultPlate: string;
  defaultVehicleType: VehicleType;
  phone: string;
  token: string;
}

export interface CampusBuilding {
  id: string;
  name: string;
  shortName: string;
  category: 'academic' | 'admin' | 'library' | 'medical' | 'sports';
  coordinates: { x: number; y: number };
  nearestZoneId: CampusZoneId;
  description: string;
}

export interface CampusGate {
  id: 'GATE_A' | 'GATE_B';
  name: string;
  coordinates: { x: number; y: number };
  description: string;
}

export interface CampusZone {
  id: CampusZoneId;
  name: string;
  shortName: string;
  floor: FloorLevel;
  allowedTypes: VehicleType[];
  nearbyBuildings: string[];
  bounds: { x: number; y: number; width: number; height: number };
  landmark: string;
}

export interface ParkingSlot {
  id: string;
  slotNumber: string;
  vehicleType: VehicleType;
  floor: FloorLevel;
  floorName: string;
  zoneId: CampusZoneId;
  zoneName: string;
  nearbyBuildingId: string;
  nearbyLandmark: string;
  coordinates: { x: number; y: number };
  distanceToBuildings: Record<string, number>;
  distanceToGates: { GATE_A: number; GATE_B: number };
  status: SlotStatus;
  isEvCharging?: boolean;
  isHandicapped?: boolean;
  activeReservationId?: string;
  maintenanceReason?: string;
  currentVehicle?: {
    licensePlate: string;
    model?: string;
    color?: string;
    driverName?: string;
    driverPhone?: string;
    driverRole?: UserRole;
    entryTime: string;
    ticketNumber: string;
    ratePerHour: number;
    reservationId?: string;
  };
}

export interface Reservation {
  id: string;
  qrPassCode: string;
  slotId: string;
  slotNumber: string;
  zoneId: CampusZoneId;
  zoneName: string;
  vehicleType: VehicleType;
  licensePlate: string;
  vehicleModel?: string;
  driverName: string;
  driverPhone: string;
  driverRole: UserRole;
  userId: string;
  targetBuildingId?: string;
  startTime: string;
  endTime: string;
  status: 'confirmed' | 'checked_in' | 'completed' | 'cancelled' | 'expired' | 'no_show';
  gracePeriodMinutes: number;
  createdAt: string;
  checkedInAt?: string;
  checkedOutAt?: string;
  feeAmount?: number;
}

export interface WaitlistEntry {
  id: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  userPhone: string;
  licensePlate: string;
  vehicleType: VehicleType;
  preferredZoneId: CampusZoneId | 'ANY';
  targetBuildingId?: string;
  desiredStartTime: string;
  desiredEndTime: string;
  joinedAt: string;
  status: 'waiting' | 'notified' | 'claimed' | 'cancelled';
  offeredSlotId?: string;
  offeredReservationId?: string;
  notifiedAt?: string;
}

export interface BusSchedule {
  id: string;
  routeNumber: string;
  routeName: string;
  busPlate: string;
  busModel: string;
  operatorName: string;
  driverName: string;
  driverPhone: string;
  bayId: string;
  bayNumber: string;
  arrivalTime: string;
  departureTime: string;
  status: 'scheduled' | 'arrived' | 'departed' | 'cancelled';
  passengerCapacity: number;
  notes?: string;
}

export type IssueCategory =
  | 'blocked_slot'
  | 'incorrect_availability'
  | 'unauthorized_parking'
  | 'damaged_facility'
  | 'other';

export type IssueStatus = 'open' | 'in_review' | 'resolved';

export interface IssueHistoryEvent {
  timestamp: string;
  status: IssueStatus;
  actorName: string;
  actorRole: UserRole;
  note: string;
}

export interface ParkingIssue {
  id: string;
  category: IssueCategory;
  slotId?: string;
  zoneId: CampusZoneId;
  severity: 'low' | 'medium' | 'high';
  title: string;
  description: string;
  reportedBy: string;
  reporterRole: UserRole;
  createdAt: string;
  updatedAt: string;
  status: IssueStatus;
  isSimulatedAlert?: boolean;
  history: IssueHistoryEvent[];
}

export interface VehicleEntryLog {
  id: string;
  ticketNumber: string;
  licensePlate: string;
  vehicleType: VehicleType;
  slotId: string;
  zoneId?: CampusZoneId;
  floor: FloorLevel;
  driverName?: string;
  entryTime: string;
  exitTime?: string;
  durationMinutes?: number;
  feeAmount?: number;
  paymentStatus: 'pending' | 'paid' | 'waived';
  status: 'active' | 'completed';
  reservationId?: string;
}

export interface VehicleCategoryStats {
  type: VehicleType;
  title: string;
  totalSpaces: number;
  occupiedSpaces: number;
  reservedSpaces: number;
  maintenanceSpaces: number;
  availableSpaces: number;
  occupancyPercentage: number;
  hourlyRate: number;
}

export interface OverallParkingStats {
  totalSpaces: number;
  totalOccupied: number;
  totalReserved: number;
  totalMaintenance: number;
  totalAvailable: number;
  activeReservationsCount: number;
  waitlistWaitingCount: number;
  openIssuesCount: number;
  canPark: number;
  overallOccupancyPercentage: number;
  carStats: VehicleCategoryStats;
  bikeStats: VehicleCategoryStats;
  staffStats: VehicleCategoryStats;
  visitorStats: VehicleCategoryStats;
  busStats: VehicleCategoryStats;
}

export interface HourlyTrafficData {
  time: string;
  cars: number;
  bikes: number;
  staff: number;
  visitors: number;
  buses: number;
  total: number;
  predictedTotal?: number;
}

export interface DailyOccupancyRecord {
  date: string;
  dayName: string;
  bookingsCount: number;
  avgOccupancyPct: number;
  peakOccupancyPct: number;
  cancelledCount: number;
  expiredCount: number;
  noShowCount: number;
  completedSessions: number;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  createdAtIso?: string;
  type: 'entry' | 'exit' | 'warning' | 'info' | 'waitlist' | 'reservation';
  read: boolean;
  targetUserRole?: UserRole | 'all';
  isSimulated?: boolean;
}

export interface ParkingSettings {
  carHourlyRate: number;
  bikeHourlyRate: number;
  staffHourlyRate: number;
  visitorHourlyRate: number;
  busHourlyRate: number;
  systemName: string;
  gateMode: 'auto' | 'manual';
  overstayLimitHours: number;
  gracePeriodMinutes: number;
  enableLiveSimulation: boolean;
}

export interface SlotRecommendationResult {
  slot: ParkingSlot;
  totalScore: number;
  distanceToBuildingMeters: number;
  distanceToGateMeters: number;
  walkingMinutes: number;
  scoreBreakdown: {
    buildingProximity: number;
    gateProximity: number;
    accessibilityMatch: number;
    zoneFit: number;
  };
  reasonSummary: string;
}

export interface ParkingDatabaseState {
  slots: ParkingSlot[];
  logs: VehicleEntryLog[];
  reservations: Reservation[];
  waitlist: WaitlistEntry[];
  busSchedules: BusSchedule[];
  issues: ParkingIssue[];
  notifications: NotificationItem[];
  settings: ParkingSettings;
  dailyHistory: DailyOccupancyRecord[];
}
