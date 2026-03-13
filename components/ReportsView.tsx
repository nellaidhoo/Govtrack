import React, { useState, useEffect, useMemo } from 'react';
import { LogService, ProcurementService, InventoryService, AssetService, SettingsService } from '../services/mockService';
import { LogEntry, ProcurementWorkflow, InventoryItem, Asset, ProcurementStatus, ItemCategory, SystemSettings } from '../types';
import { Card, Button, Input } from './SharedComponents';
import { RefreshCw, Filter, Download, PieChart as PieChartIcon, BarChart3, AlertTriangle, FileText, Activity, Printer, ArrowLeft, FileSpreadsheet } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend } from 'recharts';

type ReportTab = 'FINANCIAL' | 'INVENTORY' | 'AUDIT';

export const ReportsView = () => {
  const [activeTab, setActiveTab] = useState<ReportTab>('FINANCIAL');
  const [isLoading, setIsLoading] = useState(false);
  const [isPrintMode, setIsPrintMode] = useState(false);

  // Data State
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [requests, setRequests] = useState<ProcurementWorkflow[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [settings, setSettings] = useState<SystemSettings | null>(null);

  // Filter State
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0], // Start of current year
    end: new Date().toISOString().split('T')[0]
  });
  const [deptFilter, setDeptFilter] = useState('ALL');
  const [auditCategory, setAuditCategory] = useState('ALL');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    const [l, r, i, a, s] = await Promise.all([
      LogService.getAll(),
      ProcurementService.getAll(),
      InventoryService.getAll(),
      AssetService.getAll(),
      SettingsService.get()
    ]);
    setLogs(l);
    setRequests(r);
    setInventory(i);
    setAssets(a);
    setSettings(s);
    setIsLoading(false);
  };

  // --- Helpers for Filtering ---
  const filterByDate = (dateStr: string) => {
    return dateStr >= dateRange.start && dateStr <= dateRange.end;
  };

  const getUniqueDepartments = () => {
    const depts = new Set(requests.map(r => r.requesterDepartment));
    return ['ALL', ...Array.from(depts)];
  };

  // --- Aggregation Logic ---

  // 1. Cost & Consumption Data
  const financialData = useMemo(() => {
    let filtered = requests.filter(r => filterByDate(r.requestDate));
    if (deptFilter !== 'ALL') filtered = filtered.filter(r => r.requesterDepartment === deptFilter);

    // Filter for completed/approved spend
    const spendRequests = filtered.filter(r => 
      r.status === ProcurementStatus.PO_ISSUED || 
      r.status === ProcurementStatus.COMPLETED
    );

    // Calculate Total Spend
    const totalSpend = spendRequests.reduce((acc, r) => {
        const quotePrice = r.quotations?.find(q => q.selected)?.price || 0;
        return acc + quotePrice;
    }, 0);

    // Chart: Spend by Month
    const spendByMonth = spendRequests.reduce((acc, r) => {
        const month = new Date(r.requestDate).toLocaleString('default', { month: 'short' });
        const cost = r.quotations?.find(q => q.selected)?.price || 0;
        acc[month] = (acc[month] || 0) + cost;
        return acc;
    }, {} as Record<string, number>);

    const spendChartData = Object.entries(spendByMonth).map(([name, value]) => ({ name, value }));

    // Chart: Consumption by Department (Count of requests)
    const reqByDept = filtered.reduce((acc, r) => {
        acc[r.requesterDepartment] = (acc[r.requesterDepartment] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    const deptChartData = Object.entries(reqByDept).map(([name, value]) => ({ name, value }));

    return { totalSpend, spendChartData, deptChartData, transactionCount: filtered.length, filteredRequests: filtered, spendRequests };
  }, [requests, dateRange, deptFilter]);

  // 2. Inventory Reports
  const inventoryReport = useMemo(() => {
    // Current Valuation (Qty * Price)
    const valuation = inventory.reduce((acc, item) => acc + (item.quantity * item.pricePerUnit), 0);
    const assetValuation = assets.reduce((acc, a) => acc + a.price, 0);

    // Low Stock Items
    const lowStockItems = inventory.filter(i => i.quantity <= i.minStockLevel);

    // Category Distribution
    const catDist = inventory.reduce((acc, item) => {
        acc[item.category] = (acc[item.category] || 0) + item.quantity;
        return acc;
    }, {} as Record<string, number>);
    
    const pieData = Object.entries(catDist).map(([name, value]) => ({ name, value }));

    return { valuation, assetValuation, lowStockItems, pieData };
  }, [inventory, assets]);

  // 3. Audit Filter (Memoized for Export)
  const filteredLogs = useMemo(() => {
    return logs.filter(l => {
        const dateMatch = filterByDate(l.date.split('T')[0]);
        const catMatch = auditCategory === 'ALL' || l.category === auditCategory;
        return dateMatch && catMatch;
    });
  }, [logs, dateRange, auditCategory]);

  // --- Export Logic ---

  const escapeCsv = (str: string | number | undefined | null) => {
    if (str === null || str === undefined) return '';
    const stringValue = String(str);
    if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
      return `"${stringValue.replace(/"/g, '""')}"`;
    }
    return stringValue;
  };

  const downloadCSV = (headers: string[], data: any[], filename: string) => {
    const csvContent = [
      headers.join(','),
      ...data.map(row => row.map(escapeCsv).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleExportCSV = () => {
    const dateStr = new Date().toISOString().split('T')[0];

    if (activeTab === 'FINANCIAL') {
       // Export Financial Data
       const headers = ['Ref Number', 'Request Date', 'Status', 'Department', 'Requester', 'Selected Vendor', 'Total Amount (MVR)', 'Items Summary'];
       const rows = financialData.spendRequests.map(r => [
          r.poNumber || r.gsrfRefNumber,
          new Date(r.requestDate).toLocaleDateString(),
          r.status,
          r.requesterDepartment,
          r.requesterName,
          r.selectedVendor || 'N/A',
          (r.quotations?.find(q => q.selected)?.price || 0).toFixed(2),
          r.items.map(i => `${i.description} (${i.quantity})`).join('; ')
       ]);
       downloadCSV(headers, rows, `financial_report_${dateStr}.csv`);
    } else if (activeTab === 'INVENTORY') {
       // Export Inventory
       const headers = ['SKU', 'Gov ID', 'Item Name', 'Category', 'Location', 'Quantity', 'Unit Price (MVR)', 'Total Value (MVR)', 'Last Updated'];
       const rows = inventory.map(i => [
          i.sku,
          i.govId,
          i.name,
          i.category,
          i.location,
          i.quantity,
          i.pricePerUnit.toFixed(2),
          (i.quantity * i.pricePerUnit).toFixed(2),
          new Date(i.lastUpdated).toLocaleDateString()
       ]);
       downloadCSV(headers, rows, `inventory_snapshot_${dateStr}.csv`);
    } else if (activeTab === 'AUDIT') {
       // Export Logs
       const headers = ['Timestamp', 'Category', 'Action', 'Actor', 'Details', 'Reference ID'];
       const rows = filteredLogs.map(l => [
          l.date,
          l.category,
          l.action,
          l.actor,
          l.details,
          l.referenceId || ''
       ]);
       downloadCSV(headers, rows, `audit_logs_${dateStr}.csv`);
    }
  };

  const handlePrint = () => {
      setTimeout(() => window.print(), 100);
  };

  const renderPrintHeader = (title: string) => (
      <div className="flex flex-col items-center mb-6 border-b-2 border-black pb-4 text-center">
          {settings?.templateConfig?.showLogo && settings?.logoUrl && (
             <img src={settings.logoUrl} alt="Logo" className="h-16 object-contain mb-2" />
          )}
          <h1 className="text-xl font-bold uppercase tracking-wider mb-1 font-serif">
              {settings?.officeName || 'Government Entity'}
          </h1>
          <h2 className="text-sm uppercase text-slate-600 mb-2 font-serif">
              {settings?.departmentName}
          </h2>
          <p className="text-[10px] text-slate-500 mb-4 whitespace-pre-line">
              {settings?.officeAddress}
          </p>
          <div className="w-full flex justify-between items-end mt-4 border-t pt-2">
            <div>
              <p className="text-sm font-bold uppercase">Report: {title}</p>
              <p className="text-xs text-slate-500">Filters: {dateRange.start} to {dateRange.end} | Dept: {deptFilter}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-500">Generated On: {new Date().toLocaleString()}</p>
            </div>
          </div>
      </div>
  );

  const renderPrintFooter = () => (
      <div className="mt-8 pt-4 border-t border-slate-300 text-center text-[10px] text-slate-500">
          <p>{settings?.templateConfig?.footerText || 'System Generated Report'}</p>
      </div>
  );


  // --- Renderers ---

  const renderFinancialTab = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 print:grid-cols-3">
        <Card className="bg-white border-l-4 border-l-green-500 print:border">
           <div className="text-slate-500 text-sm font-medium uppercase">Total Procurement Cost</div>
           <div className="text-2xl font-bold text-slate-800 mt-1">MVR {financialData.totalSpend.toLocaleString()}</div>
           <div className="text-xs text-slate-400 mt-2">Based on issued POs in period</div>
        </Card>
        <Card className="bg-white border-l-4 border-l-blue-500 print:border">
           <div className="text-slate-500 text-sm font-medium uppercase">Total Requisitions</div>
           <div className="text-2xl font-bold text-slate-800 mt-1">{financialData.transactionCount}</div>
           <div className="text-xs text-slate-400 mt-2">Requests processed in period</div>
        </Card>
        <Card className="bg-white border-l-4 border-l-purple-500 print:border">
           <div className="text-slate-500 text-sm font-medium uppercase">Avg Cost per Request</div>
           <div className="text-2xl font-bold text-slate-800 mt-1">
             MVR {financialData.transactionCount > 0 ? (financialData.totalSpend / financialData.transactionCount).toFixed(2) : '0.00'}
           </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 print:grid-cols-2 print:gap-4">
         <Card title="Monthly Procurement Spend" className="print:break-inside-avoid">
            <div className="h-64 w-full">
               <ResponsiveContainer width="100%" height="100%">
                 <LineChart data={financialData.spendChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip formatter={(val: number) => `MVR ${val}`} />
                    <Legend />
                    <Line type="monotone" dataKey="value" name="Spend (MVR)" stroke="#0ea5e9" strokeWidth={2} />
                 </LineChart>
               </ResponsiveContainer>
            </div>
         </Card>
         <Card title="Requisitions by Department" className="print:break-inside-avoid">
            <div className="h-64 w-full">
               <ResponsiveContainer width="100%" height="100%">
                 <BarChart data={financialData.deptChartData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="name" type="category" width={100} style={{fontSize: '10px'}} />
                    <Tooltip />
                    <Bar dataKey="value" name="Requests" fill="#8884d8" barSize={20} />
                 </BarChart>
               </ResponsiveContainer>
            </div>
         </Card>
      </div>

      <Card title="Detailed Cost Report" className="print:shadow-none print:border-none">
         <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm print:text-xs">
               <thead className="bg-slate-50">
                  <tr>
                     <th className="px-4 py-2 text-left text-slate-500">Ref No</th>
                     <th className="px-4 py-2 text-left text-slate-500">Date</th>
                     <th className="px-4 py-2 text-left text-slate-500">Department</th>
                     <th className="px-4 py-2 text-left text-slate-500">Vendor</th>
                     <th className="px-4 py-2 text-right text-slate-500">Amount (MVR)</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-slate-200">
                  {financialData.spendRequests.map(r => (
                       <tr key={r.id}>
                          <td className="px-4 py-2 font-mono text-xs">{r.poNumber || r.gsrfRefNumber}</td>
                          <td className="px-4 py-2">{new Date(r.requestDate).toLocaleDateString()}</td>
                          <td className="px-4 py-2">{r.requesterDepartment}</td>
                          <td className="px-4 py-2">{r.selectedVendor || 'N/A'}</td>
                          <td className="px-4 py-2 text-right font-medium">{(r.quotations?.find(q => q.selected)?.price || 0).toLocaleString()}</td>
                       </tr>
                  ))}
                  <tr className="bg-slate-50 font-bold">
                      <td colSpan={4} className="px-4 py-2 text-right">TOTAL</td>
                      <td className="px-4 py-2 text-right">MVR {financialData.totalSpend.toLocaleString()}</td>
                  </tr>
               </tbody>
            </table>
         </div>
      </Card>
    </div>
  );

  const renderInventoryTab = () => {
    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 print:grid-cols-2">
           <Card title="Inventory Distribution" className="print:break-inside-avoid">
              <div className="h-64 flex items-center justify-center">
                 <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={inventoryReport.pieData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}
                      >
                        {inventoryReport.pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                 </ResponsiveContainer>
              </div>
           </Card>
           
           <div className="space-y-6">
              <Card className="bg-slate-50 print:break-inside-avoid">
                 <h3 className="text-sm font-bold text-slate-500 uppercase mb-2">Total Valuation (MVR)</h3>
                 <div className="space-y-2">
                    <div className="flex justify-between items-center border-b pb-2">
                       <span>Consumables Stock</span>
                       <span className="font-bold text-lg">{inventoryReport.valuation.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center border-b pb-2">
                       <span>Fixed Assets Registry</span>
                       <span className="font-bold text-lg">{inventoryReport.assetValuation.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center pt-1">
                       <span className="font-bold text-slate-800">Total Holdings</span>
                       <span className="font-bold text-xl text-green-700">{(inventoryReport.valuation + inventoryReport.assetValuation).toLocaleString()}</span>
                    </div>
                 </div>
              </Card>

              {inventoryReport.lowStockItems.length > 0 && (
                 <div className="bg-red-50 border border-red-200 rounded-lg p-4 print:break-inside-avoid">
                    <div className="flex items-center gap-2 text-red-700 font-bold mb-3">
                       <AlertTriangle className="w-5 h-5" /> Low Stock Warning ({inventoryReport.lowStockItems.length})
                    </div>
                    <div className="max-h-40 overflow-y-auto print:max-h-none">
                       <table className="w-full text-sm">
                          <thead>
                             <tr className="text-left text-xs text-red-500 uppercase">
                                <th className="pb-1">Item</th>
                                <th className="pb-1 text-center">Current</th>
                                <th className="pb-1 text-center">Min</th>
                             </tr>
                          </thead>
                          <tbody>
                             {inventoryReport.lowStockItems.map(i => (
                                <tr key={i.id} className="border-b border-red-100 last:border-0">
                                   <td className="py-1 text-slate-700">{i.name}</td>
                                   <td className="py-1 text-center font-bold text-red-600">{i.quantity}</td>
                                   <td className="py-1 text-center text-slate-500">{i.minStockLevel}</td>
                                </tr>
                             ))}
                          </tbody>
                       </table>
                    </div>
                 </div>
              )}
           </div>
        </div>

        <Card title="Current Inventory Snapshot" className="print:shadow-none print:border-none">
             <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200 text-sm print:text-xs">
                   <thead className="bg-slate-50">
                      <tr>
                         <th className="px-4 py-2 text-left">SKU</th>
                         <th className="px-4 py-2 text-left">Item Name</th>
                         <th className="px-4 py-2 text-left">Category</th>
                         <th className="px-4 py-2 text-center">Qty</th>
                         <th className="px-4 py-2 text-right">Value (MVR)</th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-200">
                      {inventory.map(item => (
                         <tr key={item.id}>
                            <td className="px-4 py-2 font-mono text-xs">{item.sku}</td>
                            <td className="px-4 py-2">{item.name}</td>
                            <td className="px-4 py-2">
                               <span className="px-2 py-0.5 rounded-full bg-slate-100 text-xs text-slate-600 font-medium">
                                  {item.category}
                               </span>
                            </td>
                            <td className="px-4 py-2 text-center">{item.quantity}</td>
                            <td className="px-4 py-2 text-right">{(item.quantity * item.pricePerUnit).toFixed(2)}</td>
                         </tr>
                      ))}
                   </tbody>
                </table>
             </div>
        </Card>
      </div>
    );
  };

  const renderAuditTab = () => {
     const categories = ['ALL', 'INVENTORY', 'PROCUREMENT', 'ASSETS', 'SETTINGS', 'USER', 'VENDOR', 'AUTH'];

     return (
        <div className="space-y-4">
           {!isPrintMode && (
             <div className="flex gap-2 overflow-x-auto pb-2">
                {categories.map(cat => (
                <button 
                    key={cat}
                    onClick={() => setAuditCategory(cat)}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold transition-colors whitespace-nowrap ${
                        auditCategory === cat ? 'bg-gov-600 text-white' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                    }`}
                >
                    {cat}
                </button>
                ))}
             </div>
           )}

            <Card className="min-h-[500px] print:min-h-0 print:shadow-none print:border-none">
               <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-slate-200 print:text-xs">
                  <thead className="bg-slate-50">
                     <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Timestamp</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">User</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Category</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Action</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Details</th>
                     </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-slate-200">
                     {filteredLogs.map((log) => (
                        <tr key={log.id} className="hover:bg-slate-50">
                        <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-500 font-mono">
                           {new Date(log.date).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                           {log.actor}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                           <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-slate-100 text-slate-800">
                              {log.category}
                           </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700">
                           {log.action}
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-500 max-w-md truncate print:whitespace-normal" title={log.details}>
                           {log.details}
                        </td>
                        </tr>
                     ))}
                     {filteredLogs.length === 0 && (
                        <tr>
                              <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                                 <div className="flex flex-col items-center">
                                    <Filter className="w-8 h-8 text-slate-300 mb-2" />
                                    <p>No logs found for this filter.</p>
                                 </div>
                              </td>
                        </tr>
                     )}
                  </tbody>
                  </table>
               </div>
            </Card>
        </div>
     );
  };

  // --- Main Render ---

  if (isPrintMode) {
     return (
        <div className="document-preview-wrapper min-h-screen">
             <div className="printable-area flex flex-col">
                {renderPrintHeader(activeTab === 'FINANCIAL' ? 'Financial & Consumption' : activeTab === 'INVENTORY' ? 'Inventory Status' : 'System Audit Log')}
                
                <div className="flex-1">
                   {activeTab === 'FINANCIAL' && renderFinancialTab()}
                   {activeTab === 'INVENTORY' && renderInventoryTab()}
                   {activeTab === 'AUDIT' && renderAuditTab()}
                </div>

                {renderPrintFooter()}
             </div>

             <div className="fixed top-4 right-4 flex gap-2 no-print z-50">
                <Button onClick={handlePrint} icon={Download}>Download PDF / Print</Button>
                <Button variant="secondary" onClick={() => setIsPrintMode(false)} icon={ArrowLeft}>Back to Dashboard</Button>
             </div>
        </div>
     );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
        <h2 className="text-2xl font-bold text-slate-800">Reports & Analytics</h2>
        <div className="flex gap-2">
            <button 
              onClick={loadData} 
              className="p-2 bg-white border rounded hover:bg-slate-50 text-slate-600" 
              title="Refresh Data"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
            <Button variant="outline" icon={FileSpreadsheet} onClick={handleExportCSV}>Export CSV</Button>
            <Button variant="outline" icon={Printer} onClick={() => setIsPrintMode(true)}>Print / PDF</Button>
        </div>
      </div>

      {/* Global Filters */}
      <Card className="bg-slate-50 border-slate-200 p-4">
         <div className="flex flex-col md:flex-row items-end gap-4">
            <div className="flex-1 w-full grid grid-cols-1 md:grid-cols-3 gap-4">
               <Input 
                 label="Start Date" 
                 type="date" 
                 value={dateRange.start} 
                 onChange={e => setDateRange({...dateRange, start: e.target.value})} 
                 className="mb-0 bg-white"
               />
               <Input 
                 label="End Date" 
                 type="date" 
                 value={dateRange.end} 
                 onChange={e => setDateRange({...dateRange, end: e.target.value})} 
                 className="mb-0 bg-white"
               />
               <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Department</label>
                  <select 
                     className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gov-500"
                     value={deptFilter}
                     onChange={e => setDeptFilter(e.target.value)}
                  >
                     {getUniqueDepartments().map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
               </div>
            </div>
            <div className="text-xs text-slate-400 pb-3">
               Applies to Financial & Audit reports
            </div>
         </div>
      </Card>

      {/* Report Tabs */}
      <div className="border-b border-slate-200">
         <nav className="-mb-px flex space-x-8">
            <button
               onClick={() => setActiveTab('FINANCIAL')}
               className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                  activeTab === 'FINANCIAL' 
                  ? 'border-gov-500 text-gov-600' 
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
               }`}
            >
               <BarChart3 className="w-4 h-4" /> Financial & Consumption
            </button>
            <button
               onClick={() => setActiveTab('INVENTORY')}
               className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                  activeTab === 'INVENTORY' 
                  ? 'border-gov-500 text-gov-600' 
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
               }`}
            >
               <PieChartIcon className="w-4 h-4" /> Inventory Status
            </button>
            <button
               onClick={() => setActiveTab('AUDIT')}
               className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                  activeTab === 'AUDIT' 
                  ? 'border-gov-500 text-gov-600' 
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
               }`}
            >
               <Activity className="w-4 h-4" /> System Audit
            </button>
         </nav>
      </div>

      {/* Tab Content */}
      <div className="mt-4">
         {activeTab === 'FINANCIAL' && renderFinancialTab()}
         {activeTab === 'INVENTORY' && renderInventoryTab()}
         {activeTab === 'AUDIT' && renderAuditTab()}
      </div>
    </div>
  );
};