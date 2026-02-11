import React, { useState } from 'react';
import { LayoutDashboard, Wallet, LineChart, BrainCircuit, Settings, Menu, Newspaper, LogOut, User, ChevronLeft, ChevronRight } from 'lucide-react';
import { UserProfile } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  onTabChange: (tab: string) => void;
  onLogout: () => void;
  user: UserProfile | null;
}

export const Layout: React.FC<LayoutProps> = ({ children, activeTab, onTabChange, onLogout, user }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  // LOGIC FIX: If the DB returns the default 'OPERATOR' or if it's missing, use your name.
  // This ensures your name appears immediately.
  const displayTitle = (user?.displayName && user.displayName !== 'OPERATOR') 
    ? user.displayName 
    : 'Malcolm S. Turnquest';

const NavItem = ({ 
  id, 
  icon: Icon, 
  label, 
  isCollapsed, 
  isActive, 
  onClick 
}: { 
  id: string; 
  icon: any; 
  label: string; 
  isCollapsed: boolean; 
  isActive: boolean; 
  onClick: () => void; 
}) => (
  <button
    onClick={onClick}
    title={isCollapsed ? label : ''}
    className={`flex items-center w-full ${isCollapsed ? 'justify-center px-2' : 'px-4'} py-3 mb-1 rounded-r-lg transition-all duration-200 border-l-2 select-none touch-manipulation cursor-pointer active:scale-[0.98] ${
      isActive
        ? 'bg-terminal-border/50 border-terminal-accent text-terminal-accent'
        : 'border-transparent text-terminal-muted hover:bg-terminal-border/30 hover:text-terminal-text'
    }`}
  >
    <Icon size={18} className={isCollapsed ? "" : "mr-3"} />
    {!isCollapsed && <span className="font-medium tracking-wide text-sm">{label}</span>}
  </button>
);

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar - Desktop */}
      <aside className={`hidden md:flex flex-col ${isCollapsed ? 'w-20' : 'w-64'} transition-all duration-300 border-r border-terminal-border bg-terminal-panel/95 backdrop-blur-sm z-20 relative`}>
        
        {/* Collapse Toggle */}
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="absolute -right-3 top-12 bg-terminal-border text-terminal-muted hover:text-white rounded-full p-1 border border-terminal-panel z-50 shadow-md transform hover:scale-110 transition-all"
        >
          {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>

        <div className={`p-6 border-b border-terminal-border ${isCollapsed ? 'flex flex-col items-center p-4' : ''}`}>
          <div className="flex items-center gap-2 mb-1 justify-center">
            <div className="w-8 h-8 bg-gradient-to-br from-terminal-accent to-emerald-800 rounded flex items-center justify-center text-black font-bold text-lg shadow-[0_0_15px_rgba(0,220,130,0.3)] shrink-0">
              T
            </div>
            {!isCollapsed && <span className="font-bold text-lg tracking-wider font-mono text-terminal-text whitespace-nowrap">TITAN<span className="text-terminal-accent">.OS</span></span>}
          </div>
          {/* User Badge */}
          <div className={`mt-4 flex items-center gap-3 px-3 py-2 bg-black/40 rounded border border-terminal-border/50 ${isCollapsed ? 'justify-center px-0 bg-transparent border-none' : ''}`}>
             <div className="w-8 h-8 rounded-full bg-terminal-muted/20 flex items-center justify-center text-terminal-accent shrink-0">
                <User size={14} />
             </div>
             {!isCollapsed && (
               <div className="overflow-hidden">
                  {/* NAME DISPLAY FIX */}
                  <p className="text-xs text-white font-mono truncate">{displayTitle}</p>
                  <p className="text-[10px] text-terminal-muted font-mono truncate">OPERATOR ACCESS</p>
               </div>
             )}
          </div>
        </div>

        <nav className="flex-1 py-6 pr-0">
          <NavItem 
            id="dashboard" 
            icon={LayoutDashboard} 
            label="Command Center" 
            isCollapsed={isCollapsed} 
            isActive={activeTab === 'dashboard'} 
            onClick={() => { onTabChange('dashboard'); setMobileMenuOpen(false); }} 
          />
          <NavItem 
            id="assets" 
            icon={Wallet} 
            label="Portfolio Manager" 
            isCollapsed={isCollapsed} 
            isActive={activeTab === 'assets'} 
            onClick={() => { onTabChange('assets'); setMobileMenuOpen(false); }} 
          />
          <NavItem 
            id="analysis" 
            icon={BrainCircuit} 
            label="AI Intelligence" 
            isCollapsed={isCollapsed} 
            isActive={activeTab === 'analysis'} 
            onClick={() => { onTabChange('analysis'); setMobileMenuOpen(false); }} 
          />
          <NavItem 
            id="news" 
            icon={Newspaper} 
            label="Market News" 
            isCollapsed={isCollapsed} 
            isActive={activeTab === 'news'} 
            onClick={() => { onTabChange('news'); setMobileMenuOpen(false); }} 
          />
          <NavItem 
            id="markets" 
            icon={LineChart} 
            label="Global Markets" 
            isCollapsed={isCollapsed} 
            isActive={activeTab === 'markets'} 
            onClick={() => { onTabChange('markets'); setMobileMenuOpen(false); }} 
          />
        </nav>

        <div className="p-4 border-t border-terminal-border space-y-2">
          <button
            onClick={() => onTabChange('config')}
            title={isCollapsed ? "Terminal Config" : ""}
            className={`flex items-center gap-3 px-4 py-3 text-sm w-full rounded transition-colors select-none touch-manipulation cursor-pointer active:scale-[0.98] ${
              activeTab === 'config' 
                ? 'text-terminal-accent bg-terminal-accent/10' 
                : 'text-terminal-muted hover:text-terminal-text hover:bg-terminal-border/30'
            } ${isCollapsed ? 'justify-center px-2' : ''}`}
          >
            <Settings size={16} />
            {!isCollapsed && <span>Terminal Config</span>}
          </button>
          
          <button
            onClick={onLogout}
            title={isCollapsed ? "Terminate Session" : ""}
            className={`flex items-center gap-3 px-4 py-3 text-sm w-full rounded transition-colors text-red-400 hover:text-red-300 hover:bg-red-500/10 select-none touch-manipulation cursor-pointer active:scale-[0.98] ${isCollapsed ? 'justify-center px-2' : ''}`}
          >
            <LogOut size={16} />
            {!isCollapsed && <span>Terminate Session</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative bg-transparent">
        {/* Mobile Header */}
        <header className="md:hidden flex items-center justify-between p-4 border-b border-terminal-border bg-terminal-panel/95 backdrop-blur-md relative z-30">
           <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-terminal-accent rounded flex items-center justify-center text-black font-bold text-xs">T</div>
            <span className="font-bold tracking-wider font-mono text-terminal-text">TITAN</span>
          </div>
          <div className="flex items-center gap-3">
             <span className="text-xs font-mono text-terminal-muted hidden sm:block">{displayTitle}</span>
             <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="text-terminal-text" aria-label="Toggle mobile menu">
               <Menu size={24} />
             </button>
          </div>
        </header>

        {/* Mobile Menu Overlay */}
        {mobileMenuOpen && (
          <div className="absolute inset-0 z-50 bg-terminal-panel/95 backdrop-blur-md p-4 md:hidden flex flex-col">
            <div className="flex justify-end mb-6">
              <button onClick={() => setMobileMenuOpen(false)} className="text-terminal-text" aria-label="Close mobile menu">
                <Menu size={24} />
              </button>
            </div>
            <nav className="flex-1 flex flex-col gap-2">
              <NavItem 
                id="dashboard" 
                icon={LayoutDashboard} 
                label="Command Center" 
                isCollapsed={false}
                isActive={activeTab === 'dashboard'}
                onClick={() => { onTabChange('dashboard'); setMobileMenuOpen(false); }}
              />
              <NavItem 
                id="assets" 
                icon={Wallet} 
                label="Portfolio Manager" 
                isCollapsed={false}
                isActive={activeTab === 'assets'}
                onClick={() => { onTabChange('assets'); setMobileMenuOpen(false); }}
              />
              <NavItem 
                id="analysis" 
                icon={BrainCircuit} 
                label="AI Intelligence" 
                isCollapsed={false}
                isActive={activeTab === 'analysis'}
                onClick={() => { onTabChange('analysis'); setMobileMenuOpen(false); }}
              />
              <NavItem 
                id="news" 
                icon={Newspaper} 
                label="Market News" 
                isCollapsed={false}
                isActive={activeTab === 'news'}
                onClick={() => { onTabChange('news'); setMobileMenuOpen(false); }}
              />
              <NavItem 
                id="markets" 
                icon={LineChart} 
                label="Global Markets" 
                isCollapsed={false}
                isActive={activeTab === 'markets'}
                onClick={() => { onTabChange('markets'); setMobileMenuOpen(false); }}
              />
              <NavItem 
                id="config" 
                icon={Settings} 
                label="Terminal Config" 
                isCollapsed={false}
                isActive={activeTab === 'config'}
                onClick={() => { onTabChange('config'); setMobileMenuOpen(false); }}
              />
            </nav>
            <div className="mt-auto border-t border-terminal-border pt-4">
               <button
                onClick={onLogout}
                className="flex items-center gap-3 px-4 py-3 text-sm w-full rounded transition-colors text-red-400 hover:text-red-300 hover:bg-red-500/10 font-bold"
              >
                <LogOut size={16} />
                <span>TERMINATE SESSION</span>
              </button>
            </div>
          </div>
        )}

        {/* Content Area */}
        <div className="flex-1 overflow-auto p-4 md:p-8 relative">
           <div className="relative z-0 max-w-7xl mx-auto">
             {children}
           </div>
        </div>
      </main>
    </div>
  );
};