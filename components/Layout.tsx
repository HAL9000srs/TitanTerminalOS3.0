import React from 'react';
import { LayoutDashboard, Wallet, LineChart, BrainCircuit, Settings, Menu, Newspaper } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, activeTab, onTabChange }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  const NavItem = ({ id, icon: Icon, label }: { id: string; icon: any; label: string }) => (
    <button
      onClick={() => {
        onTabChange(id);
        setMobileMenuOpen(false);
      }}
      title={label}
      className={`flex items-center w-full px-4 py-3 mb-1 rounded-r-lg transition-all duration-200 border-l-2 ${
        activeTab === id
          ? 'bg-terminal-border/50 border-terminal-accent text-terminal-accent'
          : 'border-transparent text-terminal-muted hover:bg-terminal-border/30 hover:text-terminal-text'
      }`}
    >
      <Icon size={18} className="mr-3" />
      <span className="font-medium tracking-wide text-sm">{label}</span>
    </button>
  );

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex flex-col w-64 border-r border-terminal-border bg-terminal-panel/95 backdrop-blur-sm z-20">
        <div className="p-6 border-b border-terminal-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-terminal-accent to-emerald-800 rounded flex items-center justify-center text-black font-bold text-lg shadow-[0_0_15px_rgba(0,220,130,0.3)]">
              T
            </div>
            <span className="font-bold text-lg tracking-wider font-mono text-terminal-text">TITAN<span className="text-terminal-accent">.OS</span></span>
          </div>
        </div>

        <nav className="flex-1 py-6 pr-4">
          <NavItem id="dashboard" icon={LayoutDashboard} label="Command Center" />
          <NavItem id="assets" icon={Wallet} label="Portfolio Manager" />
          <NavItem id="analysis" icon={BrainCircuit} label="AI Intelligence" />
          <NavItem id="news" icon={Newspaper} label="Market News" />
          <NavItem id="markets" icon={LineChart} label="Global Markets" />
        </nav>

        <div className="p-4 border-t border-terminal-border">
          <button
            onClick={() => onTabChange('config')}
            title="Terminal Config"
            className={`flex items-center gap-3 px-4 py-3 text-sm w-full rounded transition-colors ${
              activeTab === 'config' 
                ? 'text-terminal-accent bg-terminal-accent/10' 
                : 'text-terminal-muted hover:text-terminal-text hover:bg-terminal-border/30'
            }`}
          >
            <Settings size={16} />
            <span>Terminal Config</span>
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
          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="text-terminal-text">
            <Menu size={24} />
          </button>
        </header>

        {/* Mobile Menu Overlay */}
        {mobileMenuOpen && (
          <div className="absolute inset-0 z-50 bg-terminal-panel/95 backdrop-blur-md p-4 md:hidden">
            <div className="flex justify-end mb-6">
              <button onClick={() => setMobileMenuOpen(false)} className="text-terminal-text">
                <Menu size={24} />
              </button>
            </div>
            <nav className="flex flex-col gap-2">
              <NavItem id="dashboard" icon={LayoutDashboard} label="Command Center" />
              <NavItem id="assets" icon={Wallet} label="Portfolio Manager" />
              <NavItem id="analysis" icon={BrainCircuit} label="AI Intelligence" />
              <NavItem id="news" icon={Newspaper} label="Market News" />
              <NavItem id="markets" icon={LineChart} label="Global Markets" />
              <NavItem id="config" icon={Settings} label="Terminal Config" />
            </nav>
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