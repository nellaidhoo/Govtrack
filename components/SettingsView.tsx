
import React, { useState, useEffect, useRef } from 'react';
import { AuthService, SettingsService, UserService, DepartmentService } from '../services/mockService';
import { CommunicationService } from '../services/communicationService';
import { SystemSettings, UserRole, User, TemplateBlock, Department, ItemCategoryDef, ItemTypeDef, CommConfig } from '../types';
import { Card, Button, Input, SignaturePad } from './SharedComponents';
import { 
  Save, Building, FileText, LayoutTemplate, User as UserIcon, Users, 
  Lock, Edit2, RefreshCw, Plus, Mail, Phone, Briefcase, BadgeCheck, 
  PenTool, Type, AlignLeft, Minus, Image as ImageIcon, Trash2, 
  Layers, ChevronRight, UserCheck, Globe, Hash, Upload, Tags, Package,
  Info, X, Shield, Key, Share2, Smartphone, AtSign
} from 'lucide-react';

export const SettingsView = () => {
  const [currentUser, setCurrentUser] = useState(AuthService.getCurrentUser()!);
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [activeSection, setActiveSection] = useState<'PROFILE' | 'ORG' | 'PREFIXES' | 'TEMPLATE' | 'USERS' | 'DEPARTMENTS' | 'ITEMS' | 'INTEGRATIONS'>('PROFILE');
  const [isSaving, setIsSaving] = useState(false);
  const [testStatus, setTestStatus] = useState<{type: 'EMAIL' | 'SMS', status: 'IDLE' | 'TESTING' | 'SUCCESS' | 'FAILED'}>({type: 'EMAIL', status: 'IDLE'});
  
  // Profile & Password State
  const [profileForm, setProfileForm] = useState({
    name: '',
    email: '',
    designation: '',
    phone: ''
  });
  const [signature, setSignature] = useState('');
  
  // Admin: User Management State
  const [users, setUsers] = useState<User[]>([]);
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState<Partial<User> | null>(null);
  
  // Admin: Department Management State
  const [departments, setDepartments] = useState<Department[]>([]);
  const [showDeptModal, setShowDeptModal] = useState(false);
  const [editingDept, setEditingDept] = useState<Partial<Department> | null>(null);

  // Item Management State
  const [showCatModal, setShowCatModal] = useState(false);
  const [showTypeModal, setShowTypeModal] = useState(false);
  const [editingCat, setEditingCat] = useState<Partial<ItemCategoryDef> | null>(null);
  const [editingType, setEditingType] = useState<Partial<ItemTypeDef> | null>(null);

  // Template Builder State
  const [builderTab, setBuilderTab] = useState<'CONTENT' | 'SETTINGS'>('CONTENT');

  const logoInputRef = useRef<HTMLInputElement>(null);

  const isAdmin = currentUser.role === UserRole.ADMIN;

  useEffect(() => {
    SettingsService.get().then(setSettings);
    refreshUsers();
    DepartmentService.getAll().then(setDepartments);
    
    setProfileForm({
      name: currentUser.name,
      email: currentUser.email,
      designation: currentUser.designation || '',
      phone: currentUser.phone || ''
    });
    setSignature(currentUser.signatureUrl || '');
  }, [currentUser]);

  const refreshUsers = async () => {
    const u = await UserService.getAll();
    setUsers(u);
  };

  const handleSave = async () => {
    if (settings && isAdmin) {
      setIsSaving(true);
      await SettingsService.update(settings);
      setTimeout(() => setIsSaving(false), 800);
    }
  };

  const handleProfileUpdate = async () => {
     setIsSaving(true);
     const updatedUser = { 
        ...currentUser, 
        name: profileForm.name,
        email: profileForm.email,
        designation: profileForm.designation,
        phone: profileForm.phone,
        signatureUrl: signature
     };
     await UserService.update(updatedUser);
     setCurrentUser(updatedUser);
     setIsSaving(false);
     alert("Profile updated successfully.");
  };

  const handleUserSwitch = (id: string) => {
    const newUser = AuthService.switchUser(id);
    setCurrentUser(newUser);
    window.location.reload();
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && settings) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSettings({ ...settings, logoUrl: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const testComm = async (type: 'EMAIL' | 'SMS') => {
      if (!settings) return;
      const config = type === 'EMAIL' ? settings.emailIntegration : settings.smsIntegration;
      if (!config) return;

      setTestStatus({ type, status: 'TESTING' });
      const success = await CommunicationService.testConnection(config, type);
      setTestStatus({ type, status: success ? 'SUCCESS' : 'FAILED' });
      
      setTimeout(() => setTestStatus({ type, status: 'IDLE' }), 3000);
  };

  // --- Category Logic ---
  const handleSaveCat = async () => {
    if (!settings || !editingCat?.name || !editingCat?.code) return;
    const newCat = { 
        ...editingCat, 
        id: editingCat.id || Math.random().toString(36).substr(2, 9) 
    } as ItemCategoryDef;
    
    const categories = editingCat.id 
        ? settings.categories.map(c => c.id === editingCat.id ? newCat : c)
        : [...settings.categories, newCat];
    
    setSettings({ ...settings, categories });
    setShowCatModal(false);
  };

  const removeCat = (id: string) => {
    if (!settings) return;
    setSettings({
        ...settings,
        categories: settings.categories.filter(c => c.id !== id),
        itemTypes: settings.itemTypes.filter(t => t.categoryId !== id)
    });
  };

  // --- Type Logic ---
  const handleSaveType = async () => {
    if (!settings || !editingType?.name || !editingType?.code || !editingType?.categoryId) return;
    const newType = { 
        ...editingType, 
        id: editingType.id || Math.random().toString(36).substr(2, 9) 
    } as ItemTypeDef;

    const itemTypes = editingType.id 
        ? settings.itemTypes.map(t => t.id === editingType.id ? newType : t)
        : [...settings.itemTypes, newType];
    
    setSettings({ ...settings, itemTypes });
    setShowTypeModal(false);
  };

  const removeType = (id: string) => {
    if (!settings) return;
    setSettings({
        ...settings,
        itemTypes: settings.itemTypes.filter(t => t.id !== id)
    });
  };

  // --- Department Logic ---
  const handleSaveDept = async () => {
      if (editingDept && editingDept.name && editingDept.code) {
          if (editingDept.id) {
              await DepartmentService.update(editingDept as Department);
          } else {
              await DepartmentService.add(editingDept as Omit<Department, 'id'>);
          }
          setDepartments(await DepartmentService.getAll());
          setShowDeptModal(false);
      }
  };

  const openEditDept = (dept: Department) => {
      setEditingDept({...dept});
      setShowDeptModal(true);
  };

  // --- User Management Logic ---
  const handleSaveUser = async () => {
    if (editingUser && editingUser.name && editingUser.email) {
      if (editingUser.id) {
        await UserService.update(editingUser as User);
      } else {
        await UserService.add(editingUser as Omit<User, 'id'>);
      }
      await refreshUsers();
      setShowUserModal(false);
    }
  };

  const openEditUser = (user: User) => {
    setEditingUser({ ...user });
    setShowUserModal(true);
  };

  const handleResetPassword = async (user: User) => {
      if (confirm(`Send a password reset link to ${user.email}?`)) {
          try {
              await UserService.resetPassword(user.id);
              alert(`Reset link sent to ${user.email}`);
          } catch (e) {
              alert("Failed to initiate password reset.");
          }
      }
  };

  // --- Builder Logic ---
  const addBlock = (type: TemplateBlock['type']) => {
    if (!settings || !isAdmin) return;
    const newBlock: TemplateBlock = {
        id: Math.random().toString(36).substr(2, 9),
        type,
        content: type === 'title' ? 'New Title Here' : type === 'text' ? 'Enter your text content here...' : '',
    };
    const currentBlocks = settings.templateConfig.customBlocks || [];
    setSettings({
        ...settings,
        templateConfig: {
            ...settings.templateConfig,
            customBlocks: [...currentBlocks, newBlock]
        }
    });
  };

  const updateBlock = (id: string, content: string) => {
      if (!settings || !isAdmin) return;
      const blocks = settings.templateConfig.customBlocks?.map(b => b.id === id ? { ...b, content } : b) || [];
      setSettings({
          ...settings,
          templateConfig: { ...settings.templateConfig, customBlocks: blocks }
      });
  };

  const removeBlock = (id: string) => {
      if (!settings || !isAdmin) return;
      const blocks = settings.templateConfig.customBlocks?.filter(b => b.id !== id) || [];
      setSettings({
          ...settings,
          templateConfig: { ...settings.templateConfig, customBlocks: blocks }
      });
  };

  if (!settings) return <div>Loading settings...</div>;

  const NavItem = ({ id, label, icon: Icon }: any) => (
    <button
      onClick={() => setActiveSection(id)}
      className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors mb-1 ${
        activeSection === id ? 'bg-gov-100 text-gov-800' : 'text-slate-600 hover:bg-slate-50'
      }`}
    >
      <Icon className="w-4 h-4" />
      {label}
    </button>
  );

  const managers = users.filter(u => u.role === UserRole.MANAGER || u.role === UserRole.ADMIN);
  const supervisors = users.filter(u => u.role === UserRole.SUPERVISOR);

  return (
    <div className="flex flex-col md:flex-row gap-6 max-w-7xl h-[calc(100vh-100px)]">
      <div className="w-full md:w-64 flex-shrink-0">
         <Card className="h-full">
            <h3 className="font-bold text-slate-800 mb-4 px-2">Settings</h3>
            <nav className="space-y-1">
               <NavItem id="PROFILE" label="User Profile" icon={UserIcon} />
               
               {isAdmin && (
                 <>
                   <div className="text-[10px] font-bold text-slate-400 uppercase mt-4 mb-2 px-4 tracking-widest">Administration</div>
                   <NavItem id="DEPARTMENTS" label="Departments" icon={Layers} />
                   <NavItem id="USERS" label="User Management" icon={Users} />
                   <NavItem id="ORG" label="Organization Details" icon={Building} />
                   <NavItem id="PREFIXES" label="Identifiers & Prefixes" icon={FileText} />
                   <NavItem id="ITEMS" label="Categories & Types" icon={Tags} />
                   <NavItem id="TEMPLATE" label="Template Builder" icon={LayoutTemplate} />
                   <NavItem id="INTEGRATIONS" label="External Delivery" icon={Share2} />
                 </>
               )}
            </nav>
         </Card>
      </div>

      <div className="flex-1 overflow-hidden flex flex-col">
        {isAdmin && activeSection === 'TEMPLATE' ? (
            <div className="flex h-full border border-slate-300 rounded-lg overflow-hidden bg-slate-100">
                <div className="flex-1 overflow-auto p-8 flex justify-center bg-[#525659]">
                    <div className="w-[210mm] min-h-[297mm] bg-white shadow-lg p-[15mm] flex flex-col relative transition-all">
                        <div className="border-b-2 border-black pb-4 mb-6 opacity-50 pointer-events-none grayscale">
                            <div className="flex justify-between items-center">
                                <div>
                                    <h1 className="text-xl font-bold uppercase">{settings.officeName}</h1>
                                    <p className="text-xs">{settings.officeAddress}</p>
                                </div>
                                <div className="w-16 h-16 flex items-center justify-center">
                                  {settings.logoUrl ? (
                                    <img src={settings.logoUrl} alt="Logo" className="max-h-16 object-contain" />
                                  ) : (
                                    <div className="w-16 h-16 bg-slate-200 flex items-center justify-center text-[10px]">LOGO</div>
                                  )}
                                </div>
                            </div>
                        </div>

                        <div className="flex-1 border-2 border-dashed border-blue-200 rounded p-4 min-h-[200px] relative group">
                            {settings.templateConfig.customBlocks?.map((block) => (
                                <div key={block.id} className="relative group/block hover:ring-2 hover:ring-blue-400 hover:ring-offset-2 rounded p-2 transition-all">
                                    <div className="absolute -right-3 -top-3 hidden group-hover/block:flex gap-1">
                                        <button onClick={() => removeBlock(block.id)} className="bg-red-500 text-white p-1 rounded-full shadow hover:bg-red-600">
                                            <Trash2 className="w-3 h-3" />
                                        </button>
                                    </div>
                                    
                                    {block.type === 'title' && (
                                        <input 
                                            className="w-full text-lg font-bold border-none focus:ring-0 bg-transparent"
                                            value={block.content}
                                            onChange={(e) => updateBlock(block.id, e.target.value)}
                                        />
                                    )}
                                    {block.type === 'text' && (
                                        <textarea 
                                            className="w-full text-sm resize-none border-none focus:ring-0 bg-transparent"
                                            value={block.content}
                                            onChange={(e) => updateBlock(block.id, e.target.value)}
                                            rows={3}
                                        />
                                    )}
                                    {block.type === 'divider' && <hr className="border-black my-2" />}
                                    {block.type === 'signature' && (
                                        <div className="mt-4 pt-8 border-t border-black w-48">
                                            <input 
                                                className="w-full text-xs font-bold uppercase border-none focus:ring-0 bg-transparent"
                                                value={block.content || 'Authorized Signature'}
                                                onChange={(e) => updateBlock(block.id, e.target.value)}
                                            />
                                        </div>
                                    )}
                                    {block.type === 'image' && <div className="h-24 bg-slate-100 flex items-center justify-center text-slate-400 border border-slate-300 rounded"><ImageIcon className="w-8 h-8 opacity-50" /></div>}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="w-80 bg-white border-l border-slate-200 flex flex-col shadow-xl z-10">
                    <div className="flex border-b border-slate-200">
                        <button onClick={() => setBuilderTab('CONTENT')} className={`flex-1 py-3 text-sm font-medium ${builderTab === 'CONTENT' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-600'}`}>CONTENT</button>
                        <button onClick={() => setBuilderTab('SETTINGS')} className={`flex-1 py-3 text-sm font-medium ${builderTab === 'SETTINGS' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-600'}`}>SETTINGS</button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 bg-slate-50/50">
                        {builderTab === 'CONTENT' && (
                            <div className="grid grid-cols-2 gap-3">
                                <button onClick={() => addBlock('title')} className="flex flex-col items-center justify-center p-4 bg-white border border-slate-200 rounded hover:shadow-md transition-all group">
                                    <Type className="w-8 h-8 text-slate-400 group-hover:text-blue-500 mb-2" /><span className="text-xs font-semibold text-slate-600">Title</span>
                                </button>
                                <button onClick={() => addBlock('text')} className="flex flex-col items-center justify-center p-4 bg-white border border-slate-200 rounded hover:shadow-md transition-all group">
                                    <AlignLeft className="w-8 h-8 text-slate-400 group-hover:text-blue-500 mb-2" /><span className="text-xs font-semibold text-slate-600">Text</span>
                                </button>
                                <button onClick={() => addBlock('divider')} className="flex flex-col items-center justify-center p-4 bg-white border border-slate-200 rounded hover:shadow-md transition-all group">
                                    <Minus className="w-8 h-8 text-slate-400 group-hover:text-blue-500 mb-2" /><span className="text-xs font-semibold text-slate-600">Divider</span>
                                </button>
                                <button onClick={() => addBlock('signature')} className="flex flex-col items-center justify-center p-4 bg-white border border-slate-200 rounded hover:shadow-md transition-all group">
                                    <PenTool className="w-8 h-8 text-slate-400 group-hover:text-blue-500 mb-2" /><span className="text-xs font-semibold text-slate-600">Signature</span>
                                </button>
                            </div>
                        )}
                    </div>
                    <div className="p-4 border-t border-slate-200 bg-white">
                        <Button onClick={handleSave} className="w-full" disabled={isSaving}>Save Template</Button>
                    </div>
                </div>
            </div>
        ) : (
          <div className="overflow-y-auto h-full pr-2">
            {activeSection === 'PROFILE' && (
              <div className="space-y-6">
                <Card title="Personal Information">
                   <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                         <Input label="Full Name" value={profileForm.name} onChange={e => setProfileForm({...profileForm, name: e.target.value})} className="mb-0"/>
                         <Input label="Email Address" value={profileForm.email} onChange={e => setProfileForm({...profileForm, email: e.target.value})} className="mb-0"/>
                         <Input label="Designation" value={profileForm.designation} onChange={e => setProfileForm({...profileForm, designation: e.target.value})} className="mb-0"/>
                         <Input label="Phone Number" value={profileForm.phone} onChange={e => setProfileForm({...profileForm, phone: e.target.value})} className="mb-0"/>
                      </div>
                      <div className="flex justify-end pt-2">
                          <Button onClick={handleProfileUpdate} icon={Save} disabled={isSaving}>Save Profile</Button>
                      </div>
                   </div>
                </Card>

                <Card title="Digital Signature">
                   <SignaturePad label="Sign here to save your official signature" onChange={setSignature} initialValue={signature} />
                   <div className="flex justify-end pt-2">
                       <Button onClick={handleProfileUpdate} icon={PenTool} disabled={isSaving}>Update Signature</Button>
                   </div>
                </Card>

                <div className="bg-yellow-50 p-4 rounded border border-yellow-200">
                    <h4 className="font-bold text-yellow-800 mb-2 flex items-center"><RefreshCw className="w-4 h-4 mr-2"/> Switch Role Context (Debug)</h4>
                    <select className="w-full border p-2 rounded text-sm bg-white" value={currentUser.id} onChange={(e) => handleUserSwitch(e.target.value)}>
                      {AuthService.getAllUsers().map(u => (
                        <option key={u.id} value={u.id}>{u.name} - {u.role}</option>
                      ))}
                    </select>
                </div>
              </div>
            )}

            {isAdmin && activeSection === 'INTEGRATIONS' && (
                <div className="space-y-6 pb-12">
                   <Card title="External Notification Delivery">
                      <p className="text-sm text-slate-500 mb-6">Connect GovTrack to real communication providers to deliver critical alerts directly to users' phones and inboxes.</p>
                      
                      {/* Email SMTP Config */}
                      <div className="border-b border-slate-100 pb-8 mb-8">
                         <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                               <AtSign className="w-5 h-5 text-gov-600" />
                               <h4 className="font-bold text-slate-800">Email Gateway (SMTP)</h4>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input 
                                    type="checkbox" 
                                    className="sr-only peer" 
                                    checked={settings.emailIntegration?.enabled}
                                    onChange={e => setSettings({...settings, emailIntegration: {...(settings.emailIntegration || {enabled: false, type: 'SMTP'}), enabled: e.target.checked}})}
                                />
                                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gov-600"></div>
                                <span className="ml-3 text-xs font-bold text-slate-500 uppercase">{settings.emailIntegration?.enabled ? 'Active' : 'Disabled'}</span>
                            </label>
                         </div>
                         
                         <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 transition-opacity ${settings.emailIntegration?.enabled ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
                             <Input label="SMTP Host" placeholder="smtp.mailtrap.io" value={settings.emailIntegration?.host} onChange={e => setSettings({...settings, emailIntegration: {...settings.emailIntegration!, host: e.target.value}})} />
                             <Input label="SMTP Port" placeholder="587" type="number" value={settings.emailIntegration?.port} onChange={e => setSettings({...settings, emailIntegration: {...settings.emailIntegration!, port: parseInt(e.target.value)}})} />
                             <Input label="Username" value={settings.emailIntegration?.username} onChange={e => setSettings({...settings, emailIntegration: {...settings.emailIntegration!, username: e.target.value}})} />
                             <Input label="Password" type="password" value={settings.emailIntegration?.password} onChange={e => setSettings({...settings, emailIntegration: {...settings.emailIntegration!, password: e.target.value}})} />
                             <Input label="Sender Email" placeholder="alerts@gov.entity" value={settings.emailIntegration?.senderEmail} onChange={e => setSettings({...settings, emailIntegration: {...settings.emailIntegration!, senderEmail: e.target.value}})} />
                             
                             <div className="flex items-end pb-4">
                                <Button 
                                    size="sm" 
                                    variant="secondary" 
                                    onClick={() => testComm('EMAIL')}
                                    disabled={testStatus.status === 'TESTING'}
                                >
                                    {testStatus.type === 'EMAIL' && testStatus.status === 'TESTING' ? 'Testing...' : 
                                     testStatus.type === 'EMAIL' && testStatus.status === 'SUCCESS' ? 'Connection OK' : 
                                     testStatus.type === 'EMAIL' && testStatus.status === 'FAILED' ? 'Test Failed' : 'Test Connection'}
                                </Button>
                             </div>
                         </div>
                      </div>

                      {/* SMS Gateway Config */}
                      <div>
                         <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                               <Smartphone className="w-5 h-5 text-gov-600" />
                               <h4 className="font-bold text-slate-800">SMS Gateway (Twilio/API)</h4>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input 
                                    type="checkbox" 
                                    className="sr-only peer" 
                                    checked={settings.smsIntegration?.enabled}
                                    onChange={e => setSettings({...settings, smsIntegration: {...(settings.smsIntegration || {enabled: false, type: 'API'}), enabled: e.target.checked}})}
                                />
                                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gov-600"></div>
                                <span className="ml-3 text-xs font-bold text-slate-500 uppercase">{settings.smsIntegration?.enabled ? 'Active' : 'Disabled'}</span>
                            </label>
                         </div>

                         <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 transition-opacity ${settings.smsIntegration?.enabled ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
                             <Input label="API Key / SID" value={settings.smsIntegration?.apiKey} onChange={e => setSettings({...settings, smsIntegration: {...settings.smsIntegration!, apiKey: e.target.value}})} />
                             <Input label="API Secret / Auth Token" type="password" value={settings.smsIntegration?.apiSecret} onChange={e => setSettings({...settings, smsIntegration: {...settings.smsIntegration!, apiSecret: e.target.value}})} />
                             <Input label="Sender ID" placeholder="GOVTRACK" value={settings.smsIntegration?.senderId} onChange={e => setSettings({...settings, smsIntegration: {...settings.smsIntegration!, senderId: e.target.value}})} />
                             
                             <div className="flex items-end pb-4">
                                <Button 
                                    size="sm" 
                                    variant="secondary" 
                                    onClick={() => testComm('SMS')}
                                    disabled={testStatus.status === 'TESTING'}
                                >
                                    {testStatus.type === 'SMS' && testStatus.status === 'TESTING' ? 'Testing...' : 
                                     testStatus.type === 'SMS' && testStatus.status === 'SUCCESS' ? 'Connection OK' : 
                                     testStatus.type === 'SMS' && testStatus.status === 'FAILED' ? 'Test Failed' : 'Test Connection'}
                                </Button>
                             </div>
                         </div>
                      </div>

                      <div className="flex justify-end pt-8 border-t mt-6">
                         <Button onClick={handleSave} icon={Save} disabled={isSaving}>Save Integration Settings</Button>
                      </div>
                   </Card>
                </div>
            )}

            {isAdmin && activeSection === 'ITEMS' && (
                <div className="space-y-6 pb-20">
                    <Card title="Manage Item Categories">
                        <div className="flex justify-between items-center mb-4">
                            <p className="text-xs text-slate-500">Add or remove broad categories for inventory and assets.</p>
                            <Button size="sm" icon={Plus} onClick={() => { setEditingCat({ name: '', code: '' }); setShowCatModal(true); }}>Add Category</Button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                            {settings.categories.map(cat => (
                                <div key={cat.id} className="p-3 border rounded-lg bg-white shadow-sm flex justify-between items-center group">
                                    <div>
                                        <p className="text-sm font-bold text-slate-800">{cat.name}</p>
                                        <p className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">Code: {cat.code}</p>
                                    </div>
                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => { setEditingCat(cat); setShowCatModal(true); }} className="p-1.5 text-slate-400 hover:text-gov-600"><Edit2 className="w-3.5 h-3.5"/></button>
                                        <button onClick={() => removeCat(cat.id)} className="p-1.5 text-slate-400 hover:text-red-600"><Trash2 className="w-3.5 h-3.5"/></button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Card>

                    <Card title="Manage Product Types">
                        <div className="flex justify-between items-center mb-4">
                            <p className="text-xs text-slate-500">Define sub-types linked to categories for precise classification.</p>
                            <Button size="sm" icon={Plus} onClick={() => { setEditingType({ name: '', code: '', categoryId: settings.categories[0]?.id }); setShowTypeModal(true); }}>Add Product Type</Button>
                        </div>
                        <div className="space-y-4">
                            {settings.categories.map(cat => {
                                const types = settings.itemTypes.filter(t => t.categoryId === cat.id);
                                if (types.length === 0) return null;
                                return (
                                    <div key={cat.id} className="border-b border-slate-100 last:border-0 pb-4">
                                        <h4 className="text-[10px] font-bold text-slate-400 uppercase mb-3 flex items-center gap-1.5">
                                            <Package className="w-3 h-3"/> {cat.name} Types
                                        </h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                            {types.map(t => (
                                                <div key={t.id} className="p-3 border border-dashed rounded bg-slate-50/50 flex justify-between items-center group">
                                                    <div>
                                                        <p className="text-xs font-semibold text-slate-700">{t.name}</p>
                                                        <p className="text-[9px] font-mono text-slate-400">Code: {t.code}</p>
                                                    </div>
                                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button onClick={() => { setEditingType(t); setShowTypeModal(true); }} className="p-1 text-slate-400 hover:text-gov-600"><Edit2 className="w-3 h-3"/></button>
                                                        <button onClick={() => removeType(t.id)} className="p-1 text-slate-400 hover:text-red-600"><Trash2 className="w-3 h-3"/></button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </Card>
                    <div className="flex justify-end pt-4">
                       <Button onClick={handleSave} icon={Save} disabled={isSaving}>Save All Item Config</Button>
                    </div>
                </div>
            )}

            {isAdmin && activeSection === 'DEPARTMENTS' && (
               <Card title="Department Management">
                  <div className="flex justify-between items-center mb-6">
                      <p className="text-sm text-slate-500">Configure departments and assign Managers/Supervisors.</p>
                      <Button size="sm" icon={Plus} onClick={() => { setEditingDept({ name: '', code: '' }); setShowDeptModal(true); }}>New Department</Button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {departments.map(dept => {
                          const manager = users.find(u => u.id === dept.managerId);
                          const supervisor = users.find(u => u.id === dept.supervisorId);
                          return (
                              <div key={dept.id} className="p-4 border rounded-lg bg-white shadow-sm hover:border-gov-300 transition-all flex flex-col">
                                  <div className="flex justify-between items-start mb-4">
                                      <div>
                                          <h4 className="font-bold text-slate-800">{dept.name}</h4>
                                          <span className="text-[10px] font-mono font-bold bg-slate-100 px-1.5 py-0.5 rounded text-slate-500">{dept.code}</span>
                                      </div>
                                      <button onClick={() => openEditDept(dept)} className="text-slate-400 hover:text-gov-600"><Edit2 className="w-4 h-4"/></button>
                                  </div>
                                  <div className="space-y-3 mt-auto border-t pt-4">
                                      <div className="flex items-center gap-3">
                                          <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 flex-shrink-0"><UserCheck className="w-4 h-4"/></div>
                                          <div className="truncate">
                                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Manager</p>
                                              <p className="text-xs font-medium text-slate-700 truncate">{manager?.name || 'Unassigned'}</p>
                                          </div>
                                      </div>
                                      <div className="flex items-center gap-3">
                                          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 flex-shrink-0"><Briefcase className="w-4 h-4"/></div>
                                          <div className="truncate">
                                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Supervisor</p>
                                              <p className="text-xs font-medium text-slate-700 truncate">{supervisor?.name || 'Unassigned'}</p>
                                          </div>
                                      </div>
                                  </div>
                              </div>
                          );
                      })}
                  </div>
               </Card>
            )}

            {isAdmin && activeSection === 'ORG' && (
               <div className="space-y-6">
                 <Card title="Organization Branding">
                    <div className="flex flex-col md:flex-row gap-8 items-start">
                       <div className="w-32 h-32 rounded-lg border-2 border-dashed border-slate-300 flex flex-col items-center justify-center bg-slate-50 overflow-hidden relative group">
                          {settings.logoUrl ? (
                            <>
                               <img src={settings.logoUrl} alt="Logo Preview" className="w-full h-full object-contain p-2" />
                               <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity cursor-pointer" onClick={() => logoInputRef.current?.click()}>
                                  <RefreshCw className="w-6 h-6 text-white" />
                               </div>
                            </>
                          ) : (
                            <div className="flex flex-col items-center gap-1 text-slate-400 cursor-pointer" onClick={() => logoInputRef.current?.click()}>
                               <Upload className="w-6 h-6" />
                               <span className="text-[10px] font-bold">UPLOAD LOGO</span>
                            </div>
                          )}
                          <input 
                            type="file" 
                            ref={logoInputRef} 
                            onChange={handleLogoUpload} 
                            accept="image/*" 
                            className="hidden" 
                          />
                       </div>
                       <div className="flex-1 space-y-4">
                          <p className="text-sm text-slate-600">Official logo of the Government Entity. This will appear on all system-generated documents and reports.</p>
                          <Button size="sm" variant="outline" onClick={() => logoInputRef.current?.click()}>Change Image</Button>
                          <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                             <input 
                               type="checkbox" 
                               checked={settings.templateConfig.showLogo} 
                               onChange={e => setSettings({...settings, templateConfig: {...settings.templateConfig, showLogo: e.target.checked}})}
                               className="rounded text-gov-600 focus:ring-gov-500"
                             />
                             Show logo on official document headers
                          </label>
                       </div>
                    </div>
                 </Card>

                 <Card title="Detailed Information">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                       <div className="md:col-span-2">
                          <Input label="Entity Legal Name" value={settings.officeName} onChange={e => setSettings({...settings, officeName: e.target.value})} className="mb-0" />
                       </div>
                       
                       <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-slate-700 mb-1">Official Address</label>
                          <textarea 
                             className="flex w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gov-500 h-20 resize-none"
                             value={settings.officeAddress}
                             onChange={e => setSettings({...settings, officeAddress: e.target.value})}
                          />
                       </div>

                       <div className="space-y-4">
                          <Input label="Office Phone" icon={Phone} value={settings.phone || ''} onChange={e => setSettings({...settings, phone: e.target.value})} className="mb-0 pl-10" />
                          <Input label="Website" icon={Globe} value={settings.website || ''} onChange={e => setSettings({...settings, website: e.target.value})} className="mb-0 pl-10" />
                       </div>

                       <div className="space-y-4">
                          <Input label="Entity Email" icon={Mail} value={settings.email || ''} onChange={e => setSettings({...settings, email: e.target.value})} className="mb-0 pl-10" />
                          <Input label="Tax/VAT ID" icon={Hash} value={settings.taxId || ''} onChange={e => setSettings({...settings, taxId: e.target.value})} className="mb-0 pl-10" />
                       </div>
                    </div>
                    <div className="flex justify-end pt-8 border-t mt-6">
                       <Button onClick={handleSave} icon={Save} disabled={isSaving}>Save Organization Details</Button>
                    </div>
                 </Card>
               </div>
            )}

            {isAdmin && activeSection === 'PREFIXES' && (
               <Card title="Document Identifiers & Prefixes">
                  <p className="text-sm text-slate-500 mb-6">Configure the core identification codes and prefixes used to generate official reference numbers for assets and procurement flows.</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
                     <div className="space-y-4">
                        <div className="flex items-center gap-2 mb-2">
                            <Building className="w-4 h-4 text-gov-600" />
                            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Entity Identification</h4>
                        </div>
                        <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                            <Input 
                                label="Government Office Code" 
                                value={settings.officeCode} 
                                onChange={e => setSettings({...settings, officeCode: e.target.value})} 
                                placeholder="e.g. 263"
                                maxLength={5}
                                className="font-mono bg-white"
                            />
                            <div className="flex items-start gap-2 mt-1">
                                <Info className="w-3 h-3 text-slate-400 mt-0.5 flex-shrink-0" />
                                <p className="text-[10px] text-slate-500 leading-normal italic">
                                    The Office Code acts as the unique identifier for this entity. It is used as the primary prefix segment for all Inventory IDs, Asset Tags, and GSRF forms.
                                </p>
                            </div>
                        </div>

                        <div className="mt-6 flex items-center gap-2 mb-2">
                            <FileText className="w-4 h-4 text-gov-600" />
                            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Reference Prefixes (Cont.)</h4>
                        </div>
                        <div className="space-y-4">
                           <Input label="Price Evaluation (PEF) Prefix" value={settings.prefixes.pef} onChange={e => setSettings({...settings, prefixes: {...settings.prefixes, pef: e.target.value}})} className="mb-0" />
                           <Input label="Completion Certificate Prefix" value={settings.prefixes.cert} onChange={e => setSettings({...settings, prefixes: {...settings.prefixes, cert: e.target.value}})} className="mb-0" />
                        </div>
                     </div>
                     
                     <div className="space-y-4">
                        <div className="flex items-center gap-2 mb-2">
                            <FileText className="w-4 h-4 text-gov-600" />
                            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Document Serial Prefixes</h4>
                        </div>
                        <div className="space-y-4">
                           <div className="grid grid-cols-2 gap-4">
                              <Input label="Requisition (GSRF)" value={settings.prefixes.gsrf} onChange={e => setSettings({...settings, prefixes: {...settings.prefixes, gsrf: e.target.value}})} className="mb-0" />
                              <Input label="Inventory Prefix" value={settings.prefixes.inventory} onChange={e => setSettings({...settings, prefixes: {...settings.prefixes, inventory: e.target.value}})} className="mb-0" />
                           </div>
                           <div className="grid grid-cols-2 gap-4">
                              <Input label="Purchase Request (PR)" value={settings.prefixes.pr} onChange={e => setSettings({...settings, prefixes: {...settings.prefixes, pr: e.target.value}})} className="mb-0" />
                              <Input label="Service Request (SR)" value={settings.prefixes.sr} onChange={e => setSettings({...settings, prefixes: {...settings.prefixes, sr: e.target.value}})} className="mb-0" />
                           </div>
                           <div className="grid grid-cols-2 gap-4">
                              <Input label="Purchase Order (PO)" value={settings.prefixes.po} onChange={e => setSettings({...settings, prefixes: {...settings.prefixes, po: e.target.value}})} className="mb-0" />
                              <Input label="Service Order (SO)" value={settings.prefixes.so} onChange={e => setSettings({...settings, prefixes: {...settings.prefixes, so: e.target.value}})} className="mb-0" />
                           </div>
                           <Input label="Asset Tag Prefix" value={settings.prefixes.asset} onChange={e => setSettings({...settings, prefixes: {...settings.prefixes, asset: e.target.value}})} className="mb-0" />
                        </div>
                     </div>
                  </div>

                  <div className="mt-8 p-4 bg-blue-50 border border-blue-100 rounded-lg">
                      <h5 className="text-[10px] font-bold text-blue-800 uppercase mb-2">Reference Preview</h5>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                              <p className="text-[9px] text-blue-600 font-medium">Sample GSRF Format:</p>
                              <p className="text-xs font-mono font-bold text-blue-900">{settings.prefixes.gsrf}/{settings.officeCode}/{new Date().getFullYear()}/001</p>
                          </div>
                          <div>
                              <p className="text-[9px] text-blue-600 font-medium">Sample Asset ID:</p>
                              <p className="text-xs font-mono font-bold text-blue-900">{settings.officeCode}|{new Date().getFullYear()}|01|001|001</p>
                          </div>
                      </div>
                  </div>

                  <div className="flex justify-end pt-8 border-t mt-6">
                     <Button onClick={handleSave} icon={Save} disabled={isSaving}>Update System Identifiers</Button>
                  </div>
               </Card>
            )}

            {isAdmin && activeSection === 'USERS' && (
              <Card title="User Management">
                <div className="flex justify-between items-center mb-6">
                  <p className="text-sm text-slate-500">Create, edit and manage system access for entity personnel.</p>
                  <Button size="sm" icon={Plus} onClick={() => { setEditingUser({ name: '', email: '', role: UserRole.USER, department: departments[0]?.name || 'Finance' }); setShowUserModal(true); }}>Add User</Button>
                </div>
                <div className="overflow-x-auto">
                   <table className="min-w-full divide-y divide-slate-200">
                     <thead className="bg-slate-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">User</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Role</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Department</th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Action</th>
                        </tr>
                     </thead>
                     <tbody className="bg-white divide-y divide-slate-200">
                        {users.map(u => (
                          <tr key={u.id} className="hover:bg-slate-50">
                            <td className="px-6 py-4">
                              <div className="text-sm font-medium text-slate-900">{u.name}</div>
                              <div className="text-xs text-slate-500">{u.email}</div>
                            </td>
                            <td className="px-6 py-4">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${
                                u.role === UserRole.ADMIN ? 'bg-purple-100 text-purple-800' :
                                u.role === UserRole.STOCK_KEEPER ? 'bg-blue-100 text-blue-800' :
                                u.role === UserRole.MANAGER ? 'bg-emerald-100 text-emerald-800' :
                                'bg-slate-100 text-slate-800'
                              }`}>
                                {u.role}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-sm text-slate-500 font-medium">{u.department}</td>
                            <td className="px-6 py-4 text-right text-sm font-medium">
                                <div className="flex justify-end gap-2">
                                  <button 
                                    onClick={() => handleResetPassword(u)} 
                                    className="p-2 text-amber-600 hover:bg-amber-50 rounded-full transition-colors"
                                    title="Reset Password"
                                  >
                                    <Key className="w-4 h-4"/>
                                  </button>
                                  <button 
                                    onClick={() => openEditUser(u)} 
                                    className="p-2 text-gov-600 hover:bg-gov-50 rounded-full transition-colors"
                                    title="Edit User"
                                  >
                                    <Edit2 className="w-4 h-4"/>
                                  </button>
                                </div>
                            </td>
                          </tr>
                        ))}
                     </tbody>
                   </table>
                </div>
              </Card>
            )}
          </div>
        )}
      </div>

      {/* Category Modal */}
      {showCatModal && editingCat && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
              <div className="bg-white p-6 rounded-lg w-full max-w-sm shadow-2xl">
                  <h3 className="text-lg font-bold mb-4">{editingCat.id ? 'Edit Category' : 'New Category'}</h3>
                  <div className="space-y-4">
                      <Input label="Category Name" value={editingCat.name} onChange={e => setEditingCat({...editingCat, name: e.target.value})} placeholder="e.g. Stationery" />
                      <Input label="Category Code" value={editingCat.code} onChange={e => setEditingCat({...editingCat, code: e.target.value})} placeholder="e.g. 01" />
                  </div>
                  <div className="flex justify-end gap-2 mt-8">
                      <Button variant="outline" onClick={() => setShowCatModal(false)}>Cancel</Button>
                      <Button onClick={handleSaveCat}>Save</Button>
                  </div>
              </div>
          </div>
      )}

      {/* Item Type Modal */}
      {showTypeModal && editingType && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
              <div className="bg-white p-6 rounded-lg w-full max-w-sm shadow-2xl">
                  <h3 className="text-lg font-bold mb-4">{editingType.id ? 'Edit Product Type' : 'New Product Type'}</h3>
                  <div className="space-y-4">
                      <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">Parent Category</label>
                          <select 
                            className="w-full h-10 rounded-md border border-slate-300 bg-white px-3 text-sm focus:outline-none"
                            value={editingType.categoryId}
                            onChange={e => setEditingType({...editingType, categoryId: e.target.value})}
                          >
                              {settings.categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                          </select>
                      </div>
                      <Input label="Type Name" value={editingType.name} onChange={e => setEditingType({...editingType, name: e.target.value})} placeholder="e.g. Copier Paper" />
                      <Input label="Type Code" value={editingType.code} onChange={e => setEditingType({...editingType, code: e.target.value})} placeholder="e.g. 001" />
                  </div>
                  <div className="flex justify-end gap-2 mt-8">
                      <Button variant="outline" onClick={() => setShowTypeModal(false)}>Cancel</Button>
                      <Button onClick={handleSaveType}>Save</Button>
                  </div>
              </div>
          </div>
      )}

      {/* User Modal */}
      {showUserModal && editingUser && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200">
            <div className="bg-slate-50 px-6 py-4 border-b flex justify-between items-center">
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                {editingUser.id ? <Edit2 className="w-5 h-5 text-gov-600" /> : <Plus className="w-5 h-5 text-gov-600" />}
                {editingUser.id ? 'Edit User Access' : 'Create New System User'}
              </h3>
              <button onClick={() => setShowUserModal(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Input label="Full Name" value={editingUser.name} onChange={e => setEditingUser({ ...editingUser, name: e.target.value })} placeholder="e.g. Abdullah Ahmed" />
                <Input label="Email Address" value={editingUser.email} onChange={e => setEditingUser({ ...editingUser, email: e.target.value })} placeholder="name@gov.entity" />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">System Role</label>
                  <div className="relative">
                    <select 
                      className="w-full h-10 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gov-500 appearance-none pr-8"
                      value={editingUser.role}
                      onChange={e => setEditingUser({ ...editingUser, role: e.target.value as UserRole })}
                    >
                      {Object.values(UserRole).map(role => <option key={role} value={role}>{role}</option>)}
                    </select>
                    <Shield className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Department</label>
                  <select 
                    className="w-full h-10 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gov-500"
                    value={editingUser.department}
                    onChange={e => setEditingUser({ ...editingUser, department: e.target.value })}
                  >
                    {departments.map(dept => <option key={dept.id} value={dept.name}>{dept.name}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Input label="Designation / Rank" value={editingUser.designation} onChange={e => setEditingUser({ ...editingUser, designation: e.target.value })} placeholder="e.g. Senior Officer" />
                <Input label="Phone Contact" value={editingUser.phone} onChange={e => setEditingUser({ ...editingUser, phone: e.target.value })} placeholder="+960 777-1234" />
              </div>

              {!editingUser.id && (
                <div className="p-3 bg-blue-50 border border-blue-100 rounded text-xs text-blue-700 leading-relaxed italic">
                  Note: A default password will be generated for new users. They will be prompted to change it on first login.
                </div>
              )}
            </div>

            <div className="bg-slate-50 px-6 py-4 border-t flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowUserModal(false)}>Cancel</Button>
              <Button onClick={handleSaveUser} disabled={!editingUser.name || !editingUser.email}>
                {editingUser.id ? 'Save Changes' : 'Create User'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Dept Modal */}
      {showDeptModal && editingDept && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white p-6 rounded-lg w-full max-w-md shadow-2xl">
                  <h3 className="text-lg font-bold mb-4">Configure Department</h3>
                  <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                          <Input label="Dept Name" value={editingDept.name} onChange={e => setEditingDept({...editingDept, name: e.target.value})} />
                          <Input label="Dept Code" value={editingDept.code} onChange={e => setEditingDept({...editingDept, code: e.target.value})} />
                      </div>
                      
                      <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">Assign Manager</label>
                          <select 
                            className="w-full h-10 rounded-md border border-slate-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-gov-500"
                            value={editingDept.managerId || ''}
                            onChange={e => setEditingDept({...editingDept, managerId: e.target.value})}
                          >
                              <option value="">-- No Manager Assigned --</option>
                              {managers.map(u => <option key={u.id} value={u.id}>{u.name} ({u.role})</option>)}
                          </select>
                      </div>

                      <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">Assign Supervisor</label>
                          <select 
                            className="w-full h-10 rounded-md border border-slate-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-gov-500"
                            value={editingDept.supervisorId || ''}
                            onChange={e => setEditingDept({...editingDept, supervisorId: e.target.value})}
                          >
                              <option value="">-- No Supervisor Assigned --</option>
                              {supervisors.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                          </select>
                      </div>
                  </div>
                  <div className="flex justify-end gap-2 mt-8">
                      <Button variant="outline" onClick={() => setShowDeptModal(false)}>Cancel</Button>
                      <Button onClick={handleSaveDept}>Save Department</Button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};
