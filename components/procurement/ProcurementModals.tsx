
import React, { useState } from 'react';
import { Button, Input } from '../SharedComponents';
import { EvaluationMethod, EvaluationType, ItemCategory, Vendor, InventoryItem, CompletionCertificate } from '../../types';
import { Wrench, CheckCircle2, Award, Users, Globe, Clock } from 'lucide-react';

// --- Portal Publication Modal ---
interface PublishPortalModalProps {
    onClose: () => void;
    onConfirm: (deadline: string) => void;
}
export const PublishPortalModal: React.FC<PublishPortalModalProps> = ({ onClose, onConfirm }) => {
    const [deadline, setDeadline] = useState(new Date(Date.now() + 86400000 * 7).toISOString().split('T')[0]);

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white p-6 rounded-lg w-full max-w-md shadow-2xl">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-gov-800"><Globe className="w-5 h-5"/> Publish to Vendor Portal</h3>
                <p className="text-sm text-slate-500 mb-6">This invitation will be visible to all verified vendors. Set a submission deadline.</p>
                <div className="mb-6">
                    <Input 
                        label="Electronic Bid Deadline" 
                        type="datetime-local" 
                        value={deadline} 
                        onChange={e => setDeadline(e.target.value)} 
                    />
                    <div className="flex items-center gap-2 text-[10px] text-amber-600 font-bold bg-amber-50 p-2 rounded">
                        <Clock className="w-3.5 h-3.5" /> NO LATE SUBMISSIONS ARE ACCEPTED BY THE PORTAL
                    </div>
                </div>
                <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={onClose}>Cancel</Button>
                    <Button onClick={() => onConfirm(deadline)}>Publish RFQ Now</Button>
                </div>
            </div>
        </div>
    );
};

// --- Final Certificate Modal ---
interface FinalCertificateModalProps {
    onClose: () => void;
    onConfirm: (data: Omit<CompletionCertificate, 'certificateNumber' | 'managerName' | 'managerSignature' | 'awardedDate' | 'documentDate'>) => void;
}
export const FinalCertificateModal: React.FC<FinalCertificateModalProps> = ({ onClose, onConfirm }) => {
    const [data, setData] = useState({
        agreementNumber: '',
        startedDate: '',
        completionDate: new Date().toISOString().split('T')[0],
        totalPriceInWords: '',
        duration: '',
        additionalNotes: ''
    });

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
            <div className="bg-white p-6 rounded-lg w-full max-w-2xl shadow-2xl my-8">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-gov-800"><Award className="w-5 h-5"/> Finalize Completion Certificate</h3>
                <p className="text-xs text-slate-500 mb-6">Complete the following fields to generate the formal vendor completion certificate.</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input 
                        label="Agreement / Contract #" 
                        value={data.agreementNumber} 
                        onChange={e => setData({...data, agreementNumber: e.target.value})} 
                        placeholder="e.g. CON/2024/045"
                    />
                    <Input 
                        label="Total Price in Words" 
                        value={data.totalPriceInWords} 
                        onChange={e => setData({...data, totalPriceInWords: e.target.value})} 
                        placeholder="e.g. Ten Thousand MVR Only"
                    />
                    <Input 
                        type="date" 
                        label="Started Date" 
                        value={data.startedDate} 
                        onChange={e => setData({...data, startedDate: e.target.value})} 
                    />
                    <Input 
                        type="date" 
                        label="Completion Date" 
                        value={data.completionDate} 
                        onChange={e => setData({...data, completionDate: e.target.value})} 
                    />
                    <Input 
                        label="Work Duration" 
                        value={data.duration} 
                        onChange={e => setData({...data, duration: e.target.value})} 
                        placeholder="e.g. 15 Days"
                    />
                </div>
                
                <div className="mt-4">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Additional Notes</label>
                    <textarea 
                        className="w-full border rounded-md p-3 text-sm h-24 focus:ring-2 focus:ring-gov-500 outline-none"
                        placeholder="Any other observations or notes for the contractor..."
                        value={data.additionalNotes}
                        onChange={e => setData({...data, additionalNotes: e.target.value})}
                    />
                </div>

                <div className="flex justify-end gap-2 mt-8">
                    <Button variant="outline" onClick={onClose}>Cancel</Button>
                    <Button onClick={() => onConfirm(data)} disabled={!data.agreementNumber || !data.totalPriceInWords}>Generate Certificate</Button>
                </div>
            </div>
        </div>
    );
};

