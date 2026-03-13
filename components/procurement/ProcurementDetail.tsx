
import React, { useState, useEffect } from 'react';
import { ProcurementWorkflow, ProcurementStatus, User, UserRole, SystemSettings, InventoryItem, Vendor, ItemCategory } from '../../types';
import { Button, Card } from '../SharedComponents';
import { DocumentTemplate } from '../DocumentTemplate';
import { Printer, ArrowRight, Check, X, DollarSign, AlertCircle, CreditCard, PackageCheck, ShieldCheck, ThumbsUp, ThumbsDown, FileText, Download, Wrench, CheckCircle, Award, Globe } from 'lucide-react';
import { IssueStockModal, BudgetModal, SingleSourceModal, EvaluationModal, ReceiveGoodsModal, AssessmentModal, ServiceCompletionModal, FinalCertificateModal, PublishPortalModal } from './ProcurementModals';
import { ProcurementService } from '../../services/mockService';

interface ProcurementDetailProps {
  request: ProcurementWorkflow;
  currentUser: User;
  settings: SystemSettings | null;
  inventory: InventoryItem[];
  vendors: Vendor[];
  onBack: () => void;
  onUpdateStatus: (id: string, status: ProcurementStatus, log: string, extraUpdates?: any) => Promise<void>;
  onReceiveGoods: (id: string, items: any[], actor: string) => Promise<void>;
}

