
import React from 'react';
import { LayoutDashboard, Package, Truck, Settings, ClipboardList, ShoppingCart, Users, LogOut, Globe, Send } from 'lucide-react';
import { AppTab, User, UserRole } from '../types';

interface SidebarProps {
  activeTab: AppTab;
  onTabChange: (tab: AppTab) => void;
  mobileMenuOpen: boolean;
  currentUser: User;
  onLogout: () => void;
}

const SidebarItem = ({ icon: Icon, label, active, onClick }: any) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors ${
      active ? 'bg-gov-800 text-white' : 'text-slate-300 hover:bg-gov-800 hover:text-white'
    }`}
  >
    <Icon className="w-5 h-5" />
    {label}
  </button>
);

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, onTabChange, mobileMenuOpen, currentUser, onLogout }) => {
  const isVendor = currentUser.role === UserRole.VENDOR;

  return (
    <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-gov-900 text-white transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
      <div className="p-6 border-b border-gov-800">
        <h1 className="text-xl font-bold tracking-tight">GovTrack <span className="text-gov-500">System</span></h1>
        <p className="text-xs text-gov-500 mt-1">{isVendor ? 'External Vendor Portal' : 'Entity Inventory & Procurement'}</p>
      </div>
      <nav className="mt-6 space-y-1">
        {isVendor ? (
           <>
             <SidebarItem icon={LayoutDashboard} label="Portal Overview" active={activeTab === 'VENDOR_PORTAL'} onClick={() => onTabChange('VENDOR_PORTAL')} />
             <SidebarItem icon={Send} label="My Submissions" active={activeTab === 'PROCUREMENT'} onClick={() => onTabChange('PROCUREMENT')} />
             <SidebarItem icon={Settings} label="Company Profile" active={activeTab === 'SETTINGS'} onClick={() => onTabChange('SETTINGS')} />
           </>
        ) : (
           <>
             <SidebarItem icon={LayoutDashboard} label="Dashboard" active={activeTab === 'DASHBOARD'} onClick={() => onTabChange('DASHBOARD')} />
             <SidebarItem icon={Package} label="Inventory" active={activeTab === 'INVENTORY'} onClick={() => onTabChange('INVENTORY')} />
             <SidebarItem icon={Truck} label="Assets" active={activeTab === 'ASSETS'} onClick={() => onTabChange('ASSETS')} />
             <SidebarItem icon={ShoppingCart} label="Procurement" active={activeTab === 'PROCUREMENT'} onClick={() => onTabChange('PROCUREMENT')} />
             <SidebarItem icon={Users} label="Vendors" active={activeTab === 'VENDORS'} onClick={() => onTabChange('VENDORS')} />
             <SidebarItem icon={ClipboardList} label="Audit Reports" active={activeTab === 'REPORTS'} onClick={() => onTabChange('REPORTS')} />
             <SidebarItem icon={Settings} label="Settings" active={activeTab === 'SETTINGS'} onClick={() => onTabChange('SETTINGS')} />
           </>
        )}
      </nav>
      <div className="absolute bottom-0 w-full p-4 bg-gov-950">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 overflow-hidden">
             <div className="w-8 h-8 rounded-full bg-gov-700 flex-shrink-0 flex items-center justify-center text-xs font-bold">
               {currentUser.name.charAt(0)}
             </div>
             <div className="truncate">
               <p className="text-sm font-medium truncate">{currentUser.name}</p>
               <p className="text-xs text-gov-400 truncate">{isVendor ? 'External Partner' : currentUser.role}</p>
             </div>
          </div>
          <button 
             onClick={onLogout} 
             className="text-slate-400 hover:text-white p-1 rounded hover:bg-gov-800 transition-colors"
             title="Log Out"
          >
             <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>
    </aside>
  );
};
