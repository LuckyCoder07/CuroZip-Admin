import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Info, X, Loader2, Plus, Trash2, Truck } from 'lucide-react';
import axios from 'axios';
import AdminLayout from '../components/AdminLayout';
import { PageHeader, DataTable, FormInput, SelectDropdown, Modal } from '../components/shared';
import { ToastProvider, useToast } from '../components/shared/ToastContext';
import { useAuth } from '../context/AuthContext';

const API = '';

const VEHICLE_META = {
  'Volvo Bus':    { color: '#3b82f6', bg: '#3b82f620' },
  'Cargo Truck':  { color: '#f97316', bg: '#f9731620' },
  'Mini Van':     { color: '#8b5cf6', bg: '#8b5cf620' },
  'Other':        { color: '#9ca3af', bg: '#9ca3af20' },
};
const VEHICLE_OPTIONS = ['Volvo Bus', 'Cargo Truck', 'Mini Van', 'Other'].map(v => ({ value: v, label: v }));

// ─── Pincode Tag Input ────────────────────────────────────────────────────────
const PincodeTagInput = ({ label, pincodes, onChange }) => {
  const [input, setInput] = useState('');
  const [error, setError] = useState('');

  const handleKeyDown = e => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const val = input.trim();
      if (!/^\d{6}$/.test(val)) { setError('Must be exactly 6 digits.'); return; }
      if (pincodes.includes(val)) { setError('Already added.'); return; }
      onChange([...pincodes, val]); setInput(''); setError('');
    }
  };

  return (
    <div className="flex-1">
      {label && <label className="text-[#9ca3af] text-xs font-medium mb-1 block">{label}</label>}
      <div className="flex flex-wrap gap-1 mb-1 min-h-[24px]">
        {pincodes.map(p => (
          <span key={p} className="flex items-center gap-1 bg-[#1f2937] text-white text-[10px] px-1.5 py-0.5 rounded font-mono">
            {p}
            <button type="button" onClick={() => onChange(pincodes.filter(x => x !== p))} className="text-[#9ca3af] hover:text-white ml-0.5"><X size={9} /></button>
          </span>
        ))}
      </div>
      <input type="text" value={input} onChange={e => { setInput(e.target.value); setError(''); }}
        onKeyDown={handleKeyDown} placeholder="Pincode + Enter" maxLength={6}
        className="w-full bg-[#0a0e1a] text-white border border-[#374151] rounded-lg px-3 py-1.5 text-xs outline-none focus:border-[#f97316] transition-all" />
      {error && <span className="text-red-400 text-[10px] mt-0.5 block">{error}</span>}
    </div>
  );
};

// ─── Route Builder Row ────────────────────────────────────────────────────────
const RouteRow = ({ route, index, onChange, onRemove, showRemove }) => {
  const update = (field, val) => onChange(index, { ...route, [field]: val });
  return (
    <div className="border border-[#1f2937] rounded-lg p-3 mb-2 bg-[#0d1220] space-y-2">
      <div className="flex items-center gap-2">
        <div className="flex-1">
          <label className="text-[#9ca3af] text-xs font-medium mb-1 block">From City</label>
          <input value={route.fromCity} onChange={e => update('fromCity', e.target.value)} placeholder="e.g. Dibrugarh"
            className="w-full bg-[#0a0e1a] text-white border border-[#374151] rounded-lg px-3 py-1.5 text-sm outline-none focus:border-[#f97316] transition-all" />
        </div>
        <span className="text-[#9ca3af] mt-5">→</span>
        <div className="flex-1">
          <label className="text-[#9ca3af] text-xs font-medium mb-1 block">To City</label>
          <input value={route.toCity} onChange={e => update('toCity', e.target.value)} placeholder="e.g. Guwahati"
            className="w-full bg-[#0a0e1a] text-white border border-[#374151] rounded-lg px-3 py-1.5 text-sm outline-none focus:border-[#f97316] transition-all" />
        </div>
        {showRemove && (
          <button type="button" onClick={() => onRemove(index)} className="text-red-400 hover:text-red-300 mt-4 flex-shrink-0"><Trash2 size={15} /></button>
        )}
      </div>
      <div className="flex gap-3">
        <PincodeTagInput label="From Pincodes" pincodes={route.fromPincodes || []} onChange={pins => update('fromPincodes', pins)} />
        <PincodeTagInput label="To Pincodes"   pincodes={route.toPincodes   || []} onChange={pins => update('toPincodes',   pins)} />
      </div>
    </div>
  );
};

