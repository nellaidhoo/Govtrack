
import { InventoryItem, Asset, ProcurementWorkflow, User, UserRole, ItemCategory, OFFICE_CODE, ProcurementStatus, Vendor, SystemSettings, AppNotification, LogEntry, Department, ItemCategoryDef, ItemTypeDef, Quotation } from '../types';
import { BrowserNotificationService } from './notificationUtils';
import { OfflineService } from './offlineService';
import { CommunicationService } from './communicationService';

// Initial Mock Data
let MOCK_USERS: User[] = [
  { id: 'u1', name: 'John Doe', email: 'john.doe@gov.entity', role: UserRole.USER, department: 'Finance', designation: 'Accounts Clerk', phone: '+1 (555) 010-001' },
  { id: 'u2', name: 'Jane Smith', email: 'jane.smith@gov.entity', role: UserRole.STOCK_KEEPER, department: 'Logistics', designation: 'Senior Storeman', phone: '+1 (555) 010-002' },
  { id: 'u3', name: 'Robert Chief', email: 'robert.chief@gov.entity', role: UserRole.MANAGER, department: 'Finance', designation: 'Finance Director', phone: '+1 (555) 010-003' },
  { id: 'u4', name: 'Admin User', email: 'admin@gov.entity', role: UserRole.ADMIN, department: 'IT', designation: 'System Administrator', phone: '+1 (555) 010-004' },
  { id: 'u5', name: 'Sarah Supervisor', email: 'sarah.sup@gov.entity', role: UserRole.SUPERVISOR, department: 'HR', designation: 'HR Supervisor', phone: '+1 (555) 010-005' },
  { id: 'u6', name: 'Frank Finance', email: 'frank.fin@gov.entity', role: UserRole.FINANCE_OFFICER, department: 'Finance', designation: 'Finance Controller', phone: '+1 (555) 010-006' },
  { id: 'u7', name: 'Tech Solutions Rep', email: 'vendor@techsolutions.com', role: UserRole.VENDOR, department: 'External', vendorId: 'v2', designation: 'Sales Manager' },
];

let currentUserIndex: number | null = null; 

let MOCK_SETTINGS: SystemSettings = {
  officeName: 'Government Entity of State',
  officeAddress: '123 Capital Boulevard, Admin District, State 10101',
  officeCode: '263',
  departmentName: 'Department of Administration & Finance',
  logoUrl: '',
  phone: '+960 332-4567',
  email: 'info@gov.entity',
  website: 'www.gov.entity',
  taxId: 'GS12345678',
  prefixes: {
    gsrf: 'GSRF',
    pr: 'PR',
    sr: 'SR',
    po: 'PO',
    so: 'SO',
    pef: '(A)',
    cert: 'CERT',
    asset: 'AST',
    inventory: 'INV'
  },
  templateConfig: {
    showLogo: true,
    footerText: 'This is a computer generated document. No signature required if approved digitally.',
    customBlocks: []
  },
  categories: [
    { id: 'c1', name: 'Stationery', code: '01' },
    { id: 'c2', name: 'IT Equipment', code: '02' },
    { id: 'c3', name: 'Furniture', code: '03' },
    { id: 'c4', name: 'Vehicles', code: '04' },
    { id: 'c5', name: 'Maintenance', code: '05' }
  ],
  itemTypes: [
    { id: 't1', categoryId: 'c1', name: 'Paper Products', code: '001' },
    { id: 't2', categoryId: 'c1', name: 'Writing Instruments', code: '002' },
    { id: 't3', categoryId: 'c2', name: 'Computers & Laptops', code: '001' },
    { id: 't4', categoryId: 'c2', name: 'Monitors', code: '002' },
    { id: 't5', categoryId: 'c3', name: 'Office Desks', code: '001' }
  ],
  emailIntegration: { enabled: false, type: 'SMTP', senderEmail: 'noreply@gov.entity' },
  smsIntegration: { enabled: false, type: 'API', senderId: 'GOVTRACK' }
};

let MOCK_DEPARTMENTS: Department[] = [
    { id: 'd1', name: 'Finance', code: 'FIN', managerId: 'u3', supervisorId: 'u5' },
    { id: 'd2', name: 'Logistics', code: 'LOG', managerId: 'u3', supervisorId: 'u5' },
    { id: 'd3', name: 'Information Technology', code: 'IT', managerId: 'u4', supervisorId: 'u5' },
];

