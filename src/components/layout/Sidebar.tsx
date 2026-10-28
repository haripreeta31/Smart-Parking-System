import React from 'react';
import {
  LayoutDashboard,
  MapPin,
  CalendarCheck,
  Navigation,
  Bus,
  TrendingUp,
  AlertTriangle,
  BarChart3,
  Car,
  Bike,
  Briefcase,
  Users,
  PieChart,
  Grid3X3,
  FileBarChart,
  Settings,
  Lock,
} from 'lucide-react';
import { useParking } from '../../context/ParkingContext';

interface SidebarProps {
  isOpen: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onCloseMobile }) => {
  const { activeTab, setActiveTab, stats, currentUser } = useParking();

  const isAdmin = currentUser.role === 'admin';

  const coreCampusItems = [
    {
      id: 'dashboard',
      label: 'Smart Dashboard',
      icon: LayoutDashboard,
      metric: `${stats.overallOccupancyPercentage}%`,
    },
    {
      id: 'campus-map',
      label: 'Campus Map',
      icon: MapPin,
      metric: `${stats.totalAvailable} free`,
    },
    {
      id: 'reservations',
      label: 'Reservations & QR',
      icon: CalendarCheck,
      metric: `${stats.activeReservationsCount}`,
    },
    {
      id: 'find-vehicle',
      label: 'Find My Vehicle',
      icon: Navigation,
    },
    {
      id: 'bus-management',
      label: 'Bus Parking',
      icon: Bus,
      metric: `${stats.busStats.availableSpaces}/${stats.busStats.totalSpaces}`,
    },
    {
      id: 'insights',
      label: 'Parking Insights',
      icon: TrendingUp,
    },
    {
      id: 'issues',
      label: 'Alerts & Issues',
      icon: AlertTriangle,
      metric: stats.openIssuesCount > 0 ? `${stats.openIssuesCount} open` : undefined,
    },
  ];

  const categoryItems = [
    {
      id: 'cars',
      label: 'Cars',
      icon: Car,
      metric: `${stats.carStats.occupiedSpaces}/${stats.carStats.totalSpaces}`,
    },
    {
      id: 'bikes',
      label: 'Bikes',
      icon: Bike,
      metric: `${stats.bikeStats.occupiedSpaces}/${stats.bikeStats.totalSpaces}`,
    },
    {
      id: 'staff',
      label: 'Staff Vehicles',
      icon: Briefcase,
      metric: `${stats.staffStats.occupiedSpaces}/${stats.staffStats.totalSpaces}`,
    },
    {
      id: 'visitors',
      label: 'Visitors',
      icon: Users,
      metric: `${stats.visitorStats.occupiedSpaces}/${stats.visitorStats.totalSpaces}`,
    },
    {
      id: 'overall',
      label: 'Overall Summary',
      icon: PieChart,
    },
    {
      id: 'slots',
      label: 'All Slots Matrix',
      icon: Grid3X3,
    },
  ];

  const adminItems = [
    {
      id: 'admin-analytics',
      label: 'Admin Analytics',
      icon: BarChart3,
      adminOnly: true,
    },
    {
      id: 'reports',
      label: 'Audit & CSV Logs',
      icon: FileBarChart,
      adminOnly: false,
    },
    {
      id: 'settings',
      label: 'Facility Settings',
      icon: Settings,
      adminOnly: true,
    },
  ];

  const renderItem = (item: {
    id: string;
    label: string;
    icon: React.ElementType;
    metric?: string;
    adminOnly?: boolean;
  }) => {
    const Icon = item.icon;
    const isActive = activeTab === item.id;
    return (
      <button
        key={item.id}
        id={`nav-item-${item.id}`}
        onClick={() => {
          setActiveTab(item.id);
          onCloseMobile();
        }}
        className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
          isActive
            ? 'bg-slate-900 text-white'
            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
        }`}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-500'}`} />
          <span className="truncate">{item.label}</span>
        </div>
        {item.adminOnly && !isAdmin ? (
          <Lock className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-slate-300' : 'text-slate-400'}`} />
        ) : item.metric ? (
          <span
            className={`text-[11px] font-mono tabular-nums shrink-0 ml-2 ${
              isActive ? 'text-slate-300' : 'text-slate-500'
            }`}
          >
            {item.metric}
          </span>
        ) : null}
      </button>
    );
  };

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-900/50 z-40 lg:hidden"
          onClick={onCloseMobile}
        />
      )}

      <aside
        className={`fixed lg:static top-0 bottom-0 left-0 z-40 w-64 bg-white border-r border-slate-200 flex flex-col transition-transform duration-200 ease-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
          <div>
            <div className="px-3 pb-1.5 text-[11px] font-semibold text-slate-400">
              Campus Operations
            </div>
            <div className="space-y-0.5">{coreCampusItems.map(renderItem)}</div>
          </div>

          <div>
            <div className="px-3 pb-1.5 text-[11px] font-semibold text-slate-400">
              Vehicle Categories &amp; Bays
            </div>
            <div className="space-y-0.5">{categoryItems.map(renderItem)}</div>
          </div>

          <div>
            <div className="px-3 pb-1.5 text-[11px] font-semibold text-slate-400">
              Administration &amp; Audit
            </div>
            <div className="space-y-0.5">{adminItems.map(renderItem)}</div>
          </div>
        </div>

        {/* Live Synchronized Capacity Summary */}
        <div className="p-3.5 m-3 bg-slate-50 border border-slate-200 rounded-xl">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-800 mb-2">
            <span>Campus Capacity</span>
            <span className="font-mono tabular-nums text-emerald-700">
              {stats.totalAvailable} / {stats.totalSpaces} free
            </span>
          </div>
          <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                stats.overallOccupancyPercentage > 85
                  ? 'bg-rose-600'
                  : stats.overallOccupancyPercentage > 65
                  ? 'bg-amber-500'
                  : 'bg-emerald-600'
              }`}
              style={{ width: `${Math.min(stats.overallOccupancyPercentage, 100)}%` }}
            />
          </div>
          <div className="flex items-center justify-between mt-2 text-[11px] text-slate-500 tabular-nums">
            <span>Occupied: {stats.totalOccupied}</span>
            <span>Reserved: {stats.totalReserved}</span>
          </div>
        </div>
      </aside>
    </>
  );
};
