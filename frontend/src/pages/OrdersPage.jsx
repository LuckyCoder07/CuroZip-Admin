import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Copy, ArrowRight, AlertTriangle, Eye, Building2, Check, Package, X, MapPin, Box, Loader2 } from 'lucide-react';
import axios from 'axios';

import AdminLayout from '../components/AdminLayout';
import { PageHeader, DataTable, StatusBadge, SelectDropdown, FormInput } from '../components/shared';
import { ToastProvider, useToast } from '../components/shared/ToastContext';
import { useAuth } from '../context/AuthContext';

const API = 'http://localhost:5000';

const ALL_STATUSES = [
  'Booked', 'Pickup Assigned', 'Picked Up', 'In Transit',
  'At Destination Hub', 'Out for Delivery', 'Delivered', 'Failed / Returned',
];

const fmtDate = d => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

// ─── Status Multi-Select ──────────────────────────────────────────────────────
const StatusMultiSelect = ({ selected, onChange }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const close = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  const toggle = (status) => {
    onChange(selected.includes(status) ? selected.filter(s => s !== status) : [...selected, status]);
  };

  const label = selected.length === 0 ? 'All Statuses' : selected.length === 1 ? selected[0] : `${selected.length} statuses`;

  return (
    <div ref={ref} className="relative w-56">
      <button type="button" onClick={() => setOpen(!open)} className="w-full bg-cz-dark-bg text-white border border-cz-border rounded-lg px-4 py-2 text-sm text-left flex items-center justify-between focus:border-cz-accent-orange outline-none transition-all">
        <span className={selected.length ? 'text-white' : 'text-cz-text-secondary'}>{label}</span>
        <svg className={`w-4 h-4 text-cz-text-secondary transition-transform ${open ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
      </button>
      {open && (
        <div className="absolute top-full left-0 mt-1 w-full bg-cz-card-bg border border-cz-border rounded-lg shadow-xl z-50 py-1 max-h-72 overflow-y-auto">
          {ALL_STATUSES.map(status => (
            <label key={status} className="flex items-center gap-2 px-3 py-2 hover:bg-white/5 cursor-pointer">
              <div className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 transition-colors ${selected.includes(status) ? 'bg-cz-accent-orange border-cz-accent-orange' : 'border-cz-border bg-transparent'}`}>
                {selected.includes(status) && <Check size={11} className="text-white" strokeWidth={3} />}
              </div>
              <input type="checkbox" className="sr-only" checked={selected.includes(status)} onChange={() => toggle(status)} />
              <span className="text-white text-xs">{status}</span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
};

// ─── Copy Cell ────────────────────────────────────────────────────────────────
const TrackingCell = ({ value, navigate, rowId }) => {
  const { addToast } = useToast();
  const copy = async (e) => {
    e.stopPropagation();
    await navigator.clipboard.writeText(value);
    addToast('Tracking ID copied!', 'success');
  };
  return (
    <div className="flex items-center gap-1.5 group/cell">
      <span onClick={(e) => { e.stopPropagation(); navigate(`/orders/${rowId}`); }} className="font-mono text-xs text-cz-accent-orange font-semibold hover:underline cursor-pointer">
        {value}
      </span>
      <button onClick={copy} className="opacity-0 group-hover/cell:opacity-100 transition-opacity text-cz-text-secondary hover:text-white p-0.5" title="Copy tracking ID">
        <Copy size={11} />
      </button>
    </div>
  );
};

// ─── Create Order Drawer ──────────────────────────────────────────────────────
const EMPTY_ORDER = {
  customerName: '', customerPhone: '', pickupAddress: '', pickupCity: '', pickupPincode: '',
  deliveryName: '', deliveryPhone: '', deliveryAddress: '', deliveryCity: '', deliveryPincode: '',
  weight: '', dimensionsL: '', dimensionsW: '', dimensionsH: '', description: '', declaredValue: '',
  amount: '', isPaid: false
};

const CreateOrderDrawer = ({ isOpen, onClose, onSuccess }) => {
  const { token } = useAuth();
  const { addToast } = useToast();
  
  const [form, setForm] = useState(EMPTY_ORDER);
  const [submitting, setSubmitting] = useState(false);
  const [hubs, setHubs] = useState([]);
  
  const [pickupHub, setPickupHub] = useState(null);
  const [deliveryHub, setDeliveryHub] = useState(null);
  const [pickupLookupError, setPickupLookupError] = useState(false);
  const [deliveryLookupError, setDeliveryLookupError] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setForm(EMPTY_ORDER);
      setPickupHub(null);
      setDeliveryHub(null);
      setPickupLookupError(false);
      setDeliveryLookupError(false);
      
      // Fetch all hubs for manual fallback or lookup
      axios.get(`${API}/api/hubs`, { headers: { Authorization: `Bearer ${token}` }})
        .then(res => setHubs(res.data || [])).catch(() => {});
    }
  }, [isOpen, token]);

  const lookupHub = (pincode, isPickup) => {
    if (!pincode || pincode.length !== 6) return;
    
    // Find a hub that services this pincode
    let foundHub = hubs.find(h => h.serviceablePincodes && h.serviceablePincodes.includes(pincode));
    
    // Fallback for testing: if no hub strictly matches, assign the first available hub
    if (!foundHub && hubs.length > 0) {
      foundHub = hubs[0];
    }
    
    if (isPickup) {
      setPickupHub(foundHub || null);
      setPickupLookupError(!foundHub);
    } else {
      setDeliveryHub(foundHub || null);
      setDeliveryLookupError(!foundHub);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!pickupHub || !deliveryHub) {
      return addToast('Please enter serviceable pincodes for both pickup and delivery', 'error');
    }
    
    setSubmitting(true);
    try {
      const payload = {
        customerName: form.customerName,
        customerPhone: form.customerPhone,
        pickup: {
          name: form.customerName, // fallback
          phone: form.customerPhone, // fallback
          address: form.pickupAddress,
          city: form.pickupCity,
          pincode: form.pickupPincode
        },
        delivery: {
          name: form.deliveryName,
          phone: form.deliveryPhone,
          address: form.deliveryAddress,
          city: form.deliveryCity,
          pincode: form.deliveryPincode
        },
        parcel: {
          weight: Number(form.weight) || 0,
          dimensions: {
            l: Number(form.dimensionsL) || 0,
            w: Number(form.dimensionsW) || 0,
            h: Number(form.dimensionsH) || 0
          },
          description: form.description,
          value: Number(form.declaredValue) || 0
        },
        amount: Number(form.amount) || 0,
        isPaid: form.isPaid
      };

      const res = await axios.post(`${API}/api/orders`, payload, { headers: { Authorization: `Bearer ${token}` }});
      addToast(`Order created! Tracking ID: ${res.data.order.trackingId}`, 'success');
      
      if (res.data.warning) {
        addToast(res.data.warning, 'warning');
      }
      
      onSuccess();
      onClose();
    } catch (err) {
      addToast(err.response?.data?.message || 'Error creating order', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const isComplete = form.customerName && form.customerPhone && form.pickupPincode && form.deliveryPincode && form.amount;

  return (
    <>
      <div className={`fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`} onClick={onClose} />
      <div className={`fixed right-0 top-0 h-full w-[600px] max-w-full z-50 bg-cz-card-bg shadow-2xl flex flex-col transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        
        <div className="flex items-center justify-between p-6 border-b border-cz-border bg-cz-nav-bg">
          <h2 className="text-xl font-bold text-white">Create New Order</h2>
          <button onClick={onClose} className="p-2 text-cz-text-secondary hover:text-white bg-white/5 rounded-full"><X size={20} /></button>
        </div>

        <form id="create-order-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-8">
          
          {/* Sender */}
          <section>
            <div className="flex items-center gap-2 text-cz-accent-orange mb-4">
              <Package size={18} />
              <h3 className="font-bold text-lg">Sender Details</h3>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormInput label="Sender Name *" value={form.customerName} onChange={e => setForm({...form, customerName: e.target.value})} required />
                <FormInput label="Sender Phone *" value={form.customerPhone} onChange={e => setForm({...form, customerPhone: e.target.value})} required />
              </div>
              <FormInput label="Pickup Address *" as="textarea" rows={2} value={form.pickupAddress} onChange={e => setForm({...form, pickupAddress: e.target.value})} required />
              <div className="grid grid-cols-2 gap-4">
                <FormInput label="Pickup City *" value={form.pickupCity} onChange={e => setForm({...form, pickupCity: e.target.value})} required />
                <div>
                  <FormInput label="Pickup Pincode *" value={form.pickupPincode} onChange={e => setForm({...form, pickupPincode: e.target.value})} onBlur={(e) => lookupHub(e.target.value, true)} maxLength={6} required />
                  {pickupHub && <p className="text-xs text-green-400 mt-1">Pickup Hub: {pickupHub.name} ✓</p>}
                  {pickupLookupError && <p className="text-xs text-yellow-400 mt-1">⚠ No hub found for this pincode</p>}
                </div>
              </div>
            </div>
          </section>

          {/* Recipient */}
          <section>
            <div className="flex items-center gap-2 text-blue-400 mb-4">
              <MapPin size={18} />
              <h3 className="font-bold text-lg">Recipient Details</h3>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormInput label="Recipient Name *" value={form.deliveryName} onChange={e => setForm({...form, deliveryName: e.target.value})} required />
                <FormInput label="Recipient Phone *" value={form.deliveryPhone} onChange={e => setForm({...form, deliveryPhone: e.target.value})} required />
              </div>
              <FormInput label="Delivery Address *" as="textarea" rows={2} value={form.deliveryAddress} onChange={e => setForm({...form, deliveryAddress: e.target.value})} required />
              <div className="grid grid-cols-2 gap-4">
                <FormInput label="Delivery City *" value={form.deliveryCity} onChange={e => setForm({...form, deliveryCity: e.target.value})} required />
                <div>
                  <FormInput label="Delivery Pincode *" value={form.deliveryPincode} onChange={e => setForm({...form, deliveryPincode: e.target.value})} onBlur={(e) => lookupHub(e.target.value, false)} maxLength={6} required />
                  {deliveryHub && <p className="text-xs text-green-400 mt-1">Dest Hub: {deliveryHub.name} ✓</p>}
                  {deliveryLookupError && <p className="text-xs text-yellow-400 mt-1">⚠ No hub found for this pincode</p>}
                </div>
              </div>
            </div>
          </section>

          {/* Parcel Details */}
          <section>
            <div className="flex items-center gap-2 text-purple-400 mb-4">
              <Box size={18} />
              <h3 className="font-bold text-lg">Parcel Details</h3>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormInput label="Weight (kg)" type="number" value={form.weight} onChange={e => setForm({...form, weight: e.target.value})} />
                <FormInput label="Declared Value (₹)" type="number" value={form.declaredValue} onChange={e => setForm({...form, declaredValue: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium text-white mb-2">Dimensions (cm) L × W × H</label>
                <div className="flex items-center gap-2">
                  <input type="number" className="w-full bg-cz-dark-bg text-white border border-cz-border rounded-lg px-3 py-2 outline-none focus:border-cz-accent-orange" placeholder="L" value={form.dimensionsL} onChange={e => setForm({...form, dimensionsL: e.target.value})} />
                  <span className="text-cz-text-secondary">×</span>
                  <input type="number" className="w-full bg-cz-dark-bg text-white border border-cz-border rounded-lg px-3 py-2 outline-none focus:border-cz-accent-orange" placeholder="W" value={form.dimensionsW} onChange={e => setForm({...form, dimensionsW: e.target.value})} />
                  <span className="text-cz-text-secondary">×</span>
                  <input type="number" className="w-full bg-cz-dark-bg text-white border border-cz-border rounded-lg px-3 py-2 outline-none focus:border-cz-accent-orange" placeholder="H" value={form.dimensionsH} onChange={e => setForm({...form, dimensionsH: e.target.value})} />
                </div>
              </div>
              <FormInput label="Description" as="textarea" rows={2} value={form.description} onChange={e => setForm({...form, description: e.target.value})} />
            </div>
          </section>

          {/* Billing */}
          <section>
            <div className="flex items-center gap-2 text-green-400 mb-4">
              <span className="font-bold">₹</span>
              <h3 className="font-bold text-lg">Billing</h3>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FormInput label="Shipping Amount (₹) *" type="number" value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} required />
              <div className="flex flex-col justify-end">
                <label className="block text-sm font-medium text-white mb-2">Payment Status</label>
                <div className="flex items-center justify-between p-2 border border-cz-border rounded-lg bg-white/5">
                  <span className="text-sm font-medium text-white">{form.isPaid ? 'Paid' : 'Unpaid'}</span>
                  <button type="button" onClick={() => setForm(f => ({...f, isPaid: !f.isPaid}))}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${form.isPaid ? 'bg-green-500' : 'bg-cz-border'}`}>
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${form.isPaid ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* Route Preview */}
          {pickupHub && deliveryHub && (
            <div className="bg-white/5 border-l-4 border-l-cz-accent-orange rounded-r-lg p-4">
              <p className="text-white font-bold mb-2">Route Summary</p>
              <div className="flex items-center gap-2 text-sm text-cz-text-secondary mb-2">
                <span>{form.pickupCity || 'Pickup'}</span>
                <ArrowRight size={14} className="text-white" />
                <span>{form.deliveryCity || 'Destination'}</span>
              </div>
              <p className="text-xs text-cz-text-secondary">Pickup: <span className="text-white">{pickupHub.name}</span> | Dest: <span className="text-white">{deliveryHub.name}</span></p>
              <p className="text-xs text-cz-accent-orange mt-2">Tracking ID will be auto-generated on creation</p>
            </div>
          )}

        </form>

        <div className="p-4 border-t border-cz-border flex justify-end gap-3 bg-cz-nav-bg">
          <button onClick={onClose} className="px-4 py-2 text-sm text-cz-text-secondary hover:text-white">Cancel</button>
          <button type="submit" form="create-order-form" disabled={submitting || !isComplete} className="px-6 py-2 text-sm bg-cz-accent-orange text-white font-bold rounded-lg hover:bg-[#ea6c0a] disabled:opacity-50 flex items-center gap-2">
            {submitting && <Loader2 size={14} className="animate-spin" />}
            Create Order
          </button>
        </div>

      </div>
    </>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
const OrdersPageContent = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { token } = useAuth();

  const [orders, setOrders]   = useState([]);
  const [hubs, setHubs]       = useState([]);
  const [loading, setLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Filters
  const [search,        setSearch]        = useState('');
  const [statusSel,     setStatusSel]     = useState([]);
  const [hubFilter,     setHubFilter]     = useState('');
  const [fromDate,      setFromDate]      = useState('');
  const [toDate,        setToDate]        = useState('');

  const debounceRef = useRef(null);

  // Auto-open create drawer from Quick Actions
  useEffect(() => {
    if (searchParams.get('action') === 'create') {
      setDrawerOpen(true);
    }
  }, [searchParams]);

  useEffect(() => {
    axios.get(`${API}/api/hubs`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => setHubs(r.data || [])).catch(() => {});
  }, [token]);

  const fetchOrders = useCallback(async (params = {}) => {
    setLoading(true);
    const q = new URLSearchParams();
    if (params.search)  q.set('search', params.search);
    if (params.status?.length) q.set('status', params.status.join(','));
    if (params.hubId)   q.set('hubId', params.hubId);
    if (params.from)    q.set('from', params.from);
    if (params.to)      q.set('to', params.to);
    try {
      const res = await axios.get(`${API}/api/orders?${q}`, { headers: { Authorization: `Bearer ${token}` } });
      setOrders(res.data || []);
    } catch { setOrders([]); }
    finally { setLoading(false); }
  }, [token]);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchOrders({ search, status: statusSel, hubId: hubFilter, from: fromDate, to: toDate });
    }, 300);
    return () => clearTimeout(debounceRef.current);
  }, [search, statusSel, hubFilter, fromDate, toDate, fetchOrders]);

  const clearFilters = () => {
    setSearch(''); setStatusSel([]); setHubFilter(''); setFromDate(''); setToDate('');
  };
  const hasFilters = search || statusSel.length || hubFilter || fromDate || toDate;

  const hubOptions = [{ value: '', label: 'All Hubs' }, ...hubs.map(h => ({ value: h._id, label: h.name }))];

  const columns = [
    {
      key: 'trackingId', label: 'Tracking ID',
      render: (v, row) => <TrackingCell value={v} navigate={navigate} rowId={row._id} />,
    },
    {
      key: 'customerName', label: 'Customer',
      render: (v, row) => (
        <div>
          <p className="text-white font-semibold text-sm">{v}</p>
          <p className="text-cz-text-secondary text-xs">{row.customerPhone}</p>
        </div>
      ),
    },
    {
      key: 'pickup', label: 'Route',
      render: (v, row) => (
        <div className="flex items-center gap-1 text-cz-text-secondary text-xs whitespace-nowrap">
          <span>{row.pickup?.city}</span>
          <ArrowRight size={12} className="text-cz-accent-orange" />
          <span>{row.delivery?.city}</span>
        </div>
      ),
    },
    {
      key: 'status', label: 'Status',
      render: v => <StatusBadge status={v} />,
    },
    {
      key: 'pickupHubId', label: 'Pickup Hub',
      render: v => (
        <div className="flex items-center gap-1 text-cz-text-secondary text-xs">
          <Building2 size={12} className="flex-shrink-0" />
          <span>{v?.name || '—'}</span>
        </div>
      ),
    },
    {
      key: 'destinationHubId', label: 'Dest. Hub',
      render: v => <span className="text-cz-text-secondary text-xs">{v?.name || '—'}</span>,
    },
    {
      key: 'assignedVendorId', label: 'Vendor',
      render: v => v ? (
        <span className="text-white text-xs">{v.name}</span>
      ) : (
        <div className="flex items-center gap-1 text-yellow-400 text-xs">
          <AlertTriangle size={11} />
          <span>Unassigned</span>
        </div>
      ),
    },
    {
      key: 'assignedPickupPartnerId', label: 'Pickup Partner',
      render: v => <span className="text-cz-text-secondary text-xs">{v?.name || '—'}</span>,
    },
    {
      key: 'assignedDeliveryPartnerId', label: 'Delivery Partner',
      render: v => <span className="text-cz-text-secondary text-xs">{v?.name || '—'}</span>,
    },
    {
      key: 'createdAt', label: 'Date',
      render: v => <span className="text-cz-text-secondary text-xs whitespace-nowrap">{fmtDate(v)}</span>,
    },
    {
      key: 'amount', label: 'Amount',
      render: v => <span className="text-white text-sm font-semibold text-right block">₹{(v || 0).toLocaleString('en-IN')}</span>,
    },
    {
      key: '_id', label: 'Action',
      render: v => (
        <button
          onClick={e => { e.stopPropagation(); navigate(`/orders/${v}`); }}
          className="p-1.5 rounded text-cz-text-secondary hover:text-cz-accent-orange hover:bg-cz-accent-orange/10 transition-colors"
          title="View Order"
        >
          <Eye size={15} />
        </button>
      ),
    },
  ];

  return (
    <AdminLayout title="Orders" breadcrumb="Admin / Orders">
      <PageHeader 
        title="All Orders" 
        subtitle="Track and manage every shipment" 
        actionLabel="+ Create Order"
        onAction={() => setDrawerOpen(true)}
      />

      <div className="bg-cz-card-bg border border-cz-border rounded-xl p-4 mb-5 space-y-3">
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search tracking ID, customer name or phone..."
          className="w-full bg-cz-dark-bg text-white border border-cz-border rounded-lg px-4 py-2.5 text-sm focus:border-cz-accent-orange outline-none transition-all"
        />

        <div className="flex flex-wrap items-center gap-3">
          <StatusMultiSelect selected={statusSel} onChange={setStatusSel} />

          <input
            type="date"
            value={fromDate}
            onChange={e => setFromDate(e.target.value)}
            className="bg-cz-dark-bg text-white border border-cz-border rounded-lg px-3 py-2 text-sm focus:border-cz-accent-orange outline-none transition-all"
            title="From date"
          />
          <input
            type="date"
            value={toDate}
            onChange={e => setToDate(e.target.value)}
            className="bg-cz-dark-bg text-white border border-cz-border rounded-lg px-3 py-2 text-sm focus:border-cz-accent-orange outline-none transition-all"
            title="To date"
          />

          <div className="w-48">
            <SelectDropdown
              options={hubOptions}
              value={hubFilter}
              onChange={setHubFilter}
              placeholder="All Hubs"
              searchable
            />
          </div>

          {hasFilters && (
            <button
              onClick={clearFilters}
              className="ml-auto text-cz-text-secondary hover:text-white border border-cz-border hover:border-white px-3 py-2 rounded-lg text-sm transition-colors"
            >
              Clear Filters
            </button>
          )}
        </div>
      </div>

      <DataTable
        columns={columns}
        data={orders}
        loading={loading}
        onRowClick={row => navigate(`/orders/${row._id}`)}
        emptyIcon={Package}
        emptyTitle="No orders found"
      />

      <CreateOrderDrawer 
        isOpen={drawerOpen} 
        onClose={() => setDrawerOpen(false)} 
        onSuccess={() => fetchOrders({ search, status: statusSel, hubId: hubFilter, from: fromDate, to: toDate })}
      />
    </AdminLayout>
  );
};

export default function OrdersPage() {
  return <ToastProvider><OrdersPageContent /></ToastProvider>;
}
