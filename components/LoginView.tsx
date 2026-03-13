
import React, { useState } from 'react';
import { User, UserRole } from '../types';
import { AuthService, UserService } from '../services/mockService';
import { Lock, Shield, User as UserIcon, Users, CreditCard, Package, Briefcase, ChevronRight, ArrowLeft, MailCheck, Globe } from 'lucide-react';
import { Button, Input, Card } from './SharedComponents';

interface LoginViewProps {
  onLogin: (user: User) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Forgot Password States
  const [isForgotMode, setIsForgotMode] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [resetEmail, setResetEmail] = useState('');

  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      const user = await AuthService.login(email);
      onLogin(user);
    } catch (err) {
      setError('Invalid email or user not found.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await UserService.resetPassword(resetEmail);
      setResetSent(true);
    } catch (err) {
      setError('No user found with this email address.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = (roleEmail: string) => {
    setEmail(roleEmail);
    setPassword('demo123'); 
    AuthService.login(roleEmail).then(user => onLogin(user));
  };

  const demoRoles = [
    { role: 'Admin', email: 'admin@gov.entity', icon: Shield, color: 'bg-slate-800' },
    { role: 'Stock Keeper', email: 'jane.smith@gov.entity', icon: Package, color: 'bg-blue-600' },
    { role: 'Finance', email: 'frank.fin@gov.entity', icon: CreditCard, color: 'bg-emerald-600' },
    { role: 'Vendor Portal', email: 'vendor@techsolutions.com', icon: Globe, color: 'bg-indigo-600' },
    { role: 'Employee', email: 'john.doe@gov.entity', icon: UserIcon, color: 'bg-orange-500' },
  ];

  return (
    <div className="min-h-screen flex bg-slate-50 font-sans">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gov-900 text-white flex-col justify-between p-12 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[url('https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80')] bg-cover bg-center mix-blend-overlay"></div>
        <div className="z-10">
          <div className="flex items-center gap-3 text-2xl font-bold tracking-tight mb-2">
            <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center">
               <Shield className="w-6 h-6 text-gov-500" />
            </div>
            GovTrack <span className="text-gov-500">System</span>
          </div>
          <p className="text-gov-200">Entity Inventory & Procurement Management</p>
        </div>
        
        <div className="z-10 max-w-md">
          <blockquote className="text-xl font-serif italic mb-6">
            "Streamlining government operations through efficient asset tracking, compliant procurement workflows, and transparent auditing."
          </blockquote>
          <div className="flex gap-4 text-sm text-gov-400">
             <div className="flex items-center gap-2"><Lock className="w-4 h-4"/> Secure Access</div>
             <div className="flex items-center gap-2"><Shield className="w-4 h-4"/> Audit Trail</div>
          </div>
        </div>
        
        <div className="text-xs text-gov-600 z-10">
          © {new Date().getFullYear()} Government Entity System. Authorized Personnel Only.
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md space-y-8">
          
          {!isForgotMode ? (
            <>
              <div className="text-center lg:text-left">
                <h2 className="text-3xl font-bold text-slate-900">Sign in to your account</h2>
                <p className="mt-2 text-sm text-slate-600">Please enter your government credentials.</p>
              </div>

              <form onSubmit={handleLogin} className="space-y-6">
                 <div className="space-y-4">
                   <Input 
                     label="Email Address" 
                     type="email" 
                     value={email} 
                     onChange={e => setEmail(e.target.value)} 
                     placeholder="name@gov.entity"
                     autoFocus
                   />
                   <div>
                     <div className="flex justify-between items-center mb-1">
                       <label className="block text-sm font-medium text-slate-700">Password</label>
                       <button 
                        type="button" 
                        onClick={() => { setIsForgotMode(true); setResetSent(false); }}
                        className="text-xs text-gov-600 hover:text-gov-800 font-bold hover:underline"
                       >
                         Forgot password?
                       </button>
                     </div>
                     <Input 
                       type="password" 
                       value={password} 
                       onChange={e => setPassword(e.target.value)} 
                       placeholder="••••••••"
                       className="mb-0"
                     />
                   </div>
                 </div>
                 
                 {error && <div className="text-sm text-red-600 bg-red-50 p-3 rounded">{error}</div>}

                 <Button className="w-full h-11" type="submit" disabled={loading}>
                   {loading ? 'Authenticating...' : 'Sign In'}
                 </Button>
              </form>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-slate-50 text-slate-500">Quick Demo Access</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                 {demoRoles.map((dr) => (
                   <button 
                     key={dr.role}
                     onClick={() => handleDemoLogin(dr.email)}
                     className="flex items-center justify-between p-3 rounded-lg border border-slate-200 bg-white hover:border-gov-500 hover:shadow-sm transition-all text-left group"
                   >
                     <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full ${dr.color} flex items-center justify-center text-white`}>
                           <dr.icon className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-sm font-medium text-slate-900">{dr.role}</div>
                          <div className="text-[10px] text-slate-500">Auto-login</div>
                        </div>
                     </div>
                     <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-gov-500" />
                   </button>
                 ))}
              </div>
            </>
          ) : (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
               <button 
                 onClick={() => setIsForgotMode(false)}
                 className="flex items-center gap-2 text-sm text-slate-500 hover:text-gov-600 mb-8 font-medium group transition-colors"
               >
                 <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Back to Login
               </button>

               <div className="text-center lg:text-left mb-8">
                 <h2 className="text-3xl font-bold text-slate-900">Reset your password</h2>
                 <p className="mt-2 text-sm text-slate-600">Enter your official email address and we'll send you a link to reset your password.</p>
               </div>

               {resetSent ? (
                 <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-8 text-center flex flex-col items-center">
                    <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-4">
                      <MailCheck className="w-8 h-8" />
                    </div>
                    <h3 className="text-xl font-bold text-emerald-900 mb-2">Check your email</h3>
                    <p className="text-sm text-emerald-700 leading-relaxed">
                      We have sent a password reset link to <span className="font-bold">{resetEmail}</span>. Please check your inbox and follow the instructions.
                    </p>
                    <Button 
                      variant="outline" 
                      className="mt-6 border-emerald-200 text-emerald-700 hover:bg-emerald-100"
                      onClick={() => setIsForgotMode(false)}
                    >
                      Return to Login
                    </Button>
                 </div>
               ) : (
                 <form onSubmit={handleResetRequest} className="space-y-6">
                    <Input 
                      label="Email Address" 
                      type="email" 
                      value={resetEmail} 
                      onChange={e => setResetEmail(e.target.value)} 
                      placeholder="name@gov.entity"
                      required
                      autoFocus
                    />
                    
                    {error && <div className="text-sm text-red-600 bg-red-50 p-3 rounded">{error}</div>}

                    <Button className="w-full h-11" type="submit" disabled={loading}>
                      {loading ? 'Sending Request...' : 'Send Reset Link'}
                    </Button>
                 </form>
               )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
