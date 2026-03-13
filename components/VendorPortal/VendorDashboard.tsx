
import React, { useState, useEffect } from 'react';
import { ProcurementWorkflow, User, Vendor, ProcurementStatus } from '../../types';
import { ProcurementService, VendorService } from '../../services/mockService';
import { Card, Button } from '../SharedComponents';
import { Briefcase, Clock, FileText, Send, AlertCircle, ChevronRight, Globe } from 'lucide-react';

interface VendorDashboardProps {
  user: User;
  onSelectRequest: (req: ProcurementWorkflow) => void;
}

export const VendorDashboard: React.FC<VendorDashboardProps> = ({ user, onSelectRequest }) => {
  const [requests, setRequests] = useState<ProcurementWorkflow[]>([]);
  const [vendorDetails, setVendorDetails] = useState<Vendor | null>(null);

  useEffect(() => {
    loadPortalData();
  }, [user]);

  const loadPortalData = async () => {
    const all = await ProcurementService.getAll();
    const vendors = await VendorService.getAll();
    
    // Filter requests published to portal that are not past deadline
    const portalRequests = all.filter(r => 
        r.isPublishedToPortal && 
        r.status !== ProcurementStatus.COMPLETED &&
        r.status !== ProcurementStatus.REJECTED
    );
    
    setRequests(portalRequests);
    setVendorDetails(vendors.find(v => v.id === user.vendorId) || null);
  };

  const getSubmissionStatus = (req: ProcurementWorkflow) => {
      const submission = req.quotations?.find(q => q.vendorId === user.vendorId);
      if (!submission) return { label: 'Awaiting Quote', color: 'bg-amber-100 text-amber-800' };
      return { label: 'Quote Submitted', color: 'bg-green-100 text-green-800' };
  };

  const isDeadlinePassed = (deadline?: string) => {
      if (!deadline) return false;
      return new Date(deadline).getTime() < Date.now();
  };

  return (
    <div className="space-y-6">
      <div className="bg-gov-900 text-white rounded-xl p-8 shadow-xl relative overflow-hidden">
         <div className="absolute right-0 top-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2"></div>
         <div className="relative z-10">
            <h2 className="text-3xl font-bold font-serif mb-2">Welcome, {vendorDetails?.name || user.name}</h2>
            <p className="text-gov-300 max-w-xl">
                This is your secure gateway for government procurement. Access active Requests for Quotation (RFQs), submit electronic bids, and track award statuses.
            </p>
            <div className="flex gap-6 mt-8">
                <div className="bg-white/10 px-4 py-2 rounded-lg border border-white/20">
                    <span className="block text-[10px] uppercase font-bold text-gov-400">Company ID</span>
                    <span className="font-mono text-sm font-bold">{vendorDetails?.taxId || 'UNVERIFIED'}</span>
                </div>
                <div className="bg-white/10 px-4 py-2 rounded-lg border border-white/20">
                    <span className="block text-[10px] uppercase font-bold text-gov-400">Account Status</span>
                    <span className="text-sm font-bold flex items-center gap-1.5"><Globe className="w-3.5 h-3.5 text-green-400"/> Verified Partner</span>
                </div>
            </div>
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
         <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                    <Briefcase className="w-5 h-5 text-gov-600" /> 
                    Active Procurement Invitations
                </h3>
            </div>

            {requests.length === 0 ? (
                <div className="bg-white border-2 border-dashed border-slate-200 rounded-xl p-12 text-center">
                    <FileText className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                    <p className="text-slate-500 font-medium">No active invitations at this time.</p>
                    <p className="text-xs text-slate-400 mt-1">We will notify you via email when new RFQs are published.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-4">
                    {requests.map(req => {
                        const status = getSubmissionStatus(req);
                        const expired = isDeadlinePassed(req.bidDeadline);
                        return (
                            <Card key={req.id} className="hover:shadow-md transition-shadow group cursor-pointer" onClick={() => onSelectRequest(req)}>
                                <div className="flex justify-between items-start">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${status.color}`}>
                                                {status.label}
                                            </span>
                                            <span className="text-xs font-mono font-bold text-slate-400">{req.prRefNumber}</span>
                                        </div>
                                        <h4 className="text-lg font-bold text-slate-900 group-hover:text-gov-700 transition-colors">{req.requestType} Invitation: {req.items[0]?.description}</h4>
                                        <div className="flex items-center gap-4 mt-3 text-xs text-slate-500 font-medium">
                                            <div className="flex items-center gap-1.5">
                                                <Clock className={`w-3.5 h-3.5 ${expired ? 'text-red-500' : 'text-slate-400'}`} />
                                                <span className={expired ? 'text-red-600 font-bold' : ''}>
                                                    Deadline: {req.bidDeadline ? new Date(req.bidDeadline).toLocaleString() : 'Open'}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <FileText className="w-3.5 h-3.5 text-slate-400" />
                                                {req.items.length} Line Items
                                            </div>
                                        </div>
                                    </div>
                                    <div className="p-2 rounded-full bg-slate-50 group-hover:bg-gov-50 group-hover:text-gov-600 transition-colors">
                                        <ChevronRight className="w-5 h-5" />
                                    </div>
                                </div>
                            </Card>
                        );
                    })}
                </div>
            )}
         </div>

         <div className="space-y-6">
            <Card title="Portal Security Notices" className="bg-amber-50/50 border-amber-100">
                <ul className="space-y-4 text-xs text-slate-600 leading-relaxed">
                    <li className="flex gap-3">
                        <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                        <span>Submissions cannot be retracted or modified after the bid deadline has passed.</span>
                    </li>
                    <li className="flex gap-3">
                        <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                        <span>Ensure your tax registration details are up to date in the profile section before submitting.</span>
                    </li>
                </ul>
            </Card>
            
            <Card title="Portal Support">
                 <p className="text-xs text-slate-500 mb-4">Need help with your submission? Our procurement team is available 08:00 - 16:00.</p>
                 <Button variant="outline" size="sm" className="w-full">Contact Support Office</Button>
            </Card>
         </div>
      </div>
    </div>
  );
};
