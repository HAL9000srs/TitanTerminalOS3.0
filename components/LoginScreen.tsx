import React, { useState } from 'react';
import { ShieldCheck, Lock, User, ChevronRight, Loader2, UserPlus, AlertTriangle, Eye, EyeOff } from 'lucide-react';
import { userService } from '../services/userService';
import { UserProfile } from '../types';

interface LoginScreenProps {
  onLogin: (user: UserProfile) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
  const [isRegistering] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) return;
    
    setIsLoading(true);
    setError(null);

    try {
      const response = isRegistering 
        ? await userService.register(username, password)
        : await userService.login(username, password);

      if (response.success && response.user) {
        onLogin(response.user);
      } else {
        // CRITICAL: Force the use of response.message
        setError(response.message || "UNKNOWN REGISTRATION ERROR");
      }
    } catch (err) {
      setError("SYSTEM FAILURE: CONNECTION REFUSED");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen px-4">
      <div className="w-full max-w-md">
        {/* Header Branding */}
        <div className="text-center mb-8">
           <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-terminal-accent to-emerald-800 rounded-lg shadow-[0_0_30px_rgba(0,220,130,0.3)] mb-4">
              <span className="text-3xl font-bold text-black font-mono">T</span>
           </div>
           <h1 className="text-4xl font-light tracking-tight text-white mb-2 font-mono">
             TITAN<span className="text-terminal-accent">.OS</span>
           </h1>
           <p className="text-terminal-muted text-sm tracking-widest uppercase">Institutional Access Terminal</p>
        </div>

        {/* Login/Signup Card */}
        <div className="bg-terminal-panel/60 backdrop-blur-md border border-terminal-border/50 rounded-xl p-8 shadow-2xl relative overflow-hidden transition-all duration-300">
           {/* Decorative top bar */}
           <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent ${isRegistering ? 'via-blue-500' : 'via-terminal-accent'} to-transparent opacity-50`}></div>
           
           <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold text-white tracking-wide">
                SECURE LOGIN
              </h2>
           </div>

           {error && (
             <div className="mb-4 bg-red-500/10 border border-red-500/20 text-red-500 p-3 rounded flex items-center gap-2 text-xs font-mono animate-pulse">
                <AlertTriangle size={14} /> {error}
             </div>
           )}

           <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                 <label className="text-xs font-mono text-terminal-accent uppercase tracking-wider flex items-center gap-2">
                    <User size={12} /> Operator ID
                 </label>
                 <div className="relative group">
                    <input 
                      type="email" 
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full bg-black/40 border border-terminal-border rounded-lg px-4 py-3 text-white placeholder-terminal-muted/30 focus:outline-none focus:border-terminal-accent transition-all font-mono"
                      placeholder="operator@email.com"
                      autoComplete="email"
                    />
                 </div>
              </div>

              <div className="space-y-2">
                 <label className="text-xs font-mono text-terminal-accent uppercase tracking-wider flex items-center gap-2">
                    <Lock size={12} /> Access Key
                 </label>
                 <div className="relative group">
                    <input 
                      type={showPassword ? 'text' : 'password'} 
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-black/40 border border-terminal-border rounded-lg px-4 py-3 pr-12 text-white placeholder-terminal-muted/30 focus:outline-none focus:border-terminal-accent transition-all font-mono"
                      placeholder="••••••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-terminal-muted hover:text-terminal-accent transition-colors"
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                 </div>
              </div>

              <button 
                type="submit" 
                disabled={isLoading}
                className="w-full font-bold py-3 rounded-lg transition-all transform active:scale-[0.98] flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(0,0,0,0.2)] bg-terminal-accent/90 hover:bg-terminal-accent text-black"
              >
                {isLoading ? (
                   <>
                     <Loader2 size={18} className="animate-spin" />
                     <span className="font-mono text-sm">VERIFYING...</span>
                   </>
                ) : (
                   <>
                     <span className="font-mono text-sm">INITIALIZE SESSION</span>
                     <ChevronRight size={18} />
                   </>
                )}
              </button>
           </form>

           <div className="mt-6 pt-6 border-t border-terminal-border/30 flex items-start gap-3">
              <ShieldCheck className="text-terminal-muted shrink-0" size={16} />
              <p className="text-[10px] text-terminal-muted leading-relaxed font-mono">
                UNAUTHORIZED ACCESS IS PROHIBITED. ALL ACTIVITIES ARE LOGGED AND MONITORED.
              </p>
           </div>
        </div>

        {/* Footer Status */}
        <div className="mt-8 flex justify-between items-center px-4">
           <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-terminal-accent animate-pulse"></div>
              <span className="text-[10px] text-terminal-accent font-mono">SYSTEM ONLINE</span>
           </div>
           <div className="text-[10px] text-terminal-muted font-mono">
              SECURE LINK ESTABLISHED
           </div>
        </div>
      </div>
    </div>
  );
};