const MOCK_VENDORS: Vendor[] = [
  { id: 'v1', name: 'Office Depot Ltd', contactPerson: 'Sarah Connor', email: 'sales@officedepot.com', phone: '555-0101', address: '123 Market St', status: 'Active' },
  { id: 'v2', name: 'Tech Solutions Inc', contactPerson: 'John Smith', email: 'contact@techsolutions.com', phone: '555-0102', address: '456 Innovation Ave', status: 'Active' },
  { id: 'v3', name: 'Global Logistics', contactPerson: 'Mike Ross', email: 'logistics@global.com', phone: '555-0103', address: '789 Shipping Ln', status: 'Active' }
];

let MOCK_INVENTORY: InventoryItem[] = [
  {
    id: 'i1',
    name: 'A4 Paper Ream',
    govId: `263|2024|01|001|001`,
    sku: 'STA-001',
    barcode: '978020137962',
    category: 'c1',
    productType: 't1',
    isAsset: false,
    quantity: 45,
    location: 'Store A',
    minStockLevel: 10,
    pricePerUnit: 5.00,
    lastUpdated: new Date().toISOString()
  },
  {
    id: 'i2',
    name: 'Ballpoint Pen (Blue)',
    govId: `263|2024|01|002|050`,
    sku: 'STA-002',
    barcode: '890123456789',
    category: 'c1',
    productType: 't2',
    isAsset: false,
    quantity: 120,
    location: 'Store A',
    minStockLevel: 50,
    pricePerUnit: 0.50,
    lastUpdated: new Date().toISOString()
  },
  {
    id: 'i3',
    name: 'Dell Monitor 24"',
    govId: `263|2024|02|005|012`,
    sku: 'IT-005',
    category: 'c2',
    productType: 't4',
    isAsset: true,
    quantity: 2,
    location: 'Store B',
    minStockLevel: 5,
    pricePerUnit: 150.00,
    lastUpdated: new Date().toISOString()
  }
];

let MOCK_ASSETS: Asset[] = [
  {
    id: 'a1',
    name: 'Office Desk Executive',
    govId: `263|2023|03|001|001`,
    category: 'c3',
    condition: 'Good',
    purchaseDate: '2023-01-15',
    price: 450.00,
    location: 'Finance Director Office',
    assignedTo: 'Robert Chief'
  }
];

const MOCK_REQUESTS: ProcurementWorkflow[] = [
  {
    id: 'req1',
    requestType: 'GOODS',
    status: ProcurementStatus.SUBMITTED,
    requesterId: 'u1',
    requesterName: 'John Doe',
    requesterDepartment: 'Finance',
    section: 'Accounts Payable',
    requestDate: new Date().toISOString(),
    requiredDate: new Date(Date.now() + 86400000 * 7).toISOString(), 
    remarks: 'Needed for new staff members starting next week.',
    gsrfRefNumber: `(RF)/263/2024/001`,
    items: [
      { description: 'Laptop Stand', quantity: 2, estimatedCost: 30 }
    ],
    requesterSignature: 'data:image/png;base64,mocksignature',
    logs: [
      { date: new Date().toISOString(), action: 'Request Submitted', actor: 'John Doe' }
    ]
  }
];

let MOCK_NOTIFICATIONS: AppNotification[] = [
  { id: 'n1', title: 'Low Stock Alert', message: 'Dell Monitor 24" is below reorder level (5). Current: 2', type: 'warning', time: '10 mins ago', read: false, link: { tab: 'INVENTORY' } },
];

let MOCK_LOGS: LogEntry[] = [
    { id: 'l1', date: new Date(Date.now() - 100000).toISOString(), action: 'System Init', actor: 'System', category: 'SETTINGS', details: 'System initialized with default settings.' },
];

const generateSKU = (category: string) => {
  const cat = MOCK_SETTINGS.categories.find(c => c.id === category);
  const prefix = cat?.name.substring(0, 3).toUpperCase() || 'GEN';
  const randomNum = Math.floor(Math.random() * 9000) + 1000;
  return `${prefix}-${randomNum}`;
};

