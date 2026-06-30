import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { Search, MapPin, Users, Package, X, ArrowRight, Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import AdminLayout from '../components/AdminLayout';
import { PageHeader, DataTable, FormInput, SelectDropdown, OrderLifecycleTracker, StatusBadge } from '../components/shared';
import { ToastProvider, useToast } from '../components/shared/ToastContext';
import { useAuth } from '../context/AuthContext';

const API = '';

const fmtDate = d => d ? new Date(d).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' }) : '—';

const CustomerDrawer = ({ isOpen, onClose, customerData, onSuccess }) => {
  const { token } = useAuth();
  const { addToast } = useToast();
  const isEdit = !!customerData;
  
  const [form, setForm] = useState({ name:'', email:'', phone:'', address:'', city:'', pincode:'', isActive:true });
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('details'); // 'details' | 'orders'
  
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [expandedOrder, setExpandedOrder] = useState(null);

  useEffect(() => {
    if (isOpen) {
      if (isEdit) {
        setForm({ ...customerData, isActive: customerData.isActive ?? true });
        setActiveTab('details');
        fetchOrders(customerData._id);
      } else {
        setForm({ name:'', email:'', phone:'', address:'', city:'', pincode:'', isActive:true });
        setActiveTab('details');
        setOrders([]);
      }
    }
  }, [isOpen, customerData]);

  const fetchOrders = async (id) => {
    setOrdersLoading(true);
    try {
      const res = await axios.get(`${API}/api/customers/${id}/orders`, { headers: { Authorization: `Bearer ${token}` }});
      setOrders(res.data || []);
    } catch {
      setOrders([]);
    }
    setOrdersLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.phone) return addToast('Name and phone are required', 'error');
    
    setSubmitting(true);
    try {
      if (isEdit) {
        await axios.put(`${API}/api/customers/${customerData._id}`, form, { headers: { Authorization: `Bearer ${token}` }});
        addToast('Customer updated successfully', 'success');
      } else {
        await axios.post(`${API}/api/customers`, form, { headers: { Authorization: `Bearer ${token}` }});
        addToast('Customer created successfully', 'success');
      }
      onSuccess();
      onClose();
    } catch (err) {
      addToast(err.response?.data?.message || 'Error saving customer', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const initials = form.name?.split(' ').map(n=>n[0]).join('').substring(0,2).toUpperCase() || '?';

  return (
    <>
      <div className={`fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`} onClick={onClose} />
      <div className={`fixed right-0 top-0 h-full w-[${isEdit ? '600px' : '480px'}] max-w-full z-50 bg-cz-card-bg shadow-2xl flex flex-col transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-cz-border bg-cz-nav-bg">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full flex items-center justify-center font-bold text-2xl text-white bg-blue-600 shadow-md flex-shrink-0">
              {initials}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white mb-1">{isEdit ? form.name : 'Add Customer'}</h2>
              {isEdit && (
                <div className="flex items-center gap-2 text-xs text-cz-text-secondary">
                  <span>{form.phone}</span> • <span>{form.email || 'No email'}</span>
                  {!form.isActive && <span className="ml-2 font-bold px-2 py-0.5 rounded-full bg-red-500/15 text-red-400">Inactive</span>}
                </div>
              )}
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-cz-text-secondary hover:text-white bg-white/5 rounded-full"><X size={20} /></button>
        </div>

        {/* Tabs */}
        {isEdit && (
          <div className="flex border-b border-cz-border bg-cz-card-bg px-6">
            <button 
              onClick={() => setActiveTab('details')} 
              className={`flex items-center gap-2 py-4 px-2 border-b-2 font-medium text-sm transition-colors ${activeTab === 'details' ? 'border-cz-accent-orange text-cz-accent-orange' : 'border-transparent text-cz-text-secondary hover:text-white'}`}
            >
              <Users size={16} /> Details
            </button>
            <button 
              onClick={() => setActiveTab('orders')} 
              className={`flex items-center gap-2 py-4 px-2 ml-6 border-b-2 font-medium text-sm transition-colors ${activeTab === 'orders' ? 'border-cz-accent-orange text-cz-accent-orange' : 'border-transparent text-cz-text-secondary hover:text-white'}`}
            >
              <Package size={16} /> Order History
            </button>
          </div>
        )}

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {(!isEdit || activeTab === 'details') && (
            <form id="customer-form" onSubmit={handleSubmit} className="space-y-4">
              <FormInput label="Full Name *" name="name" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
              <FormInput label="Phone *" name="phone" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} />
              <FormInput label="Email" name="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} />
              <FormInput label="Address" as="textarea" rows={3} name="address" value={form.address} onChange={e => setForm({...form, address: e.target.value})} />
              <div className="grid grid-cols-2 gap-4">
                <FormInput label="City" name="city" value={form.city} onChange={e => setForm({...form, city: e.target.value})} />
                <FormInput label="Pincode" name="pincode" value={form.pincode} onChange={e => setForm({...form, pincode: e.target.value})} maxLength={6} />
              </div>
              
              {isEdit && (
                <div className="flex items-center justify-between p-4 border border-cz-border rounded-lg bg-white/5 mt-4">
                  <span className="text-sm font-medium text-white">Account Status</span>
                  <button type="button" onClick={() => setForm(f => ({...f, isActive: !f.isActive}))}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${form.isActive ? 'bg-green-500' : 'bg-cz-border'}`}>
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${form.isActive ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
                </div>
              )}
            </form>
          )}

          {isEdit && activeTab === 'orders' && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3 mb-6">
                <div className="bg-white/5 border border-cz-border rounded-lg p-3 text-center">
                  <p className="text-cz-text-secondary text-xs uppercase tracking-wider mb-1">Total Orders</p>
                  <p className="text-white font-bold text-lg">{orders.length}</p>
                </div>
                <div className="bg-white/5 border border-cz-border rounded-lg p-3 text-center">
                  <p className="text-cz-text-secondary text-xs uppercase tracking-wider mb-1">Total Spent</p>
                  <p className="text-white font-bold text-lg">₹{orders.reduce((acc, o) => acc + (o.amount || 0), 0)}</p>
                </div>
                <div className="bg-white/5 border border-cz-border rounded-lg p-3 text-center">
                  <p className="text-cz-text-secondary text-xs uppercase tracking-wider mb-1">Last Order</p>
                  <p className="text-white font-bold text-sm truncate">{orders.length > 0 ? fmtDate(orders[0].createdAt) : '—'}</p>
                </div>
              </div>

              {ordersLoading ? (
                <div className="flex justify-center py-10"><Loader2 className="animate-spin text-cz-accent-orange" /></div>
              ) : orders.length === 0 ? (
                <div className="text-center py-10 border border-dashed border-cz-border rounded-xl">
                  <Package className="mx-auto text-cz-text-secondary mb-2" size={32} />
                  <p className="text-white font-medium">No orders yet</p>
                  <p className="text-cz-text-secondary text-sm">This customer hasn't placed any orders.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {orders.map(order => (
                    <div key={order._id} className="bg-cz-card-bg border border-cz-border rounded-lg overflow-hidden transition-all">
                      <div 
                        className="p-4 cursor-pointer hover:bg-white/5 flex items-center justify-between"
                        onClick={() => setExpandedOrder(expandedOrder === order._id ? null : order._id)}
                      >
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-cz-accent-orange font-mono font-bold">{order.trackingId}</span>
                            <StatusBadge status={order.status} />
                          </div>
                          <div className="flex items-center text-sm text-white gap-2">
                            <span>{order.pickup?.city || 'Origin'}</span>
                            <ArrowRight size={14} className="text-cz-text-secondary" />
                            <span>{order.delivery?.city || 'Destination'}</span>
                          </div>
                          <div className="flex items-center gap-4 mt-2 text-xs text-cz-text-secondary">
                            <span>{fmtDate(order.createdAt)}</span>
                            <span>₹{order.amount || 0}</span>
                          </div>
                        </div>
                        <button className="text-cz-text-secondary">
                          {expandedOrder === order._id ? <ChevronUp size={20}/> : <ChevronDown size={20}/>}
                        </button>
                      </div>
                      
                      {expandedOrder === order._id && (
                        <div className="p-4 border-t border-cz-border bg-cz-dark-bg">
                          <OrderLifecycleTracker statusHistory={order.statusHistory} currentStatus={order.status} isDark />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        {(!isEdit || activeTab === 'details') && (
          <div className="p-4 border-t border-cz-border flex justify-end gap-3 bg-cz-nav-bg">
            <button onClick={onClose} className="px-4 py-2 text-sm text-cz-text-secondary hover:text-white">Cancel</button>
            <button type="submit" form="customer-form" disabled={submitting} className="px-6 py-2 text-sm bg-cz-accent-orange text-white font-bold rounded-lg hover:bg-[#ea6c0a] flex items-center gap-2">
              {submitting && <Loader2 size={14} className="animate-spin" />}
              Save
            </button>
          </div>
        )}
      </div>
    </>
  );
};

const CustomersPageContent = () => {
  const { token } = useAuth();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);

  const [search, setSearch] = useState('');
  const [cityFilter, setCityFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const debounceRef = useRef(null);

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    const q = new URLSearchParams();
    if (search) q.set('search', search);
    if (cityFilter) q.set('city', cityFilter);
    if (statusFilter !== '') q.set('isActive', statusFilter);
    
    try {
      const res = await axios.get(`${API}/api/customers?${q}`, { headers: { Authorization:`Bearer ${token}` } });
      setCustomers(res.data || []);
    } catch { setCustomers([]); }
    finally { setLoading(false); }
  }, [token, search, cityFilter, statusFilter]);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => { fetchCustomers(); }, 300);
    return () => clearTimeout(debounceRef.current);
  }, [fetchCustomers]);

  const openDrawer = (customer = null) => { setEditingCustomer(customer); setDrawerOpen(true); };

  const cityOptions = [{ value:'', label:'All Cities' }, ...Array.from(new Set(customers.map(c => c.city).filter(Boolean))).map(c => ({ value:c, label:c }))];
  const statusOptions = [{ value:'', label:'All Status' }, { value:'true', label:'Active' }, { value:'false', label:'Inactive' }];

  const columns = [
    {
      key: 'name', label: 'Customer',
      render: (val, row) => {
        const initials = val?.split(' ').map(n=>n[0]).join('').substring(0,2).toUpperCase() || '?';
        return (
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center font-bold text-sm text-white flex-shrink-0">
              {initials}
            </div>
            <div>
              <p className="text-white font-semibold text-sm">{val}</p>
              <p className="text-cz-text-secondary text-xs">{row.email || '—'}</p>
            </div>
          </div>
        );
      },
    },
    { key:'phone', label:'Phone', render: v => <a href={`tel:${v}`} onClick={e=>e.stopPropagation()} className="text-cz-accent-orange text-sm hover:underline">{v}</a> },
    {
      key:'city', label:'City',
      render: v => v ? <div className="flex items-center gap-1 text-cz-text-secondary text-sm"><MapPin size={14}/> {v}</div> : <span className="text-cz-text-secondary">—</span>
    },
    {
      key:'ordersCount', label:'Total Orders',
      render: v => <span className="bg-blue-500/15 text-blue-400 text-xs font-bold px-2.5 py-1 rounded-full">{v || 0}</span>
    },
    {
      key:'lastOrder', label:'Last Order',
      render: v => v ? (
        <div className="flex flex-col gap-1">
          <span className="text-cz-accent-orange font-mono text-xs">{v.trackingId}</span>
          <StatusBadge status={v.status} className="scale-75 origin-left" />
        </div>
      ) : <span className="text-cz-text-secondary text-sm">—</span>
    },
    {
      key:'isActive', label:'Status',
      render: v => v
        ? <span className="bg-green-500/15 text-green-400 text-xs font-bold px-2 py-0.5 rounded-full">Active</span>
        : <span className="bg-red-500/15 text-red-400 text-xs font-bold px-2 py-0.5 rounded-full">Inactive</span>,
    }
  ];

  return (
    <AdminLayout title="Customers" breadcrumb="Admin / Customers">
      <PageHeader title="Customers" subtitle="All customers who have placed orders" actionLabel="+ Add Customer" onAction={() => openDrawer(null)} />

      <div className="bg-cz-card-bg border border-cz-border rounded-xl p-4 flex flex-col sm:flex-row gap-3 mb-5">
        <input
          value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search by name, phone, email..."
          className="flex-1 bg-cz-dark-bg text-white border border-cz-border rounded-lg px-4 py-2 text-sm focus:border-cz-accent-orange outline-none transition-all"
        />
        <div className="w-full sm:w-48">
          <SelectDropdown options={cityOptions} value={cityFilter} onChange={setCityFilter} placeholder="All Cities" searchable />
        </div>
        <div className="w-full sm:w-40">
          <SelectDropdown options={statusOptions} value={statusFilter} onChange={setStatusFilter} placeholder="All Status" />
        </div>
        <button onClick={() => { setSearch(''); setCityFilter(''); setStatusFilter(''); }} className="px-4 py-2 text-cz-text-secondary hover:text-white hover:bg-white/5 rounded-lg transition-colors">
          Clear
        </button>
      </div>

      <DataTable columns={columns} data={customers} loading={loading} emptyIcon={Users} emptyTitle="No customers found" onRowClick={openDrawer} />

      <CustomerDrawer isOpen={drawerOpen} onClose={() => setDrawerOpen(false)} customerData={editingCustomer} onSuccess={fetchCustomers} />
    </AdminLayout>
  );
};

export default function CustomersPage() {
  return <ToastProvider><CustomersPageContent /></ToastProvider>;
}
