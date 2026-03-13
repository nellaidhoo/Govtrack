
import React, { useState, useEffect } from 'react';
import { Menu, Bell, ShieldAlert, Wifi, WifiOff, CloudUpload, RefreshCw } from 'lucide-react';
import { AppNotification, AppTab } from '../types';
import { BrowserNotificationService } from '../services/notificationUtils';
import { OfflineService } from '../services/offlineService';

interface HeaderProps {
    activeTab: AppTab;
    mobileMenuOpen: boolean;
    setMobileMenuOpen: (open: boolean) => void;
    showNotifications: boolean;
    setShowNotifications: (show: boolean) => void;
    notifications: AppNotification[];
    markRead: (e?: React.MouseEvent) => void;
    handleNotificationClick: (n: AppNotification) => void;
    onSyncRequest?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
    activeTab,
    mobileMenuOpen,
    setMobileMenuOpen,
    showNotifications,
    setShowNotifications,
    notifications,
    markRead,
    handleNotificationClick,
    onSyncRequest
}) => {
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [pendingCount, setPendingCount] = useState(0);
    const [isSyncing, setIsSyncing] = useState(false);

    const unreadCount = notifications.filter(n => !n.read).length;
    const browserPerm = BrowserNotificationService.getPermissionStatus();

    useEffect(() => {
        const handleStatusChange = () => setIsOnline(navigator.onLine);
        window.addEventListener('online', handleStatusChange);
        window.addEventListener('offline', handleStatusChange);
        
        const checkQueue = () => setPendingCount(OfflineService.getQueue().length);
        const interval = setInterval(checkQueue, 2000);
        checkQueue();

        return () => {
            window.removeEventListener('online', handleStatusChange);
            window.removeEventListener('offline', handleStatusChange);
            clearInterval(interval);
        };
    }, []);

    const handleSync = async () => {
        if (onSyncRequest) {
            setIsSyncing(true);
            await onSyncRequest();
            setIsSyncing(false);
        }
    };

    const handleEnableBrowser = async () => {
        const res = await BrowserNotificationService.requestPermission();
        if (res === 'granted') {
            BrowserNotificationService.send("Success!", "Browser alerts are now enabled for GovTrack.");
        }
    };

    return (
        <header className="bg-white shadow-sm z-40 p-4 flex items-center justify-between sticky top-0">
           <div className="flex items-center">
             <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-2 text-slate-600 md:hidden mr-2">
               <Menu className="w-6 h-6" />
             </button>
             <span className="font-bold text-gov-900 md:hidden">GovTrack</span>
             <div className="hidden md:flex items-center gap-3">
                <h2 className="text-lg font-semibold text-slate-700 capitalize">
                    {activeTab.toLowerCase().replace('_', ' ')}
                </h2>
                {/* Connectivity Badge */}
                <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-[10px] font-bold uppercase tracking-tight ${
                    isOnline ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200 animate-pulse'
                }`}>
                    {isOnline ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
                    {isOnline ? 'Online' : 'Offline Mode'}
                </div>
             </div>
           </div>

           <div className="flex items-center gap-4">
              {/* Sync Button */}
              {isOnline && pendingCount > 0 && (
                  <button 
                    onClick={handleSync}
                    disabled={isSyncing}
                    className="flex items-center gap-2 bg-gov-600 text-white px-3 py-1.5 rounded-md text-xs font-bold hover:bg-gov-700 transition-all shadow-sm"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                    Sync {pendingCount} Updates
                  </button>
              )}

              {/* Notification Bell */}
              <div className="relative">
                <button onClick={() => setShowNotifications(!showNotifications)} className="p-2 text-slate-500 hover:text-gov-600 relative outline-none focus:ring-2 focus:ring-gov-200 rounded-full transition-all">
                   <Bell className="w-6 h-6" />
                   {unreadCount > 0 && (
                       <span className="absolute top-1 right-1 h-3 w-3 bg-red-500 rounded-full border-2 border-white animate-pulse"></span>
                   )}
                </button>
                {/* Notification Dropdown */}
                {showNotifications && (
                    <div className="absolute right-0 mt-2 w-80 md:w-96 bg-white rounded-lg shadow-2xl border border-slate-200 z-50 overflow-hidden transform origin-top-right transition-all">
                        <div className="p-4 border-b bg-slate-50 flex justify-between items-center">
                            <h3 className="font-bold text-sm text-slate-700 flex items-center gap-2">
                                <Bell className="w-4 h-4" /> Notifications
                            </h3>
                            {unreadCount > 0 && (
                                <button onClick={markRead} className="text-xs text-gov-600 font-bold hover:underline">Mark all read</button>
                            )}
                        </div>

                        {/* Browser Permission Prompt */}
                        {browserPerm !== 'granted' && (
                            <div className="px-4 py-3 bg-indigo-50 border-b border-indigo-100 flex items-center justify-between">
                                <div className="flex items-center gap-2 text-[11px] text-indigo-700 font-medium">
                                    <ShieldAlert className="w-4 h-4" /> Desktop alerts are off
                                </div>
                                <button 
                                    onClick={handleEnableBrowser}
                                    className="bg-indigo-600 text-white text-[10px] font-bold px-2 py-1 rounded hover:bg-indigo-700"
                                >
                                    Enable
                                </button>
                            </div>
                        )}

                        <div className="max-h-96 overflow-y-auto">
                            {notifications.length === 0 ? (
                                <p className="p-8 text-sm text-slate-400 text-center italic">No new activity</p>
                            ) : (
                                notifications.map(n => (
                                    <div 
                                      key={n.id} 
                                      onClick={() => handleNotificationClick(n)}
                                      className={`p-4 border-b hover:bg-slate-50 last:border-0 cursor-pointer transition-colors ${!n.read ? 'bg-blue-50/40' : ''}`}
                                    >
                                        <div className="flex justify-between items-start mb-1">
                                            <div className="flex items-center gap-2">
                                                <span className={`w-2 h-2 rounded-full ${!n.read ? 'bg-gov-500' : 'bg-transparent'}`}></span>
                                                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wide ${
                                                    n.type === 'warning' ? 'bg-amber-100 text-amber-800' : 
                                                    n.type === 'success' ? 'bg-green-100 text-green-800' : 
                                                    'bg-blue-100 text-blue-800'
                                                }`}>
                                                    {n.type === 'error' ? 'Alert' : n.type}
                                                </span>
                                            </div>
                                            <span className="text-[10px] text-slate-400 font-medium">{n.time}</span>
                                        </div>
                                        <p className="text-sm font-bold text-slate-800 leading-tight">{n.title}</p>
                                        <p className="text-xs text-slate-500 mt-1 leading-normal line-clamp-2">{n.message}</p>
                                    </div>
                                ))
                            )}
                        </div>
                        
                        <div className="p-3 bg-slate-50 border-t text-center">
                             <button className="text-xs text-slate-500 hover:text-gov-800 font-medium">View all activity history</button>
                        </div>
                    </div>
                )}
              </div>
           </div>
        </header>
    );
};
