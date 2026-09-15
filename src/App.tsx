import React, { useState } from 'react';
import { ParkingProvider, useParking } from './context/ParkingContext';
import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';
import { MainDashboard } from './components/dashboard/MainDashboard';
import { VehicleDashboard } from './components/dashboard/VehicleDashboard';
import { OverallDashboard } from './components/dashboard/OverallDashboard';
import { ParkingSlotsView } from './components/slots/ParkingSlotsView';
import { ReportsView } from './components/reports/ReportsView';
import { SettingsView } from './components/settings/SettingsView';
import { ParkVehicleModal } from './components/modals/ParkVehicleModal';
import { SlotDetailModal } from './components/modals/SlotDetailModal';

const DashboardContent: React.FC = () => {
  const { activeTab } = useParking();
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
            {activeTab === 'dashboard' && <MainDashboard />}
            {activeTab === 'cars' && <VehicleDashboard vehicleType="car" />}
            {activeTab === 'buses' && <VehicleDashboard vehicleType="bus" />}
            {activeTab === 'bikes' && <VehicleDashboard vehicleType="bike" />}
            {activeTab === 'overall' && <OverallDashboard />}
            {activeTab === 'slots' && <ParkingSlotsView />}
            {activeTab === 'reports' && <ReportsView />}
            {activeTab === 'settings' && <SettingsView />}
          </div>
        </main>
      </div>

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
