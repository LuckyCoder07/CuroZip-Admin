import React, { useState, useEffect } from 'react';
import { Menu, LogOut, X } from 'lucide-react';
import { Link } from 'react-router-dom';

const Sidebar = ({ navItems = [], activeRoute, userName = 'User', userRole = 'Role', onLogout, mobileOpen, setMobileOpen, isCollapsed, setIsCollapsed }) => {
  const initials = userName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

  // Mobile translates offscreen when closed. Desktop is static.
  const mobileClasses = mobileOpen ? 'translate-x-0' : '-translate-x-full';
  const desktopClasses = `lg:translate-x-0 ${isCollapsed ? 'lg:w-20' : 'lg:w-60'}`;

  return (
    <aside 
      className={`fixed left-0 top-0 h-screen bg-cz-nav-bg border-r border-cz-border transition-all duration-300 z-50 flex flex-col w-60 ${mobileClasses} ${desktopClasses}`}
    >
      {/* Header */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-cz-border relative">
        {(!isCollapsed || window.innerWidth < 1024) && (
          <img src="https://finixia.in/logo%27s/curozip.png?v=1.4" alt="Curozip" className="h-8 object-contain" />
        )}
        {(isCollapsed && window.innerWidth >= 1024) && (
          <img src="https://finixia.in/logo%27s/curozip-icon.png?v=1.4" alt="Curozip Icon" className="h-8 w-8 mx-auto object-contain" />
        )}
        
        {/* Desktop Collapse Toggle */}
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className={`p-1 rounded text-cz-text-secondary hover:text-cz-text-primary hover:bg-cz-card-bg transition-colors ${isCollapsed ? 'hidden' : 'hidden lg:block'}`}
        >
          <Menu size={20} />
        </button>

        {/* Mobile Close Toggle */}
        <button 
          onClick={() => setMobileOpen(false)}
          className="lg:hidden p-1 rounded text-cz-text-secondary hover:text-white absolute right-4"
        >
          <X size={24} />
        </button>
      </div>

      {isCollapsed && window.innerWidth >= 1024 && (
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="hidden lg:block p-2 mx-auto mt-2 text-cz-text-secondary hover:text-cz-text-primary hover:bg-cz-card-bg rounded transition-colors"
        >
          <Menu size={20} />
        </button>
      )}

      {/* Nav Items */}
      <nav className="flex-1 overflow-y-auto py-4">
        <ul className="space-y-1">
          {navItems.map((item, index) => {
            const isActive = activeRoute === item.path;
            const Icon = item.icon;
            
            return (
              <li key={index}>
                <Link 
                  to={item.path}
                  onClick={() => setMobileOpen(false)} // close on click for mobile
                  className={`flex items-center px-4 py-3 transition-colors duration-150 group
                    ${isActive 
                      ? 'border-l-[3px] border-cz-accent-orange bg-white/10 text-cz-accent-orange' 
                      : 'border-l-[3px] border-transparent text-cz-text-secondary hover:bg-white/5 hover:text-cz-text-primary'
                    }`}
                >
                  <Icon size={20} className={`${isCollapsed && window.innerWidth >= 1024 ? 'mx-auto' : 'mr-3'} ${isActive ? 'text-cz-accent-orange' : 'group-hover:text-cz-text-primary'}`} />
                  {(!isCollapsed || window.innerWidth < 1024) && <span className="font-medium whitespace-nowrap">{item.label}</span>}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-cz-border">
        {isCollapsed && window.innerWidth >= 1024 ? (
          <div className="flex flex-col items-center space-y-4">
            <div className="w-10 h-10 rounded-full bg-cz-accent-orange text-white flex items-center justify-center font-bold shadow-md">
              {initials}
            </div>
            <button onClick={onLogout} className="text-cz-text-secondary hover:text-red-400 transition-colors">
              <LogOut size={20} />
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 overflow-hidden">
              <div className="w-10 h-10 rounded-full bg-cz-accent-orange text-white flex items-center justify-center font-bold flex-shrink-0 shadow-md">
                {initials}
              </div>
              <div className="truncate">
                <p className="text-sm font-semibold text-cz-text-primary truncate">{userName}</p>
                <p className="text-xs text-cz-text-secondary truncate capitalize">{userRole.replace('_', ' ')}</p>
              </div>
            </div>
            <button onClick={onLogout} className="p-2 text-cz-text-secondary hover:text-red-400 hover:bg-white/5 rounded transition-colors flex-shrink-0" title="Logout">
              <LogOut size={18} />
            </button>
          </div>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;