// --- Assessment Modal (Service) ---
interface AssessmentModalProps {
    onClose: () => void;
    onConfirm: (data: { findings: string; inHouseRepair: boolean }) => void;
}
export const AssessmentModal: React.FC<AssessmentModalProps> = ({ onClose, onConfirm }) => {
    const [findings, setFindings] = useState('');
    const [inHouseRepair, setInHouseRepair] = useState(false);

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white p-6 rounded-lg w-full max-w-md shadow-2xl">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><Wrench className="w-5 h-5 text-gov-600"/> Service Assessment</h3>
                <div className="mb-4">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Assessment Findings</label>
                    <textarea 
                        className="w-full border rounded-md p-3 text-sm h-32 focus:ring-2 focus:ring-gov-500 outline-none"
                        placeholder="Describe the condition found and required work..."
                        value={findings}
                        onChange={e => setFindings(e.target.value)}
                    />
                </div>
                <label className="flex items-center gap-2 cursor-pointer mb-6 group">
                    <input 
                        type="checkbox" 
                        checked={inHouseRepair} 
                        onChange={e => setInHouseRepair(e.target.checked)}
                        className="w-4 h-4 rounded text-gov-600 focus:ring-gov-500"
                    />
                    <span className="text-sm font-medium text-slate-700 group-hover:text-slate-900 transition-colors">In-house repair possible (skip procurement)</span>
                </label>
                <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={onClose}>Cancel</Button>
                    <Button onClick={() => onConfirm({ findings, inHouseRepair })} disabled={!findings}>Submit Assessment</Button>
                </div>
            </div>
        </div>
    );
};

// --- Service Completion Modal ---
interface ServiceCompletionModalProps {
    onClose: () => void;
    onConfirm: (data: { remarks: string; cost: number }) => void;
}
export const ServiceCompletionModal: React.FC<ServiceCompletionModalProps> = ({ onClose, onConfirm }) => {
    const [remarks, setRemarks] = useState('');
    const [cost, setCost] = useState(0);

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white p-6 rounded-lg w-full max-w-md shadow-2xl">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><CheckCircle2 className="w-5 h-5 text-green-600"/> Service Completion Report</h3>
                <div className="space-y-4">
                    <Input label="Final Cost (MVR)" type="number" value={cost} onChange={e => setCost(parseFloat(e.target.value) || 0)} />
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Completion Remarks</label>
                        <textarea 
                            className="w-full border rounded-md p-3 text-sm h-32"
                            placeholder="Detail what was completed and any future maintenance advice..."
                            value={remarks}
                            onChange={e => setRemarks(e.target.value)}
                        />
                    </div>
                </div>
                <div className="flex justify-end gap-2 mt-6">
                    <Button variant="outline" onClick={onClose}>Cancel</Button>
                    <Button onClick={() => onConfirm({ remarks, cost })} disabled={!remarks}>Verify & Complete</Button>
                </div>
            </div>
        </div>
    );
};

// --- Issue Stock Modal ---
interface IssueStockModalProps {
  onClose: () => void;
  onConfirm: (details: { receiverName: string; receiverDept: string; remarks: string }) => void;
}
export const IssueStockModal: React.FC<IssueStockModalProps> = ({ onClose, onConfirm }) => {
  const [details, setDetails] = useState({ receiverName: '', receiverDept: '', remarks: '' });

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg w-full max-w-md">
        <h3 className="text-lg font-bold mb-4">Issue Stock Details</h3>
        <Input label="Receiver Name" value={details.receiverName} onChange={e => setDetails({ ...details, receiverName: e.target.value })} />
        <Input label="Receiver Department" value={details.receiverDept} onChange={e => setDetails({ ...details, receiverDept: e.target.value })} />
        <Input label="Remarks / Purpose" value={details.remarks} onChange={e => setDetails({ ...details, remarks: e.target.value })} />
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleConfirm} disabled={!details.receiverName}>Confirm Issue</Button>
        </div>
      </div>
    </div>
  );
  function handleConfirm() { onConfirm(details); }
};

