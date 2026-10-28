import React, { createContext, useContext, useState, useMemo, useEffect, useCallback, ReactNode } from 'react';
import type {
  ParkingSlot,
  VehicleEntryLog,
  VehicleType,
  OverallParkingStats,
  VehicleCategoryStats,
  NotificationItem,
  ParkingSettings,
  Reservation,
  WaitlistEntry,
  BusSchedule,
  ParkingIssue,
  IssueCategory,
  IssueStatus,
  CampusZoneId,
  DailyOccupancyRecord,
  UserSession,
  ParkingDatabaseState,
} from '../types';
import { createSeedDatabase, DEMO_USERS } from '../data/initialData';

interface ApiActionResult<T = unknown> {
  success: boolean;
  message: string;
  code?: string;
  data?: T;
}

interface ParkingContextType {
  currentUser: UserSession;
  availableUsers: Omit<UserSession, 'token'>[];
  switchUser: (userId: string) => Promise<void>;
  isLoading: boolean;
  toastMessage: { type: 'success' | 'error' | 'info'; text: string } | null;
  showToast: (type: 'success' | 'error' | 'info', text: string) => void;
  dismissToast: () => void;

  slots: ParkingSlot[];
  logs: VehicleEntryLog[];
  reservations: Reservation[];
  waitlist: WaitlistEntry[];
  busSchedules: BusSchedule[];
  issues: ParkingIssue[];
  dailyHistory: DailyOccupancyRecord[];
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

  mapHighlightedSlotId: string | null;
  setMapHighlightedSlotId: (slotId: string | null) => void;
  preselectedSlotForReservation: string | null;
  setPreselectedSlotForReservation: (slotId: string | null) => void;
  lastCheckedInSlotId: string | null;
  setLastCheckedInSlotId: (slotId: string | null) => void;

  searchQuery: string;
  setSearchQuery: (query: string) => void;

  parkVehicle: (data: {
    type: VehicleType;
    slotId: string;
    licensePlate: string;
    model?: string;
    driverName?: string;
    driverPhone?: string;
  }) => Promise<ApiActionResult>;

  vacateSlot: (slotId: string) => Promise<ApiActionResult<VehicleEntryLog>>;

  createReservation: (data: {
    slotId: string;
    vehicleType: VehicleType;
    licensePlate: string;
    vehicleModel?: string;
    driverName?: string;
    driverPhone?: string;
    targetBuildingId?: string;
    startTime: string;
    endTime: string;
  }) => Promise<ApiActionResult<Reservation>>;

  validateOrActionQrPass: (
    qrPassCode: string,
    action: 'verify' | 'checkin' | 'checkout'
  ) => Promise<ApiActionResult<Reservation>>;

  cancelReservation: (reservationId: string) => Promise<ApiActionResult>;
  processNoShows: () => Promise<ApiActionResult<{ releasedCount: number; promotedCount: number }>>;

  joinWaitlist: (data: {
    vehicleType: VehicleType;
    preferredZoneId: CampusZoneId | 'ANY';
    licensePlate: string;
    userName?: string;
    userPhone?: string;
    targetBuildingId?: string;
    desiredStartTime?: string;
    desiredEndTime?: string;
  }) => Promise<ApiActionResult<WaitlistEntry>>;

  leaveWaitlist: (waitlistId: string) => Promise<ApiActionResult>;

  createBusSchedule: (data: Partial<BusSchedule>) => Promise<ApiActionResult<BusSchedule>>;
  updateBusSchedule: (
    scheduleId: string,
    updates: { status?: BusSchedule['status']; bayId?: string }
  ) => Promise<ApiActionResult>;

  reportIssue: (data: {
    category: IssueCategory;
    slotId?: string;
    zoneId: CampusZoneId;
    severity: 'low' | 'medium' | 'high';
    title: string;
    description: string;
  }) => Promise<ApiActionResult<ParkingIssue>>;

  updateIssueStatus: (
    issueId: string,
    updates: { status: IssueStatus; note?: string; markSlotMaintenance?: boolean }
  ) => Promise<ApiActionResult<ParkingIssue>>;

  triggerSimulatedAlert: (scenario: 'overstay' | 'blocked' | 'peak') => Promise<ApiActionResult>;

  toggleSlotMaintenance: (slotId: string, reason?: string) => Promise<ApiActionResult>;
  updateSettings: (newSettings: Partial<ParkingSettings>) => Promise<ApiActionResult>;