export const ProcurementDetail: React.FC<ProcurementDetailProps> = ({ request: r, currentUser, settings, inventory, vendors, onBack, onUpdateStatus, onReceiveGoods }) => {
  const [isPrintMode, setIsPrintMode] = useState(false);
  const [activeDocType, setActiveDocType] = useState<'GSRF' | 'PRF' | 'PEF' | 'PO' | 'CERT'>('GSRF');
  const [modalOpen, setModalOpen] = useState<'ISSUE' | 'EVAL' | 'SINGLE' | 'BUDGET' | 'RECEIVE' | 'ASSESS' | 'COMPLETION' | 'CERT_FINAL' | 'PUBLISH' | null>(null);

  const isService = r.requestType === 'SERVICE';

  const getAvailableDocuments = () => {
    const docs: { type: 'GSRF' | 'PRF' | 'PEF' | 'PO' | 'CERT'; label: string }[] = [
        { type: 'GSRF', label: `Requisition Form (${isService ? 'SRF' : 'GSRF'})` }
    ];

    const s = r.status;
    if ([ProcurementStatus.PR_CREATED, ProcurementStatus.EVALUATION, ProcurementStatus.PENDING_APPROVAL, ProcurementStatus.BUDGET_CHECK, ProcurementStatus.PO_ISSUED, ProcurementStatus.COMPLETED].includes(s)) {
        docs.push({ type: 'PRF', label: isService ? 'Service Request (SR)' : 'Purchase Request (PR)' });
    }
    if ([ProcurementStatus.EVALUATION, ProcurementStatus.PENDING_APPROVAL, ProcurementStatus.BUDGET_CHECK, ProcurementStatus.PO_ISSUED, ProcurementStatus.COMPLETED].includes(s)) {
        docs.push({ type: 'PEF', label: 'Price Evaluation (PEF)' });
    }
    if ([ProcurementStatus.PO_ISSUED, ProcurementStatus.COMPLETED].includes(s)) {
        docs.push({ type: 'PO', label: isService ? 'Service Order (SO)' : 'Purchase Order (PO)' });
    }
    if (r.status === ProcurementStatus.COMPLETED && r.certificate) {
        docs.push({ type: 'CERT', label: 'Completion Certificate' });
    }
    return docs;
  };

  useEffect(() => {
      if (isPrintMode) {
        const available = getAvailableDocuments();
        setActiveDocType(available[available.length - 1].type);
      }
  }, [isPrintMode, r.status, r.certificate]);

  const renderStatusBadge = (status: ProcurementStatus) => {
    const colors: Record<string, string> = {
      [ProcurementStatus.DRAFT]: 'bg-slate-100 text-slate-800',
      [ProcurementStatus.SUBMITTED]: 'bg-blue-100 text-blue-800',
      [ProcurementStatus.APPROVED]: 'bg-green-100 text-green-800',
      [ProcurementStatus.REJECTED]: 'bg-red-100 text-red-800',
      [ProcurementStatus.ISSUED]: 'bg-purple-100 text-purple-800',
      [ProcurementStatus.PROCUREMENT_NEEDED]: 'bg-orange-100 text-orange-800',
      [ProcurementStatus.PR_CREATED]: 'bg-indigo-100 text-indigo-800',
      [ProcurementStatus.EVALUATION]: 'bg-pink-100 text-pink-800',
      [ProcurementStatus.PENDING_APPROVAL]: 'bg-amber-100 text-amber-800',
      [ProcurementStatus.BUDGET_CHECK]: 'bg-yellow-100 text-yellow-800',
      [ProcurementStatus.PO_ISSUED]: 'bg-teal-100 text-teal-800',
      [ProcurementStatus.COMPLETED]: 'bg-emerald-100 text-emerald-800',
    };
    return <span className={`px-2 py-1 rounded-full text-xs font-semibold ${colors[status] || 'bg-slate-100'}`}>{status}</span>;
  };

  const handlePublishConfirm = async (deadline: string) => {
      await ProcurementService.publishToPortal(r.id, deadline, currentUser.name);
      setModalOpen(null);
      onUpdateStatus(r.id, ProcurementStatus.EVALUATION, 'Invitation to Bid published to Vendor Portal');
  };

  const handleIssueConfirm = async (details: any) => {
    await onUpdateStatus(r.id, ProcurementStatus.ISSUED, 'Items Issued from Stock', { 
      stockKeeperSignature: currentUser.signatureUrl || 'signed',
      stockCheckDate: new Date().toISOString(),
      issueDetails: {
        receiverName: details.receiverName,
        receiverDepartment: details.receiverDept,
        issueDate: new Date().toISOString(),
        remarks: details.remarks
      }
    });
    setModalOpen(null);
  };

  const handleAssessmentConfirm = async (data: any) => {
      const nextStatus = data.inHouseRepair ? ProcurementStatus.COMPLETED : ProcurementStatus.PROCUREMENT_NEEDED;
      const logMsg = data.inHouseRepair ? 'In-house Service Completed' : 'Service Assessment: Out-sourced Procurement Needed';
      await onUpdateStatus(r.id, nextStatus, logMsg, {
          assessmentDetails: { assessedBy: currentUser.name, assessmentDate: new Date().toISOString(), findings: data.findings, inHouseRepairPossible: data.inHouseRepair },
          stockKeeperSignature: currentUser.signatureUrl
      });
      setModalOpen(null);
  };

  const handleEvaluationConfirm = async (data: any) => {
    const sortedVendors = [...data.vendors].map((v: any) => ({...v, selected: false}));
    const activeVendors = sortedVendors.filter((v: any) => v.vendorName && v.price > 0);
    if (activeVendors.length > 0) {
       const minPrice = Math.min(...activeVendors.map((v: any) => v.price));
       const cheapestIndex = sortedVendors.findIndex((v: any) => v.price === minPrice && v.vendorName);
       if (cheapestIndex >= 0) sortedVendors[cheapestIndex].selected = true;
    }
    await onUpdateStatus(r.id, ProcurementStatus.PENDING_APPROVAL, 'Price Evaluation Submitted - Awaiting Manager Approval', {
      evaluationMethod: data.method, evaluationType: data.type, quotations: sortedVendors, stockKeeperSignature: currentUser.signatureUrl
    });
    setModalOpen(null);
  };

  const handleSingleSourceConfirm = async (data: any) => {
    await onUpdateStatus(r.id, ProcurementStatus.PENDING_APPROVAL, 'Single Source Justification Added - Awaiting Manager Approval', {
      evaluationType: 'SINGLE_SOURCE', singleSourceJustification: data.justification, selectedVendor: data.vendorName, quotations: [{ vendorName: data.vendorName, price: data.estimatedPrice, selected: true }], stockKeeperSignature: currentUser.signatureUrl
    });
    setModalOpen(null);
  };

  const handleManagerDecision = async (approved: boolean) => {
    if (approved) {
      await onUpdateStatus(r.id, ProcurementStatus.BUDGET_CHECK, 'Evaluation Approved by Manager', { authorizedBySignature: currentUser.signatureUrl });
    } else {
      await onUpdateStatus(r.id, ProcurementStatus.PR_CREATED, 'Evaluation Rejected by Manager - Re-evaluation Required', {});
    }
  };

  const handleBudgetConfirm = async (code: string) => {
    const prefix = isService ? (settings?.prefixes.so || 'SO') : (settings?.prefixes.po || 'PO');
    const poNumber = `${prefix}/${new Date().getFullYear()}/${Math.floor(Math.random()*10000).toString().padStart(4, '0')}`;
    const selectedVendor = r.quotations?.find(q => q.selected)?.vendorName || 'Unknown Vendor';
    await onUpdateStatus(r.id, ProcurementStatus.PO_ISSUED, `Budget Confirmed & ${isService ? 'SO' : 'PO'} Generated`, {
      budgetCode: code, budgetVerifiedDate: new Date().toISOString(), poNumber: poNumber, selectedVendor: selectedVendor, authorizedBySignature: currentUser.signatureUrl
    });
    setModalOpen(null);
  };

  const handleReceiveConfirm = async (items: any[]) => {
    await onReceiveGoods(r.id, items, currentUser.name);
    setModalOpen(null);
  };

  const initialReceiveData = r.items.map(item => ({
      description: item.description, orderedQty: item.quantity, receivedQty: item.quantity, addToInventory: true, inventoryAction: item.itemId || 'NEW', newCategory: 'c1', newLocation: 'Main Store', price: r.quotations?.find(q => q.selected)?.price || 0
  }));

  const availableDocs = getAvailableDocuments();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <Button variant="outline" onClick={() => { onBack(); setIsPrintMode(false); }} icon={ArrowRight} className="rotate-180">Back</Button>
        <div className="flex gap-2">
          {!isPrintMode && <Button variant="secondary" icon={Printer} onClick={() => setIsPrintMode(true)}>Print Documents</Button>}
          {isPrintMode && <Button variant="outline" onClick={() => setIsPrintMode(false)}>Close Preview</Button>}
        </div>
      </div>

      {isPrintMode ? (
        <div className="space-y-4">
             <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200 flex flex-wrap gap-2 no-print">
                <div className="text-sm font-bold text-slate-500 flex items-center mr-2">Available Documents:</div>
                {availableDocs.map(doc => (
                    <button key={doc.type} onClick={() => setActiveDocType(doc.type)} className={`px-4 py-2 rounded-full text-sm font-medium transition-colors flex items-center gap-2 ${activeDocType === doc.type ? 'bg-gov-600 text-white shadow-md' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                        <FileText className="w-4 h-4" /> {doc.label}
                    </button>
                ))}
                <div className="ml-auto"><Button icon={Download} onClick={() => window.print()}>Download PDF</Button></div>
             </div>
            <div className="document-preview-wrapper rounded border border-slate-300">
              <DocumentTemplate type={activeDocType} data={r} settings={settings} />
            </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card title={`${isService ? 'Service' : 'Goods'} Request #${r.gsrfRefNumber || r.id.toUpperCase()}`}>
              <div className="flex justify-between mb-4">
                <div>
                  <p className="text-sm text-slate-500">Requester</p>
                  <p className="font-medium">{r.requesterName} ({r.section || r.requesterDepartment})</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-slate-500">Status</p>
                  {renderStatusBadge(r.status)}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                 <div><span className="text-slate-500 block">Date Submitted</span><span>{new Date(r.requestDate).toLocaleDateString()}</span></div>
                 <div><span className="text-slate-500 block">Required By</span><span>{r.requiredDate ? new Date(r.requiredDate).toLocaleDateString() : 'N/A'}</span></div>
                 <div className="col-span-2"><span className="text-slate-500 block">Remarks</span><p className="bg-slate-50 p-2 rounded border border-slate-100">{r.remarks || 'No remarks provided.'}</p></div>
              </div>

              <div className="mt-4">
                <h4 className="text-sm font-medium border-b border-slate-100 pb-2 mb-2">{!isService ? 'Items Requested' : 'Services Requested'}</h4>
                {r.items.map((item, i) => (
                  <div key={i} className="flex justify-between py-2 border-b border-slate-50 text-sm">
                    <div className="flex items-center gap-2">{item.itemId ? <span className="bg-blue-100 text-blue-800 text-[10px] font-bold px-1.5 py-0.5 rounded">INV</span> : null}<span>{item.description}</span></div>
                    <span className="font-mono bg-slate-100 px-2 rounded">{item.quantity}</span>
                  </div>
                ))}
              </div>

              {r.isPublishedToPortal && (
                <div className="mt-4 bg-blue-900 text-white p-3 rounded shadow-lg">
                   <div className="flex justify-between items-center">
                       <h4 className="text-sm font-bold flex items-center gap-2"><Globe className="w-4 h-4 text-gov-400"/> Published to Vendor Portal</h4>
                       <span className="text-[10px] font-bold uppercase bg-white/20 px-2 py-0.5 rounded">Bidding Live</span>
                   </div>
                   <p className="text-xs text-blue-100 mt-1">Invitation was sent to verified vendors. Bids will be collected until deadline.</p>
                   <p className="text-xs font-bold mt-2 text-gov-400">Deadline: {new Date(r.bidDeadline!).toLocaleString()}</p>
                </div>
              )}

              {/* ... Rest of existing detail renders ... */}
              {r.quotations && r.quotations.length > 0 && (
                <div className="mt-4 bg-pink-50 p-3 rounded border border-pink-100">
                   <h4 className="text-sm font-bold text-pink-800 mb-2">Collected Quotations ({r.quotations.length})</h4>
                   <div className="flex gap-4 mt-2 overflow-x-auto">
                     {r.quotations.map((q, i) => (
                       <div key={i} className={`p-2 border rounded text-xs min-w-[140px] ${q.selected ? 'bg-green-100 border-green-300 shadow-sm' : 'bg-white'}`}>
                         {q.selected && <div className="text-green-700 font-bold mb-1 text-[10px] uppercase">✓ Best Offer</div>}
                         <p className="font-bold">{q.vendorName}</p>
                         {q.isPortalSubmission && <span className="text-[9px] bg-blue-100 text-blue-700 px-1 rounded font-bold uppercase tracking-tighter">Electronic</span>}
                         <p className="mt-1 font-mono">MVR {(q.price || 0).toFixed(2)}</p>
                       </div>
                     ))}
                   </div>
                </div>
              )}
            </Card>

            {/* ACTION CARDS */}
            {currentUser.role === UserRole.STOCK_KEEPER && r.status === ProcurementStatus.PR_CREATED && (
              <Card title="Procurement Action">
                <p className="text-sm text-slate-600 mb-4">Choose procurement method for this {r.requestType.toLowerCase()}.</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <Button className="flex-col h-auto py-4" onClick={() => setModalOpen('EVAL')}>
                    <DollarSign className="mb-2 h-5 w-5" /> Manual Price Evaluation
                  </Button>
                  <Button variant="secondary" className="flex-col h-auto py-4" onClick={() => setModalOpen('PUBLISH')}>
                    <Globe className="mb-2 h-5 w-5 text-gov-600" /> Publish to Vendor Portal
                  </Button>
                  <Button variant="outline" className="flex-col h-auto py-4" onClick={() => setModalOpen('SINGLE')}>
                    <AlertCircle className="mb-2 h-5 w-5 text-amber-600" /> Single Source / Ad-hoc
                  </Button>
                </div>
              </Card>
            )}

            {/* Existing roles & actions continue here ... */}
            {currentUser.role === UserRole.STOCK_KEEPER && r.status === ProcurementStatus.SUBMITTED && (
              <Card title={`${!isService ? 'Store' : 'Service'} Officer Action`}>
                {!isService ? (
                   <div className="flex gap-4">
                        <Button className="flex-1" onClick={() => setModalOpen('ISSUE')} icon={Check}>Issue Stock</Button>
                        <Button className="flex-1" variant="secondary" onClick={() => onUpdateStatus(r.id, ProcurementStatus.PROCUREMENT_NEEDED, 'Marked for Procurement', { stockKeeperSignature: currentUser.signatureUrl || 'signed', stockCheckDate: new Date().toISOString() })} icon={X}>Procure External</Button>
                    </div>
                ) : (
                    <Button className="w-full" icon={Wrench} onClick={() => setModalOpen('ASSESS')}>Perform Technical Assessment</Button>
                )}
              </Card>
            )}

            {currentUser.role === UserRole.STOCK_KEEPER && r.status === ProcurementStatus.PROCUREMENT_NEEDED && (
              <Card title="Procurement Processing">
                <Button className="w-full" onClick={() => {
                  const prefix = isService ? (settings?.prefixes.sr || 'SR') : (settings?.prefixes.pr || 'PR');
                  onUpdateStatus(r.id, ProcurementStatus.PR_CREATED, `${isService ? 'Service' : 'Purchase'} Request Created`, { prRefNumber: `${prefix}/${new Date().getFullYear()}/${Math.floor(Math.random()*1000)}`, stockKeeperSignature: currentUser.signatureUrl })
                }}>Generate {isService ? 'SR' : 'PR'}</Button>
              </Card>
            )}

            {r.status === ProcurementStatus.PENDING_APPROVAL && (currentUser.role === UserRole.MANAGER || currentUser.role === UserRole.ADMIN) && (
              <Card title="Approval Required">
                <div className="flex gap-4">
                  <Button className="flex-1" onClick={() => handleManagerDecision(true)} icon={ThumbsUp}>Approve Evaluation</Button>
                  <Button className="flex-1" variant="danger" onClick={() => handleManagerDecision(false)} icon={ThumbsDown}>Reject</Button>
                </div>
              </Card>
            )}

            {r.status === ProcurementStatus.BUDGET_CHECK && (currentUser.role === UserRole.STOCK_KEEPER || currentUser.role === UserRole.FINANCE_OFFICER) && (
               <Card title="Budget Verification">
                  <Button className="w-full" onClick={() => setModalOpen('BUDGET')} icon={CreditCard}>Verify Budget & Issue Order</Button>
               </Card>
            )}
          </div>

          <div className="space-y-6">
             <Card title="Signatures">
               <div className="space-y-4">
                 <div><p className="text-xs text-slate-500 uppercase font-bold">Requester</p>{r.requesterSignature ? <img src={r.requesterSignature} className="h-8 border border-slate-200 mt-1"/> : <span className="text-xs italic">Pending</span>}</div>
                 <div><p className="text-xs text-slate-500 uppercase font-bold">{!isService ? 'Store' : 'Technical'} Officer</p>{r.stockKeeperSignature ? <img src={r.stockKeeperSignature} className="h-8 border border-slate-200 mt-1"/> : <span className="text-xs italic">Pending</span>}</div>
                 {r.authorizedBySignature && (<div><p className="text-xs text-slate-500 uppercase font-bold">Authorized Official</p><img src={r.authorizedBySignature} className="h-8 border border-slate-200 mt-1"/></div>)}
               </div>
             </Card>
             <Card title="Audit History">
               <ul className="space-y-3 relative border-l border-slate-200 ml-2 pl-4">
                 {r.logs.map((log, i) => (
                   <li key={i} className="text-xs">
                     <div className="absolute w-2 h-2 bg-slate-300 rounded-full -left-[5px] mt-1"></div>
                     <p className="font-semibold text-slate-700">{log.action}</p>
                     <p className="text-slate-500">{new Date(log.date).toLocaleString()} by {log.actor}</p>
                   </li>
                 ))}
               </ul>
             </Card>
          </div>
        </div>
      )}

      {modalOpen === 'ISSUE' && <IssueStockModal onClose={() => setModalOpen(null)} onConfirm={handleIssueConfirm} />}
      {modalOpen === 'ASSESS' && <AssessmentModal onClose={() => setModalOpen(null)} onConfirm={handleAssessmentConfirm} />}
      {modalOpen === 'BUDGET' && <BudgetModal requestType={r.requestType} onClose={() => setModalOpen(null)} onConfirm={handleBudgetConfirm} />}
      {modalOpen === 'SINGLE' && <SingleSourceModal vendors={vendors} onClose={() => setModalOpen(null)} onConfirm={handleSingleSourceConfirm} />}
      {modalOpen === 'EVAL' && <EvaluationModal vendors={vendors} onClose={() => setModalOpen(null)} onConfirm={handleEvaluationConfirm} />}
      {modalOpen === 'RECEIVE' && <ReceiveGoodsModal initialItems={initialReceiveData} inventory={inventory} onClose={() => setModalOpen(null)} onConfirm={handleReceiveConfirm} />}
      {modalOpen === 'PUBLISH' && <PublishPortalModal onClose={() => setModalOpen(null)} onConfirm={handlePublishConfirm} />}
    </div>
  );
};
