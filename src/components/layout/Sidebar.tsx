import React from 'react';
import {
  LayoutDashboard,
  Car,
  Bus,
  Bike,
  PieChart,
  Grid3X3,
  FileBarChart,
  Settings,
  Sparkles,
  Zap,
} from 'lucide-react';
import { useParking } from '../../context/ParkingContext';

interface SidebarProps {
  isOpen: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onCloseMobile }) => {
  const { activeTab, setActiveTab, stats } = useParking();

  const navItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      badge: 'Main',
      badgeColor: 'bg-slate-100 text-slate-700',
    },
    {
      id: 'cars',
      label: 'Cars',
      icon: Car,
      badge: `${stats.carStats.occupiedSpaces}/${stats.carStats.totalSpaces}`,
      badgeColor: 'bg-blue-50 text-blue-700 border border-blue-200/60',
    },
    {
      id: 'buses',
      label: 'Buses',
      icon: Bus,
      badge: `${stats.busStats.occupiedSpaces}/${stats.busStats.totalSpaces}`,
      badgeColor: 'bg-amber-50 text-amber-700 border border-amber-200/60',
    },
    {
      id: 'bikes',
      label: 'Bikes',
      icon: Bike,
      badge: `${stats.bikeStats.occupiedSpaces}/${stats.bikeStats.totalSpaces}`,
      badgeColor: 'bg-purple-50 text-purple-700 border border-purple-200/60',
    },
    {
      id: 'overall',
      label: 'Overall',
      icon: PieChart,
      badge: `${stats.overallOccupancyPercentage}%`,
      badgeColor: 'bg-emerald-50 text-emerald-700 border border-emerald-200/60',
    },
    {
      id: 'slots',
      label: 'Parking Slots',
      icon: Grid3X3,
      badge: `${stats.totalAvailable} free`,
      badgeColor: 'bg-emerald-50 text-emerald-700',
    },
    {
      id: 'reports',
      label: 'Reports',
      icon: FileBarChart,
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: Settings,
    },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-40 lg:hidden"
          onClick={onCloseMobile}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed lg:static top-0 bottom-0 left-0 z-40 w-64 bg-white border-r border-slate-200 flex flex-col transition-transform duration-200 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Hub Branding Banner */}
        <div className="p-4 border-b border-slate-100 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white shadow-xs font-bold text-lg">
            P
          </div>
          <div>
            <div className="text-sm font-bold text-slate-900 tracking-tight">ParkHub Operations</div>
            <div className="text-[11px] text-slate-500 font-medium">Smart Capacity Control</div>
          </div>
        </div>

        {/* Navigation List */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          <div className="px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Navigation
          </div>

          {navItems.map((item) => {
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
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span
                    className={`text-xs px-2 py-0.5 rounded-md font-medium tracking-tight ${
                      isActive ? 'bg-white/20 text-white' : item.badgeColor
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Quick Status Box */}
        <div className="p-3 m-3 bg-slate-50 border border-slate-200/80 rounded-2xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-500" />
              Total Space Available
            </span>
            <span className="text-xs font-bold text-emerald-600">{stats.canPark} free</span>
          </div>

          {/* Mini progress */}
          <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                stats.overallOccupancyPercentage > 85
                  ? 'bg-rose-500'
                  : stats.overallOccupancyPercentage > 65
                  ? 'bg-amber-500'
                  : 'bg-emerald-500'
              }`}
              style={{ width: `${Math.min(stats.overallOccupancyPercentage, 100)}%` }}
            />
          </div>

          <div className="flex items-center justify-between mt-2 text-[11px] text-slate-500">
            <span>Occupancy</span>
            <span className="font-semibold text-slate-700">{stats.overallOccupancyPercentage}%</span>
          </div>
        </div>

        {/* Footer info */}
        <div className="p-3 border-t border-slate-100 text-center text-[11px] text-slate-400">
          v2.4 Smart Barrier Controller
        </div>
      </aside>
    </>
  );
};
