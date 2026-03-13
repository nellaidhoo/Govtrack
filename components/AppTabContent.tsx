
import React from 'react';
import { AppTab, User, UserRole, ProcurementWorkflow } from '../types';
import { DashboardView } from './DashboardView';
import { InventoryView } from './InventoryView';
import { ProcurementModule } from './ProcurementModule';
import { AssetView } from './AssetView';
import { VendorManagement } from './VendorManagement';
import { ReportsView } from './ReportsView';
import { SettingsView } from './SettingsView';
import { VendorDashboard } from './VendorPortal/VendorDashboard';
import { QuoteSubmission } from './VendorPortal/QuoteSubmission';
import { ProcurementService } from '../services/mockService';

interface AppTabContentProps {
    activeTab: AppTab;
    user: User;
    targetId: string | null;
    selectedRequest: ProcurementWorkflow | null;
    setSelectedRequest: (req: ProcurementWorkflow | null) => void;
}

export const AppTabContent: React.FC<AppTabContentProps> = ({ 
    activeTab, 
    user, 
    targetId, 
    selectedRequest, 
    setSelectedRequest 
}) => {
    const isVendor = user.role === UserRole.VENDOR;

    const handleVendorSubmit = async (id: string, vId: string, vName: string, qNo: string, price: number) => {
        await ProcurementService.submitVendorQuote(id, vId, vName, qNo, price);
        setSelectedRequest(null);
    };

    if (isVendor) {
        if (selectedRequest) {
            return (
                <QuoteSubmission 
                    request={selectedRequest} 
                    user={user} 
                    onBack={() => setSelectedRequest(null)} 
                    onSubmit={handleVendorSubmit}
                />
            );
        }

        switch (activeTab) {
            case 'VENDOR_PORTAL': return <VendorDashboard user={user} onSelectRequest={setSelectedRequest} />;
            case 'PROCUREMENT': return <ProcurementModule isVendorView={true} onSelectRequest={setSelectedRequest} />;
            case 'SETTINGS': return <SettingsView />;
            default: return <VendorDashboard user={user} onSelectRequest={setSelectedRequest} />;
        }
    }

    switch (activeTab) {
      case 'DASHBOARD': return <DashboardView />;
      case 'INVENTORY': return <InventoryView />;
      case 'PROCUREMENT': return <ProcurementModule initialRequestId={activeTab === 'PROCUREMENT' ? targetId : null} />;
      case 'ASSETS': return <AssetView />;
      case 'VENDORS': return <VendorManagement />;
      case 'REPORTS': return <ReportsView />;
      case 'SETTINGS': return <SettingsView />;
      default: return <DashboardView />;
    }
};
