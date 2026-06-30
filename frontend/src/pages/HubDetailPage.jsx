import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Mail, Phone, AlertCircle,
  Package, Truck, Activity, Pencil, UserPlus, Bike, Copy
} from 'lucide-react';
import axios from 'axios';

import AdminLayout from '../components/AdminLayout';
import HubDrawer from '../components/HubDrawer';
import { StatCard, DataTable, StatusBadge, Modal, SelectDropdown } from '../components/shared';
import { ToastProvider, useToast } from '../components/shared/ToastContext';
import { useAuth } from '../context/AuthContext';

const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

const STATUS_OPTIONS = [
  'All', 'Booked', 'Pickup Assigned', 'Picked Up',
  'In Transit', 'At Destination Hub', 'Out for Delivery',
  'Delivered', 'Failed / Returned',
].map(s => ({ value: s, label: s }));

// ─── Tab component ───────────────────────────────────────────────────────────
const Tab = ({ label, active, onClick }) => (
  <button
    onClick={onClick}
    className={`px-5 py-3 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap
      ${active
        ? 'border-[#f97316] text-[#f97316]'
        : 'border-transparent text-[#9ca3af] hover:text-white'}`}
  >
    {label}
  </button>
);

// ─── Manager Card ────────────────────────────────────────────────────────────
const ManagerCard = ({ manager, onChangeClick }) => {
  if (!manager) return (
    <div className="bg-[#111827] rounded-xl border border-yellow-500/30 p-5">
      <div className="flex items-start gap-3">
        <AlertCircle size={20} className="text-yellow-400 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-yellow-400 font-semibold text-sm">No hub manager assigned</p>
          <p className="text-[#9ca3af] text-xs mt-0.5">Assign a manager to oversee hub operations.</p>
        </div>
      </div>
      <button onClick={onChangeClick}
        className="mt-4 text-xs bg-[#f97316] text-white px-3 py-1.5 rounded-lg font-semibold hover:bg-[#ea6c0a] transition-colors">
        Assign Manager
      </button>
    </div>
  );

  const initials = manager.name?.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'HM';
  return (
    <div className="bg-[#111827] rounded-xl border border-[#1f2937] p-5">
      <p className="text-[#9ca3af] text-xs font-semibold uppercase tracking-wider mb-3">Hub Manager</p>
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-full bg-[#f97316] text-white flex items-center justify-center font-bold text-lg flex-shrink-0">
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-white font-bold truncate">{manager.name}</p>
          <p className="text-[#9ca3af] text-sm truncate">{manager.email}</p>
          {manager.phone && <p className="text-[#9ca3af] text-xs">{manager.phone}</p>}
        </div>
      </div>
      <button onClick={onChangeClick}
        className="mt-4 text-xs border border-[#374151] text-[#9ca3af] hover:text-white px-3 py-1.5 rounded-lg transition-colors">
        Change Manager
      </button>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
const HubDetailContent = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token } = useAuth();
  const { addToast } = useToast();

  const [hub, setHub] = useState(null);
  const [hubLoading, setHubLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  // Orders tab
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState('All');

  // Partners tab
  const [partners, setPartners] = useState([]);
  const [partnersLoading, setPartnersLoading] = useState(false);
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [allDeliveryPartners, setAllDeliveryPartners] = useState([]);
  const [selectedPartner, setSelectedPartner] = useState(null);
  const [assigning, setAssigning] = useState(false);

  // Drawer
  const [drawerOpen, setDrawerOpen] = useState(false);

  // ── Fetch hub ───────────────────────────────────────────────────────────
  const fetchHub = useCallback(async () => {
    setHubLoading(true);
    try {
      const res = await axios.get(`http://localhost:5000/api/hubs/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setHub(res.data);
    } catch {
      addToast('Failed to load hub.', 'error');
    } finally {
      setHubLoading(false);
    }
  }, [id, token]);

  useEffect(() => { fetchHub(); }, [fetchHub]);

  // ── Fetch orders when tab active ─────────────────────────────────────
  useEffect(() => {
    if (activeTab !== 'orders') return;
    setOrdersLoading(true);
    axios.get(`http://localhost:5000/api/orders/hub/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    }).then(res => {
      setOrders(res.data || []);
    }).catch(() => {}).finally(() => setOrdersLoading(false));
  }, [activeTab, id, token]);

  // ── Fetch partners when tab active ───────────────────────────────────
  useEffect(() => {
    if (activeTab !== 'partners') return;
    setPartnersLoading(true);
    axios.get(`http://localhost:5000/api/users/delivery-partners/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    }).then(res => {
      setPartners(res.data || []);
    }).catch(() => {}).finally(() => setPartnersLoading(false));
  }, [activeTab, id, token]);

  // ── Open assign modal: fetch all delivery partners ──────────────────
  const openAssignModal = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/users', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const opts = (res.data || [])
        .filter(u => u.role === 'delivery_partner')
        .map(u => ({ value: u._id, label: `${u.name} — ${u.email}` }));
      setAllDeliveryPartners(opts);
    } catch { setAllDeliveryPartners([]); }
    setSelectedPartner(null);
    setAssignModalOpen(true);
  };

  const handleAssignPartner = async () => {
    if (!selectedPartner) return;
    setAssigning(true);
    try {
      await axios.put(`http://localhost:5000/api/users/${selectedPartner}`,
        { hubId: id },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      addToast('Partner assigned successfully.', 'success');
      setAssignModalOpen(false);
      // Refresh partners list
      const res = await axios.get(`http://localhost:5000/api/users/delivery-partners/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPartners(res.data || []);
    } catch {
      addToast('Failed to assign partner.', 'error');
    } finally {
      setAssigning(false);
    }
  };

  // ── Orders table columns ────────────────────────────────────────────
  const filteredOrders = statusFilter === 'All'
    ? orders
    : orders.filter(o => o.status === statusFilter);

  const orderColumns = [
    {
      key: 'trackingId',
      label: 'Tracking ID',
      render: (v, row) => (
        <div className="flex items-center gap-1.5 group/cell cursor-pointer" onClick={async (e) => {
          e.stopPropagation();
          await navigator.clipboard.writeText(v);
          addToast('Tracking ID copied!', 'success');
        }}>
          <span className="font-mono text-xs text-[#f97316] font-semibold hover:underline">{v}</span>
          <Copy size={11} className="text-[#9ca3af] opacity-0 group-hover/cell:opacity-100 transition-opacity hover:text-white" />
        </div>
      ),
    },
    {
      key: 'customerName',
      label: 'Customer',
      render: v => <span className="text-cz-text-primary text-sm">{v}</span>,
    },
    {
      key: 'pickup',
      label: 'From → To',
      render: (v, row) => (
        <span className="text-cz-text-secondary text-xs">{row.pickup?.city} → {row.delivery?.city}</span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: v => <StatusBadge status={v} />,
    },
    {
      key: 'pickupHubId',
      label: 'Direction',
      render: (v, row) => {
        const isPickup = row.pickupHubId?._id === id || row.pickupHubId === id;
        return isPickup
          ? <span className="bg-blue-500/15 text-blue-400 text-[10px] font-bold px-2 py-0.5 rounded-full">Pickup Hub</span>
          : <span className="bg-[#f97316]/15 text-[#f97316] text-[10px] font-bold px-2 py-0.5 rounded-full">Dest. Hub</span>;
      },
    },
    {
      key: 'createdAt',
      label: 'Date',
      render: v => <span className="text-cz-text-secondary text-xs">{fmtDate(v)}</span>,
    },
  ];

  // ── Partners table columns ──────────────────────────────────────────
  const partnerColumns = [
    {
      key: 'name',
      label: 'Name / Email',
      render: (v, row) => (
        <div>
          <p className="text-cz-text-primary font-semibold text-sm">{v}</p>
          <p className="text-cz-text-secondary text-xs">{row.email}</p>
        </div>
      ),
    },
    {
      key: 'phone',
      label: 'Phone',
      render: v => <span className="text-cz-text-secondary text-sm">{v || '—'}</span>,
    },
    {
      key: 'isActive',
      label: 'Status',
      render: v => v
        ? <span className="bg-green-500/15 text-green-400 text-xs font-bold px-2 py-0.5 rounded-full">Active</span>
        : <span className="bg-red-500/15 text-red-400 text-xs font-bold px-2 py-0.5 rounded-full">Inactive</span>,
    },
  ];

  // ── Loading state ───────────────────────────────────────────────────
  if (hubLoading) {
    return (
      <AdminLayout title="Hub Detail" breadcrumb="Admin / Hubs / ...">
        <div className="flex items-center justify-center h-64">
          <div className="w-12 h-12 rounded-full border-4 border-[#1f2937] border-t-[#f97316] animate-spin" />
        </div>
      </AdminLayout>
    );
  }

  if (!hub) {
    return (
      <AdminLayout title="Hub Not Found" breadcrumb="Admin / Hubs">
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center">
            <AlertCircle size={28} className="text-red-400" />
          </div>
          <p className="text-cz-text-primary font-bold text-lg">Hub not found</p>
          <p className="text-cz-text-secondary text-sm">The hub may have been removed or the ID is invalid.</p>
          <div className="flex gap-3 mt-2">
            <button onClick={() => navigate('/hubs')} className="px-4 py-2 border border-cz-border text-cz-text-primary rounded-lg hover:bg-white/5 text-sm font-semibold transition-colors">
              Back to Hubs
            </button>
            <button onClick={fetchHub} className="px-4 py-2 bg-cz-accent-orange text-white rounded-lg hover:bg-[#ea6c0a] text-sm font-semibold transition-colors">
              Retry
            </button>
          </div>
        </div>
      </AdminLayout>
    );
  }

  const activeOrders = orders.filter(o => !['Delivered', 'Failed / Returned'].includes(o.status));

  return (
    <AdminLayout title={hub.name} breadcrumb={`Admin / Hubs / ${hub.name}`}>

      {/* Back button */}
      <button
        onClick={() => navigate('/hubs')}
        className="flex items-center gap-2 text-[#9ca3af] hover:text-white text-sm mb-5 transition-colors group"
      >
        <ArrowLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" />
        Back to Hubs
      </button>

      {/* ── Info Card ──────────────────────────────────────────────────── */}
      <div className="bg-[#111827] rounded-xl border border-[#1f2937] p-6 flex flex-col md:flex-row md:items-start justify-between gap-4 mb-6">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-white text-2xl font-bold">{hub.name}</h1>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full
              ${hub.isActive ? 'bg-green-500/15 text-green-400' : 'bg-red-500/15 text-red-400'}`}>
              {hub.isActive ? 'Active' : 'Inactive'}
            </span>
          </div>
          <p className="text-[#9ca3af] text-sm">{hub.city}, {hub.state}</p>
          <p className="text-[#6b7280] text-xs mt-0.5">{hub.address}</p>
        </div>

        <div className="flex flex-col sm:flex-row md:flex-col gap-2 flex-shrink-0">
          {hub.email && (
            <div className="flex items-center gap-2 bg-[#1f2937] px-3 py-2 rounded-lg">
              <Mail size={14} className="text-[#f97316]" />
              <span className="text-white text-xs">{hub.email}</span>
            </div>
          )}
          {hub.phone && (
            <div className="flex items-center gap-2 bg-[#1f2937] px-3 py-2 rounded-lg">
              <Phone size={14} className="text-[#f97316]" />
              <span className="text-white text-xs">{hub.phone}</span>
            </div>
          )}
          <button
            onClick={() => setDrawerOpen(true)}
            className="flex items-center gap-2 border border-[#f97316] text-[#f97316] hover:bg-[#f97316] hover:text-white px-4 py-2 rounded-lg text-xs font-semibold transition-colors"
          >
            <Pencil size={13} /> Edit Hub
          </button>
        </div>
      </div>

      {/* ── Tabs ──────────────────────────────────────────────────────── */}
      <div className="border-b border-[#1f2937] flex mb-6">
        <Tab label="Overview"          active={activeTab === 'overview'}  onClick={() => setActiveTab('overview')} />
        <Tab label="Orders"            active={activeTab === 'orders'}    onClick={() => setActiveTab('orders')} />
        <Tab label="Delivery Partners" active={activeTab === 'partners'}  onClick={() => setActiveTab('partners')} />
      </div>

      {/* ── Overview Tab ──────────────────────────────────────────────── */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <ManagerCard manager={hub.managerId} onChangeClick={() => setDrawerOpen(true)} />

            {/* Pincodes */}
            <div className="bg-[#111827] rounded-xl border border-[#1f2937] p-5">
              <p className="text-[#9ca3af] text-xs font-semibold uppercase tracking-wider mb-3">
                Serviceable Pincodes ({hub.serviceablePincodes?.length || 0})
              </p>
              {hub.serviceablePincodes?.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {hub.serviceablePincodes.map(p => (
                    <span key={p}
                      className="bg-[#1f2937] text-white text-xs font-mono px-2 py-1 rounded-md">
                      {p}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-[#6b7280] text-sm">No pincodes configured.</p>
              )}
            </div>
          </div>

          {/* Mini StatCards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatCard title="Total Orders" value={String(orders.length)} icon={Package} color="#3b82f6" loading={ordersLoading && orders.length === 0} />
            <StatCard title="Active Orders" value={String(activeOrders.length)} icon={Activity} color="#f97316" loading={ordersLoading && orders.length === 0} />
            <StatCard title="Delivery Partners" value={String(partners.length)} icon={Truck} color="#22c55e" loading={partnersLoading && partners.length === 0} />
          </div>
        </div>
      )}

      {/* ── Orders Tab ────────────────────────────────────────────────── */}
      {activeTab === 'orders' && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <p className="text-white font-bold text-sm">Hub Orders</p>
            <div className="w-52">
              <SelectDropdown
                options={STATUS_OPTIONS}
                value={statusFilter}
                onChange={setStatusFilter}
                placeholder="Filter by status..."
              />
            </div>
          </div>
          <DataTable
            columns={orderColumns}
            data={filteredOrders}
            loading={ordersLoading}
            onRowClick={row => navigate(`/orders/${row._id}`)}
            emptyIcon={Package}
            emptyTitle="No orders found"
          />
        </div>
      )}

      {/* ── Partners Tab ──────────────────────────────────────────────── */}
      {activeTab === 'partners' && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <p className="text-white font-bold text-sm">Delivery Partners</p>
            <button
              onClick={openAssignModal}
              className="flex items-center gap-2 bg-[#f97316] text-white text-xs font-bold px-4 py-2 rounded-lg hover:bg-[#ea6c0a] transition-colors"
            >
              <UserPlus size={14} /> Assign Partner
            </button>
          </div>
          <DataTable
            columns={partnerColumns}
            data={partners}
            loading={partnersLoading}
            emptyIcon={Bike}
            emptyTitle="No delivery partners yet"
          />
        </div>
      )}

      {/* ── Edit Drawer ────────────────────────────────────────────────── */}
      <HubDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        hubData={hub}
        onSuccess={(updated) => {
          setHub(updated);
          setDrawerOpen(false);
        }}
      />

      {/* ── Assign Partner Modal ───────────────────────────────────────── */}
      <Modal
        isOpen={assignModalOpen}
        onClose={() => setAssignModalOpen(false)}
        title="Assign Delivery Partner"
        footer={
          <div className="flex justify-end gap-3">
            <button
              onClick={() => setAssignModalOpen(false)}
              className="px-4 py-2 text-sm border border-[#374151] text-[#9ca3af] hover:text-white rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleAssignPartner}
              disabled={!selectedPartner || assigning}
              className="px-5 py-2 text-sm bg-[#f97316] text-white font-bold rounded-lg hover:bg-[#ea6c0a] disabled:opacity-50 transition-colors"
            >
              {assigning ? 'Assigning…' : 'Assign'}
            </button>
          </div>
        }
      >
        <p className="text-[#9ca3af] text-sm mb-4">
          Select a delivery partner to assign to <span className="text-white font-semibold">{hub.name}</span>.
        </p>
        <SelectDropdown
          label="Delivery Partner"
          options={allDeliveryPartners}
          value={selectedPartner}
          onChange={setSelectedPartner}
          searchable
          placeholder="Search by name or email..."
        />
      </Modal>

    </AdminLayout>
  );
};

const HubDetailPage = () => (
  <ToastProvider>
    <HubDetailContent />
  </ToastProvider>
);

export default HubDetailPage;