  markNotificationAsRead: (id: string) => void;
  markAllNotificationsAsRead: () => void;
  clearNotifications: () => void;
  refreshState: () => Promise<void>;
}

const STORAGE_STATE_KEY = 'smart_campus_parking_state_v2';
const STORAGE_USER_KEY = 'smart_campus_parking_user_v2';
const STORAGE_LAST_SLOT_KEY = 'smart_campus_last_parked_slot_v2';

const ParkingContext = createContext<ParkingContextType | undefined>(undefined);

export const ParkingProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [dbState, setDbState] = useState<ParkingDatabaseState>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_STATE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as ParkingDatabaseState;
        if (parsed && Array.isArray(parsed.slots) && Array.isArray(parsed.reservations)) {
          return parsed;
        }
      }
    } catch {
      // Ignore storage parse error and fall back to seed
    }
    return createSeedDatabase();
  });

  const [currentUser, setCurrentUser] = useState<UserSession>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_USER_KEY);
      if (saved) {
        return JSON.parse(saved) as UserSession;
      }
    } catch {
      // ignore
    }
    return { ...DEMO_USERS[0], token: '' };
  });

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [toastMessage, setToastMessage] = useState<{
    type: 'success' | 'error' | 'info';
    text: string;
  } | null>(null);

  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [selectedSlotForModal, setSelectedSlotForModal] = useState<ParkingSlot | null>(null);
  const [isParkModalOpen, setIsParkModalOpen] = useState<boolean>(false);
  const [preselectedTypeForParkModal, setPreselectedTypeForParkModal] = useState<VehicleType | null>(null);
  const [preselectedSlotIdForParkModal, setPreselectedSlotIdForParkModal] = useState<string | null>(null);

  const [mapHighlightedSlotId, setMapHighlightedSlotId] = useState<string | null>(null);
  const [preselectedSlotForReservation, setPreselectedSlotForReservation] = useState<string | null>(null);
  const [lastCheckedInSlotId, setLastCheckedInSlotIdState] = useState<string | null>(() => {
    try {
      return localStorage.getItem(STORAGE_LAST_SLOT_KEY) || 'A-08';
    } catch {
      return 'A-08';
    }
  });

  const [searchQuery, setSearchQuery] = useState<string>('');

  const showToast = useCallback((type: 'success' | 'error' | 'info', text: string) => {
    setToastMessage({ type, text });
  }, []);

  const dismissToast = useCallback(() => {
    setToastMessage(null);
  }, []);

  useEffect(() => {
    if (!toastMessage) return;
    const timer = setTimeout(() => setToastMessage(null), 4500);
    return () => clearTimeout(timer);
  }, [toastMessage]);

  const setLastCheckedInSlotId = useCallback((slotId: string | null) => {
    setLastCheckedInSlotIdState(slotId);
    try {
      if (slotId) localStorage.setItem(STORAGE_LAST_SLOT_KEY, slotId);
      else localStorage.removeItem(STORAGE_LAST_SLOT_KEY);
    } catch {
      // ignore
    }
  }, []);

  const applyServerState = useCallback((nextState: ParkingDatabaseState) => {
    setDbState(nextState);
    try {
      localStorage.setItem(STORAGE_STATE_KEY, JSON.stringify(nextState));
    } catch {
      // ignore quota errors
    }
    setSelectedSlotForModal((prev) => {
      if (!prev) return null;
      return nextState.slots.find((s) => s.id === prev.id) || null;
    });
  }, []);

  const switchUser = useCallback(
    async (userId: string) => {
      try {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId }),
        });
        const data = await res.json();
        if (data.success && data.session) {
          setCurrentUser(data.session);
          localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(data.session));
          showToast(
            'info',
            `Switched active role to ${data.session.name} (${data.session.role.toUpperCase()}).`
          );
        }
      } catch {
        const fallback = DEMO_USERS.find((u) => u.id === userId) || DEMO_USERS[0];
        const session: UserSession = { ...fallback, token: 'local-fallback' };
        setCurrentUser(session);
      }
    },
    [showToast]
  );

  const refreshState = useCallback(async () => {
    try {
      const res = await fetch('/api/state');
      const data = await res.json();
      if (data.success && data.state) {
        applyServerState(data.state);
      }
    } catch {
      // Offline / localStorage fallback retained cleanly
    } finally {
      setIsLoading(false);
    }
  }, [applyServerState]);

  // Initial session login + state sync from backend
  useEffect(() => {
    let mounted = true;
    async function bootstrap() {
      try {
        const loginRes = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: currentUser.id }),
        });
        const loginJson = await loginRes.json();
        if (mounted && loginJson.success && loginJson.session) {
          setCurrentUser(loginJson.session);
          localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(loginJson.session));
        }

        const stateRes = await fetch('/api/state');
        const stateJson = await stateRes.json();
        if (mounted && stateJson.success && stateJson.state) {
          applyServerState(stateJson.state);
        }
      } catch {
        // Keep hydrated localStorage / seed state if server temporarily unreachable
      } finally {
        if (mounted) setIsLoading(false);
      }
    }
    bootstrap();
    return () => {
      mounted = false;
    };
  }, []);

  const authHeaders = useMemo(
    () => ({
      'Content-Type': 'application/json',
      Authorization: `Bearer ${currentUser.token}`,
    }),
    [currentUser.token]
  );

  // Compute live statistics across all 5 categories + reservations + waitlist + issues
  const stats: OverallParkingStats = useMemo(() => {
    const { slots, settings, reservations, waitlist, issues } = dbState;

    const calcCategory = (type: VehicleType, title: string, rate: number): VehicleCategoryStats => {
      const typeSlots = slots.filter((s) => s.vehicleType === type);
      const totalSpaces = typeSlots.length;
      const occupiedSpaces = typeSlots.filter((s) => s.status === 'occupied').length;
      const reservedSpaces = typeSlots.filter((s) => s.status === 'reserved').length;
      const maintenanceSpaces = typeSlots.filter((s) => s.status === 'maintenance').length;
      const availableSpaces = typeSlots.filter((s) => s.status === 'available').length;
      const occupancyPercentage =
        totalSpaces > 0 ? Math.round((occupiedSpaces / totalSpaces) * 100) : 0;

      return {
        type,
        title,
        totalSpaces,
        occupiedSpaces,
        reservedSpaces,
        maintenanceSpaces,
        availableSpaces,
        occupancyPercentage,
        hourlyRate: rate,
      };
    };

    const carStats = calcCategory('car', 'Cars', settings.carHourlyRate);
    const bikeStats = calcCategory('bike', 'Bikes', settings.bikeHourlyRate);
    const staffStats = calcCategory('staff', 'Staff Vehicles', settings.staffHourlyRate);
    const visitorStats = calcCategory('visitor', 'Visitors', settings.visitorHourlyRate);
    const busStats = calcCategory('bus', 'Buses', settings.busHourlyRate);

    const totalSpaces = slots.length;
    const totalOccupied = slots.filter((s) => s.status === 'occupied').length;
    const totalReserved = slots.filter((s) => s.status === 'reserved').length;
    const totalMaintenance = slots.filter((s) => s.status === 'maintenance').length;
    const totalAvailable = slots.filter((s) => s.status === 'available').length;

    const activeReservationsCount = reservations.filter(
      (r) => r.status === 'confirmed' || r.status === 'checked_in'
    ).length;
    const waitlistWaitingCount = waitlist.filter((w) => w.status === 'waiting').length;
    const openIssuesCount = issues.filter((i) => i.status !== 'resolved').length;

    const overallOccupancyPercentage =
      totalSpaces > 0 ? Math.round((totalOccupied / totalSpaces) * 1000) / 10 : 0;

    return {
      totalSpaces,
      totalOccupied,
      totalReserved,
      totalMaintenance,
      totalAvailable,
      activeReservationsCount,
      waitlistWaitingCount,
      openIssuesCount,
      canPark: totalAvailable,
      overallOccupancyPercentage,
      carStats,
      bikeStats,
      staffStats,
      visitorStats,
      busStats,
    };
  }, [dbState]);

  const parkVehicle: ParkingContextType['parkVehicle'] = async (payload) => {
    try {
      const res = await fetch('/api/park', {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (json.state) applyServerState(json.state);
      if (json.success) {
        setLastCheckedInSlotId(payload.slotId);
        showToast('success', json.message);
      } else {
        showToast('error', json.message || 'Check-in failed.');
      }
      return { success: Boolean(json.success), message: json.message };
    } catch {
      return { success: false, message: 'Network error while checking in vehicle.' };
    }
  };

  const vacateSlot: ParkingContextType['vacateSlot'] = async (slotId) => {
    try {
      const res = await fetch('/api/vacate', {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({ slotId }),
      });
      const json = await res.json();
      if (json.state) applyServerState(json.state);
      if (json.success) {
        if (lastCheckedInSlotId === slotId) {
          setLastCheckedInSlotId(null);
        }
        showToast('success', json.message);
      } else {
        showToast('error', json.message || 'Checkout failed.');
      }
      return { success: Boolean(json.success), message: json.message, data: json.log };
    } catch {
      return { success: false, message: 'Network error during checkout.' };
    }
  };

  const createReservation: ParkingContextType['createReservation'] = async (payload) => {
    try {
      const res = await fetch('/api/reservations', {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (json.state) applyServerState(json.state);
      if (json.success) {
        showToast('success', json.message);
      } else {
        showToast('error', json.message);
      }
      return {
        success: Boolean(json.success),
        message: json.message,
        data: json.reservation,
      };
    } catch {
      return { success: false, message: 'Unable to reach server to validate reservation.' };
    }
  };

  const validateOrActionQrPass: ParkingContextType['validateOrActionQrPass'] = async (
    qrPassCode,
    action
  ) => {
    try {
      const res = await fetch('/api/reservations/validate-qr', {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({ qrPassCode, action }),
      });
      const json = await res.json();
      if (json.state) applyServerState(json.state);
      if (json.success && action === 'checkin' && json.reservation?.slotId) {
        setLastCheckedInSlotId(json.reservation.slotId);
      }
      if (json.success && action === 'checkout' && json.reservation?.slotId === lastCheckedInSlotId) {
        setLastCheckedInSlotId(null);
      }
      if (json.success) {
        showToast('success', json.message);
      } else {
        showToast('error', json.message);
      }
      return {
        success: Boolean(json.success),
        message: json.message,
        code: json.code,
        data: json.reservation,
      };
    } catch {
      return { success: false, message: 'Unable to validate QR pass with server.' };
    }
  };

  const cancelReservation: ParkingContextType['cancelReservation'] = async (reservationId) => {
    try {
      const res = await fetch(`/api/reservations/${reservationId}/cancel`, {
        method: 'POST',
        headers: authHeaders,
      });
      const json = await res.json();
      if (json.state) applyServerState(json.state);
      showToast(json.success ? 'info' : 'error', json.message);
      return { success: Boolean(json.success), message: json.message };
    } catch {
      return { success: false, message: 'Failed to cancel reservation.' };
    }
  };

  const processNoShows: ParkingContextType['processNoShows'] = async () => {
    try {
      const res = await fetch('/api/reservations/process-noshows', {
        method: 'POST',
        headers: authHeaders,
      });
      const json = await res.json();
      if (json.state) applyServerState(json.state);
      showToast(json.releasedCount > 0 ? 'success' : 'info', json.message);
      return {
        success: Boolean(json.success),
        message: json.message,
        data: { releasedCount: json.releasedCount || 0, promotedCount: json.promotedCount || 0 },
      };
    } catch {
      return { success: false, message: 'Failed to run grace-period check.' };
    }
  };

  const joinWaitlist: ParkingContextType['joinWaitlist'] = async (payload) => {
    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (json.state) applyServerState(json.state);
      showToast(json.success ? 'success' : 'error', json.message);
      return { success: Boolean(json.success), message: json.message, data: json.entry };
    } catch {
      return { success: false, message: 'Failed to join waitlist.' };
    }
  };

  const leaveWaitlist: ParkingContextType['leaveWaitlist'] = async (waitlistId) => {
    try {
      const res = await fetch(`/api/waitlist/${waitlistId}`, {
        method: 'DELETE',
        headers: authHeaders,
      });
      const json = await res.json();
      if (json.state) applyServerState(json.state);
      showToast(json.success ? 'info' : 'error', json.message);
      return { success: Boolean(json.success), message: json.message };
    } catch {
      return { success: false, message: 'Failed to leave waitlist.' };
    }
  };

  const createBusSchedule: ParkingContextType['createBusSchedule'] = async (payload) => {
    try {
      const res = await fetch('/api/bus-schedules', {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (json.state) applyServerState(json.state);
      showToast(json.success ? 'success' : 'error', json.message);
      return { success: Boolean(json.success), message: json.message, data: json.schedule };
    } catch {
      return { success: false, message: 'Failed to schedule bus bay.' };
    }
  };

  const updateBusSchedule: ParkingContextType['updateBusSchedule'] = async (scheduleId, updates) => {
    try {
      const res = await fetch(`/api/bus-schedules/${scheduleId}`, {
        method: 'PATCH',
        headers: authHeaders,
        body: JSON.stringify(updates),
      });
      const json = await res.json();
      if (json.state) applyServerState(json.state);
      showToast(json.success ? 'success' : 'error', json.message);
      return { success: Boolean(json.success), message: json.message };
    } catch {
      return { success: false, message: 'Failed to update bus schedule.' };
    }
  };

  const reportIssue: ParkingContextType['reportIssue'] = async (payload) => {
    try {
      const res = await fetch('/api/issues', {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (json.state) applyServerState(json.state);
      showToast(json.success ? 'success' : 'error', json.message);
      return { success: Boolean(json.success), message: json.message, data: json.issue };
    } catch {
      return { success: false, message: 'Failed to submit issue report.' };
    }
  };

  const updateIssueStatus: ParkingContextType['updateIssueStatus'] = async (issueId, updates) => {
    try {
      const res = await fetch(`/api/issues/${issueId}/status`, {
        method: 'PATCH',
        headers: authHeaders,
        body: JSON.stringify(updates),
      });
      const json = await res.json();
      if (json.state) applyServerState(json.state);
      showToast(json.success ? 'success' : 'error', json.message);
      return { success: Boolean(json.success), message: json.message, data: json.issue };
    } catch {
      return { success: false, message: 'Failed to update issue status.' };
    }
  };

  const triggerSimulatedAlert: ParkingContextType['triggerSimulatedAlert'] = async (scenario) => {
    try {
      const res = await fetch('/api/alerts/simulate', {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({ scenario }),
      });
      const json = await res.json();
      if (json.state) applyServerState(json.state);
      showToast('info', json.message);
      return { success: Boolean(json.success), message: json.message };
    } catch {
      return { success: false, message: 'Failed to trigger simulated alert.' };
    }
  };

  const toggleSlotMaintenance: ParkingContextType['toggleSlotMaintenance'] = async (slotId, reason) => {
    try {
      const res = await fetch(`/api/slots/${slotId}/maintenance`, {
        method: 'PATCH',
        headers: authHeaders,
        body: JSON.stringify({ reason }),
      });
      const json = await res.json();
      if (json.state) applyServerState(json.state);
      showToast(json.success ? 'info' : 'error', json.message);
      return { success: Boolean(json.success), message: json.message };
    } catch {
      return { success: false, message: 'Failed to update slot maintenance status.' };
    }
  };

  const updateSettings: ParkingContextType['updateSettings'] = async (newSettings) => {
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: authHeaders,
        body: JSON.stringify(newSettings),
      });
      const json = await res.json();
      if (json.state) applyServerState(json.state);
      showToast(json.success ? 'success' : 'error', json.message);
      return { success: Boolean(json.success), message: json.message };
    } catch {
      return { success: false, message: 'Failed to save configuration settings.' };
    }
  };

  const markNotificationAsRead = (id: string) => {
    setDbState((prev) => ({
      ...prev,
      notifications: prev.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)),
    }));
  };

  const markAllNotificationsAsRead = () => {
    setDbState((prev) => ({
      ...prev,
      notifications: prev.notifications.map((n) => ({ ...n, read: true })),
    }));
  };

  const clearNotifications = () => {
    setDbState((prev) => ({ ...prev, notifications: [] }));
  };

  return (
    <ParkingContext.Provider
      value={{
        currentUser,
        availableUsers: DEMO_USERS,
        switchUser,
        isLoading,
        toastMessage,
        showToast,
        dismissToast,
        slots: dbState.slots,
        logs: dbState.logs,
        reservations: dbState.reservations,
        waitlist: dbState.waitlist,
        busSchedules: dbState.busSchedules,
        issues: dbState.issues,
        dailyHistory: dbState.dailyHistory,
        notifications: dbState.notifications,
        settings: dbState.settings,
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
        mapHighlightedSlotId,
        setMapHighlightedSlotId,
        preselectedSlotForReservation,
        setPreselectedSlotForReservation,
        lastCheckedInSlotId,
        setLastCheckedInSlotId,
        searchQuery,
        setSearchQuery,
        parkVehicle,
        vacateSlot,
        createReservation,
        validateOrActionQrPass,
        cancelReservation,
        processNoShows,
        joinWaitlist,
        leaveWaitlist,
        createBusSchedule,
        updateBusSchedule,
        reportIssue,
        updateIssueStatus,
        triggerSimulatedAlert,
        toggleSlotMaintenance,
        updateSettings,
        markNotificationAsRead,
        markAllNotificationsAsRead,
        clearNotifications,
        refreshState,
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