const getCurrentActor = () => {
    return currentUserIndex !== null ? MOCK_USERS[currentUserIndex].name : 'System';
}

export const LogService = {
  getAll: () => Promise.resolve([...MOCK_LOGS].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())),
  add: (entry: Omit<LogEntry, 'id' | 'date'>) => {
    const newLog = {
        ...entry,
        id: Math.random().toString(36).substr(2, 9),
        date: new Date().toISOString()
    };
    MOCK_LOGS.unshift(newLog);
    return Promise.resolve(newLog);
  }
};

export const SyncService = {
    performSync: async () => {
        if (!OfflineService.isOnline()) return;
        
        const queue = OfflineService.getQueue();
        if (queue.length === 0) return;

        for (const action of queue) {
            try {
                if (action.type === 'INVENTORY_UPDATE') {
                    await InventoryService.update(action.payload);
                } else if (action.type === 'ASSET_UPDATE') {
                    await AssetService.update(action.payload);
                }
            } catch (e) {
                console.error("Sync Conflict for action", action.id);
            }
        }
        
        OfflineService.clearQueue();
        LogService.add({
            action: 'Data Synced',
            category: 'AUTH',
            details: `Successfully synced ${queue.length} offline updates.`,
            actor: getCurrentActor()
        });
    }
}

export const NotificationService = {
  getAll: () => Promise.resolve([...MOCK_NOTIFICATIONS]),
  getUnreadCount: () => Promise.resolve(MOCK_NOTIFICATIONS.filter(n => !n.read).length),
  markAllRead: () => {
    MOCK_NOTIFICATIONS = MOCK_NOTIFICATIONS.map(n => ({ ...n, read: true }));
    return Promise.resolve(true);
  },
  add: (notification: Omit<AppNotification, 'id' | 'time' | 'read'>) => {
    const newNotif = {
        ...notification,
        id: Math.random().toString(36).substr(2, 9),
        time: 'Just now',
        read: false
    };
    MOCK_NOTIFICATIONS.unshift(newNotif);
    
    // 1. Browser Notification
    BrowserNotificationService.send(newNotif.title, newNotif.message, newNotif.id);
    
    // 2. Real External Delivery (Email/SMS)
    CommunicationService.dispatch(newNotif.title, newNotif.message, newNotif.recipientId);
    
    return Promise.resolve(newNotif);
  }
};

export const DepartmentService = {
    getAll: () => Promise.resolve([...MOCK_DEPARTMENTS]),
    add: (dept: Omit<Department, 'id'>) => {
        const newDept = { ...dept, id: Math.random().toString(36).substr(2, 9) };
        MOCK_DEPARTMENTS.push(newDept);
        LogService.add({
            action: 'Create Department',
            category: 'SETTINGS',
            details: `Created department '${newDept.name}'`,
            actor: getCurrentActor()
        });
        return Promise.resolve(newDept);
    },
    update: (dept: Department) => {
        const idx = MOCK_DEPARTMENTS.findIndex(d => d.id === dept.id);
        if (idx !== -1) MOCK_DEPARTMENTS[idx] = dept;
        LogService.add({
            action: 'Update Department',
            category: 'SETTINGS',
            details: `Updated department '${dept.name}' assignments.`,
            actor: getCurrentActor()
        });
        return Promise.resolve(dept);
    }
};

