import React, { useState, useEffect, useMemo } from 'react';
import { VendorService } from '../services/mockService';
import { Vendor } from '../types';
import { Plus, Search, Filter } from 'lucide-react';
import { Card, Button, Input } from './SharedComponents';

export const VendorManagement = () => {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  
  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const [formData, setFormData] = useState({
    name: '',
    contactPerson: '',
    email: '',
    phone: '',
    address: '',
    taxId: ''
  });

  useEffect(() => {
    loadVendors();
  }, []);

  const loadVendors = async () => {
    const data = await VendorService.getAll();
    setVendors(data);
  };

  const filteredVendors = useMemo(() => {
    return vendors.filter(v => {
      const matchesSearch = 
        v.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.contactPerson.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.email.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'ALL' || v.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });
  }, [vendors, searchTerm, statusFilter]);

  const handleAdd = async () => {
    if (!formData.name) return;
    await VendorService.add({
      name: formData.name,
      contactPerson: formData.contactPerson,
      email: formData.email,
      phone: formData.phone,
      address: formData.address,
      taxId: formData.taxId,
      status: 'Active'
    });
    setFormData({ name: '', contactPerson: '', email: '', phone: '', address: '', taxId: '' });
    setShowAdd(false);
    loadVendors();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h2 className="text-2xl font-bold text-slate-800">Vendor Management</h2>
        <Button onClick={() => setShowAdd(!showAdd)} icon={Plus}>Register Vendor</Button>
      </div>

      {showAdd && (
        <Card className="mb-6 bg-slate-50 border-slate-200">
           <h3 className="font-bold mb-4">New Vendor Registration</h3>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input label="Company Name" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
              <Input label="Contact Person" value={formData.contactPerson} onChange={e => setFormData({...formData, contactPerson: e.target.value})} />
              <Input label="Email" type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
              <Input label="Phone" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
              <Input label="Address" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} />
              <Input label="Tax ID / Registration No." value={formData.taxId} onChange={e => setFormData({...formData, taxId: e.target.value})} />
           </div>
           <div className="mt-4 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowAdd(false)}>Cancel</Button>
              <Button onClick={handleAdd}>Save Vendor</Button>
           </div>
        </Card>
      )}

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200 flex flex-col md:flex-row gap-4 items-center">
        <div className="flex-1 w-full relative">
          <Input 
            placeholder="Search vendors by name, contact, or email..." 
            icon={Search}
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="mb-0 pl-10"
          />
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto">
          <Filter className="w-4 h-4 text-slate-400" />
          <select 
            className="flex h-10 w-full md:w-48 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gov-500"
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
          >
            <option value="ALL">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Blacklisted">Blacklisted</option>
            <option value="Pending">Pending</option>
          </select>
        </div>
      </div>

      <Card className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
             <thead className="bg-slate-50">
               <tr>
                 <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Vendor</th>
                 <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Contact</th>
                 <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Details</th>
                 <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
               </tr>
             </thead>
             <tbody className="bg-white divide-y divide-slate-200">
               {filteredVendors.map(v => (
                 <tr key={v.id}>
                   <td className="px-6 py-4">
                     <div className="text-sm font-medium text-slate-900">{v.name}</div>
                     <div className="text-xs text-slate-500">Tax ID: {v.taxId || 'N/A'}</div>
                   </td>
                   <td className="px-6 py-4 text-sm text-slate-500">
                     <div>{v.contactPerson}</div>
                     <div>{v.email}</div>
                   </td>
                   <td className="px-6 py-4 text-sm text-slate-500">
                      <div>{v.phone}</div>
                      <div className="truncate max-w-xs">{v.address}</div>
                   </td>
                   <td className="px-6 py-4">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        v.status === 'Active' ? 'bg-green-100 text-green-800' : 
                        v.status === 'Blacklisted' ? 'bg-red-100 text-red-800' : 
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {v.status}
                      </span>
                   </td>
                 </tr>
               ))}
               {filteredVendors.length === 0 && (
                 <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-slate-500">
                        <div className="flex flex-col items-center gap-2">
                           <Search className="w-8 h-8 text-slate-200" />
                           <p>No vendors found matching your criteria.</p>
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