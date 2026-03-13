# Business Logic & Architecture

## 1. Procurement Workflow
The heart of GovTrack is its compliance-driven procurement engine. It follows a linear progression with role-based gates.

### Workflow Stages:
1.  **Requisition (GSRF):**
    *   Initiated by a **User**.
    *   Requires item descriptions, quantities, and estimated costs.
    *   Generates a unique GSRF Reference Number (e.g., `(RF)/263/2024/407`).
2.  **Stock/Technical Check:**
    *   **Stock Keeper** reviews the request.
    *   If items are in stock, they are "Issued" (Inventory quantity decreases).
    *   If items are unavailable, the status moves to "Procurement Needed".
3.  **Purchase Request (PR):**
    *   The request is escalated to a **Manager** for authorization.
    *   A PR Reference Number is assigned.
4.  **Bidding & Evaluation:**
    *   **Procurement Officer** (or Manager) initiates evaluation.
    *   Methods: Competitive Bidding (3+ quotes) or Single Source (with justification).
    *   **Vendor Portal:** RFQs can be published to the portal where Vendors submit quotes electronically.
5.  **Financial Approval:**
    *   **Finance Officer** verifies the budget and assigns a Budget Code.
6.  **Official Order (PO/SO):**
    *   System generates a formal Purchase Order (for Goods) or Service Order (for Services).
7.  **Closure (GRN/Completion):**
    *   **Goods Receipt Note (GRN):** For goods, stock is added to inventory upon delivery.
    *   **Completion Certificate:** For services, a certificate is generated once the work is verified.

## 2. ID Generation Logic
GovTrack uses structured identifiers to ensure auditability.

### Government Asset IDs:
Format: `[OfficeCode]|[Year]|[Category]|[Type]|[Sequence]`
*   Example: `263|2024|03|001|005`
*   Logic: Ensures every asset has a unique, traceable ID across the government entity.

### SKU Logic:
*   Generated based on the first 3 letters of the category (e.g., `STA-4921` for Stationery).

## 3. Role-Based Access Control (RBAC)
| Role | Permissions |
| :--- | :--- |
| **User** | Create GSRFs, view personal requests. |
| **Supervisor** | Approve/Review departmental requests. |
| **Manager** | Authorize PRs, manage department assets. |
| **Finance Officer** | Budget verification, PO issuance. |
| **Stock Keeper** | Inventory management, stock checks, GRN processing. |
| **Administrator** | System settings, user management, audit logs. |
| **Vendor** | View published RFQs, submit electronic quotes. |

## 4. Notification System
*   **In-App:** Uses a custom toast stack for real-time feedback.
*   **Browser:** Utilizes the Web Notifications API for background alerts.
*   **Deep Linking:** Notifications include metadata to navigate the user directly to the relevant record.

## 5. Offline Support
*   The system includes an `OfflineService` that snapshots data to `localStorage`.
*   Updates made while offline are queued and synced once the connection is restored.