// --- Budget Modal ---
interface BudgetModalProps {
  requestType?: 'GOODS' | 'SERVICE';
  onClose: () => void;
  onConfirm: (code: string) => void;
}
export const BudgetModal: React.FC<BudgetModalProps> = ({ requestType = 'GOODS', onClose, onConfirm }) => {
  const [budgetCode, setBudgetCode] = useState('');
  const isService = requestType === 'SERVICE';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg w-full max-w-sm shadow-xl">
        <h3 className="text-lg font-bold mb-4">Budget Confirmation</h3>
        <p className="text-sm text-slate-600 mb-4">Please enter the confirmed Budget Code to finalize this {isService ? 'Service Order' : 'Purchase Order'}.</p>
        <Input label="Budget Code" value={budgetCode} onChange={e => setBudgetCode(e.target.value)} placeholder="e.g. BGT-2024-001" />
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={() => onConfirm(budgetCode)} disabled={!budgetCode}>Approve & Issue {isService ? 'SO' : 'PO'}</Button>
        </div>
      </div>
    </div>
  );
};

// --- Single Source Modal ---
interface SingleSourceModalProps {
  vendors: Vendor[];
  onClose: () => void;
  onConfirm: (data: { vendorName: string; estimatedPrice: number; justification: string }) => void;
}
export const SingleSourceModal: React.FC<SingleSourceModalProps> = ({ vendors, onClose, onConfirm }) => {
  const [data, setData] = useState({ justification: '', vendorName: '', estimatedPrice: 0 });

  const handleVendorSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedName = e.target.value;
    if (selectedName) {
      setData({ ...data, vendorName: selectedName });
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg w-full max-w-lg shadow-2xl">
        <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><Users className="w-5 h-5 text-gov-600"/> Single Source Procurement</h3>
        <p className="text-sm text-slate-600 mb-4">Skip price evaluation for special cases. This requires formal justification.</p>
        
        <div className="mb-4">
            <label className="block text-sm font-medium text-slate-700 mb-1">Pick Registered Vendor</label>
            <select 
                className="w-full border border-slate-300 rounded-md p-2 text-sm bg-white focus:ring-2 focus:ring-gov-500 outline-none"
                onChange={handleVendorSelect}
                value={vendors.some(v => v.name === data.vendorName) ? data.vendorName : ""}
            >
                <option value="">-- Choose from Database --</option>
                {vendors.map(v => (
                    <option key={v.id} value={v.name}>{v.name}</option>
                ))}
            </select>
            <p className="text-[10px] text-slate-400 mt-1 italic">Or enter name manually below</p>
        </div>

        <Input 
          label="Vendor Name (Selected or Manual)" 
          value={data.vendorName} 
          onChange={e => setData({...data, vendorName: e.target.value})} 
          placeholder="Type company name..."
        />
        <Input 
          type="number" 
          label="Total Estimated Price (MVR)" 
          value={data.estimatedPrice} 
          onChange={e => setData({...data, estimatedPrice: parseFloat(e.target.value) || 0})} 
        />
        <div className="mb-4">
           <label className="block text-sm font-medium text-slate-700 mb-1">Justification</label>
           <textarea 
             className="w-full border border-slate-300 p-2 rounded-md text-sm h-24 focus:ring-2 focus:ring-gov-500 outline-none"
             placeholder="Explain why only this vendor can provide the goods/services..."
             value={data.justification}
             onChange={e => setData({...data, justification: e.target.value})}
           />
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={() => onConfirm(data)} disabled={!data.justification || !data.vendorName}>Save Single Source</Button>
        </div>
      </div>
    </div>
  );
};

