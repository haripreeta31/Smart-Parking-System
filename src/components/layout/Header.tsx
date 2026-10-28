import React, { useState, useRef, useEffect } from 'react';
import {
  Car,
  Bell,
  Search,
  PlusCircle,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ShieldCheck,
  Menu,
  X,
  QrCode,
  UserCheck,
  ChevronDown,
} from 'lucide-react';
import { useParking } from '../../context/ParkingContext';

interface HeaderProps {
  onToggleSidebar?: () => void;
  isSidebarOpen?: boolean;
}

const TAB_LABELS: Record<string, string> = {
  dashboard: 'Smart Parking Dashboard',
  'campus-map': 'Interactive Campus Map',
  reservations: 'Reservations, QR Pass & Waitlist',
  'find-vehicle': 'Find My Vehicle',
  'bus-management': 'Bus Parking Management',
  insights: 'Parking Insights & Forecast',
  issues: 'Alerts & Issue Reporting',
  'admin-analytics': 'Administrator Analytics',
  cars: 'Cars Category View',
  bikes: 'Bikes Category View',
  staff: 'Staff Vehicles View',
  visitors: 'Visitor Parking View',
  buses: 'Bus Bays Overview',
  overall: 'Overall Capacity Summary',
  slots: 'All Parking Slots Matrix',
  reports: 'Session & Revenue Logs',
  settings: 'Facility Configuration',
};

