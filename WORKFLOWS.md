# Example Workflows

## Workflow A: Requesting Office Supplies (Consumables)
1.  **Login:** User logs in and navigates to the **Procurement** tab.
2.  **Create Request:** Clicks "New Request", selects "GOODS", and adds "A4 Paper (5 Reams)".
3.  **Submit:** Signs the digital form and submits. Status: `SUBMITTED`.
4.  **Stock Check:** Stock Keeper receives a notification, checks the store, and finds the item.
5.  **Issue:** Stock Keeper clicks "Issue from Stock".
6.  **Result:** Status becomes `ISSUED`. Inventory quantity for A4 Paper automatically decreases by 5.

## Workflow B: Procuring New IT Equipment (Capital Expenditure)
1.  **Request:** User submits a request for a "High-End Laptop".
2.  **Stock Check:** Stock Keeper marks as "Procurement Needed" (not in stock).
3.  **Authorization:** Manager reviews and clicks "Authorize for Procurement". Status: `PR_CREATED`.
4.  **Evaluation:** Procurement Officer adds 3 quotes from different vendors.
5.  **Selection:** Manager selects the best value quote. Status: `PENDING_APPROVAL`.
6.  **Finance:** Finance Officer assigns Budget Code `502.01` and approves. Status: `BUDGET_CHECK`.
7.  **PO:** System generates PO and status moves to `PO_ISSUED`.
8.  **Delivery:** Upon delivery, Stock Keeper clicks "Receive Goods".
9.  **Inventory/Asset:** The laptop is added to Inventory and a new **Asset** record is automatically created with a unique Gov Asset ID.

## Workflow C: Vendor Quote Submission (Portal)
1.  **Publish:** Procurement Officer publishes an RFQ to the **Vendor Portal**.
2.  **Vendor Action:** Vendor logs in, sees the "Open Tenders" section.
3.  **Submit Quote:** Vendor enters their price, quote reference, and clicks "Submit Quote".
4.  **Internal Review:** The quote appears instantly in the internal Procurement Evaluation matrix for comparison.

## Workflow D: Asset Audit
1.  **Registry:** Admin navigates to **Assets** tab.
2.  **Print Tag:** Admin selects an asset and prints the QR code tag.
3.  **Field Audit:** Using a mobile device, the auditor scans the QR code.
4.  **Verification:** The system displays the asset's current location, condition, and assigned user for verification.