export const InventoryService = {
  getAll: () => {
    if (!OfflineService.isOnline()) {
        const snapshot = OfflineService.getSnapshot('inventory');
        if (snapshot) return Promise.resolve(snapshot);
    }
    OfflineService.saveSnapshot('inventory', MOCK_INVENTORY);
    return Promise.resolve([...MOCK_INVENTORY]);
  },
  isGovIdUnique: (govId: string, excludeId?: string) => {
    return Promise.resolve(!MOCK_INVENTORY.some(i => i.govId === govId && i.id !== excludeId));
  },
  add: (item: Omit<InventoryItem, 'id' | 'lastUpdated' | 'sku'> & { sku?: string }) => {
    const sku = item.sku || generateSKU(item.category);
    const newItem = { 
      ...item, 
      sku,
      id: Math.random().toString(36).substr(2, 9), 
      lastUpdated: new Date().toISOString() 
    };
    MOCK_INVENTORY.push(newItem);
    
    LogService.add({
        action: 'Create Inventory Item',
        category: 'INVENTORY',
        details: `Created item '${newItem.name}' (Qty: ${newItem.quantity}) in ${newItem.location}`,
        actor: getCurrentActor(),
        referenceId: newItem.id
    });

    if (newItem.isAsset) {
        AssetService.add({
            name: newItem.name,
            govId: newItem.govId,
            category: newItem.category,
            condition: 'New',
            purchaseDate: new Date().toISOString().split('T')[0],
            price: newItem.pricePerUnit,
            location: newItem.location,
            assignedTo: undefined
        });
    }

    return Promise.resolve(newItem);
  },
  update: (item: InventoryItem) => {
    if (!OfflineService.isOnline()) {
        OfflineService.enqueue('INVENTORY_UPDATE', item);
        return Promise.resolve(item);
    }

    const idx = MOCK_INVENTORY.findIndex(i => i.id === item.id);
    if (idx !== -1) {
      MOCK_INVENTORY[idx] = { ...item, lastUpdated: new Date().toISOString() };
      LogService.add({
        action: 'Update Inventory Item',
        category: 'INVENTORY',
        details: `Updated details for '${item.name}'.`,
        actor: getCurrentActor(),
        referenceId: item.id
      });
    }
    return Promise.resolve(MOCK_INVENTORY[idx]);
  },
  updateStock: (id: string, delta: number) => {
    const item = MOCK_INVENTORY.find(i => i.id === id);
    if (item) {
      item.quantity += delta;
      item.lastUpdated = new Date().toISOString();
      
      LogService.add({
        action: 'Stock Adjustment',
        category: 'INVENTORY',
        details: `Stock for '${item.name}' adjusted by ${delta}. New Quantity: ${item.quantity}`,
        actor: getCurrentActor(),
        referenceId: item.id
      });
    }
    return Promise.resolve(item);
  },
  generateGovId: (year: string, category: string, type: string) => {
    const count = MOCK_INVENTORY.filter(i => i.govId.includes(`${year}|${category}|${type}`)).length + 1;
    const countStr = count.toString().padStart(3, '0');
    return `${MOCK_SETTINGS.officeCode}|${year}|${category}|${type}|${countStr}`;
  }
};

export const AssetService = {
  getAll: () => {
    if (!OfflineService.isOnline()) {
        const snapshot = OfflineService.getSnapshot('assets');
        if (snapshot) return Promise.resolve(snapshot);
    }
    OfflineService.saveSnapshot('assets', MOCK_ASSETS);
    return Promise.resolve([...MOCK_ASSETS]);
  },
  isGovIdUnique: (govId: string, excludeId?: string) => {
    return Promise.resolve(!MOCK_ASSETS.some(a => a.govId === govId && a.id !== excludeId));
  },
  add: (asset: Omit<Asset, 'id'>) => {
    const newAsset = { ...asset, id: Math.random().toString(36).substr(2, 9) };
    MOCK_ASSETS.push(newAsset);
    
    LogService.add({
        action: 'Register Asset',
        category: 'ASSETS',
        details: `Registered new asset '${newAsset.name}' (ID: ${newAsset.govId})`,
        actor: getCurrentActor(),
        referenceId: newAsset.id
    });

    return Promise.resolve(newAsset);
  },
  update: (asset: Asset) => {
    if (!OfflineService.isOnline()) {
        OfflineService.enqueue('ASSET_UPDATE', asset);
        return Promise.resolve(asset);
    }

    const idx = MOCK_ASSETS.findIndex(a => a.id === asset.id);
    if (idx !== -1) {
      MOCK_ASSETS[idx] = asset;
      LogService.add({
        action: 'Update Asset',
        category: 'ASSETS',
        details: `Updated details for asset '${asset.name}' (ID: ${asset.govId})`,
        actor: getCurrentActor(),
        referenceId: asset.id
      });
    }
    return Promise.resolve(asset);
  },
  delete: (id: string) => {
    const asset = MOCK_ASSETS.find(a => a.id === id);
    if (asset) {
      MOCK_ASSETS = MOCK_ASSETS.filter(a => a.id !== id);
      LogService.add({
        action: 'Delete Asset',
        category: 'ASSETS',
        details: `Deleted asset '${asset.name}' (ID: ${asset.govId})`,
        actor: getCurrentActor()
      });
    }
    return Promise.resolve(true);
  },
  generateGovId: (year: string, category: string, type: string) => {
    const count = MOCK_ASSETS.filter(a => a.govId.includes(`${year}|${category}|${type}`)).length + 1;
    const countStr = count.toString().padStart(3, '0');
    return `${MOCK_SETTINGS.officeCode}|${year}|${category}|${type}|${countStr}`;
  }
};

