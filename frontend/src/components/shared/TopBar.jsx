import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Bell, ChevronDown, User, LogOut, Sun, Moon, Search, X, Package, Users, Building2, Menu } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';

const API = '';

// ─── Notification store (simple module-level singleton) ───────────────────────
let _notifications = [];
let _listeners = [];

export const addNotification = (msg) => {
  const n = { id: Date.now(), msg, time: new Date(), read: false };
  _notifications = [n, ..._notifications].slice(0, 30);
  _listeners.forEach(fn => fn([..._notifications]));
};

const useNotifications = () => {
  const [list, setList] = useState([..._notifications]);
  useEffect(() => {
    _listeners.push(setList);
    return () => { _listeners = _listeners.filter(fn => fn !== setList); };
  }, []);
  const markAllRead = () => {
    _notifications = _notifications.map(n => ({ ...n, read: true }));
    setList([..._notifications]);
  };
  return { list, markAllRead, unread: list.filter(n => !n.read).length };
};

const fmtAge = (date) => {
  const diff = (Date.now() - new Date(date)) / 1000;
  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return new Date(date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
};

// ─── Global Search ─────────────────────────────────────────────────────────────
const GlobalSearch = ({ token }) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState({ orders: [], customers: [], hubs: [] });
  const [searching, setSearching] = useState(false);
  const inputRef = useRef(null);
  const debounceRef = useRef(null);
  const navigate = useNavigate();

  // Cmd+K shortcut
  useEffect(() => {
    const handle = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen(true);
        setTimeout(() => inputRef.current?.focus(), 50);
      }
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', handle);
    return () => document.removeEventListener('keydown', handle);
  }, []);

  const search = useCallback(async (q) => {
    if (!q || q.length < 2) { setResults({ orders: [], customers: [], hubs: [] }); return; }
    setSearching(true);
    try {
      const [ordersRes, customersRes, hubsRes] = await Promise.all([
        axios.get(`${API}/api/orders?search=${q}&limit=3`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API}/api/customers?search=${q}&limit=3`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API}/api/hubs?search=${q}&all=true`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      setResults({
        orders: (ordersRes.data || []).slice(0, 3),
        customers: (customersRes.data || []).slice(0, 3),
        hubs: (hubsRes.data || []).slice(0, 3),
      });
    } catch { setResults({ orders: [], customers: [], hubs: [] }); }
    finally { setSearching(false); }
  }, [token]);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(query), 400);
    return () => clearTimeout(debounceRef.current);
  }, [query, search]);

  const goTo = (path) => { setOpen(false); setQuery(''); navigate(path); };

  const hasResults = results.orders.length || results.customers.length || results.hubs.length;

  if (!open) {
    return (
      <button
        onClick={() => { setOpen(true); setTimeout(() => inputRef.current?.focus(), 50); }}
        className="flex items-center gap-2 text-cz-text-secondary hover:text-white bg-cz-card-bg border border-cz-border rounded-lg px-3 py-1.5 text-sm transition-colors"
        title="Search (⌘K)"
      >
        <Search size={15} />
        <span className="hidden md:block">Search</span>
        <span className="hidden md:block text-xs text-cz-text-secondary border border-cz-border px-1 rounded">⌘K</span>
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-start justify-center pt-20 px-4" onClick={() => setOpen(false)}>
      <div className="w-full max-w-xl" onClick={e => e.stopPropagation()}>
        <div className="bg-cz-card-bg border border-cz-border rounded-xl overflow-hidden shadow-2xl">
          <div className="flex items-center gap-3 px-4 py-3 border-b border-cz-border">
            <Search size={18} className="text-cz-text-secondary flex-shrink-0" />
            <input
              ref={inputRef}
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search orders, customers, hubs..."
              className="flex-1 bg-transparent text-cz-text-primary text-base outline-none placeholder:text-cz-text-secondary"
            />
            <button onClick={() => setOpen(false)} className="text-cz-text-secondary hover:text-white"><X size={18} /></button>
          </div>

          {query.length >= 2 && (
            <div className="max-h-96 overflow-y-auto py-2">
              {searching && (
                <p className="text-cz-text-secondary text-sm text-center py-6">Searching…</p>
              )}
              {!searching && !hasResults && (
                <p className="text-cz-text-secondary text-sm text-center py-6">No results for "{query}"</p>
              )}
              {!searching && results.orders.length > 0 && (
                <div className="mb-2">
                  <p className="text-cz-text-secondary text-xs font-semibold uppercase px-4 py-1">Orders</p>
                  {results.orders.map(o => (
                    <button key={o._id} onClick={() => goTo(`/orders/${o._id}`)} className="w-full flex items-center gap-3 px-4 py-2 hover:bg-white/5 text-left">
                      <Package size={15} className="text-cz-accent-orange flex-shrink-0" />
                      <span className="text-cz-text-primary text-sm font-mono">{o.trackingId}</span>
                      <span className="text-cz-text-secondary text-xs ml-auto">{o.customerName}</span>
                    </button>
                  ))}
                </div>
              )}
              {!searching && results.customers.length > 0 && (
                <div className="mb-2">
                  <p className="text-cz-text-secondary text-xs font-semibold uppercase px-4 py-1">Customers</p>
                  {results.customers.map(c => (
                    <button key={c._id} onClick={() => goTo('/customers')} className="w-full flex items-center gap-3 px-4 py-2 hover:bg-white/5 text-left">
                      <Users size={15} className="text-blue-400 flex-shrink-0" />
                      <span className="text-cz-text-primary text-sm">{c.name}</span>
                      <span className="text-cz-text-secondary text-xs ml-auto">{c.phone}</span>
                    </button>
                  ))}
                </div>
              )}
              {!searching && results.hubs.length > 0 && (
                <div className="mb-2">
                  <p className="text-cz-text-secondary text-xs font-semibold uppercase px-4 py-1">Hubs</p>
                  {results.hubs.map(h => (
                    <button key={h._id} onClick={() => goTo(`/hubs/${h._id}`)} className="w-full flex items-center gap-3 px-4 py-2 hover:bg-white/5 text-left">
                      <Building2 size={15} className="text-green-400 flex-shrink-0" />
                      <span className="text-cz-text-primary text-sm">{h.name}</span>
                      <span className="text-cz-text-secondary text-xs ml-auto">{h.city}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── TopBar ───────────────────────────────────────────────────────────────────
const TopBar = ({ title, breadcrumb, onMenuClick }) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [bellOpen, setBellOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const { user, logout, token } = useAuth();
  const navigate = useNavigate();
  const { list: notifications, markAllRead, unread } = useNotifications();
  const bellRef = useRef(null);
  const dropRef = useRef(null);

  // Close popups on outside click
  useEffect(() => {
    const handle = (e) => {
      if (bellRef.current && !bellRef.current.contains(e.target)) setBellOpen(false);
      if (dropRef.current && !dropRef.current.contains(e.target)) setDropdownOpen(false);
    };
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, []);

  // Parse breadcrumb for clickable segments
  const segments = (breadcrumb || '').split('/').map(s => s.trim()).filter(Boolean);

  const initials = user?.name?.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'A';

  return (
    <header className="sticky top-0 h-16 bg-cz-nav-bg border-b border-cz-accent-orange z-40 flex items-center justify-between px-4 lg:px-6 transition-all duration-300 w-full">
      {/* Left side: Hamburger & Title */}
      <div className="flex items-center gap-3 flex-1 lg:flex-none lg:w-1/3 min-w-0">
        <button onClick={onMenuClick} className="lg:hidden text-cz-text-secondary hover:text-white flex-shrink-0">
          <Menu size={24} />
        </button>
        <div className="min-w-0 hidden sm:block">
          <h1 className="text-white text-lg lg:text-xl font-bold leading-tight truncate">{title}</h1>
          {segments.length > 0 && (
            <nav className="flex items-center gap-1 text-xs mt-0.5 truncate">
              {segments.map((seg, i) => {
                const isLast = i === segments.length - 1;
                const pathMap = { 'Dashboard': '/dashboard', 'Hubs': '/hubs', 'Users': '/users', 'Customers': '/customers', 'Roles': '/roles', 'Departments': '/departments', 'Vendors': '/vendors', 'Orders': '/orders', 'Settings': '/settings', 'Home': '/dashboard', 'Admin': '/dashboard' };
                const path = pathMap[seg];
                return (
                  <React.Fragment key={i}>
                    {i > 0 && <span className="text-white/30">/</span>}
                    {path && !isLast
                      ? <button onClick={() => navigate(path)} className="text-cz-text-secondary hover:text-white transition-colors truncate">{seg}</button>
                      : <span className={isLast ? 'text-cz-accent-orange font-medium truncate' : 'text-cz-text-secondary truncate'}>{seg}</span>
                    }
                  </React.Fragment>
                );
              })}
            </nav>
          )}
        </div>
      </div>

      {/* Center side: Global Search */}
      <div className="flex justify-end lg:justify-center flex-1 lg:w-1/3 px-2 lg:px-0">
        <GlobalSearch token={token} />
      </div>

      {/* Right side: Actions & Profile */}
      <div className="flex items-center justify-end gap-2 sm:gap-3 lg:gap-4 flex-none lg:w-1/3">

        {/* Theme toggle */}
        <button onClick={toggleTheme} className="text-cz-text-secondary hover:text-white transition-colors p-1" title="Toggle theme">
          {theme === 'dark' ? <Moon size={20} /> : <Sun size={20} />}
        </button>

        {/* Notification Bell */}
        <div ref={bellRef} className="relative">
          <button onClick={() => { setBellOpen(!bellOpen); if (bellOpen) markAllRead(); }} className="relative text-cz-text-secondary hover:text-white transition-colors p-1">
            <Bell size={20} />
            {unread > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center border border-cz-nav-bg">
                {unread > 9 ? '9+' : unread}
              </span>
            )}
          </button>

          {bellOpen && (
            <div className="absolute right-0 mt-2 w-80 bg-cz-card-bg border border-cz-border rounded-xl shadow-2xl z-50 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-cz-border">
                <span className="text-cz-text-primary font-bold text-sm">Notifications</span>
                {unread > 0 && (
                  <button onClick={markAllRead} className="text-cz-accent-orange text-xs hover:underline">Mark all read</button>
                )}
              </div>
              <div className="max-h-80 overflow-y-auto">
                {notifications.length === 0 ? (
                  <p className="text-cz-text-secondary text-sm text-center py-8">No notifications yet</p>
                ) : (
                  notifications.map(n => (
                    <div key={n.id} className={`px-4 py-3 border-b border-cz-border last:border-0 ${!n.read ? 'bg-cz-accent-orange/5' : ''}`}>
                      <p className="text-cz-text-primary text-sm">{n.msg}</p>
                      <p className="text-cz-text-secondary text-xs mt-1">{fmtAge(n.time)}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Dropdown */}
        <div ref={dropRef} className="relative">
          <button onClick={() => setDropdownOpen(!dropdownOpen)} className="flex items-center space-x-2 focus:outline-none">
            <div className="w-8 h-8 rounded-full bg-cz-accent-orange text-white flex items-center justify-center font-bold text-sm flex-shrink-0">
              {initials}
            </div>
            <span className="text-sm font-medium hidden md:block text-white">{user?.name?.split(' ')[0] || 'Admin'}</span>
            <ChevronDown size={16} className="text-cz-text-secondary hidden md:block" />
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-52 bg-cz-card-bg border border-cz-border rounded-xl shadow-2xl py-1 z-50">
              <div className="px-4 py-2 border-b border-cz-border">
                <p className="text-cz-text-primary text-sm font-bold truncate">{user?.name}</p>
                <p className="text-cz-text-secondary text-xs truncate">{user?.email}</p>
              </div>
              <button
                onClick={() => { setDropdownOpen(false); navigate('/settings'); }}
                className="w-full text-left px-4 py-2 text-sm text-cz-text-primary hover:bg-white/5 transition-colors flex items-center gap-2"
              >
                <User size={15} className="text-cz-text-secondary" /> Account Settings
              </button>
              <button
                onClick={() => { setDropdownOpen(false); logout(); }}
                className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-white/5 transition-colors flex items-center gap-2"
              >
                <LogOut size={15} /> Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default TopBar;