// ─── Vendor Drawer ────────────────────────────────────────────────────────────
const EMPTY_ROUTE = { fromCity: '', toCity: '', fromPincodes: [], toPincodes: [] };
const EMPTY_FORM  = { name: '', contactPerson: '', phone: '', email: '', vehicleType: 'Volvo Bus', operatingRoutes: [{ ...EMPTY_ROUTE }], isActive: true };

const VendorDrawer = ({ isOpen, onClose, vendorData, onSuccess }) => {
  const { token } = useAuth();
  const { addToast } = useToast();
  const isEdit = !!vendorData;
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setForm(vendorData ? {
        name: vendorData.name || '', contactPerson: vendorData.contactPerson || '',
        phone: vendorData.phone || '', email: vendorData.email || '',
        vehicleType: vendorData.vehicleType || 'Volvo Bus',
        operatingRoutes: vendorData.operatingRoutes?.length ? vendorData.operatingRoutes : [{ ...EMPTY_ROUTE }],
        isActive: vendorData.isActive ?? true,
      } : { ...EMPTY_FORM, operatingRoutes: [{ ...EMPTY_ROUTE }] });
      setErrors({});
    }
  }, [isOpen, vendorData]);

  useEffect(() => { document.body.style.overflow = isOpen ? 'hidden' : ''; return () => { document.body.style.overflow = ''; }; }, [isOpen]);

  const handle = e => { const { name, value } = e.target; setForm(p => ({ ...p, [name]: value })); };

  const updateRoute = (i, updated) => setForm(p => ({ ...p, operatingRoutes: p.operatingRoutes.map((r, idx) => idx === i ? updated : r) }));
  const addRoute    = () => setForm(p => ({ ...p, operatingRoutes: [...p.operatingRoutes, { ...EMPTY_ROUTE }] }));
  const removeRoute = i  => setForm(p => ({ ...p, operatingRoutes: p.operatingRoutes.filter((_, idx) => idx !== i) }));

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'This field is required';
    if (!form.contactPerson.trim()) e.contactPerson = 'This field is required';
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Please enter a valid email';
    return e;
  };

  const hasErrors = Object.keys(validate()).length > 0;

  const handleSubmit = async e => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setSubmitting(true);
    try {
      if (isEdit) {
        await axios.put(`${API}/api/vendors/${vendorData._id}`, form, { headers: { Authorization: `Bearer ${token}` } });
        addToast('Vendor updated successfully.', 'success');
      } else {
        await axios.post(`${API}/api/vendors`, form, { headers: { Authorization: `Bearer ${token}` } });
        addToast('Vendor created successfully.', 'success');
      }
      onSuccess(); onClose();
    } catch (err) { addToast(err.response?.data?.message || 'Something went wrong.', 'error'); }
    finally { setSubmitting(false); }
  };

  return (
    <>
      <div className={`fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`} onClick={onClose} />
      <div className={`fixed right-0 top-0 h-full w-[520px] max-w-full z-50 bg-[#111827] shadow-2xl flex flex-col transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#1f2937] flex-shrink-0">
          <h2 className="text-white font-bold text-lg">{isEdit ? 'Edit Vendor' : 'Add New Vendor'}</h2>
          <button onClick={onClose} className="text-[#9ca3af] hover:text-white hover:bg-white/10 p-1.5 rounded-full transition-colors"><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
            <FormInput label="Company Name *" name="name" value={form.name} onChange={handle} placeholder="e.g. Assam Express Lines" error={errors.name} />
            <FormInput label="Contact Person *" name="contactPerson" value={form.contactPerson} onChange={handle} placeholder="e.g. Bimal Bora" error={errors.contactPerson} />
            <div className="grid grid-cols-2 gap-4">
              <FormInput label="Phone" name="phone" type="tel" value={form.phone} onChange={handle} placeholder="+91 XXXXX XXXXX" />
              <FormInput label="Email" name="email" type="email" value={form.email} onChange={handle} placeholder="vendor@example.com" />
            </div>
            <SelectDropdown label="Vehicle Type" options={VEHICLE_OPTIONS} value={form.vehicleType} onChange={v => setForm(p => ({ ...p, vehicleType: v }))} />

            {/* Operating Routes */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-[#9ca3af] text-sm font-medium">Operating Routes</label>
                <button type="button" onClick={addRoute} className="flex items-center gap-1 text-[#f97316] text-xs font-semibold hover:underline">
                  <Plus size={13} /> Add Route
                </button>
              </div>
              {form.operatingRoutes.map((route, i) => (
                <RouteRow key={i} route={route} index={i} onChange={updateRoute} onRemove={removeRoute} showRemove={form.operatingRoutes.length > 1} />
              ))}
            </div>

            {/* Status */}
            <div className="flex items-center justify-between bg-[#1f2937] rounded-lg px-4 py-3">
              <div>
                <p className="text-white text-sm font-medium">Status</p>
                <p className="text-[#9ca3af] text-xs">{form.isActive ? 'Active' : 'Inactive'}</p>
              </div>
              <button type="button" onClick={() => setForm(p => ({ ...p, isActive: !p.isActive }))}
                className={`relative inline-flex items-center h-6 w-11 rounded-full transition-colors duration-200 ${form.isActive ? 'bg-green-500' : 'bg-[#374151]'}`}>
                <span className={`inline-block w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${form.isActive ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>
          </div>
          <div className="px-6 py-4 border-t border-[#1f2937] flex justify-end gap-3 flex-shrink-0">
            <button type="button" onClick={onClose} className="px-5 py-2 rounded-lg border border-[#374151] text-[#9ca3af] hover:text-white transition-colors text-sm font-medium">Cancel</button>
            <button type="submit" disabled={submitting || hasErrors} className="px-6 py-2 rounded-lg bg-[#f97316] text-white font-bold hover:bg-[#ea6c0a] transition-colors text-sm disabled:opacity-60 flex items-center gap-2">
              {submitting && <Loader2 size={15} className="animate-spin" />}
              {isEdit ? 'Update Vendor' : 'Create Vendor'}
            </button>
          </div>
        </form>
      </div>
    </>
  );
};

// ─── Toggle Switch (inline) ───────────────────────────────────────────────────
const ToggleSwitch = ({ vendorId, isActive, token, onToggle }) => {
  const { addToast } = useToast();
  const [loading, setLoading] = useState(false);
  const handleToggle = async e => {
    e.stopPropagation();
    setLoading(true);
    try {
      await axios.put(`${API}/api/vendors/${vendorId}`, { isActive: !isActive }, { headers: { Authorization: `Bearer ${token}` } });
      onToggle(vendorId, !isActive);
      addToast(`Vendor ${!isActive ? 'activated' : 'deactivated'}.`, 'success');
    } catch { addToast('Failed to update vendor status.', 'error'); }
    finally { setLoading(false); }
  };
  return (
    <button onClick={handleToggle} disabled={loading}
      className={`relative inline-flex items-center h-6 w-11 rounded-full transition-colors duration-200 focus:outline-none ${isActive ? 'bg-green-500' : 'bg-cz-border'} ${loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}>
      <span className={`inline-block w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${isActive ? 'translate-x-6' : 'translate-x-1'}`} />
    </button>
  );
};

// ─── Route Pills ──────────────────────────────────────────────────────────────
const RoutePills = ({ routes = [] }) => {
  const visible = routes.slice(0, 2);
  const extra = routes.length - 2;
  return (
    <div className="flex flex-wrap gap-1">
      {visible.map((r, i) => (
        <span key={i} className="bg-cz-dark-bg text-cz-text-secondary border border-cz-border text-[10px] px-2 py-0.5 rounded-full whitespace-nowrap">
          {r.fromCity} → {r.toCity}
        </span>
      ))}
      {extra > 0 && <span className="bg-cz-card-bg text-cz-text-secondary border border-cz-border text-[10px] px-2 py-0.5 rounded-full">+{extra} more</span>}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
const VendorsPageContent = () => {
  const { token } = useAuth();
  const { addToast } = useToast();
  const [searchParams] = useSearchParams();
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingVendor, setEditingVendor] = useState(null);
  const [deleteModal, setDeleteModal] = useState({ open: false, vendor: null });
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Auto-open Add Vendor drawer from Quick Actions (?action=add)
  useEffect(() => {
    if (searchParams.get('action') === 'add') {
      setEditingVendor(null);
      setDrawerOpen(true);
    }
  }, [searchParams]);

  const fetchVendors = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/api/vendors?all=true`, { headers: { Authorization: `Bearer ${token}` } });
      setVendors(res.data || []);
    } catch { setVendors([]); }
    finally { setLoading(false); }
  }, [token]);

  useEffect(() => { fetchVendors(); }, [fetchVendors]);

  const handleToggle = (id, newActive) => setVendors(p => p.map(v => v._id === id ? { ...v, isActive: newActive } : v));

  const handleDelete = async () => {
    if (!deleteModal.vendor) return;
    setDeleteLoading(true);
    try {
      await axios.delete(`${API}/api/vendors/${deleteModal.vendor._id}`, { headers: { Authorization: `Bearer ${token}` } });
      addToast('Vendor removed.', 'success');
      setDeleteModal({ open: false, vendor: null });
      fetchVendors();
    } catch { addToast('Failed to delete vendor.', 'error'); }
    finally { setDeleteLoading(false); }
  };

  const columns = [
    { key: 'name', label: 'Vendor Name', render: v => <span className="text-cz-text-primary font-bold text-sm">{v}</span> },
    { key: 'contactPerson', label: 'Contact', render: v => <span className="text-cz-text-secondary text-sm">{v || '—'}</span> },
    {
      key: 'phone', label: 'Phone / Email',
      render: (v, row) => (
        <div>
          <p className="text-cz-text-primary text-sm">{row.phone || '—'}</p>
          <p className="text-cz-text-secondary text-xs">{row.email || '—'}</p>
        </div>
      ),
    },
    {
      key: 'vehicleType', label: 'Vehicle Type',
      render: v => {
        const m = VEHICLE_META[v] || VEHICLE_META['Other'];
        return <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ color: m.color, backgroundColor: m.bg }}>{v}</span>;
      },
    },
    { key: 'operatingRoutes', label: 'Routes', render: v => <RoutePills routes={v} /> },
    {
      key: 'isActive', label: 'Status',
      render: (v, row) => <ToggleSwitch vendorId={row._id} isActive={v} token={token} onToggle={handleToggle} />,
    },
    {
      key: '_id', label: 'Actions',
      render: (v, row) => (
        <div className="flex items-center gap-1">
          <button onClick={e => { e.stopPropagation(); setEditingVendor(row); setDrawerOpen(true); }}
            className="p-1.5 rounded text-cz-text-secondary hover:text-white hover:bg-white/10 transition-colors" title="Edit">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg>
          </button>
          <button onClick={e => { e.stopPropagation(); setDeleteModal({ open: true, vendor: row }); }}
            className="p-1.5 rounded text-cz-text-secondary hover:text-red-400 hover:bg-red-500/10 transition-colors" title="Delete">
            <Trash2 size={14} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <AdminLayout title="Vendors" breadcrumb="Admin / Vendors">
      <PageHeader title="Fleet Vendors" subtitle="Intercity bus and cargo fleet operators" actionLabel="+ Add Vendor" onAction={() => { setEditingVendor(null); setDrawerOpen(true); }} />

      {/* Info Banner */}
      <div className="bg-cz-card-bg border-l-[3px] border-blue-500 rounded-lg px-4 py-3 flex items-start gap-3 mb-5">
        <Info size={18} className="text-blue-400 flex-shrink-0 mt-0.5" />
        <p className="text-cz-text-secondary text-sm leading-relaxed">
          Vendors are intercity transport operators (buses, cargo fleets) who carry parcels between cities.{' '}
          <span className="text-cz-text-primary font-semibold">Hub Managers</span> assign vendors to orders for the intercity transit leg.
        </p>
      </div>

      <DataTable columns={columns} data={vendors} loading={loading} searchable emptyIcon={Truck} emptyTitle="No vendors added yet" emptyActionLabel="+ Add Vendor" emptyOnAction={() => { setEditingVendor(null); setDrawerOpen(true); }} />

      <VendorDrawer isOpen={drawerOpen} onClose={() => setDrawerOpen(false)} vendorData={editingVendor} onSuccess={fetchVendors} />

      {/* Delete confirm modal */}
      <Modal isOpen={deleteModal.open} onClose={() => setDeleteModal({ open: false, vendor: null })} title="Delete Vendor"
        footer={
          <div className="flex justify-end gap-3">
            <button onClick={() => setDeleteModal({ open: false, vendor: null })} className="px-4 py-2 text-sm border border-cz-border text-cz-text-secondary hover:text-white rounded-lg transition-colors">Cancel</button>
            <button onClick={handleDelete} disabled={deleteLoading} className="px-5 py-2 text-sm bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center gap-2">
              {deleteLoading && <Loader2 size={14} className="animate-spin" />} Delete
            </button>
          </div>
        }
      >
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-red-500/15 flex items-center justify-center flex-shrink-0">
            <Trash2 size={18} className="text-red-500" />
          </div>
          <div>
            <p className="text-cz-text-primary font-semibold mb-1">Delete "{deleteModal.vendor?.name}"?</p>
            <p className="text-cz-text-secondary text-sm">This action cannot be undone. {deleteModal.vendor?.name} will be permanently deleted.</p>
          </div>
        </div>
      </Modal>
    </AdminLayout>
  );
};

const VendorsPage = () => (
  <ToastProvider>
    <VendorsPageContent />
  </ToastProvider>
);

export default VendorsPage;
