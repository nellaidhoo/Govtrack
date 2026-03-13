
import React, { useState, useEffect, useMemo } from 'react';
import { AssetService, SettingsService, LogService, AuthService } from '../services/mockService';
import { Asset, ItemCategory, SystemSettings } from '../types';
import { Plus, Printer, X, Lock, Unlock, AlertCircle, Search, Filter, Edit2, Trash2, FileSpreadsheet, Camera } from 'lucide-react';
import { Card, Button, Input } from './SharedComponents';
import { ScannerOverlay } from './ScannerOverlay';
import QRCode from 'react-qr-code';

export const AssetView = () => {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedAssetForLabel, setSelectedAssetForLabel] = useState<Asset | null>(null);
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [isManualGovId, setIsManualGovId] = useState(false);
  const [govIdError, setGovIdError] = useState('');
  const [showScanner, setShowScanner] = useState(false);

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [conditionFilter, setConditionFilter] = useState('ALL');

  const [formData, setFormData] = useState({
    name: '',
    category: ItemCategory.IT_EQUIPMENT,
    condition: 'New' as Asset['condition'],
    purchaseDate: new Date().toISOString().split('T')[0],
    price: 0,
    location: '',
    assignedTo: '',
    govId: ''
  });

  useEffect(() => {
    loadAssets();
    SettingsService.get().then(setSettings);
  }, []);

  const loadAssets = async () => {
    const data = await AssetService.getAll();
    setAssets(data);
  };

  const filteredAssets = useMemo(() => {
    return assets.filter(asset => {
      const matchesSearch = 
        asset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        asset.govId.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesCategory = categoryFilter === 'ALL' || asset.category === categoryFilter;
      const matchesCondition = conditionFilter === 'ALL' || asset.condition === conditionFilter;
      
      return matchesSearch && matchesCategory && matchesCondition;
    });
  }, [assets, searchTerm, categoryFilter, conditionFilter]);

  const handleSave = async () => {
    setGovIdError('');
    let finalGovId = formData.govId;

    if (!isManualGovId && !editingId) {
      finalGovId = AssetService.generateGovId(
        new Date().getFullYear().toString(),
        formData.category,
        '001'
      );
    }

    // Validation for unique Gov ID
    const isUnique = await AssetService.isGovIdUnique(finalGovId, editingId || undefined);
    if (!isUnique) {
      setGovIdError('This GOV ID is already assigned to another asset.');
      return;
    }

    const assetData: any = {
      name: formData.name,
      category: formData.category,
      condition: formData.condition,
      purchaseDate: formData.purchaseDate,
      price: formData.price,
      location: formData.location,
      assignedTo: formData.assignedTo || undefined,
      govId: finalGovId
    };

    if (editingId) {
      await AssetService.update({ ...assetData, id: editingId });
    } else {
      await AssetService.add(assetData);
    }

    loadAssets();
    resetForm();
  };

  const handleEdit = (asset: Asset) => {
    setEditingId(asset.id);
    setIsManualGovId(true);
    setFormData({
      name: asset.name,
      category: asset.category as any,
      condition: asset.condition,
      purchaseDate: asset.purchaseDate,
      price: asset.price,
      location: asset.location,
      assignedTo: asset.assignedTo || '',
      govId: asset.govId
    });
    setShowAdd(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to remove this asset from the registry?')) {
      await AssetService.delete(id);
      loadAssets();
    }
  };

  const handleScanSuccess = (decodedText: string) => {
    // Check if scanned text is our JSON format or just a Gov ID
    let finalQuery = decodedText;
    try {
        const parsed = JSON.parse(decodedText);
        if (parsed.id) finalQuery = parsed.id;
    } catch (e) {
        // Not JSON, assume direct ID string
    }

    setSearchTerm(finalQuery);
    LogService.add({
      action: 'Asset Tag Scan',
      category: 'ASSETS',
      details: `User scanned asset security tag via camera: ${finalQuery}`,
      actor: AuthService.getCurrentUser()?.name || 'System'
    });
  };

  const resetForm = () => {
    setShowAdd(false);
    setEditingId(null);
    setGovIdError('');
    setFormData({ 
      name: '', 
      category: ItemCategory.IT_EQUIPMENT,
      condition: 'New',
      purchaseDate: new Date().toISOString().split('T')[0],
      price: 0, 
      location: '', 
      assignedTo: '',
      govId: ''
    });
    setIsManualGovId(false);
  };

  const handleExportCSV = () => {
    const headers = ['Gov ID', 'Asset Name', 'Category', 'Condition', 'Purchase Date', 'Price (MVR)', 'Location', 'Assigned To'];
    const rows = filteredAssets.map(a => [
      a.govId,
      a.name,
      a.category,
      a.condition,
      a.purchaseDate,
      a.price.toFixed(2),
      a.location,
      a.assignedTo || 'Unassigned'
    ]);
    
    const csvContent = [headers.join(','), ...rows.map(r => r.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', `asset_registry_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  const conditions = ['New', 'Good', 'Fair', 'Poor', 'Disposal'];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h2 className="text-2xl font-bold text-slate-800">Asset Management</h2>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExportCSV} icon={FileSpreadsheet}>Export CSV</Button>
          <Button onClick={() => setShowAdd(!showAdd)} icon={Plus}>New Asset</Button>
        </div>
      </div>

      {showAdd && (
        <Card className="mb-6 bg-slate-50 border-slate-200">
          <h3 className="font-bold mb-4">{editingId ? 'Edit Asset Record' : 'Register New Asset'}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">Asset Government ID</label>
                <div className="flex gap-2 items-start">
                   <div className="flex-1">
                      <Input 
                        value={isManualGovId ? formData.govId : (editingId ? formData.govId : 'Auto-Generated on Register')} 
                        onChange={e => setFormData({...formData, govId: e.target.value})}
                        disabled={!isManualGovId}
                        className={`mb-1 ${govIdError ? 'border-red-500' : ''}`}
                        placeholder="e.g. 263|2024|03|001|001"
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

            <Input label="Asset Name" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
              <select
                className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gov-500"
                value={formData.category}
                onChange={e => setFormData({ ...formData, category: e.target.value as any })}
              >
                <option value="">-- Select Category --</option>
                {settings?.categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Condition</label>
              <select
                className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gov-500"
                value={formData.condition}
                onChange={e => setFormData({ ...formData, condition: e.target.value as Asset['condition'] })}
              >
                {conditions.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <Input type="date" label="Purchase Date" value={formData.purchaseDate} onChange={e => setFormData({ ...formData, purchaseDate: e.target.value })} />
            <Input type="number" label="Price (MVR)" value={formData.price} onChange={e => setFormData({ ...formData, price: parseFloat(e.target.value) })} />
            <Input label="Location" value={formData.location} onChange={e => setFormData({ ...formData, location: e.target.value })} />
            <Input label="Assigned To (Optional)" value={formData.assignedTo} onChange={e => setFormData({ ...formData, assignedTo: e.target.value })} />
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <Button variant="outline" onClick={resetForm}>Cancel</Button>
            <Button onClick={handleSave}>{editingId ? 'Update Record' : 'Register Asset'}</Button>
          </div>
        </Card>
      )}

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200 flex flex-col md:flex-row gap-4 items-center">
        <div className="flex-1 w-full relative group">
          <Input 
            placeholder="Search assets by name or Gov ID..." 
            icon={Search}
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="mb-0 pl-10 pr-12"
          />
          <button 
            onClick={() => setShowScanner(true)}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-gov-600 hover:bg-gov-50 rounded-md transition-all active:scale-95"
            title="Scan Asset Tag"
          >
            <Camera className="w-5 h-5" />
          </button>
        </div>
        <div className="flex flex-col md:flex-row items-center gap-2 w-full md:w-auto">
          <div className="flex items-center gap-2 w-full md:w-auto">
            <Filter className="w-4 h-4 text-slate-400" />
            <select 
              className="flex h-10 w-full md:w-40 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gov-500"
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value)}
            >
              <option value="ALL">All Categories</option>
              {settings?.categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <select 
            className="flex h-10 w-full md:w-40 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gov-500"
            value={conditionFilter}
            onChange={e => setConditionFilter(e.target.value)}
          >
            <option value="ALL">All Conditions</option>
            {conditions.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>

      {showScanner && (
        <ScannerOverlay 
          onScan={handleScanSuccess} 
          onClose={() => setShowScanner(false)} 
          title="Asset Tag QR Scanner"
        />
      )}

      {/* Asset Label Modal */}
      {selectedAssetForLabel && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full overflow-hidden">
            <div className="p-4 border-b flex justify-between items-center no-print">
              <h3 className="font-bold text-lg">Print Asset Label</h3>
              <button onClick={() => setSelectedAssetForLabel(null)} className="text-slate-500 hover:text-slate-800">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-8 flex justify-center bg-slate-100">
               <div className="printable-area label-print bg-white border-2 border-black w-[80mm] h-auto min-h-[50mm] p-4 flex flex-col justify-between relative shadow-sm">
                  <div className="text-center border-b-2 border-black pb-2 mb-2">
                     <h2 className="font-bold text-sm uppercase tracking-wider leading-tight">{settings?.officeName || 'GOV PROPERTY'}</h2>
                     <p className="text-[8px] uppercase text-slate-600">Fixed Asset Registry</p>
                  </div>
                  
                  <div className="flex flex-col gap-2 items-center flex-1">
                     <div className="bg-white p-1">
                        <QRCode 
                          value={JSON.stringify({
                            id: selectedAssetForLabel.govId,
                            name: selectedAssetForLabel.name,
                            date: selectedAssetForLabel.purchaseDate,
                            price: selectedAssetForLabel.price
                          })} 
                          size={80}
                          level="M"
                        />
                     </div>
                     <div className="w-full text-center space-y-1">
                        <div>
                          <span className="block text-[8px] font-bold text-slate-500 uppercase">Gov Asset ID</span>
                          <span className="font-mono font-bold text-base leading-none">{selectedAssetForLabel.govId}</span>
                        </div>
                        <div>
                          <span className="block text-[8px] font-bold text-slate-500 uppercase">Item Description</span>
                          <span className="font-semibold text-xs leading-tight block truncate">{selectedAssetForLabel.name}</span>
                        </div>
                        <div className="flex justify-between pt-1 text-[10px]">
                           <div>
                              <span className="block text-[8px] font-bold text-slate-500 uppercase">Purchased</span>
                              <span>{new Date(selectedAssetForLabel.purchaseDate).toLocaleDateString()}</span>
                           </div>
                           <div className="text-right">
                              <span className="block text-[8px] font-bold text-slate-500 uppercase">Value</span>
                              <span>MVR {selectedAssetForLabel.price.toFixed(2)}</span>
                           </div>
                        </div>
                     </div>
                  </div>

                  <div className="mt-2 text-center">
                     <p className="text-[8px] font-bold text-slate-400 uppercase">Security Tag - Do not remove</p>
                  </div>
               </div>
            </div>

            <div className="p-4 border-t flex justify-end gap-2 no-print bg-slate-50">
               <Button variant="outline" onClick={() => setSelectedAssetForLabel(null)}>Close</Button>
               <Button onClick={handlePrint} icon={Printer}>Print Label</Button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden border border-slate-200">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Gov ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Asset Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Category</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Condition</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Price (MVR)</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Location</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {filteredAssets.map((asset) => (
                <tr key={asset.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4 whitespace-nowrap text-xs font-mono text-slate-600">{asset.govId}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">{asset.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                    {settings?.categories.find(c => c.id === asset.category)?.name || asset.category}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                      ${asset.condition === 'New' ? 'bg-green-100 text-green-800' : 
                        asset.condition === 'Good' ? 'bg-blue-100 text-blue-800' : 
                        asset.condition === 'Fair' ? 'bg-yellow-100 text-yellow-800' : 
                        'bg-red-100 text-red-800'}`}>
                      {asset.condition}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{asset.price.toFixed(2)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                    {asset.location}
                    {asset.assignedTo && <div className="text-xs text-slate-400">({asset.assignedTo})</div>}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                     <div className="flex justify-end gap-3">
                        <button 
                          onClick={() => setSelectedAssetForLabel(asset)}
                          className="text-slate-500 hover:text-slate-700"
                          title="Print Label"
                        >
                          <Printer className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleEdit(asset)}
                          className="text-gov-600 hover:text-gov-900"
                          title="Edit Record"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDelete(asset.id)}
                          className="text-red-500 hover:text-red-700"
                          title="Delete Record"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                     </div>
                  </td>
                </tr>
              ))}
              {filteredAssets.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-500 text-sm">
                    <div className="flex flex-col items-center gap-2">
                       <Search className="w-8 h-8 text-slate-200" />
                       <p>No assets found in the registry for this criteria.</p>
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
