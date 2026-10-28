import React, { useState } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import { ParkingProvider, useParking } from './context/ParkingContext';
import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';
import { MainDashboard } from './components/dashboard/MainDashboard';
import { VehicleDashboard } from './components/dashboard/VehicleDashboard';
import { OverallDashboard } from './components/dashboard/OverallDashboard';
import { ParkingSlotsView } from './components/slots/ParkingSlotsView';
import { ReportsView } from './components/reports/ReportsView';
import { SettingsView } from './components/settings/SettingsView';
import { CampusMapView } from './components/map/CampusMapView';
import { ReservationsView } from './components/reservations/ReservationsView';
import { FindMyVehicleView } from './components/navigation/FindMyVehicleView';
import { BusManagementView } from './components/bus/BusManagementView';
import { ParkingInsightsView } from './components/insights/ParkingInsightsView';
import { AlertsIssuesView } from './components/issues/AlertsIssuesView';
import { AdminAnalyticsView } from './components/admin/AdminAnalyticsView';
import { ParkVehicleModal } from './components/modals/ParkVehicleModal';
import { SlotDetailModal } from './components/modals/SlotDetailModal';

const DashboardContent: React.FC = () => {
  const { activeTab, toastMessage, dismissToast, isLoading } = useParking();
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans antialiased text-slate-900">
      {/* Top Header */}
      <Header
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        isSidebarOpen={isSidebarOpen}
      />

      {/* Main Layout Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar Navigation */}
        <Sidebar isOpen={isSidebarOpen} onCloseMobile={() => setIsSidebarOpen(false)} />

        {/* Dynamic Main Workspace */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            {isLoading ? (
              <div className="space-y-6 animate-pulse">
                <div className="h-8 w-64 bg-slate-200 rounded-lg" />
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="h-28 bg-white border border-slate-200 rounded-xl" />
                  <div className="h-28 bg-white border border-slate-200 rounded-xl" />
                  <div className="h-28 bg-white border border-slate-200 rounded-xl" />
                  <div className="h-28 bg-white border border-slate-200 rounded-xl" />
                </div>
                <div className="h-80 bg-white border border-slate-200 rounded-xl" />
              </div>
            ) : (
              <>
                {activeTab === 'dashboard' && <MainDashboard />}
                {activeTab === 'campus-map' && <CampusMapView />}
                {activeTab === 'reservations' && <ReservationsView />}
                {activeTab === 'find-vehicle' && <FindMyVehicleView />}
                {activeTab === 'bus-management' && <BusManagementView />}
                {activeTab === 'insights' && <ParkingInsightsView />}
                {activeTab === 'issues' && <AlertsIssuesView />}
                {activeTab === 'admin-analytics' && <AdminAnalyticsView />}
                {activeTab === 'cars' && <VehicleDashboard vehicleType="car" />}
                {activeTab === 'bikes' && <VehicleDashboard vehicleType="bike" />}
                {activeTab === 'staff' && <VehicleDashboard vehicleType="staff" />}
                {activeTab === 'visitors' && <VehicleDashboard vehicleType="visitor" />}
                {activeTab === 'buses' && <VehicleDashboard vehicleType="bus" />}
                {activeTab === 'overall' && <OverallDashboard />}
                {activeTab === 'slots' && <ParkingSlotsView />}
                {activeTab === 'reports' && <ReportsView />}
                {activeTab === 'settings' && <SettingsView />}
              </>
            )}
          </div>
        </main>
      </div>

      {/* Global Feedback Toast */}
      {toastMessage && (
        <div
          role="status"
          aria-live="polite"
          className={`fixed bottom-5 right-5 z-50 max-w-md flex items-start gap-3 px-4 py-3 rounded-xl shadow-lg border text-sm font-medium transition-all ${
            toastMessage.type === 'success'
              ? 'bg-emerald-950 text-emerald-50 border-emerald-800'
              : toastMessage.type === 'error'
                ? 'bg-rose-950 text-rose-50 border-rose-800'
                : 'bg-slate-900 text-slate-50 border-slate-700'
          }`}
        >
          {toastMessage.type === 'success' && (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          )}
          {toastMessage.type === 'error' && (
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
          )}
          {toastMessage.type === 'info' && (
            <Info className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
          )}
          <span className="leading-snug">{toastMessage.text}</span>
          <button
            onClick={dismissToast}
            aria-label="Dismiss notification"
            className="ml-2 text-slate-400 hover:text-white transition-colors shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Modals */}
      <ParkVehicleModal />
      <SlotDetailModal />
    </div>
  );
};

export default function App() {
  return (
    <ParkingProvider>
      <DashboardContent />
    </ParkingProvider>
  );
}
