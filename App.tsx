
import React, { useState, useEffect, useCallback } from 'react';
import { AuthService, NotificationService, SyncService } from './services/mockService';
import { BrowserNotificationService } from './services/notificationUtils';
import { AppNotification, AppTab, User, UserRole, ProcurementWorkflow } from './types';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { LoginView } from './components/LoginView';
import { AppTabContent } from './components/AppTabContent';
import { AlertCircle, X, BellRing } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<AppTab>('DASHBOARD');
  const [targetId, setTargetId] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  
  const [selectedRequest, setSelectedRequest] = useState<ProcurementWorkflow | null>(null);

  // Toast state for in-app transient alerts
  const [toasts, setToasts] = useState<AppNotification[]>([]);

  // Auth State
  const [user, setUser] = useState<User | null>(AuthService.getCurrentUser());

  const addToast = useCallback((notif: AppNotification) => {
    setToasts(prev => [...prev, notif]);
    setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== notif.id));
    }, 6000);
  }, []);

  useEffect(() => {
    if (!user) return;

    if (user.role === UserRole.VENDOR) {
        setActiveTab('VENDOR_PORTAL');
    }

    // Load initial data
    const loadNotifications = async () => {
      const data = await NotificationService.getAll();
      
      if (data.length > notifications.length && notifications.length > 0) {
          const newItems = data.slice(0, data.length - notifications.length);
          newItems.forEach(item => addToast(item));
      }
      
      setNotifications(data);
    };
    loadNotifications();
    
    const interval = setInterval(loadNotifications, 5000);
    BrowserNotificationService.requestPermission();

    return () => clearInterval(interval);
  }, [user, notifications.length, addToast]);

  const handleLogin = (newUser: User) => {
    setUser(newUser);
    if (newUser.role === UserRole.VENDOR) {
        setActiveTab('VENDOR_PORTAL');
    } else {
        setActiveTab('DASHBOARD');
    }
    BrowserNotificationService.requestPermission();
  };

  const handleLogout = async () => {
    await AuthService.logout();
    setUser(null);
  };

  const handleSync = async () => {
      await SyncService.performSync();
      window.location.reload(); 
  };

  const markRead = async (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    await NotificationService.markAllRead();
    setNotifications(await NotificationService.getAll());
  };

  const handleTabChange = (tab: AppTab) => {
    setActiveTab(tab);
    setTargetId(null);
    setSelectedRequest(null);
    setMobileMenuOpen(false);
  };

  const handleNotificationClick = (notification: AppNotification) => {
    if (notification.link) {
        setActiveTab(notification.link.tab);
        if (notification.link.itemId) {
            setTargetId(notification.link.itemId);
        }
    }
    setShowNotifications(false);
    setToasts(prev => prev.filter(t => t.id !== notification.id));
  };

  if (!user) {
    return <LoginView onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans text-slate-900">
      <Sidebar 
        activeTab={activeTab} 
        onTabChange={handleTabChange} 
        mobileMenuOpen={mobileMenuOpen} 
        currentUser={user}
        onLogout={handleLogout}
      />

      <div className="flex-1 flex flex-col overflow-hidden relative">
        <Header 
            activeTab={activeTab}
            mobileMenuOpen={mobileMenuOpen}
            setMobileMenuOpen={setMobileMenuOpen}
            showNotifications={showNotifications}
            setShowNotifications={setShowNotifications}
            notifications={notifications}
            markRead={markRead}
            handleNotificationClick={handleNotificationClick}
            onSyncRequest={handleSync}
        />

        <main className="flex-1 overflow-auto p-4 md:p-8 relative">
          <AppTabContent 
            activeTab={activeTab} 
            user={user} 
            targetId={targetId} 
            selectedRequest={selectedRequest}
            setSelectedRequest={setSelectedRequest}
          />
        </main>

        {/* Improved Notification Toast Stack */}
        <div className="fixed top-20 right-4 z-[100] flex flex-col gap-3 w-80 md:w-96 pointer-events-none">
            {toasts.map(toast => (
                <div 
                    key={toast.id}
                    className="pointer-events-auto bg-white border-l-4 border-gov-600 rounded-lg shadow-2xl p-4 flex gap-4 animate-in slide-in-from-right fade-in duration-300 transform transition-all hover:scale-[1.02] cursor-pointer"
                    onClick={() => handleNotificationClick(toast)}
                >
                    <div className={`mt-1 flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${toast.type === 'warning' ? 'bg-amber-100 text-amber-600' : 'bg-blue-100 text-blue-600'}`}>
                        {toast.type === 'warning' ? <AlertCircle className="w-5 h-5" /> : <BellRing className="w-5 h-5" />}
                    </div>
                    <div className="flex-1">
                        <div className="flex justify-between items-start">
                            <h4 className="font-bold text-sm text-slate-900">{toast.title}</h4>
                            <button 
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setToasts(prev => prev.filter(t => t.id !== toast.id));
                                }}
                                className="text-slate-400 hover:text-slate-600"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                        <p className="text-xs text-slate-600 mt-1 line-clamp-2">{toast.message}</p>
                    </div>
                </div>
            ))}
        </div>
      </div>
      
      {mobileMenuOpen && <div className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden" onClick={() => setMobileMenuOpen(false)}></div>}
      
      {showNotifications && <div className="fixed inset-0 z-30" onClick={() => setShowNotifications(false)}></div>}
    </div>
  );
}
