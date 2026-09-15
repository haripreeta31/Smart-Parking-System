export type VehicleType = 'car' | 'bus' | 'bike';

export type SlotStatus = 'available' | 'occupied' | 'reserved' | 'maintenance';

export type FloorLevel = 'G' | 'F1' | 'F2' | 'F3';

export interface ParkingSlot {
  id: string; // e.g. "C-101", "B-04", "BK-12"
  slotNumber: string;
  vehicleType: VehicleType;
  floor: FloorLevel;
  floorName: string;
  status: SlotStatus;
  isEvCharging?: boolean;
  isHandicapped?: boolean;
  currentVehicle?: {
    licensePlate: string;
    model?: string;
    color?: string;
    driverName?: string;
    driverPhone?: string;
    entryTime: string; // ISO string
    ticketNumber: string;
    ratePerHour: number;
  };
}

export interface VehicleEntryLog {
  id: string;
  ticketNumber: string;
  licensePlate: string;
  vehicleType: VehicleType;
  slotId: string;
  floor: FloorLevel;
  entryTime: string;
  exitTime?: string;
  durationMinutes?: number;
  feeAmount?: number;
  paymentStatus: 'pending' | 'paid' | 'waived';
  status: 'active' | 'completed';
}

export interface VehicleCategoryStats {
  type: VehicleType;
  title: string;
  totalSpaces: number;
  occupiedSpaces: number;
  availableSpaces: number;
  occupancyPercentage: number;
  hourlyRate: number;
}

export interface OverallParkingStats {
  totalSpaces: number;
  totalOccupied: number;
  totalAvailable: number;
  canPark: number;
  overallOccupancyPercentage: number;
  carStats: VehicleCategoryStats;
  busStats: VehicleCategoryStats;
  bikeStats: VehicleCategoryStats;
}

export interface HourlyTrafficData {
  time: string;
  cars: number;
  buses: number;
  bikes: number;
  total: number;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  type: 'entry' | 'exit' | 'warning' | 'info';
  read: boolean;
}

export interface ParkingSettings {
  carHourlyRate: number;
  busHourlyRate: number;
  bikeHourlyRate: number;
  systemName: string;
  gateMode: 'auto' | 'manual';
  overstayLimitHours: number;
  enableLiveSimulation: boolean;
}
