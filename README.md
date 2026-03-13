# GovTrack: Government Entity Inventory & Procurement System

## Overview
GovTrack is a comprehensive management system designed for Government-Owned Entities (GOEs) and public sector departments. It streamlines the lifecycle of government property management, ensuring compliance, transparency, and efficiency in procurement and asset tracking.

## Core Features (Implemented)

### 1. Advanced Dashboard
*   **Real-time KPIs:** Instant visibility into Total Inventory Value, Pending Requisitions, and Critical Stock Alerts.
*   **Data Visualization:** Interactive charts showing Inventory Distribution and Procurement Spending trends using Recharts.

### 2. Intelligent Inventory Management
*   **Consumable Tracking:** Detailed management of office supplies and technical spares.
*   **ID Systems:** Automated SKU generation and support for standard barcodes.
*   **Label Printing:** Specialized thermal label printing support (80mm) for warehouse bin locations.
*   **Stock Control:** Automated reorder point alerts and low-stock warnings.
*   **Data Portability:** Full CSV Export functionality for external auditing and reporting.

### 3. Fixed Asset Registry
*   **Government Compliance:** Automatic generation of structured Government Asset IDs (e.g., `263|2024|03|001`).
*   **QR Code Integration:** Printable security tags with embedded metadata QR codes for quick field audits.
*   **Lifecycle Management:** Full Edit/Delete capabilities and tracking of condition, location, and individual assignments.
*   **Bulk Export:** Export the entire asset registry to CSV format.

### 4. Procurement Workflow (The Compliance Engine)
A multi-step, role-validated workflow that follows strict public procurement standards:
1.  **Requisition (GSRF/SRF):** Electronic submission of Goods or Service requests with digital signatures.
2.  **Stock/Technical Check:** Warehouse check for goods or technical assessment for service requests.
3.  **Procurement Escalation:** Automated conversion to Purchase Request (PR) or Service Request (SR) if items are unavailable.
4.  **Bidding & Evaluation:** 
    *   **Competitive Bidding:** Multi-vendor price comparison matrix with automated "Best Offer" highlighting.
    *   **Single Source:** Dedicated workflow for sole-source justification and approval.
5.  **Financial Governance:** Finance role budget verification and assignment of official Budget Codes.
6.  **Official Orders:** Automated generation of professional POs (Purchase Orders) and SOs (Service Orders).
7.  **Closure:** Goods Receipt Notes (GRN) that automatically update inventory, or Service Completion Certificates.

### 5. Multi-Layered Notification System
*   **In-App Alerts:** Real-time toast notifications for system events (status changes, low stock).
*   **Native Browser Alerts:** OS-level desktop notifications using the Web Notifications API to ensure critical alerts are never missed.
*   **Deep Linking:** Clicking a notification takes the user directly to the relevant record.

### 6. Administration & Governance
*   **User Management:** Full CRUD actions for system users with role-based access control (RBAC).
*   **Security:** Password reset mechanism for admins and a "Forgot Password" email simulation on the login screen.
*   **Organization Config:** Extensive branding options, custom office codes, and document prefix management.
*   **Template Builder:** A drag-and-drop style editor to customize the layout of official document headers and footers.
*   **Audit Trail:** Immutable logs tracking every user action, login attempt, and document modification.

---

## Technical Specifications
*   **Framework:** React 19 with TypeScript.
*   **UI/UX:** Tailwind CSS for a modern, responsive "Gov-Tech" aesthetic.
*   **Icons:** Lucide-React.
*   **Reporting:** Recharts (Analytics), `react-qr-code` (Assets), `react-barcode` (Inventory).
*   **Mock Backend:** In-memory service simulating complex relational data and stateful workflows.

---

## Future Roadmap (Upgrades)

### Phase 1: Enhanced Mobility & Scanning
*   **Direct Camera Scanning:** Enable mobile phone cameras to scan Barcodes/QR codes directly in the browser for inventory counts.
*   **Offline Support:** PWA (Progressive Web App) capabilities for warehouse areas with poor connectivity.

### Phase 2: Integration & Automation
*   **Email/SMS Gateway:** Integration with actual SMTP/SMS services for real notification delivery.
*   **Accounting API:** Connect with ERP systems (SAP, Oracle, or local Treasury systems) for real-time budget synchronization.
*   **Vendor Portal:** A secure area for registered vendors to upload their quotations directly.

### Phase 3: AI & Predictive Analytics
*   **Demand Forecasting:** AI-driven suggestions for reorder quantities based on historical consumption.
*   **Anomaly Detection:** Flagging unusual procurement patterns or potential compliance risks.
*   **Automated Summaries:** LLM integration (Gemini API) to summarize long technical assessments into concise executive reports.

---
© 2024 GovTrack Systems. Empowering Public Sector Efficiency.