export const VendorService = {
  getAll: () => Promise.resolve([...MOCK_VENDORS]),
  add: (vendor: Omit<Vendor, 'id'>) => {
    const newVendor = { ...vendor, id: Math.random().toString(36).substr(2, 9) };
    MOCK_VENDORS.push(newVendor);
    LogService.add({
        action: 'Add Vendor',
        category: 'VENDOR',
        details: `Added vendor '${newVendor.name}'`,
        actor: getCurrentActor(),
        referenceId: newVendor.id
    });
    return Promise.resolve(newVendor);
  }
};

export const SettingsService = {
  get: () => Promise.resolve({ ...MOCK_SETTINGS }),
  update: (settings: SystemSettings) => {
    MOCK_SETTINGS = settings;
    LogService.add({
        action: 'Update Settings',
        category: 'SETTINGS',
        details: `System configuration updated.`,
        actor: getCurrentActor()
    });
    return Promise.resolve(MOCK_SETTINGS);
  }
};

export const UserService = {
  getAll: () => Promise.resolve([...MOCK_USERS]),
  update: (user: User) => {
    const idx = MOCK_USERS.findIndex(u => u.id === user.id);
    if (idx !== -1) {
      MOCK_USERS[idx] = user;
    }
    return Promise.resolve(user);
  },
  changePassword: (id: string, current: string, newPass: string) => Promise.resolve(true),
  resetPassword: (idOrEmail: string) => {
    const user = MOCK_USERS.find(u => u.id === idOrEmail || u.email === idOrEmail);
    if (user) {
        LogService.add({
            action: 'Password Reset Requested',
            category: 'AUTH',
            details: `A password reset link was sent to ${user.email}`,
            actor: getCurrentActor()
        });
        return Promise.resolve(true);
    }
    return Promise.reject("User not found");
  },
  add: (user: Omit<User, 'id'>) => {
      const newUser = { ...user, id: `u${MOCK_USERS.length + 1}` };
      MOCK_USERS.push(newUser);
      return Promise.resolve(newUser);
  }
};