// --- Evaluation Modal ---
interface EvaluationModalProps {
  vendors: Vendor[];
  onClose: () => void;
  onConfirm: (data: { method: EvaluationMethod; type: EvaluationType; vendors: any[] }) => void;
}
export const EvaluationModal: React.FC<EvaluationModalProps> = ({ vendors, onClose, onConfirm }) => {
  const [evalType, setEvalType] = useState<EvaluationType>('FORM');
  const [evalData, setEvalData] = useState({
    method: EvaluationMethod.EMAIL,
    vendors: [
      { vendorName: '', quoteNumber: '', quoteDate: '', price: 0, selected: false },
      { vendorName: '', quoteNumber: '', quoteDate: '', price: 0, selected: false },
      { vendorName: '', quoteNumber: '', quoteDate: '', price: 0, selected: false }
    ]
  });

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg font-bold mb-4">Price Evaluation Form</h3>
        
        <div className="grid grid-cols-2 gap-6 mb-6">
          <div>
            <label className="block text-sm font-medium mb-1">Evaluation Method</label>
            <select 
              className="w-full border p-2 rounded"
              value={evalData.method}
              onChange={e => setEvalData({...evalData, method: e.target.value as EvaluationMethod})}
            >
              {Object.values(EvaluationMethod).map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          <div>
             <label className="block text-sm font-medium mb-1">Evaluation Type</label>
             <div className="flex gap-2">
               <button 
                 className={`px-3 py-2 text-sm rounded border ${evalType === 'FORM' ? 'bg-gov-100 border-gov-500 text-gov-800' : 'bg-white'}`}
                 onClick={() => setEvalType('FORM')}
               >
                 Form Based (Item Matrix)
               </button>
               <button 
                 className={`px-3 py-2 text-sm rounded border ${evalType === 'QUOTATION' ? 'bg-gov-100 border-gov-500 text-gov-800' : 'bg-white'}`}
                 onClick={() => setEvalType('QUOTATION')}
               >
                 Quotation Based (Totals)
               </button>
             </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-4">
          {evalData.vendors.map((v, idx) => (
            <div key={idx} className="border p-3 rounded bg-slate-50 relative">
              <div className="absolute top-2 right-2 text-xs font-bold text-slate-300">#{idx+1}</div>
              <h4 className="font-bold text-xs mb-2">Vendor Details</h4>
              
              <div className="mb-2">
                <label className="block text-xs font-medium text-slate-500 mb-1">Select Registered Vendor</label>
                <select 
                    className="w-full border text-sm p-1 rounded mb-1"
                    onChange={(e) => {
                        const selected = vendors.find(ven => ven.name === e.target.value);
                        if(selected) {
                            const newVendors = evalData.vendors.map((vend, i) => i === idx ? {...vend, vendorName: selected.name} : vend);
                            setEvalData({...evalData, vendors: newVendors});
                        }
                    }}
                >
                    <option value="">-- Manual Entry --</option>
                    {vendors.map(ven => <option key={ven.id} value={ven.name}>{ven.name}</option>)}
                </select>
              </div>

              <Input 
                placeholder="Vendor Name" 
                value={v.vendorName} 
                onChange={e => {
                    const newVendors = evalData.vendors.map((vend, i) => i === idx ? {...vend, vendorName: e.target.value} : vend);
                    setEvalData({...evalData, vendors: newVendors});
                }}
                className="mb-2"
              />
              {evalType === 'QUOTATION' && (
                <>
                  <Input 
                    placeholder="Quote Number" 
                    value={v.quoteNumber} 
                    onChange={e => {
                      const newVendors = evalData.vendors.map((vend, i) => i === idx ? {...vend, quoteNumber: e.target.value} : vend);
                      setEvalData({...evalData, vendors: newVendors});
                    }}
                    className="mb-2"
                  />
                  <Input 
                    type="date"
                    placeholder="Quote Date" 
                    value={v.quoteDate} 
                    onChange={e => {
                      const newVendors = evalData.vendors.map((vend, i) => i === idx ? {...vend, quoteDate: e.target.value} : vend);
                      setEvalData({...evalData, vendors: newVendors});
                    }}
                    className="mb-2"
                  />
                </>
              )}
              <Input 
                type="number"
                label={evalType === 'FORM' ? "Unit/Total Rate (MVR)" : "Total Quotation Price (MVR)"}
                value={v.price} 
                onChange={e => {
                  const newVendors = evalData.vendors.map((vend, i) => i === idx ? {...vend, price: parseFloat(e.target.value) || 0} : vend);
                  setEvalData({...evalData, vendors: newVendors});
                }}
              />
            </div>
          ))}
        </div>
        
        <div className="text-xs text-slate-500 mb-4 bg-yellow-50 p-2 rounded">
          Note: The system will automatically highlight the vendor with the lowest price as the recommended option.
        </div>

        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={() => onConfirm({ method: evalData.method, type: evalType, vendors: evalData.vendors })}>Save Evaluation</Button>
        </div>
      </div>
    </div>
  );
};

