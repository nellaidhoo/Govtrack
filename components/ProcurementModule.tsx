
import React, { useState, useEffect } from 'react';
import { ProcurementWorkflow, ProcurementStatus, User, InventoryItem, SystemSettings, Vendor } from '../types';
import { ProcurementService, AuthService, VendorService, InventoryService, SettingsService } from '../services/mockService';
import { ProcurementList } from './procurement/ProcurementList';
import { ProcurementCreate } from './procurement/ProcurementCreate';
import { ProcurementDetail } from './procurement/ProcurementDetail';

interface ProcurementModuleProps {
    initialRequestId?: string | null;
    isVendorView?: boolean;
    onSelectRequest?: (req: ProcurementWorkflow) => void;
}

export const ProcurementModule: React.FC<ProcurementModuleProps> = ({ 
    initialRequestId, 
    isVendorView = false,
    onSelectRequest
}) => {
  const [requests, setRequests] = useState<ProcurementWorkflow[]>([]);
  const [currentUser] = useState<User>(AuthService.getCurrentUser()!);
  const [view, setView] = useState<'LIST' | 'CREATE' | 'DETAIL'>('LIST');
  const [selectedRequest, setSelectedRequest] = useState<ProcurementWorkflow | null>(null);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [settings, setSettings] = useState<SystemSettings | null>(null);

  useEffect(() => {
    loadData();
    VendorService.getAll().then(setVendors);
    InventoryService.getAll().then(setInventory);
    SettingsService.get().then(setSettings);
  }, []);

  // Handle deep linking
  useEffect(() => {
    if (initialRequestId && requests.length > 0) {
        const req = requests.find(r => r.id === initialRequestId);
        if (req) {
            setSelectedRequest(req);
            setView('DETAIL');
        }
    }
  }, [initialRequestId, requests]);

  const loadData = async () => {
    const data = await ProcurementService.getAll();
    if (isVendorView) {
        // Vendors only see requests where they've submitted a quote or invitations published to portal
        setRequests(data.filter(r => 
            r.isPublishedToPortal || 
            r.quotations?.some(q => q.vendorId === currentUser.vendorId)
        ));
    } else {
        setRequests(data);
    }
  };

  const handleCreateSubmit = async (data: any) => {
    await ProcurementService.create({
      requestType: data.requestType,
      status: ProcurementStatus.SUBMITTED,
      requesterId: currentUser.id,
      requesterName: currentUser.name,
      requesterDepartment: currentUser.department,
      section: data.section,
      requestDate: new Date().toISOString(),
      requiredDate: data.requiredDate || new Date().toISOString(),
      remarks: data.remarks,
      items: data.items,
      requesterSignature: data.requesterSignature
    });
    
    setView('LIST');
    loadData();
  };

  const updateStatus = async (id: string, status: ProcurementStatus, log: string, extraUpdates = {}) => {
    await ProcurementService.updateStatus(id, status, log, currentUser.name, extraUpdates);
    refreshSelection(id);
  };

  const receiveGoods = async (id: string, items: any[], actor: string) => {
    await ProcurementService.receiveGoods(id, items, actor);
    refreshSelection(id);
  };

  const refreshSelection = async (id: string) => {
    const updated = await ProcurementService.getAll();
    loadData();
    const found = updated.find(r => r.id === id);
    setSelectedRequest(found || null);
  };

  const handleSelectRequest = (req: ProcurementWorkflow) => {
    if (isVendorView && onSelectRequest) {
        onSelectRequest(req);
    } else {
        setSelectedRequest(req);
        setView('DETAIL');
    }
  };

  if (view === 'CREATE') {
    return (
      <ProcurementCreate 
        user={currentUser}
        inventory={inventory}
        onCancel={() => setView('LIST')}
        onSubmit={handleCreateSubmit}
      />
    );
  }

  if (view === 'DETAIL' && selectedRequest) {
    return (
      <ProcurementDetail 
        request={selectedRequest}
        currentUser={currentUser}
        settings={settings}
        inventory={inventory}
        vendors={vendors}
        onBack={() => setView('LIST')}
        onUpdateStatus={updateStatus}
        onReceiveGoods={receiveGoods}
      />
    );
  }

  return (
    <ProcurementList 
      requests={requests}
      onSelect={handleSelectRequest}
      onCreate={() => setView('CREATE')}
      isVendorView={isVendorView}
    />
  );
};