export const Header: React.FC<HeaderProps> = ({ onToggleSidebar, isSidebarOpen }) => {
  const {
    currentUser,
    availableUsers,
    switchUser,
    notifications,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    clearNotifications,
    setIsParkModalOpen,
    searchQuery,
    setSearchQuery,
    slots,
    setSelectedSlotForModal,
    activeTab,
    setActiveTab,
    settings,
  } = useParking();

  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [isSearchDropdownOpen, setIsSearchDropdownOpen] = useState(false);

  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => !n.read).length;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false);
      }
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsSearchDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const searchResults = React.useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase().trim();
    return slots
      .filter((s) => {
        const slotMatch = s.slotNumber.toLowerCase().includes(q) || s.id.toLowerCase().includes(q);
        const zoneMatch = s.zoneName.toLowerCase().includes(q);
        const plateMatch = s.currentVehicle?.licensePlate.toLowerCase().includes(q);
        const driverMatch = s.currentVehicle?.driverName?.toLowerCase().includes(q);
        return slotMatch || zoneMatch || plateMatch || driverMatch;
      })
      .slice(0, 7);
  }, [slots, searchQuery]);

  const statusLabel = (status: string) => {
    if (status === 'occupied') return 'Occupied';
    if (status === 'reserved') return 'Reserved';
    if (status === 'maintenance') return 'Unavailable';
    return 'Available';
  };

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-slate-200">
      <div className="flex items-center justify-between gap-4 px-4 sm:px-6 py-3">
        {/* Zone 1: Mobile Menu + Brand / Breadcrumb */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            id="mobile-sidebar-toggle-btn"
            onClick={onToggleSidebar}
            className="lg:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors shrink-0"
            aria-label="Toggle navigation menu"
          >
            {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <div className="flex items-center gap-2.5 min-w-0">
            <button
              onClick={() => setActiveTab('dashboard')}
              className="text-base font-bold text-slate-900 tracking-tight whitespace-nowrap shrink-0 hover:text-blue-600 transition-colors"
            >
              {settings.systemName}
            </button>
            <span className="hidden md:inline text-slate-300" aria-hidden="true">
              /
            </span>
            <span className="hidden md:inline text-sm font-medium text-slate-600 truncate">
              {TAB_LABELS[activeTab] || 'Overview'}
            </span>
          </div>
        </div>

        {/* Zone 2: Global Search */}
        <div ref={searchRef} className="relative hidden md:block flex-1 max-w-md">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              id="global-search-input"
              type="text"
              placeholder="Search slot, zone, license plate, or driver..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setIsSearchDropdownOpen(true);
              }}
              onFocus={() => setIsSearchDropdownOpen(true)}
              className="w-full pl-10 pr-14 py-2 text-sm bg-slate-50 focus:bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-600 transition-colors placeholder:text-slate-400"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-slate-500 hover:text-slate-800 whitespace-nowrap"
              >
                Clear
              </button>
            )}
          </div>

          {isSearchDropdownOpen && searchQuery && (
            <div className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden z-50">
              <div className="px-3 py-2 border-b border-slate-100 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
                <span>Matching Slots &amp; Vehicles</span>
                <span className="tabular-nums">{searchResults.length} found</span>
              </div>
              {searchResults.length === 0 ? (
                <div className="p-4 text-center text-sm text-slate-500">
                  No slots or vehicles matching &quot;{searchQuery}&quot;
                </div>
              ) : (
                <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto">
                  {searchResults.map((slot) => (
                    <button
                      key={slot.id}
                      onClick={() => {
                        setSelectedSlotForModal(slot);
                        setIsSearchDropdownOpen(false);
                      }}
                      className="w-full text-left p-3 hover:bg-slate-50 flex items-center justify-between transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="font-mono text-xs font-semibold text-slate-900 w-14 shrink-0">
                          {slot.slotNumber}
                        </span>
                        <div className="min-w-0">
                          <div className="text-xs font-semibold text-slate-900 truncate">
                            {slot.zoneName} · <span className="capitalize">{slot.vehicleType}</span>
                          </div>
                          <div className="text-xs text-slate-500 truncate">
                            {slot.currentVehicle
                              ? `${slot.currentVehicle.licensePlate} · ${slot.currentVehicle.driverName}`
                              : statusLabel(slot.status)}
                          </div>
                        </div>
                      </div>
                      <span
                        className={`text-xs font-semibold whitespace-nowrap shrink-0 ml-2 ${
                          slot.status === 'occupied'
                            ? 'text-rose-600'
                            : slot.status === 'reserved'
                            ? 'text-blue-600'
                            : slot.status === 'maintenance'
                            ? 'text-amber-600'
                            : 'text-emerald-600'
                        }`}
                      >
                        {statusLabel(slot.status)}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Zone 3: Primary CTA, Notifications & Role Switcher */}
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            id="header-reserve-btn"
            onClick={() => setActiveTab('reservations')}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors whitespace-nowrap shrink-0"
          >
            <QrCode className="w-4 h-4" />
            <span>Book &amp; QR Pass</span>
          </button>

          <button
            id="header-park-vehicle-btn"
            onClick={() => setIsParkModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-colors whitespace-nowrap shrink-0"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Check-In</span>
          </button>

          {/* Notifications Dropdown */}
          <div ref={notifRef} className="relative">
            <button
              id="header-notifications-btn"
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 rounded-lg text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
              aria-label="In-app notifications"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-4 h-4 px-1 bg-rose-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center tabular-nums">
                  {unreadCount}
                </span>
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white border border-slate-200 rounded-xl shadow-lg z-50 overflow-hidden">
                <div className="p-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                  <div className="text-xs font-bold text-slate-900">
                    In-App Notifications ({unreadCount} unread)
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <button
                      onClick={markAllNotificationsAsRead}
                      className="text-blue-600 hover:text-blue-700 font-medium whitespace-nowrap"
                    >
                      Mark read
                    </button>
                    <span className="text-slate-300">·</span>
                    <button
                      onClick={clearNotifications}
                      className="text-slate-500 hover:text-slate-700 font-medium whitespace-nowrap"
                    >
                      Clear
                    </button>
                  </div>
                </div>

                <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                  {notifications.length === 0 ? (
                    <div className="p-6 text-center text-sm text-slate-500">
                      No notifications in feed.
                    </div>
                  ) : (
                    notifications.map((notif) => (
                      <div
                        key={notif.id}
                        onClick={() => markNotificationAsRead(notif.id)}
                        className={`p-3.5 transition-colors cursor-pointer hover:bg-slate-50 ${
                          notif.read ? 'bg-white opacity-75' : 'bg-blue-50/30'
                        }`}
                      >
                        <div className="flex items-start gap-2.5">
                          <div className="mt-0.5 text-slate-600 shrink-0">
                            {notif.type === 'entry' ? (
                              <Car className="w-4 h-4 text-blue-600" />
                            ) : notif.type === 'exit' ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            ) : notif.type === 'warning' ? (
                              <AlertTriangle className="w-4 h-4 text-amber-600" />
                            ) : (
                              <Clock className="w-4 h-4 text-slate-500" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <p className="text-xs font-semibold text-slate-900 truncate">
                                {notif.title}
                              </p>
                              <span className="text-[11px] text-slate-400 whitespace-nowrap shrink-0">
                                {notif.timestamp}
                              </span>
                            </div>
                            <p className="text-xs text-slate-600 mt-0.5">{notif.message}</p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className="p-2.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between px-4">
                  <button
                    onClick={() => {
                      setActiveTab('issues');
                      setShowNotifications(false);
                    }}
                    className="text-xs font-semibold text-slate-700 hover:text-slate-900"
                  >
                    Report Issue
                  </button>
                  <button
                    onClick={() => {
                      setActiveTab('reports');
                      setShowNotifications(false);
                    }}
                    className="text-xs font-semibold text-blue-600 hover:text-blue-700"
                  >
                    Activity Logs &rarr;
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Authenticated Campus User / Role Switcher */}
          <div ref={profileRef} className="relative">
            <button
              id="header-profile-btn"
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors"
            >
              <div className="w-7 h-7 rounded-md bg-slate-900 text-white font-bold text-xs flex items-center justify-center shrink-0">
                {currentUser.name
                  .split(' ')
                  .map((p) => p[0])
                  .join('')
                  .slice(0, 2)}
              </div>
              <div className="text-left hidden xl:block">
                <div className="text-xs font-semibold text-slate-900 leading-none whitespace-nowrap">
                  {currentUser.name}
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5 capitalize whitespace-nowrap">
                  Role: {currentUser.role}
                </div>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {showProfileMenu && (
              <div className="absolute right-0 mt-2 w-72 bg-white border border-slate-200 rounded-xl shadow-lg z-50 py-2">
                <div className="px-4 py-2.5 border-b border-slate-100">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-slate-900">{currentUser.name}</p>
                    <span className="text-[11px] font-semibold capitalize text-blue-700">
                      {currentUser.role}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">{currentUser.department}</p>
                  <p className="text-[11px] font-mono text-slate-500 mt-0.5">
                    Default Plate: {currentUser.defaultPlate}
                  </p>
                </div>

                <div className="px-4 py-2 border-b border-slate-100">
                  <div className="text-[11px] font-semibold text-slate-500 mb-1.5">
                    Switch Campus Account (Role Testing)
                  </div>
                  <div className="space-y-1">
                    {availableUsers.map((u) => {
                      const active = u.id === currentUser.id;
                      return (
                        <button
                          key={u.id}
                          onClick={async () => {
                            await switchUser(u.id);
                            setShowProfileMenu(false);
                          }}
                          className={`w-full text-left px-2.5 py-2 rounded-lg text-xs flex items-center justify-between transition-colors ${
                            active
                              ? 'bg-blue-50 text-blue-800 font-semibold'
                              : 'text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            {u.role === 'admin' ? (
                              <ShieldCheck className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                            ) : (
                              <UserCheck className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            )}
                            <span className="truncate">{u.name}</span>
                          </div>
                          <span className="text-[11px] capitalize text-slate-500 shrink-0 ml-2">
                            {u.role}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="pt-1">
                  <button
                    onClick={() => {
                      setActiveTab('find-vehicle');
                      setShowProfileMenu(false);
                    }}
                    className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    Find My Parked Vehicle
                  </button>
                  {currentUser.role === 'admin' && (
                    <button
                      onClick={() => {
                        setActiveTab('settings');
                        setShowProfileMenu(false);
                      }}
                      className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 transition-colors"
                    >
                      Facility &amp; Grace Period Settings
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
