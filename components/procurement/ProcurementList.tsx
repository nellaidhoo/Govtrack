
import React, { useState, useMemo } from 'react';
import { ProcurementWorkflow, ProcurementStatus } from '../../types';
import { Button, Card, Input } from '../SharedComponents';
import { Plus, ArrowRight, Search, Filter } from 'lucide-react';

interface ProcurementListProps {
  requests: ProcurementWorkflow[];
  onSelect: (req: ProcurementWorkflow) => void;
  onCreate: () => void;
  isVendorView?: boolean;
}

export const ProcurementList: React.FC<ProcurementListProps> = ({ requests, onSelect, onCreate, isVendorView = false }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'GOODS' | 'SERVICE'>('ALL');

  const filteredRequests = useMemo(() => {
    return requests.filter(r => {
      const searchLower = searchTerm.toLowerCase();
      const matchesRef = (r.gsrfRefNumber?.toLowerCase() || '').includes(searchLower) || (r.prRefNumber?.toLowerCase() || '').includes(searchLower);
      const matchesRequester = r.requesterName.toLowerCase().includes(searchLower);
      const matchesSelectedVendor = (r.selectedVendor?.toLowerCase() || '').includes(searchLower);
      const matchesSearch = matchesRef || matchesRequester || matchesSelectedVendor;
      const matchesStatus = statusFilter === 'ALL' || r.status === statusFilter;
      const matchesType = typeFilter === 'ALL' || r.requestType === typeFilter;
      return matchesSearch && matchesStatus && matchesType;
    });
  }, [requests, searchTerm, statusFilter, typeFilter]);

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

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h2 className="text-2xl font-bold text-slate-800">{isVendorView ? 'Submission History' : 'Procurement Requests'}</h2>
        {!isVendorView && <Button onClick={onCreate} icon={Plus}>New Request (GSRF)</Button>}
      </div>

      <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200 flex flex-col md:flex-row gap-4 items-center">
        <div className="flex-1 w-full relative">
          <Input 
            placeholder="Search by ref number, requester, or items..." 
            icon={Search}
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="mb-0 pl-10"
          />
        </div>
        <div className="flex flex-col md:flex-row items-center gap-2 w-full md:w-auto">
          {!isVendorView && (
              <div className="flex items-center gap-2 w-full md:w-auto">
                <Filter className="w-4 h-4 text-slate-400" />
                <select 
                className="flex h-10 w-full md:w-40 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gov-500"
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                >
                <option value="ALL">All Statuses</option>
                {Object.values(ProcurementStatus).map(s => <option key={s} value={s}>{s}</option>)}
                </select>
            </div>
          )}
          <select 
            className="flex h-10 w-full md:w-40 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gov-500"
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value as any)}
          >
            <option value="ALL">All Types</option>
            <option value="GOODS">Goods</option>
            <option value="SERVICE">Services</option>
          </select>
        </div>
      </div>

      <Card className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Reference</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Type</th>
                {!isVendorView && <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Requester</th>}
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Item/Description</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {filteredRequests.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50 cursor-pointer" onClick={() => onSelect(r)}>
                  <td className="px-6 py-4 whitespace-nowrap text-xs font-mono font-bold text-slate-700">
                    {r.prRefNumber || r.gsrfRefNumber || <span className="text-slate-400 italic">Pending</span>}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-xs">
                    <span className={`font-bold ${r.requestType === 'SERVICE' ? 'text-indigo-600' : 'text-slate-600'}`}>
                        {r.requestType}
                    </span>
                  </td>
                  {!isVendorView && <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">{r.requesterName}</td>}
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 truncate max-w-xs">{r.items[0]?.description}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{new Date(r.requestDate).toLocaleDateString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {renderStatusBadge(r.status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button className="text-gov-600 hover:text-gov-900">
                      <ArrowRight className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              ))}
              {filteredRequests.length === 0 && (
                <tr>
                  <td colSpan={isVendorView ? 6 : 7} className="px-6 py-12 text-center text-slate-500 text-sm">
                    <div className="flex flex-col items-center gap-2">
                       <Search className="w-8 h-8 text-slate-200" />
                       <p>No records matching your criteria.</p>
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
