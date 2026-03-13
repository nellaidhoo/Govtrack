# Data Schema

## Core Entities

### User
Represents a system user or vendor representative.
```typescript
interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  department: string;
  designation?: string;
  vendorId?: string; // Linked if role is VENDOR
}
```

### InventoryItem
Represents consumable stock or items held in stores.
```typescript
interface InventoryItem {
  id: string;
  name: string;
  sku: string;
  govId: string;
  category: string; 
  isAsset: boolean; // If true, creates an Asset record on addition
  quantity: number;
  minStockLevel: number;
  pricePerUnit: number;
}
```

### Asset
Represents fixed assets (furniture, IT equipment, vehicles).
```typescript
interface Asset {
  id: string;
  name: string;
  govId: string;
  category: string;
  condition: 'New' | 'Good' | 'Fair' | 'Poor' | 'Disposal';
  purchaseDate: string;
  assignedTo?: string; // User ID
}
```

### ProcurementWorkflow
The central record for any goods or service request.
```typescript
interface ProcurementWorkflow {
  id: string;
  requestType: 'GOODS' | 'SERVICE';
  status: ProcurementStatus;
  requesterId: string;
  items: {
    itemId?: string; 
    description: string;
    quantity: number;
  }[];
  gsrfRefNumber?: string;
  prRefNumber?: string;
  poNumber?: string;
  quotations?: Quotation[];
  logs: LogEntry[];
}
```

### Vendor
Approved suppliers in the system.
```typescript
interface Vendor {
  id: string;
  name: string;
  email: string;
  status: 'Active' | 'Blacklisted' | 'Pending';
}
```

## Enums

### UserRole
`USER`, `SUPERVISOR`, `MANAGER`, `FINANCE_OFFICER`, `ADMIN`, `STOCK_KEEPER`, `VENDOR`

### ProcurementStatus
`DRAFT`, `SUBMITTED`, `APPROVED`, `REJECTED`, `ISSUED`, `PROCUREMENT_NEEDED`, `PR_CREATED`, `EVALUATION`, `BUDGET_CHECK`, `PO_ISSUED`, `COMPLETED`
