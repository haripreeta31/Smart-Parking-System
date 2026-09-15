import React, { createContext, useContext, useState, useMemo, useEffect, ReactNode } from 'react';
import {
  ParkingSlot,
  VehicleEntryLog,
  VehicleType,
  OverallParkingStats,
  VehicleCategoryStats,
  NotificationItem,
  ParkingSettings,
  SlotStatus,
} from '../types';
import { generateInitialSlots, generateInitialLogs, INITIAL_SETTINGS } from '../data/initialData';

interface ParkingContextType {
  slots: ParkingSlot[];
  logs: VehicleEntryLog[];
  notifications: NotificationItem[];
  settings: ParkingSettings;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  stats: OverallParkingStats;
  selectedSlotForModal: ParkingSlot | null;
  setSelectedSlotForModal: (slot: ParkingSlot | null) => void;
  isParkModalOpen: boolean;
  setIsParkModalOpen: (open: boolean) => void;
  preselectedTypeForParkModal: VehicleType | null;
  setPreselectedTypeForParkModal: (type: VehicleType | null) => void;
  preselectedSlotIdForParkModal: string | null;
  setPreselectedSlotIdForParkModal: (slotId: string | null) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  parkVehicle: (data: {
    type: VehicleType;
    slotId: string;
    licensePlate: string;
    model?: string;
    driverName?: string;
    driverPhone?: string;
  }) => { success: boolean; message: string };
  vacateSlot: (slotId: string) => { success: boolean; log?: VehicleEntryLog };
  toggleSlotMaintenance: (slotId: string) => void;
  updateSettings: (newSettings: Partial<ParkingSettings>) => void;
  markNotificationAsRead: (id: string) => void;
  markAllNotificationsAsRead: () => void;
  clearNotifications: () => void;
}

const ParkingContext = createContext<ParkingContextType | undefined>(undefined);

