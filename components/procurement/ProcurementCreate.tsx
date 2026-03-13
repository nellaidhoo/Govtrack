
import React, { useState, useRef, useEffect } from 'react';
import { User, InventoryItem } from '../../types';
import { Button, Card, Input, SignaturePad } from '../SharedComponents';
import { Plus, List, FileText, Barcode, Search, AlertCircle, ShoppingBag, Wrench, Camera } from 'lucide-react';
import { ScannerOverlay } from '../ScannerOverlay';

interface ProcurementCreateProps {
  user: User;
  inventory: InventoryItem[];
  onCancel: () => void;
  onSubmit: (data: any) => void;
}

export const ProcurementCreate: React.FC<ProcurementCreateProps> = ({ user, inventory, onCancel, onSubmit }) => {
  const [requestType, setRequestType] = useState<'GOODS' | 'SERVICE'>('GOODS');
  const [section, setSection] = useState(user.department);
  const [requiredDate, setRequiredDate] = useState('');
  const [remarks, setRemarks] = useState('');
  
  // Item Entry State
  const [itemEntryMode, setItemEntryMode] = useState<'INVENTORY' | 'CUSTOM' | 'BARCODE'>('INVENTORY');
  const [selectedInventoryId, setSelectedInventoryId] = useState('');
  const [newItemDesc, setNewItemDesc] = useState('');
  const [newItemQty, setNewItemQty] = useState(1);
  const [barcodeInput, setBarcodeInput] = useState('');
  const [scanStatus, setScanStatus] = useState<{msg: string, type: 'success' | 'error' | 'neutral'}>({msg: '', type: 'neutral'});
  const [showScanner, setShowScanner] = useState(false);
  
  // Search & Suggestion States
  const [searchQuery, setSearchQuery] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<InventoryItem[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [requestItems, setRequestItems] = useState<{itemId?: string, description: string, quantity: number}[]>([]);
  const [signature, setSignature] = useState(user.signatureUrl || '');

  const sections = ['Administration', 'Finance', 'Human Resources', 'IT / Technical', 'Operations', 'Logistics', 'Executive Office'];

  // Handle Search Filtering
  useEffect(() => {
    if (searchQuery.trim().length > 0) {
      const filtered = inventory.filter(item => 
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.sku.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setSuggestions(filtered);
    } else {
      setSuggestions([]);
    }
  }, [searchQuery, inventory]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleBarcodeScan = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const code = barcodeInput.trim();
      processCode(code);
    }
  };

  const handleCameraScanSuccess = (code: string) => {
    processCode(code);
  };

  const processCode = (code: string) => {
    if (!code) return;

    const foundItem = inventory.find(i => 
      (i.barcode && i.barcode === code) || 
      (i.sku && i.sku.toLowerCase() === code.toLowerCase())
    );

    if (foundItem) {
      setSelectedInventoryId(foundItem.id);
      setNewItemDesc(foundItem.name);
      setNewItemQty(1);
      setScanStatus({ msg: `Found: ${foundItem.name} (Stock: ${foundItem.quantity})`, type: 'success' });
      setBarcodeInput('');
    } else {
      setScanStatus({ msg: `Item not found for code: ${code}`, type: 'error' });
      setSelectedInventoryId('');
      setNewItemDesc('');
    }
  };

  const selectInventoryItem = (item: InventoryItem) => {
    setSelectedInventoryId(item.id);
    setNewItemDesc(item.name);
    setSearchQuery(item.name);
    setIsDropdownOpen(false);
  };

  const addItemToRequest = () => {
    if(!newItemDesc) return;
    
    setRequestItems([...requestItems, { 
        description: newItemDesc, 
        quantity: newItemQty,
        itemId: (itemEntryMode === 'INVENTORY' || itemEntryMode === 'BARCODE' || (itemEntryMode === 'CUSTOM' && selectedInventoryId)) ? selectedInventoryId : undefined
    }]);
    
    // Reset fields
    setNewItemDesc('');
    setNewItemQty(1);
    setSelectedInventoryId('');
    setBarcodeInput('');
    setSearchQuery('');
    setScanStatus({ msg: '', type: 'neutral' });
  };

  const handleSubmit = () => {
    onSubmit({
      requestType,
      section,
      requiredDate,
      remarks,
      items: requestItems,
      requesterSignature: signature
    });
  };

  return (
    <Card title={`New ${requestType === 'GOODS' ? 'Goods' : 'Service'} Requisition Form (GSRF)`}>
      <div className="space-y-6 max-w-3xl">
        
        {/* Request Type Selector */}
        <div className="flex bg-slate-100 p-1 rounded-lg w-fit">
            <button 
                onClick={() => { setRequestType('GOODS'); setRequestItems([]); }}
                className={`flex items-center gap-2 px-6 py-2 rounded-md text-sm font-bold transition-all ${requestType === 'GOODS' ? 'bg-white text-gov-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
                <ShoppingBag className="w-4 h-4" /> Goods Request
            </button>
            <button 
                onClick={() => { setRequestType('SERVICE'); setRequestItems([]); }}
                className={`flex items-center gap-2 px-6 py-2 rounded-md text-sm font-bold transition-all ${requestType === 'SERVICE' ? 'bg-white text-gov-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
                <Wrench className="w-4 h-4" /> Service Request
            </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
           <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Select Section</label>
              <select 
                className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gov-500"
                value={section}
                onChange={e => setSection(e.target.value)}
              >
                <option value="">-- Select Section --</option>
                {sections.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
           </div>
           <Input 
             type="date" 
             label="Required Date" 
             value={requiredDate} 
             onChange={e => setRequiredDate(e.target.value)} 
           />
        </div>

        <div>
           <label className="block text-sm font-medium text-slate-700 mb-1">
               {requestType === 'GOODS' ? 'Remarks / Purpose of Use' : 'Service Requirements / Maintenance Needs'}
           </label>
           <textarea 
             className="flex w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-gov-500 h-24 resize-none"
             placeholder={requestType === 'GOODS' ? "Enter use case or details..." : "Describe the problem or maintenance work required..."}
             value={remarks}
             onChange={e => setRemarks(e.target.value)}
           />
        </div>

        <div className="bg-slate-50 p-4 rounded-md border border-slate-200">
          <div className="flex justify-between items-center mb-3">
             <h3 className="text-sm font-medium">{requestType === 'GOODS' ? 'Add Items' : 'Requested Services'}</h3>
             {requestType === 'GOODS' && (
                <button 
                    onClick={() => { setItemEntryMode('BARCODE'); setShowScanner(true); }}
                    className="flex items-center gap-1.5 text-xs font-bold text-gov-600 bg-gov-50 px-2 py-1 rounded hover:bg-gov-100 transition-colors"
                >
                    <Camera className="w-3.5 h-3.5" /> Start Scanning
                </button>
             )}
          </div>
          
          {requestType === 'GOODS' && (
              <div className="flex flex-wrap gap-4 mb-4 text-sm">
                  <label className="flex items-center gap-2 cursor-pointer">
                      <input 
                          type="radio" 
                          name="itemMode"
                          checked={itemEntryMode === 'INVENTORY'}
                          onChange={() => {
                              setItemEntryMode('INVENTORY');
                              setNewItemDesc('');
                              setSearchQuery('');
                              setSelectedInventoryId('');
                          }}
                          className="text-gov-600 focus:ring-gov-500"
                      />
                      <span className="font-medium text-slate-700 flex items-center gap-1"><List className="w-4 h-4"/> Select from Inventory</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                      <input 
                          type="radio" 
                          name="itemMode"
                          checked={itemEntryMode === 'BARCODE'}
                          onChange={() => {
                              setItemEntryMode('BARCODE');
                              setNewItemDesc('');
                              setSelectedInventoryId('');
                          }}
                          className="text-gov-600 focus:ring-gov-500"
                      />
                      <span className="font-medium text-slate-700 flex items-center gap-1"><Barcode className="w-4 h-4"/> Scan Barcode</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                      <input 
                          type="radio" 
                          name="itemMode"
                          checked={itemEntryMode === 'CUSTOM'}
                          onChange={() => {
                              setItemEntryMode('CUSTOM');
                              setSelectedInventoryId('');
                              setNewItemDesc('');
                              setSearchQuery('');
                          }}
                          className="text-gov-600 focus:ring-gov-500"
                      />
                      <span className="font-medium text-slate-700 flex items-center gap-1"><FileText className="w-4 h-4"/> Custom / Ad-hoc Item</span>
                  </label>
              </div>
          )}

          <div className="flex gap-2 mb-2 items-start relative">
            <div className="flex-1 relative" ref={dropdownRef}>
               {/* Searchable Inventory Selection (Goods Only) */}
               {requestType === 'GOODS' && (itemEntryMode === 'INVENTORY' || itemEntryMode === 'CUSTOM') && (
                  <div className="relative">
                    <div className="relative">
                       <input 
                          className="flex h-10 w-full rounded-md border border-slate-300 bg-white pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gov-500"
                          placeholder={itemEntryMode === 'INVENTORY' ? "Search inventory item..." : "Type custom item name..."}
                          value={searchQuery}
                          onChange={(e) => {
                             setSearchQuery(e.target.value);
                             setIsDropdownOpen(true);
                             if (itemEntryMode === 'CUSTOM') {
                                setNewItemDesc(e.target.value);
                                if(!e.target.value) setSelectedInventoryId('');
                             }
                          }}
                          onFocus={() => setIsDropdownOpen(true)}
                       />
                       <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    </div>

                    {isDropdownOpen && suggestions.length > 0 && (
                       <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-md shadow-lg max-h-60 overflow-auto">
                          {suggestions.map((item) => (
                             <button
                                key={item.id}
                                className="w-full text-left px-3 py-2 hover:bg-gov-50 transition-colors border-b last:border-0"
                                onClick={() => selectInventoryItem(item)}
                             >
                                <div className="flex justify-between items-start">
                                   <div>
                                      <p className="text-sm font-semibold text-slate-900">{item.name}</p>
                                      <p className="text-xs text-slate-500 font-mono">{item.sku}</p>
                                   </div>
                                </div>
                             </button>
                          ))}
                       </div>
                    )}
                  </div>
               )}
               
               {/* Barcode Logic (Goods Only) */}
               {requestType === 'GOODS' && itemEntryMode === 'BARCODE' && (
                  <div>
                    <input 
                        className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gov-500 mb-2"
                        placeholder="Click here and scan barcode or type SKU + Enter"
                        value={barcodeInput}
                        onChange={(e) => setBarcodeInput(e.target.value)}
                        onKeyDown={handleBarcodeScan}
                        autoFocus
                    />
                  </div>
               )}

               {/* Service Request Entry */}
               {requestType === 'SERVICE' && (
                   <input 
                        className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gov-500"
                        placeholder="Enter specific service task (e.g., Replace AC Filters)"
                        value={newItemDesc}
                        onChange={(e) => setNewItemDesc(e.target.value)}
                   />
               )}
            </div>

            <Input 
              type="number" 
              placeholder="Qty" 
              value={newItemQty} 
              onChange={e => setNewItemQty(parseInt(e.target.value) || 1)} 
              className="w-24 mb-0"
              min={1}
            />
            <Button onClick={addItemToRequest} size="sm" icon={Plus} type="button" className="h-10 mt-0" disabled={!newItemDesc}>Add</Button>
          </div>
          
          {scanStatus.msg && (
             <p className={`text-xs font-bold mb-3 flex items-center gap-1 ${scanStatus.type === 'success' ? 'text-green-600' : 'text-red-500'}`}>
                <AlertCircle className="w-3 h-3" /> {scanStatus.msg}
             </p>
          )}

          <ul className="text-sm space-y-1 mt-3">
            {requestItems.map((item, idx) => (
              <li key={idx} className="flex justify-between border-b border-slate-200 py-2 items-center">
                <div className="flex items-center gap-2 text-slate-800 font-medium">
                   {item.description}
                </div>
                <div className="flex items-center gap-4">
                   <span className="font-mono bg-slate-100 px-2 py-0.5 rounded border border-slate-200 text-slate-700 font-bold">Qty: {item.quantity}</span>
                   <button 
                      onClick={() => setRequestItems(requestItems.filter((_, i) => i !== idx))}
                      className="text-slate-400 hover:text-red-500 transition-colors"
                   >
                      <Plus className="w-4 h-4 rotate-45" />
                   </button>
                </div>
              </li>
            ))}
            {requestItems.length === 0 && <li className="text-slate-400 italic text-center py-4 bg-white rounded border border-dashed border-slate-300">No items added to the request yet.</li>}
          </ul>
        </div>

        {showScanner && (
           <ScannerOverlay 
              onScan={handleCameraScanSuccess} 
              onClose={() => setShowScanner(false)} 
              title="Item Barcode Scanner"
           />
        )}

        <SignaturePad 
            onChange={setSignature} 
            label="Requester Signature" 
            initialValue={user.signatureUrl} 
        />

        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={onCancel}>Cancel</Button>
          <Button disabled={requestItems.length === 0 || !signature} onClick={handleSubmit}>Submit Request</Button>
        </div>
      </div>
    </Card>
  );
};