// --- Receive Goods Modal ---
interface ReceiveGoodsModalProps {
  initialItems: any[];
  inventory: InventoryItem[];
  onClose: () => void;
  onConfirm: (items: any[]) => void;
}
export const ReceiveGoodsModal: React.FC<ReceiveGoodsModalProps> = ({ initialItems, inventory, onClose, onConfirm }) => {
  const [items, setItems] = useState(initialItems);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
          <h3 className="text-lg font-bold mb-4">Receive Goods & Update Inventory</h3>
          <table className="w-full text-sm mb-6">
              <thead className="bg-slate-50 text-left">
                  <tr>
                      <th className="p-2 border">Item Description</th>
                      <th className="p-2 border w-24">Ord Qty</th>
                      <th className="p-2 border w-24">Rec Qty</th>
                      <th className="p-2 border">Inventory Mapping</th>
                  </tr>
              </thead>
              <tbody>
                  {items.map((item, idx) => (
                      <tr key={idx} className="border-b">
                          <td className="p-2">{item.description}</td>
                          <td className="p-2">{item.orderedQty}</td>
                          <td className="p-2">
                              <input 
                                  type="number" 
                                  className="w-16 border rounded p-1"
                                  value={item.receivedQty}
                                  onChange={(e) => {
                                      const newData = [...items];
                                      newData[idx].receivedQty = parseInt(e.target.value) || 0;
                                      setItems(newData);
                                  }}
                              />
                          </td>
                          <td className="p-2 space-y-2">
                              <select 
                                  className="w-full border rounded p-1"
                                  value={item.inventoryAction}
                                  onChange={(e) => {
                                      const newData = [...items];
                                      newData[idx].inventoryAction = e.target.value;
                                      setItems(newData);
                                  }}
                              >
                                  <option value="NEW">Create New Item: {item.description}</option>
                                  {inventory.map(inv => (
                                      <option key={inv.id} value={inv.id}>Update Existing: {inv.name}</option>
                                  ))}
                              </select>
                              
                              {item.inventoryAction === 'NEW' && (
                                  <div className="flex gap-2">
                                      <select
                                          className="w-full border rounded p-1 text-xs"
                                          value={item.newCategory}
                                          onChange={(e) => {
                                              const newData = [...items];
                                              newData[idx].newCategory = e.target.value;
                                              setItems(newData);
                                          }}
                                      >
                                          <option value="c1">Stationery</option>
                                          <option value="c2">IT Equipment</option>
                                      </select>
                                      <input 
                                          placeholder="Location"
                                          className="w-full border rounded p-1 text-xs"
                                          value={item.newLocation}
                                          onChange={(e) => {
                                              const newData = [...items];
                                              newData[idx].newLocation = e.target.value;
                                              setItems(newData);
                                          }}
                                      />
                                  </div>
                              )}
                          </td>
                      </tr>
                  ))}
              </tbody>
          </table>
          <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={onClose}>Cancel</Button>
              <Button onClick={() => onConfirm(items)}>Confirm Receipt</Button>
          </div>
      </div>
    </div>
  );
};
