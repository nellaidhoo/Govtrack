
import React, { useState } from 'react';
import { ProcurementWorkflow, User, Quotation } from '../../types';
import { Card, Button, Input } from '../SharedComponents';
import { ArrowLeft, Send, CheckCircle, ShieldCheck, DollarSign, FileText, Upload } from 'lucide-react';

interface QuoteSubmissionProps {
  request: ProcurementWorkflow;
  user: User;
  onBack: () => void;
  onSubmit: (id: string, vendorId: string, vendorName: string, quoteNo: string, price: number) => Promise<void>;
}

export const QuoteSubmission: React.FC<QuoteSubmissionProps> = ({ request: r, user, onBack, onSubmit }) => {
  const [formData, setFormData] = useState({
    quoteNumber: '',
    totalPrice: 0,
    isConfirmed: false
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const existingQuote = r.quotations?.find(q => q.vendorId === user.vendorId);
  const isDeadlinePassed = r.bidDeadline ? new Date(r.bidDeadline).getTime() < Date.now() : false;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.quoteNumber || formData.totalPrice <= 0 || !formData.isConfirmed) return;

    setIsSubmitting(true);
    try {
        await onSubmit(r.id, user.vendorId!, user.name, formData.quoteNumber, formData.totalPrice);
        setIsSuccess(true);
    } finally {
        setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
        <div className="flex flex-col items-center justify-center py-12 text-center animate-in fade-in zoom-in duration-300">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6">
                <CheckCircle className="w-12 h-12 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Submission Successful</h2>
            <p className="text-slate-500 max-w-sm mx-auto mb-8">
                Your electronic quotation has been securely transmitted and logged. A copy has been sent to your registered email.
            </p>
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 mb-8 w-full max-w-sm">
                <div className="flex justify-between text-sm mb-1">
                    <span className="text-slate-500">Transaction ID</span>
                    <span className="font-mono font-bold text-slate-700">{Math.random().toString(36).substr(2, 10).toUpperCase()}</span>
                </div>
                <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Timestamp</span>
                    <span className="text-slate-700">{new Date().toLocaleString()}</span>
                </div>
            </div>
            <Button onClick={onBack} icon={ArrowLeft}>Back to Invitations</Button>
        </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-4">
        <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
            <ArrowLeft className="w-5 h-5 text-slate-500" />
        </button>
        <div>
            <h2 className="text-xl font-bold text-slate-900">RFQ: {r.items[0]?.description}</h2>
            <p className="text-xs text-slate-500 font-mono">Reference: {r.prRefNumber}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <div className="md:col-span-2 space-y-6">
            <Card title="Invitation Details">
                <div className="space-y-6">
                    <div>
                        <h4 className="text-xs font-bold text-slate-400 uppercase mb-3">Itemized Requirements</h4>
                        <table className="w-full text-sm">
                            <thead className="bg-slate-50">
                                <tr>
                                    <th className="p-2 text-left border">Description</th>
                                    <th className="p-2 text-center border w-24">Quantity</th>
                                </tr>
                            </thead>
                            <tbody>
                                {r.items.map((item, idx) => (
                                    <tr key={idx}>
                                        <td className="p-2 border font-medium">{item.description}</td>
                                        <td className="p-2 border text-center font-mono">{item.quantity}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="bg-slate-50 p-4 rounded-lg">
                        <h4 className="text-xs font-bold text-slate-400 uppercase mb-2">Scope / Additional Remarks</h4>
                        <p className="text-sm text-slate-700 italic">"{r.remarks || 'No additional notes provided.'}"</p>
                    </div>
                </div>
            </Card>

            {existingQuote ? (
               <div className="bg-blue-50 border border-blue-200 rounded-xl p-8 text-center">
                    <ShieldCheck className="w-12 h-12 text-blue-500 mx-auto mb-4" />
                    <h3 className="text-lg font-bold text-blue-900 mb-2">Quotation Already Submitted</h3>
                    <p className="text-sm text-blue-700 mb-6">
                        You submitted quote <b>#{existingQuote.quoteNumber}</b> on {new Date(existingQuote.submittedAt!).toLocaleDateString()}.
                    </p>
                    <div className="flex justify-center gap-4">
                        <Button variant="outline" size="sm">View Submission</Button>
                        <Button variant="secondary" size="sm" disabled={isDeadlinePassed}>Withdraw Quote</Button>
                    </div>
               </div>
            ) : isDeadlinePassed ? (
               <div className="bg-red-50 border border-red-200 rounded-xl p-8 text-center text-red-700">
                    <p className="font-bold">The deadline for this invitation has passed.</p>
                    <p className="text-sm">Submissions are no longer accepted for this RFQ.</p>
               </div>
            ) : (
                <Card title="Electronic Submission Form">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Input 
                                label="Your Quotation Reference #" 
                                value={formData.quoteNumber} 
                                onChange={e => setFormData({...formData, quoteNumber: e.target.value})}
                                placeholder="e.g. QTE-2024-445"
                                required
                            />
                            <div className="relative">
                                <label className="block text-sm font-medium text-slate-700 mb-1">Total Bid Price (MVR)</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">MVR</span>
                                    <input 
                                        type="number"
                                        className="h-10 w-full rounded-md border border-slate-300 bg-white pl-12 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gov-500"
                                        value={formData.totalPrice || ''}
                                        onChange={e => setFormData({...formData, totalPrice: parseFloat(e.target.value) || 0})}
                                        required
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="border-2 border-dashed border-slate-200 rounded-lg p-8 text-center group hover:border-gov-300 transition-colors">
                            <Upload className="w-8 h-8 text-slate-300 group-hover:text-gov-500 mx-auto mb-2" />
                            <p className="text-sm font-medium text-slate-600">Drag & Drop Signed Quote PDF</p>
                            <p className="text-[10px] text-slate-400 mt-1 uppercase">Optional for Portal MVP - Reference Only</p>
                        </div>

                        <div className="bg-slate-50 p-4 rounded border border-slate-200">
                            <label className="flex items-start gap-3 cursor-pointer group">
                                <input 
                                    type="checkbox" 
                                    className="mt-1 w-4 h-4 rounded text-gov-600 focus:ring-gov-500"
                                    checked={formData.isConfirmed}
                                    onChange={e => setFormData({...formData, isConfirmed: e.target.checked})}
                                />
                                <span className="text-xs text-slate-600 leading-relaxed">
                                    I certify that the prices quoted are valid for 30 days and our company complies with the terms specified in the RFQ document. I understand that this electronic submission is binding.
                                </span>
                            </label>
                        </div>

                        <div className="flex justify-end gap-3 pt-4 border-t">
                            <Button variant="outline" onClick={onBack}>Cancel</Button>
                            <Button type="submit" disabled={isSubmitting || !formData.isConfirmed || formData.totalPrice <= 0} icon={Send}>
                                {isSubmitting ? 'Transmitting...' : 'Submit Electronic Quote'}
                            </Button>
                        </div>
                    </form>
                </Card>
            )}
         </div>

         <div className="space-y-6">
            <Card className="bg-gov-50 border-gov-100">
                <h3 className="text-sm font-bold text-gov-800 uppercase flex items-center gap-2 mb-4">
                    <DollarSign className="w-4 h-4" /> Pricing Guidance
                </h3>
                <p className="text-xs text-gov-700 leading-relaxed">
                    Submit your total inclusive price including GST and delivery charges. Proposals exceeding the internal budget threshold may be automatically disqualified.
                </p>
            </Card>

            <div className="bg-slate-900 text-white rounded-lg p-6 shadow-lg">
                <h4 className="font-bold flex items-center gap-2 mb-3">
                    <FileText className="w-4 h-4 text-gov-500" /> Procurement Rules
                </h4>
                <p className="text-[10px] text-slate-400 leading-relaxed">
                    All quotes are strictly confidential and will not be visible to other bidders or unauthorized entity personnel until the bid opening session.
                </p>
            </div>
         </div>
      </div>
    </div>
  );
};