export const ParkingProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [slots, setSlots] = useState<ParkingSlot[]>(() => generateInitialSlots());
  const [logs, setLogs] = useState<VehicleEntryLog[]>(() => generateInitialLogs());
  const [settings, setSettings] = useState<ParkingSettings>(INITIAL_SETTINGS);
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [selectedSlotForModal, setSelectedSlotForModal] = useState<ParkingSlot | null>(null);
  const [isParkModalOpen, setIsParkModalOpen] = useState<boolean>(false);
  const [preselectedTypeForParkModal, setPreselectedTypeForParkModal] = useState<VehicleType | null>(null);
  const [preselectedSlotIdForParkModal, setPreselectedSlotIdForParkModal] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');

  const [notifications, setNotifications] = useState<NotificationItem[]>([
    {
      id: 'notif-1',
      title: 'Gate A Entry - Tesla Model 3',
      message: 'Vehicle CA-4291-XT parked at Slot C-G03 (EV Charging).',
      timestamp: '2 mins ago',
      type: 'entry',
      read: false,
    },
    {
      id: 'notif-2',
      title: 'High Occupancy Alert',
      message: 'Car parking capacity reached 70% (84/120 occupied).',
      timestamp: '15 mins ago',
      type: 'warning',
      read: false,
    },
    {
      id: 'notif-3',
      title: 'Checkout Completed - Bus Bay',
      message: 'Bus BU-1849-TR checked out from B-03. Total fee $46.67 collected.',
      timestamp: '32 mins ago',
      type: 'exit',
      read: true,
    },
  ]);

  // Compute live statistics for Cars, Buses, Bikes and Overall
  const stats: OverallParkingStats = useMemo(() => {
    const calcCategory = (type: VehicleType, title: string, rate: number): VehicleCategoryStats => {
      const typeSlots = slots.filter((s) => s.vehicleType === type);
      const totalSpaces = typeSlots.length;
      const occupiedSpaces = typeSlots.filter((s) => s.status === 'occupied').length;
      const availableSpaces = totalSpaces - occupiedSpaces;
      const occupancyPercentage = totalSpaces > 0 ? Math.round((occupiedSpaces / totalSpaces) * 100) : 0;

      return {
        type,
        title,
        totalSpaces,
        occupiedSpaces,
        availableSpaces,
        occupancyPercentage,
        hourlyRate: rate,
      };
    };

    const carStats = calcCategory('car', 'Cars', settings.carHourlyRate);
    const busStats = calcCategory('bus', 'Buses', settings.busHourlyRate);
    const bikeStats = calcCategory('bike', 'Bikes', settings.bikeHourlyRate);

    const totalSpaces = carStats.totalSpaces + busStats.totalSpaces + bikeStats.totalSpaces;
    const totalOccupied = carStats.occupiedSpaces + busStats.occupiedSpaces + bikeStats.occupiedSpaces;
    const totalAvailable = carStats.availableSpaces + busStats.availableSpaces + bikeStats.availableSpaces;
    const canPark = totalAvailable;
    const overallOccupancyPercentage =
      totalSpaces > 0 ? Math.round((totalOccupied / totalSpaces) * 1000) / 10 : 0;

    return {
      totalSpaces,
      totalOccupied,
      totalAvailable,
      canPark,
      overallOccupancyPercentage,
      carStats,
      busStats,
      bikeStats,
    };
  }, [slots, settings]);

  const parkVehicle = (data: {
    type: VehicleType;
    slotId: string;
    licensePlate: string;
    model?: string;
    driverName?: string;
    driverPhone?: string;
  }) => {
    const slot = slots.find((s) => s.id === data.slotId);
    if (!slot) {
      return { success: false, message: 'Slot not found.' };
    }
    if (slot.status === 'occupied') {
      return { success: false, message: 'Slot is already occupied.' };
    }

    const rate =
      data.type === 'car'
        ? settings.carHourlyRate
        : data.type === 'bus'
        ? settings.busHourlyRate
        : settings.bikeHourlyRate;

    const entryTime = new Date().toISOString();
    const ticketNumber = `TK-${data.type.toUpperCase().slice(0, 1)}-${Math.floor(1000 + Math.random() * 9000)}`;

    const currentVehicle = {
      licensePlate: data.licensePlate.toUpperCase().trim(),
      model: data.model || `${data.type.toUpperCase()} Default`,
      driverName: data.driverName || 'Guest Driver',
      driverPhone: data.driverPhone || '+1 (555) 000-0000',
      entryTime,
      ticketNumber,
      ratePerHour: rate,
    };

    setSlots((prev) =>
      prev.map((s) => (s.id === data.slotId ? { ...s, status: 'occupied' as SlotStatus, currentVehicle } : s))
    );

    // Add active log
    const newLog: VehicleEntryLog = {
      id: `LOG-${Date.now()}`,
      ticketNumber,
      licensePlate: currentVehicle.licensePlate,
      vehicleType: data.type,
      slotId: data.slotId,
      floor: slot.floor,
      entryTime,
      paymentStatus: 'pending',
      status: 'active',
    };
    setLogs((prev) => [newLog, ...prev]);

    // Add Notification
    const newNotif: NotificationItem = {
      id: `notif-${Date.now()}`,
      title: `Vehicle Parked - Slot ${slot.slotNumber}`,
      message: `${currentVehicle.licensePlate} (${data.type.toUpperCase()}) parked successfully.`,
      timestamp: 'Just now',
      type: 'entry',
      read: false,
    };
    setNotifications((prev) => [newNotif, ...prev]);

    return { success: true, message: `Vehicle ${currentVehicle.licensePlate} assigned to ${slot.slotNumber}.` };
  };

  const vacateSlot = (slotId: string) => {
    const slot = slots.find((s) => s.id === slotId);
    if (!slot || !slot.currentVehicle) {
      return { success: false };
    }

    const exitTime = new Date();
    const entryDate = new Date(slot.currentVehicle.entryTime);
    const durationMs = Math.max(exitTime.getTime() - entryDate.getTime(), 60000); // at least 1 min
    const durationMinutes = Math.round(durationMs / (1000 * 60));
    const hoursBilled = Math.max(durationMinutes / 60, 0.5); // min 30 min billing
    const feeAmount = Math.round(hoursBilled * slot.currentVehicle.ratePerHour * 100) / 100;

    const completedLog: VehicleEntryLog = {
      id: `LOG-${Date.now()}`,
      ticketNumber: slot.currentVehicle.ticketNumber,
      licensePlate: slot.currentVehicle.licensePlate,
      vehicleType: slot.vehicleType,
      slotId: slot.id,
      floor: slot.floor,
      entryTime: slot.currentVehicle.entryTime,
      exitTime: exitTime.toISOString(),
      durationMinutes,
      feeAmount,
      paymentStatus: 'paid',
      status: 'completed',
    };

    setLogs((prev) => [completedLog, ...prev.filter((l) => l.ticketNumber !== slot.currentVehicle?.ticketNumber)]);

    setSlots((prev) =>
      prev.map((s) => (s.id === slotId ? { ...s, status: 'available' as SlotStatus, currentVehicle: undefined } : s))
    );

    // Notification
    const newNotif: NotificationItem = {
      id: `notif-${Date.now()}`,
      title: `Vehicle Checked Out - Slot ${slot.slotNumber}`,
      message: `${slot.currentVehicle.licensePlate} vacated. Fee of $${feeAmount.toFixed(2)} settled.`,
      timestamp: 'Just now',
      type: 'exit',
      read: false,
    };
    setNotifications((prev) => [newNotif, ...prev]);

    return { success: true, log: completedLog };
  };

  const toggleSlotMaintenance = (slotId: string) => {
    setSlots((prev) =>
      prev.map((s) => {
        if (s.id !== slotId) return s;
        if (s.status === 'maintenance') {
          return { ...s, status: 'available' as SlotStatus };
        }
        if (s.status === 'available') {
          return { ...s, status: 'maintenance' as SlotStatus };
        }
        return s;
      })
    );
  };

  const updateSettings = (newSettings: Partial<ParkingSettings>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
  };

  const markNotificationAsRead = (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };

  const markAllNotificationsAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  return (
    <ParkingContext.Provider
      value={{
        slots,
        logs,
        notifications,
        settings,
        activeTab,
        setActiveTab,
        stats,
        selectedSlotForModal,
        setSelectedSlotForModal,
        isParkModalOpen,
        setIsParkModalOpen,
        preselectedTypeForParkModal,
        setPreselectedTypeForParkModal,
        preselectedSlotIdForParkModal,
        setPreselectedSlotIdForParkModal,
        searchQuery,
        setSearchQuery,
        parkVehicle,
        vacateSlot,
        toggleSlotMaintenance,
        updateSettings,
        markNotificationAsRead,
        markAllNotificationsAsRead,
        clearNotifications,
      }}
    >
      {children}
    </ParkingContext.Provider>
  );
};

export const useParking = () => {
  const context = useContext(ParkingContext);
  if (!context) {
    throw new Error('useParking must be used within a ParkingProvider');
  }
  return context;
};
