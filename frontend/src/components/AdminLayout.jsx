import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Building2, Users, Users2, ShieldCheck, Layers, Truck, Package, Settings
} from 'lucide-react';
import { Sidebar, TopBar } from './shared';
import { useAuth } from '../context/AuthContext';

const NAV_ITEMS = [
  { icon: LayoutDashboard, label: 'Dashboard',          path: '/dashboard' },
  { icon: Building2,       label: 'Hubs',               path: '/hubs'      },
  { icon: Users,           label: 'Users',              path: '/users'     },
  { icon: Users2,          label: 'Customers',          path: '/customers' },
  { icon: ShieldCheck,     label: 'Roles',              path: '/roles'     },
  { icon: Layers,          label: 'Departments',        path: '/departments'},
  { icon: Truck,           label: 'Vendors',            path: '/vendors'   },
  { icon: Package,         label: 'Orders',             path: '/orders'    },
  { icon: Settings,        label: 'Settings',           path: '/settings'  },
];

const AdminLayout = ({ title, breadcrumb, children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(() => {
    const saved = localStorage.getItem('cz_sidebar_collapsed');
    if (saved !== null) return saved === 'true';
    return window.innerWidth >= 1024 && window.innerWidth < 1280;
  });

  React.useEffect(() => {
    localStorage.setItem('cz_sidebar_collapsed', isCollapsed);
  }, [isCollapsed]);

  const activeRoute = '/' + location.pathname.split('/')[1];

  return (
    <div className="min-h-screen bg-cz-dark-bg flex">
      {/* Mobile overlay */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      <Sidebar
        navItems={NAV_ITEMS}
        activeRoute={activeRoute}
        userName={user?.name || 'Admin'}
        userRole={user?.role || 'super_admin'}
        onLogout={logout}
        mobileOpen={mobileMenuOpen}
        setMobileOpen={setMobileMenuOpen}
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
      />

      {/* Main content — offset by sidebar width on desktop */}
      <div className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${isCollapsed ? 'lg:ml-20' : 'lg:ml-60'}`}>
        <TopBar 
          title={title} 
          breadcrumb={breadcrumb} 
          onMenuClick={() => setMobileMenuOpen(true)} 
        />

        {/* Page body */}
        <main className="flex-1 p-4 lg:p-6 overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
