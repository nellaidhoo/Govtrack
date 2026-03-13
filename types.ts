
export enum UserRole {
  USER = 'User',
  SUPERVISOR = 'Supervisor',
  MANAGER = 'Manager',
  FINANCE_OFFICER = 'Finance Officer',
  ADMIN = 'Administrator',
  STOCK_KEEPER = 'Stock Keeper',
  VENDOR = 'Vendor'
}

export interface ItemCategoryDef {
  id: string;
  name: string;
  code: string;
}

export interface ItemTypeDef {
  id: string;
  categoryId: string;
  name: string;
  code: string;
}

export enum ItemCategory {
  STATIONERY = '01',
  IT_EQUIPMENT = '02',
  FURNITURE = '03',
  VEHICLES = '04',
  MAINTENANCE = '05'
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  department: string;
  designation?: string;
  phone?: string;
  signatureUrl?: string;
  vendorId?: string; // Link to Vendor entity if role is VENDOR
}

export interface Department {
  id: string;
  name: string;
  managerId?: string;
  supervisorId?: string;
  code: string;
}

export interface Vendor {
  id: string;
  name: string;
  contactPerson: string;
  email: string;
  phone: string;
  address: string;
  taxId?: string;
  status: 'Active' | 'Blacklisted' | 'Pending';
}

export interface InventoryItem {
  id: string;
  name: string;
  sku: string;
  barcode?: string;
  govId: string;
  category: string; 
  productType?: string; 
  isAsset: boolean; 
  quantity: number;
  location: string;
  minStockLevel: number;
  pricePerUnit: number;
  lastUpdated: string;
}

export interface Asset {
  id: string;
  name: string;
  govId: string;
  category: string;
  condition: 'New' | 'Good' | 'Fair' | 'Poor' | 'Disposal';
  purchaseDate: string;
  price: number;
  location: string;
  assignedTo?: string;
}

export enum ProcurementStatus {
  DRAFT = 'Draft',
  SUBMITTED = 'Submitted',
  APPROVED = 'Approved',
  REJECTED = 'Rejected',
  ISSUED = 'Issued', 
  PROCUREMENT_NEEDED = 'Procurement Needed', 
  PR_CREATED = 'PR Created', 
  EVALUATION = 'Evaluation', 
  PENDING_APPROVAL = 'Pending Approval', 
  BUDGET_CHECK = 'Budget Check', 
  PO_ISSUED = 'PO Issued',
  COMPLETED = 'Completed'
}

export enum EvaluationMethod {
  EMAIL = 'Email',
  PHONE = 'Phone',
  VISITING = 'Visiting',
  PORTAL = 'Electronic Portal'
}

export type EvaluationType = 'FORM' | 'QUOTATION' | 'SINGLE_SOURCE';

export interface TemplateBlock {
  id: string;
  type: 'title' | 'text' | 'divider' | 'image' | 'signature';
  content?: string;
  style?: Record<string, string>;
}

export interface CommConfig {
  enabled: boolean;
  type: 'SMTP' | 'API';
  host?: string;
  port?: number;
  username?: string;
  password?: string;
  apiKey?: string;
  apiSecret?: string;
  senderId?: string;
  senderEmail?: string;
}

export interface SystemSettings {
  officeName: string;
  officeAddress: string;
  officeCode: string;
  departmentName: string;
  logoUrl?: string;
  phone?: string;
  email?: string;
  website?: string;
  taxId?: string;
  prefixes: {
    gsrf: string;
    pr: string;
    sr: string;
    po: string;
    so: string;
    pef: string;
    cert: string;
    asset: string;
    inventory: string;
  };
  templateConfig: {
    headerText?: string;
    footerText?: string;
    showLogo: boolean;
    customBlocks?: TemplateBlock[]; 
  };
  categories: ItemCategoryDef[];
  itemTypes: ItemTypeDef[];
  emailIntegration?: CommConfig;
  smsIntegration?: CommConfig;
}

export interface CompletionCertificate {
  certificateNumber: string;
  agreementNumber: string;
  awardedDate: string;
  startedDate: string;
  completionDate: string;
  totalPriceInWords: string;
  duration: string;
  additionalNotes: string;
  documentDate: string;
  managerName: string;
  managerSignature?: string;
}

export interface Quotation {
  id: string;
  vendorId?: string;
  vendorName: string;
  quoteNumber?: string;
  quoteDate?: string;
  price: number;
  selected: boolean;
  isPortalSubmission?: boolean;
  submittedAt?: string;
  status: 'Draft' | 'Submitted' | 'Withdrawn';
}

export interface ProcurementWorkflow {
  id: string;
  requestType: 'GOODS' | 'SERVICE';
  status: ProcurementStatus;
  requesterId: string;
  requesterName: string;
  requesterDepartment: string;
  section?: string;
  requestDate: string;
  requiredDate?: string;
  remarks?: string; 
  items: {
    itemId?: string; 
    description: string;
    quantity: number;
    estimatedCost?: number;
  }[];
  requesterSignature?: string;
  gsrfRefNumber?: string;
  stockKeeperSignature?: string;
  stockCheckDate?: string;
  issueDetails?: {
    receiverName: string;
    receiverDepartment: string;
    issueDate: string;
    remarks: string;
  };
  assessmentDetails?: {
    assessedBy: string;
    assessmentDate: string;
    findings: string;
    inHouseRepairPossible: boolean;
  };
  prRefNumber?: string;
  authorizedBySignature?: string;
  evalRefNumber?: string; 
  evaluationMethod?: EvaluationMethod;
  evaluationType?: EvaluationType;
  singleSourceJustification?: string;
  quotations?: Quotation[];
  // Portal Specific Fields
  isPublishedToPortal?: boolean;
  portalPublishedAt?: string;
  bidDeadline?: string;
  budgetCode?: string;
  budgetVerifiedDate?: string;
  poNumber?: string;
  selectedVendor?: string;
  serviceCompletionDetails?: {
      completionDate: string;
      verifiedBy: string;
      remarks: string;
      totalCost: number;
  };
  certificate?: CompletionCertificate;
  logs: {
    date: string;
    action: string;
    actor: string;
  }[];
}

export type AppTab = 'DASHBOARD' | 'INVENTORY' | 'PROCUREMENT' | 'ASSETS' | 'REPORTS' | 'SETTINGS' | 'VENDORS' | 'VENDOR_PORTAL';

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'error';
  time: string;
  read: boolean;
  link?: {
    tab: AppTab;
    itemId?: string;
  };
  recipientId?: string;
}

export interface LogEntry {
  id: string;
  date: string;
  action: string;
  actor: string;
  details: string;
  category: 'INVENTORY' | 'PROCUREMENT' | 'ASSETS' | 'SETTINGS' | 'USER' | 'VENDOR' | 'AUTH' | 'COMMUNICATION';
  referenceId?: string;
}

export const OFFICE_CODE = "263";
