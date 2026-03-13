
import React, { useState, useEffect, useMemo } from 'react';
import { InventoryService, SettingsService, LogService, AuthService } from '../services/mockService';
import { InventoryItem, SystemSettings } from '../types';
import { Plus, Edit2, Barcode as BarcodeIcon, Printer, X, Lock, Unlock, AlertCircle, Search, Filter, FileSpreadsheet, Camera } from 'lucide-react';
import { Card, Button, Input } from './SharedComponents';
import { ScannerOverlay } from './ScannerOverlay';
import Barcode from 'react-barcode';

export const InventoryView = () => {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isManualGovId, setIsManualGovId] = useState(false);
  const [govIdError, setGovIdError] = useState('');
  const [showScanner, setShowScanner] = useState(false);
  
  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  
  // Printing State
  const [itemToPrint, setItemToPrint] = useState<InventoryItem | null>(null);
  const [printQty, setPrintQty] = useState(1);
  
  // Form state
  const [formData, setFormData] = useState({ 
    name: '', 
    category: '', 
    productType: '',
    isAsset: false,
    qty: 0, 
    loc: '', 
    price: 0, 
    minStockLevel: 5, 
    barcode: '', 
    sku: '',
    govId: ''
  });

  useEffect(() => {
    InventoryService.getAll().then(setItems);
    SettingsService.get().then(s => {
      setSettings(s);
      if (s.categories.length > 0) {
        setFormData(prev => ({ ...prev, category: s.categories[0].id }));
      }
    });
  }, []);

  const filteredItems = useMemo(() => {
    return items.filter(item => {
      const matchesSearch = 
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.govId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.barcode && item.barcode.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesCategory = categoryFilter === 'ALL' || item.category === categoryFilter;
      
      return matchesSearch && matchesCategory;
    });
  }, [items, searchTerm, categoryFilter]);

  const handleSave = async () => {
    setGovIdError('');
    let finalGovId = formData.govId;

    if (!isManualGovId && !editingId) {
      const cat = settings?.categories.find(c => c.id === formData.category);
      const type = settings?.itemTypes.find(t => t.id === formData.productType);
      finalGovId = InventoryService.generateGovId(
        new Date().getFullYear().toString(), 
        cat?.code || '00', 
        type?.code || '00'
      );
    }

    // Validation: Check for duplicates
    const isUnique = await InventoryService.isGovIdUnique(finalGovId, editingId || undefined);
    if (!isUnique) {
      setGovIdError('This GOV ID is already assigned to another item.');
      return;
    }

    if (editingId) {
      // Update existing item
      const itemToUpdate = items.find(i => i.id === editingId);
      if (itemToUpdate) {
        await InventoryService.update({
          ...itemToUpdate,
          name: formData.name,
          category: formData.category,
          productType: formData.productType,
          isAsset: formData.isAsset,
          quantity: formData.qty,
          location: formData.loc,
          pricePerUnit: formData.price,
          minStockLevel: formData.minStockLevel,
          barcode: formData.barcode,
          govId: finalGovId
        });
      }
    } else {
      // Create new item
      await InventoryService.add({
        name: formData.name,
        category: formData.category,
        productType: formData.productType,
        isAsset: formData.isAsset,
        quantity: formData.qty,
        location: formData.loc,
        pricePerUnit: formData.price,
        minStockLevel: formData.minStockLevel,
        govId: finalGovId,
        barcode: formData.barcode
      });
    }
    
    setItems(await InventoryService.getAll());
    resetForm();
  };

  const handleEdit = (item: InventoryItem) => {
    setEditingId(item.id);
    setIsManualGovId(true);
    setFormData({
      name: item.name,
      category: item.category,
      productType: item.productType || '',
      isAsset: item.isAsset,
      qty: item.quantity,
      loc: item.location,
      price: item.pricePerUnit,
      minStockLevel: item.minStockLevel,
      barcode: item.barcode || '',
      sku: item.sku,
      govId: item.govId
    });
    setShowForm(true);
  };

  const handleScanSuccess = (decodedText: string) => {
    setSearchTerm(decodedText);
    LogService.add({
      action: 'Barcode Scan Lookup',
      category: 'INVENTORY',
      details: `User performed inventory lookup via camera scan: ${decodedText}`,
      actor: AuthService.getCurrentUser()?.name || 'System'
    });
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingId(null);
    setIsManualGovId(false);
    setGovIdError('');
    setFormData({ 
      name: '', 
      category: settings?.categories[0]?.id || '', 
      productType: '',
      isAsset: false,
      qty: 0, 
      loc: '', 
      price: 0, 
      minStockLevel: 5, 
      barcode: '', 
      sku: '', 
      govId: '' 
    });
  };

  const handleExportCSV = () => {
    const headers = ['SKU', 'Gov ID', 'Item Name', 'Category', 'Stock', 'Location', 'Price (MVR)', 'Min Level'];
    const rows = filteredItems.map(i => [
      i.sku,
      i.govId,
      i.name,
      settings?.categories.find(c => c.id === i.category)?.name || i.category,
      i.quantity,
      i.location,
      i.pricePerUnit.toFixed(2),
      i.minStockLevel
    ]);
    
    const csvContent = [headers.join(','), ...rows.map(r => r.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', `inventory_report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const openPrintModal = (item: InventoryItem) => {
    setItemToPrint(item);
    setPrintQty(item.quantity > 0 ? item.quantity : 1);
  };

  const handlePrint = () => {
    window.print();
  };

  const filteredTypes = settings?.itemTypes.filter(t => t.categoryId === formData.category) || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h2 className="text-2xl font-bold text-slate-800">Inventory Management</h2>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExportCSV} icon={FileSpreadsheet}>Export CSV</Button>
          <Button onClick={() => setShowForm(!showForm)} icon={Plus}>Add Item</Button>
        </div>
      </div>
      
      {showForm && (
        <Card className="mb-6 bg-slate-50 border-slate-200">
          <h3 className="font-bold mb-4">{editingId ? 'Edit Item' : 'New Item Entry'}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <div className="col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">Government ID</label>
                <div className="flex gap-2 items-start">
                   <div className="flex-1">
                      <Input 
                        value={isManualGovId ? formData.govId : (editingId ? formData.govId : 'Auto-Generated on Save')} 
                        onChange={e => setFormData({...formData, govId: e.target.value})}
                        disabled={!isManualGovId}
                        className={`mb-1 ${govIdError ? 'border-red-500' : ''}`}
                        placeholder="Manual GOV ID format: 263|YYYY|CAT|TYPE|###"
                      />
                      {govIdError && <p className="text-[10px] text-red-600 font-bold flex items-center gap-1"><AlertCircle className="w-3 h-3"/> {govIdError}</p>}
                   </div>
                   {!editingId && (
                     <button 
                        type="button"
                        onClick={() => setIsManualGovId(!isManualGovId)}
                        className={`h-10 px-3 rounded-md border flex items-center gap-2 text-xs font-bold transition-colors ${isManualGovId ? 'bg-amber-50 border-amber-300 text-amber-700' : 'bg-slate-100 border-slate-300 text-slate-600'}`}
                        title={isManualGovId ? "Switch to Auto-Generation" : "Manual ID Entry"}
                     >
                        {isManualGovId ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                        {isManualGovId ? "Manual" : "Auto"}
                     </button>
                   )}
                </div>
             </div>
             
             {editingId && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-slate-700 mb-1">SKU (Auto-Generated)</label>
                  <div className="flex h-10 w-full items-center rounded-md border border-slate-200 bg-slate-100 px-3 text-sm font-mono text-slate-600">
                    {formData.sku}
                  </div>
                </div>
             )}
             
             <Input label="Item Name" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
             
             <div className="flex items-center gap-4 pt-6">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input 
                    type="checkbox" 
                    checked={formData.isAsset}
                    onChange={e => setFormData({...formData, isAsset: e.target.checked})}
                    className="w-4 h-4 rounded text-gov-600 focus:ring-gov-500"
                  />
                  <span className="text-sm font-bold text-slate-700 group-hover:text-gov-800 transition-colors">Mark as Fixed Asset</span>
                </label>
             </div>

             <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
                <select 
                  className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gov-500"
                  value={formData.category}
                  onChange={e => setFormData({...formData, category: e.target.value, productType: ''})}
                >
                  {settings?.categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
             </div>

             <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Product Type</label>
                <select 
                  className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gov-500"
                  value={formData.productType}
                  onChange={e => setFormData({...formData, productType: e.target.value})}
                  disabled={filteredTypes.length === 0}
                >
                  <option value="">-- Select Product Type --</option>
                  {filteredTypes.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
             </div>

             <Input label="Barcode" value={formData.barcode} onChange={e => setFormData({...formData, barcode: e.target.value})} placeholder="Scan or enter barcode" />
             <Input type="number" label="Quantity" value={formData.qty} onChange={e => setFormData({...formData, qty: parseInt(e.target.value)})} />
             <Input type="number" label="Reorder Point (Low Stock Alert)" value={formData.minStockLevel} onChange={e => setFormData({...formData, minStockLevel: parseInt(e.target.value)})} />
             <Input label="Location" value={formData.loc} onChange={e => setFormData({...formData, loc: e.target.value})} />
             <Input type="number" label="Price per Unit (MVR)" value={formData.price} onChange={e => setFormData({...formData, price: parseFloat(e.target.value)})} />
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <Button variant="outline" onClick={resetForm}>Cancel</Button>
            <Button onClick={handleSave}>{editingId ? 'Update Item' : 'Save to Inventory'}</Button>
          </div>
        </Card>
      )}

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200 flex flex-col md:flex-row gap-4 items-center">
        <div className="flex-1 w-full relative group">
          <Input 
            placeholder="Search by name, SKU, or Gov ID..." 
            icon={Search}
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="mb-0 pl-10 pr-12"
          />
          <button 
            onClick={() => setShowScanner(true)}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-gov-600 hover:bg-gov-50 rounded-md transition-all active:scale-95"
            title="Scan Barcode"
          >
            <Camera className="w-5 h-5" />
          </button>
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto">
          <Filter className="w-4 h-4 text-slate-400" />
          <select 
            className="flex h-10 w-full md:w-48 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gov-500"
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value)}
          >
            <option value="ALL">All Categories</option>
            {settings?.categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div className="text-xs text-slate-400 font-medium">
          Showing {filteredItems.length} of {items.length} items
        </div>
      </div>

      {showScanner && (
        <ScannerOverlay 
          onScan={handleScanSuccess} 
          onClose={() => setShowScanner(false)} 
          title="Inventory Barcode Scanner"
        />
      )}

      {/* Barcode Print Modal */}
      {itemToPrint && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
            <div className="p-4 border-b flex justify-between items-center no-print">
              <h3 className="font-bold text-lg">Print Inventory Labels</h3>
              <button onClick={() => setItemToPrint(null)} className="text-slate-500 hover:text-slate-800">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-4 bg-slate-50 border-b no-print">
               <div className="flex items-end gap-4">
                  <div className="flex-1">
                      <p className="text-sm font-bold text-slate-700">{itemToPrint.name}</p>
                      <p className="text-xs text-slate-500">Current Stock: {itemToPrint.quantity}</p>
                  </div>
                  <div>
                      <Input 
                        label="Quantity of Labels" 
                        type="number" 
                        value={printQty} 
                        onChange={e => setPrintQty(parseInt(e.target.value) || 0)} 
                        className="mb-0 w-32"
                      />
                  </div>
               </div>
            </div>

            <div className="flex-1 overflow-y-auto p-8 bg-slate-100 flex justify-center">
               <div className="printable-area label-print label-grid bg-white shadow-sm w-[80mm] p-4">
                  {Array.from({ length: printQty }).map((_, i) => (
                    <div key={i} className="label-item flex flex-col items-center justify-center p-2 border border-slate-200 rounded text-center h-[120px] overflow-hidden">
                       <p className="text-[10px] font-bold truncate w-full mb-1">{itemToPrint.name}</p>
                       
                       <div className="flex flex-col gap-1 items-center justify-center w-full transform scale-75 origin-center">
                          {itemToPrint.barcode && (
                             <div className="mb-1">
                               <Barcode value={itemToPrint.barcode} height={20} width={1} fontSize={10} displayValue={true} />
                             </div>
                          )}
                          <Barcode value={itemToPrint.sku} height={25} width={1.2} fontSize={10} displayValue={true} format="CODE128" />
                       </div>
                    </div>
                  ))}
               </div>
            </div>

            <div className="p-4 border-t flex justify-end gap-2 no-print bg-white">
               <Button variant="outline" onClick={() => setItemToPrint(null)}>Close</Button>
               <Button onClick={handlePrint} icon={Printer}>Print Labels</Button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden border border-slate-200">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">SKU</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Gov ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Item Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Category</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Stock</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Asset</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {filteredItems.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4 whitespace-nowrap text-xs font-mono font-bold text-slate-700">{item.sku}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-xs font-mono text-slate-500">{item.govId}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">{item.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                    {settings?.categories.find(c => c.id === item.category)?.name || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${item.quantity < item.minStockLevel ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                      {item.quantity}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {item.isAsset ? <span className="text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded font-bold uppercase tracking-tighter">Fixed Asset</span> : <span className="text-slate-300">Consumable</span>}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium flex justify-end gap-2">
                    <button onClick={() => openPrintModal(item)} className="text-slate-600 hover:text-slate-900 flex items-center" title="Print Labels">
                      <Printer className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleEdit(item)} className="text-gov-600 hover:text-gov-900 flex items-center gap-1">
                      <Edit2 className="w-4 h-4" /> Edit
                    </button>
                  </td>
                </tr>
              ))}
              {filteredItems.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-500 text-sm">
                    <div className="flex flex-col items-center gap-2">
                       <Search className="w-8 h-8 text-slate-200" />
                       <p>No items found matching your criteria.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