export const ProcurementService = {
  getAll: () => Promise.resolve([...MOCK_REQUESTS]),
  create: (req: Omit<ProcurementWorkflow, 'id' | 'logs' | 'gsrfRefNumber'>) => {
    const year = new Date().getFullYear();
    const count = MOCK_REQUESTS.length + 407; 
    const prefix = MOCK_SETTINGS.prefixes.gsrf;
    const gsrfRefNumber = `${prefix}/${MOCK_SETTINGS.officeCode}/${year}/${count}`;
    
    const newReq: ProcurementWorkflow = { 
      ...req, 
      id: Math.random().toString(36).substr(2, 9),
      gsrfRefNumber,
      logs: [{ date: new Date().toISOString(), action: 'Request Submitted', actor: req.requesterName }]
    };
    
    NotificationService.add({
      title: 'New Procurement Request',
      message: `${req.requesterName} submitted a new request.`,
      type: 'info',
      link: { tab: 'PROCUREMENT', itemId: newReq.id },
      recipientId: 'u2' 
    });

    MOCK_REQUESTS.push(newReq);
    return Promise.resolve(newReq);
  },
  updateStatus: async (id: string, status: ProcurementStatus, logEntry: string, actor: string, updates?: Partial<ProcurementWorkflow>) => {
    const req = MOCK_REQUESTS.find(r => r.id === id);
    if (req) {
      if (status === ProcurementStatus.EVALUATION && !req.evalRefNumber) {
         const year = new Date().getFullYear();
         const pefPrefix = MOCK_SETTINGS.prefixes.pef;
         req.evalRefNumber = `${pefPrefix}${MOCK_SETTINGS.officeCode}/${year}/45`;
      }

      if (status === ProcurementStatus.ISSUED) {
          for (const item of req.items) {
              if (item.itemId) {
                  await InventoryService.updateStock(item.itemId, -item.quantity);
              }
          }
      }

      req.status = status;
      req.logs.push({ date: new Date().toISOString(), action: logEntry, actor });
      if (updates) Object.assign(req, updates);

      NotificationService.add({
          title: `Status Updated`,
          message: `Request ${req.gsrfRefNumber} moved to ${status}.`,
          type: 'info',
          link: { tab: 'PROCUREMENT', itemId: req.id },
          recipientId: req.requesterId
      });
    }
    return Promise.resolve(req);
  },
  
  publishToPortal: async (id: string, deadline: string, actor: string) => {
    const req = MOCK_REQUESTS.find(r => r.id === id);
    if (req) {
        req.isPublishedToPortal = true;
        req.portalPublishedAt = new Date().toISOString();
        req.bidDeadline = deadline;
        req.logs.push({ date: new Date().toISOString(), action: 'Published to Vendor Portal', actor });
        
        LogService.add({
            action: 'RFQ Published',
            category: 'PROCUREMENT',
            details: `RFQ ${req.prRefNumber} published to vendor portal. Deadline: ${deadline}`,
            actor
        });
    }
    return Promise.resolve(req);
  },

  submitVendorQuote: async (id: string, vendorId: string, vendorName: string, quoteNumber: string, price: number) => {
    const req = MOCK_REQUESTS.find(r => r.id === id);
    if (req) {
        const newQuote: Quotation = {
            id: Math.random().toString(36).substr(2, 9),
            vendorId,
            vendorName,
            quoteNumber,
            quoteDate: new Date().toISOString().split('T')[0],
            price,
            selected: false,
            isPortalSubmission: true,
            submittedAt: new Date().toISOString(),
            status: 'Submitted'
        };
        
        if (!req.quotations) req.quotations = [];
        // Prevent duplicate submissions from same vendor
        req.quotations = req.quotations.filter(q => q.vendorId !== vendorId);
        req.quotations.push(newQuote);
        
        req.logs.push({ date: new Date().toISOString(), action: `Electronic Quote Submitted by ${vendorName}`, actor: 'Vendor Portal' });
        
        LogService.add({
            action: 'Vendor Quote Received',
            category: 'PROCUREMENT',
            details: `Electronic submission from ${vendorName} for RFQ ${req.prRefNumber}`,
            actor: 'System'
        });
    }
    return Promise.resolve(req);
  },

  receiveGoods: async (id: string, receivedItems: any[], actor: string) => {
      const req = MOCK_REQUESTS.find(r => r.id === id);
      if (req) {
          for (const item of receivedItems) {
              if (item.inventoryAction === 'NEW') {
                  const govId = InventoryService.generateGovId(new Date().getFullYear().toString(), item.newCategory, '001');
                  await InventoryService.add({
                      name: item.description,
                      category: item.newCategory,
                      quantity: item.receivedQty,
                      location: item.newLocation || 'Main Store',
                      minStockLevel: 5,
                      pricePerUnit: item.price || 0,
                      govId,
                      isAsset: false 
                  });
              } else {
                  await InventoryService.updateStock(item.inventoryAction, item.receivedQty);
              }
          }
          
          req.status = ProcurementStatus.COMPLETED;
          req.logs.push({ date: new Date().toISOString(), action: 'Goods Received & Inventory Updated', actor });
      }
      return Promise.resolve(req);
  }
};

export const AuthService = {
  getCurrentUser: () => currentUserIndex !== null ? MOCK_USERS[currentUserIndex] : null,
  login: (email: string) => {
    const idx = MOCK_USERS.findIndex(u => u.email === email);
    if (idx !== -1) {
        currentUserIndex = idx;
        return Promise.resolve(MOCK_USERS[idx]);
    }
    return Promise.reject("Invalid credentials");
  },
  logout: () => {
      currentUserIndex = null;
      return Promise.resolve();
  },
  switchUser: (id: string) => {
    const idx = MOCK_USERS.findIndex(u => u.id === id);
    if (idx !== -1) currentUserIndex = idx;
    return MOCK_USERS[currentUserIndex!];
  },
  getAllUsers: () => MOCK_USERS
};
