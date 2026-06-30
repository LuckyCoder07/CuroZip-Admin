import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Copy, MapPin, Building2, Truck,
  AlertTriangle, User, RefreshCcw, ChevronRight, Loader2
} from 'lucide-react';
import axios from 'axios';

import AdminLayout from '../components/AdminLayout';
import { StatusBadge, Modal, SelectDropdown, OrderLifecycleTracker } from '../components/shared';
import { ToastProvider, useToast } from '../components/shared/ToastContext';
import { useAuth } from '../context/AuthContext';

const API = '';

const fmtDate = (d, long = false) => {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', long
    ? { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }
    : { day: '2-digit', month: 'short', year: 'numeric' }
  );
};

// Status transition map
const NEXT_STATUSES = {
  'Booked':              ['Pickup Assigned'],
  'Pickup Assigned':     ['Picked Up'],
  'Picked Up':           ['In Transit'],
  'In Transit':          ['At Destination Hub'],
  'At Destination Hub':  ['Out for Delivery'],
  'Out for Delivery':    ['Delivered', 'Failed / Returned'],
  'Delivered':           [],
  'Failed / Returned':   [],
};

// Status dot colors for timeline
const STATUS_COLORS = {
  'Booked':              '#9ca3af',
  'Pickup Assigned':     '#3b82f6',
  'Picked Up':           '#8b5cf6',
  'In Transit':          '#f59e0b',
  'At Destination Hub':  '#06b6d4',
  'Out for Delivery':    '#f97316',
  'Delivered':           '#22c55e',
  'Failed / Returned':   '#ef4444',
};

const VEHICLE_META = {
  'Volvo Bus':   { color: '#3b82f6', bg: '#3b82f620' },
  'Cargo Truck': { color: '#f97316', bg: '#f9731620' },
  'Mini Van':    { color: '#8b5cf6', bg: '#8b5cf620' },
  'Other':       { color: '#9ca3af', bg: '#9ca3af20' },
};

// ─── Info Card wrapper ────────────────────────────────────────────────────────
const Card = ({ children, className = '' }) => (
  <div className={`bg-[#111827] border border-[#1f2937] rounded-xl p-6 ${className}`}>
    {children}
  </div>
);

// ─── Assignment Row ───────────────────────────────────────────────────────────
const AssignmentRow = ({ label, value, onAssign }) => (
  <div className="flex items-center justify-between py-4 border-b border-[#1f2937] last:border-0">
    <div className="min-w-0 flex-1">
      <p className="text-[#9ca3af] text-xs font-semibold uppercase tracking-wider mb-1">{label}</p>
      <div>{value}</div>
    </div>
    <button
      onClick={onAssign}
      className="ml-4 flex-shrink-0 border border-[#f97316] text-[#f97316] hover:bg-[#f97316] hover:text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-colors"
    >
      Assign
    </button>
  </div>
);

// ─── Unassigned badge ─────────────────────────────────────────────────────────
const Unassigned = () => (
  <div className="flex items-center gap-1.5 text-yellow-400 text-sm">
    <AlertTriangle size={14} />
    <span className="font-semibold">Not Assigned</span>
  </div>
);

// ═══════════════════════════════════════════════════════════════════════════════
const OrderDetailContent = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token, user: authUser } = useAuth();
  const { addToast } = useToast();

  const [order, setOrder]     = useState(null);
  const [loading, setLoading] = useState(true);

  // Vendor assignment modal
  const [vendorModal, setVendorModal]       = useState(false);
  const [vendorOptions, setVendorOptions]   = useState([]);
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [vendorSaving, setVendorSaving]     = useState(false);

  // Pickup partner modal
  const [pickupModal, setPickupModal]         = useState(false);
  const [pickupOptions, setPickupOptions]     = useState([]);
  const [selectedPickup, setSelectedPickup]   = useState(null);
  const [pickupSaving, setPickupSaving]       = useState(false);

  // Delivery partner modal
  const [deliveryModal, setDeliveryModal]       = useState(false);
  const [deliveryOptions, setDeliveryOptions]   = useState([]);
  const [selectedDelivery, setSelectedDelivery] = useState(null);
  const [deliverySaving, setDeliverySaving]     = useState(false);

  // Status update modal
  const [statusModal, setStatusModal]     = useState(false);
  const [nextStatus, setNextStatus]       = useState('');
  const [statusNote, setStatusNote]       = useState('');
  const [statusSaving, setStatusSaving]   = useState(false);

  const [error, setError] = useState(null);

  // ── Fetch order ─────────────────────────────────────────────────────
  const fetchOrder = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get(`${API}/api/orders/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      setOrder(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load order.');
      addToast('Failed to load order.', 'error');
    }
    finally { setLoading(false); }
  }, [id, token]);

  useEffect(() => { fetchOrder(); }, [fetchOrder]);

  // ── Copy tracking ID ────────────────────────────────────────────────────
  const copyTrackingId = async () => {
    await navigator.clipboard.writeText(order.trackingId);
    addToast('Tracking ID copied!', 'success');
  };

  // ── Open vendor modal ───────────────────────────────────────────────────
  const openVendorModal = async () => {
    setSelectedVendor(null);
    try {
      const res = await axios.get(
        `${API}/api/vendors/by-route?fromCity=${order.pickup.city}&toCity=${order.delivery.city}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const opts = (res.data || []).map(v => ({
        value: v._id,
        label: `${v.name} · ${v.vehicleType}`,
        vehicleType: v.vehicleType,
      }));
      setVendorOptions(opts.length ? opts : [{ value: '', label: 'No vendors for this route' }]);
    } catch { setVendorOptions([]); }
    setVendorModal(true);
  };

  const assignVendor = async () => {
    if (!selectedVendor) return;
    setVendorSaving(true);
    try {
      await axios.put(`${API}/api/orders/${id}/assign-vendor`, { vendorId: selectedVendor }, { headers: { Authorization: `Bearer ${token}` } });
      addToast('Vendor assigned.', 'success');
      setVendorModal(false);
      fetchOrder();
    } catch { addToast('Failed to assign vendor.', 'error'); }
    finally { setVendorSaving(false); }
  };

  // ── Open pickup partner modal ───────────────────────────────────────────
  const openPickupModal = async () => {
    setSelectedPickup(null);
    const hubId = order.pickupHubId?._id || order.pickupHubId;
    try {
      const res = await axios.get(`${API}/api/users/delivery-partners/${hubId}`, { headers: { Authorization: `Bearer ${token}` } });
      setPickupOptions((res.data || []).map(u => ({ value: u._id, label: `${u.name} · ${u.phone || 'No phone'}` })));
    } catch { setPickupOptions([]); }
    setPickupModal(true);
  };

  const assignPickup = async () => {
    if (!selectedPickup) return;
    setPickupSaving(true);
    try {
      await axios.put(`${API}/api/orders/${id}/assign-pickup-partner`, { partnerId: selectedPickup }, { headers: { Authorization: `Bearer ${token}` } });
      addToast('Pickup partner assigned. Status → Pickup Assigned.', 'success');
      setPickupModal(false);
      fetchOrder();
    } catch { addToast('Failed to assign pickup partner.', 'error'); }
    finally { setPickupSaving(false); }
  };

  // ── Open delivery partner modal ─────────────────────────────────────────
  const openDeliveryModal = async () => {
    setSelectedDelivery(null);
    const hubId = order.destinationHubId?._id || order.destinationHubId;
    try {
      const res = await axios.get(`${API}/api/users/delivery-partners/${hubId}`, { headers: { Authorization: `Bearer ${token}` } });
      setDeliveryOptions((res.data || []).map(u => ({ value: u._id, label: `${u.name} · ${u.phone || 'No phone'}` })));
    } catch { setDeliveryOptions([]); }
    setDeliveryModal(true);
  };

  const assignDelivery = async () => {
    if (!selectedDelivery) return;
    setDeliverySaving(true);
    try {
      await axios.put(`${API}/api/orders/${id}/assign-delivery-partner`, { partnerId: selectedDelivery }, { headers: { Authorization: `Bearer ${token}` } });
      addToast('Delivery partner assigned. Status → Out for Delivery.', 'success');
      setDeliveryModal(false);
      fetchOrder();
    } catch { addToast('Failed to assign delivery partner.', 'error'); }
    finally { setDeliverySaving(false); }
  };

  // ── Open status modal ───────────────────────────────────────────────────
  const openStatusModal = () => {
    const nexts = NEXT_STATUSES[order.status] || [];
    setNextStatus(nexts[0] || '');
    setStatusNote('');
    setStatusModal(true);
  };

  const updateStatus = async () => {
    if (!nextStatus) return;
    setStatusSaving(true);
    try {
      await axios.put(`${API}/api/orders/${id}/status`, { status: nextStatus, note: statusNote }, { headers: { Authorization: `Bearer ${token}` } });
      addToast(`Status updated to "${nextStatus}".`, 'success');
      setStatusModal(false);
      fetchOrder();
    } catch { addToast('Failed to update status.', 'error'); }
    finally { setStatusSaving(false); }
  };

  // ── Loading ─────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <AdminLayout title="Order Detail" breadcrumb="Admin / Orders / ...">
        <div className="flex items-center justify-center h-64">
          <div className="w-12 h-12 rounded-full border-4 border-[#1f2937] border-t-[#f97316] animate-spin" />
        </div>
      </AdminLayout>
    );
  }

  if (!order) {
    return (
      <AdminLayout title="Not Found" breadcrumb="Admin / Orders">
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center">
            <AlertTriangle size={28} className="text-red-400" />
          </div>
          <p className="text-cz-text-primary font-bold text-lg">{error || 'Order not found'}</p>
          <p className="text-cz-text-secondary text-sm">The order may have been removed or the ID is invalid.</p>
          <div className="flex gap-3 mt-2">
            <button onClick={() => navigate('/orders')} className="px-4 py-2 border border-cz-border text-cz-text-primary rounded-lg hover:bg-white/5 text-sm font-semibold transition-colors">
              Back to Orders
            </button>
            <button onClick={fetchOrder} className="px-4 py-2 bg-cz-accent-orange text-white rounded-lg hover:bg-[#ea6c0a] text-sm font-semibold transition-colors">
              Retry
            </button>
          </div>
        </div>
      </AdminLayout>
    );
  }

  const nextStatuses = NEXT_STATUSES[order.status] || [];
  const isFinalStatus = nextStatuses.length === 0;

  return (
    <AdminLayout title={order.trackingId} breadcrumb={`Admin / Orders / ${order.trackingId}`}>

      {/* Back link */}
      <button
        onClick={() => navigate('/orders')}
        className="flex items-center gap-2 text-[#9ca3af] hover:text-white text-sm mb-5 transition-colors group"
      >
        <ArrowLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" />
        Back to Orders
      </button>

      {/* ── BLOCK 1 — Header Card ─────────────────────────────────────────── */}
      <Card className="flex flex-col sm:flex-row items-start justify-between gap-4 mb-5">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="font-mono text-2xl font-bold text-[#f97316]">{order.trackingId}</span>
            <button onClick={copyTrackingId} title="Copy" className="text-[#9ca3af] hover:text-white p-1 rounded transition-colors">
              <Copy size={16} />
            </button>
          </div>
          <StatusBadge status={order.status} />
        </div>
        <div className="flex flex-col items-end gap-2 text-right">
          <p className="text-[#9ca3af] text-xs">Booked: <span className="text-white font-medium">{fmtDate(order.createdAt)}</span></p>
          <p className="text-white font-bold text-xl">₹{(order.amount || 0).toLocaleString('en-IN')}</p>
          <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${order.isPaid ? 'bg-green-500/15 text-green-400' : 'bg-red-500/15 text-red-400'}`}>
            {order.isPaid ? 'Paid' : 'Unpaid'}
          </span>
        </div>
      </Card>

      {/* ── BLOCK 2 — Lifecycle Tracker ───────────────────────────────────── */}
      <Card className="mb-5">
        <h2 className="text-white font-bold text-base mb-2">Shipment Journey</h2>
        <OrderLifecycleTracker currentStatus={order.status} />
      </Card>

      {/* ── BLOCK 3 — Pickup + Delivery Details ───────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
        {/* Pickup */}
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <MapPin size={18} className="text-[#f97316]" />
            <h3 className="text-white font-bold">Pickup Details</h3>
          </div>
          <p className="text-white font-semibold">{order.pickup?.name}</p>
          <p className="text-[#9ca3af] text-sm">{order.pickup?.phone}</p>
          <p className="text-[#6b7280] text-xs mt-1">{order.pickup?.address}, {order.pickup?.city} — {order.pickup?.pincode}</p>
          <div className="border-t border-[#1f2937] mt-3 pt-3">
            <p className="text-[#9ca3af] text-xs">Pickup Hub: <span className="text-[#f97316] font-semibold">{order.pickupHubId?.name || '—'}</span></p>
          </div>
        </Card>

        {/* Delivery */}
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <MapPin size={18} className="text-[#3b82f6]" />
            <h3 className="text-white font-bold">Delivery Details</h3>
          </div>
          <p className="text-white font-semibold">{order.delivery?.name}</p>
          <p className="text-[#9ca3af] text-sm">{order.delivery?.phone}</p>
          <p className="text-[#6b7280] text-xs mt-1">{order.delivery?.address}, {order.delivery?.city} — {order.delivery?.pincode}</p>
          <div className="border-t border-[#1f2937] mt-3 pt-3">
            <p className="text-[#9ca3af] text-xs">Destination Hub: <span className="text-[#3b82f6] font-semibold">{order.destinationHubId?.name || '—'}</span></p>
          </div>
        </Card>
      </div>

      {/* ── BLOCK 4 — Assignments ────────────────────────────────────────── */}
      <Card className="mb-5">
        <h2 className="text-white font-bold text-base mb-2">Assignments</h2>

        {/* Vendor */}
        <AssignmentRow
          label="Fleet Vendor (Intercity)"
          value={order.assignedVendorId ? (
            <div className="flex items-center gap-2">
              <span className="text-white font-semibold text-sm">{order.assignedVendorId.name}</span>
              {order.assignedVendorId.vehicleType && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                  style={{ color: VEHICLE_META[order.assignedVendorId.vehicleType]?.color || '#9ca3af', backgroundColor: VEHICLE_META[order.assignedVendorId.vehicleType]?.bg || '#9ca3af20' }}>
                  {order.assignedVendorId.vehicleType}
                </span>
              )}
            </div>
          ) : <Unassigned />}
          onAssign={openVendorModal}
        />

        {/* Pickup Partner */}
        <AssignmentRow
          label="Pickup Delivery Partner"
          value={order.assignedPickupPartnerId
            ? <span className="text-white font-semibold text-sm">{order.assignedPickupPartnerId.name}</span>
            : <span className="text-[#9ca3af] text-sm">—</span>
          }
          onAssign={openPickupModal}
        />

        {/* Last-Mile Partner */}
        <AssignmentRow
          label="Last-Mile Delivery Partner"
          value={order.assignedDeliveryPartnerId
            ? <span className="text-white font-semibold text-sm">{order.assignedDeliveryPartnerId.name}</span>
            : <span className="text-[#9ca3af] text-sm">—</span>
          }
          onAssign={openDeliveryModal}
        />
      </Card>

      {/* ── BLOCK 5 — Update Status ──────────────────────────────────────── */}
      <Card className="mb-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-white font-bold text-base mb-2">Update Status</h2>
            <StatusBadge status={order.status} />
          </div>
          {!isFinalStatus && (
            <button
              onClick={openStatusModal}
              className="flex items-center gap-2 bg-[#f97316] text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-[#ea6c0a] transition-colors"
            >
              <RefreshCcw size={14} /> Update Status
            </button>
          )}
          {isFinalStatus && (
            <p className="text-[#9ca3af] text-sm italic">Final status — no further updates possible.</p>
          )}
        </div>
      </Card>

      {/* ── BLOCK 6 — Status History ─────────────────────────────────────── */}
      <Card>
        <h2 className="text-white font-bold text-base mb-5">Status History</h2>
        <div className="relative">
          {/* Vertical line */}
          {order.statusHistory?.length > 1 && (
            <div className="absolute left-[7px] top-4 bottom-4 w-[2px] bg-[#1f2937]" />
          )}
          <div className="space-y-5">
            {[...(order.statusHistory || [])].reverse().map((entry, i) => {
              const color = STATUS_COLORS[entry.status] || '#9ca3af';
              return (
                <div key={i} className="flex gap-4 relative">
                  {/* Dot */}
                  <div className="w-4 h-4 rounded-full flex-shrink-0 mt-1 z-10 border-2 border-[#111827]"
                    style={{ backgroundColor: color }} />

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-0.5">
                      <StatusBadge status={entry.status} />
                      <span className="text-[#6b7280] text-xs">{fmtDate(entry.timestamp, true)}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <User size={11} className="text-[#9ca3af]" />
                      <span className="text-[#9ca3af] text-xs">{entry.updatedByName || entry.updatedBy?.name || 'System'}</span>
                    </div>
                    {entry.note && (
                      <p className="text-[#6b7280] text-xs italic mt-1">"{entry.note}"</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </Card>

      {/* ─────────────────── MODALS ─────────────────── */}

      {/* Vendor Assignment Modal */}
      <Modal isOpen={vendorModal} onClose={() => setVendorModal(false)} title="Assign Intercity Vendor"
        footer={
          <div className="flex justify-end gap-3">
            <button onClick={() => setVendorModal(false)} className="px-4 py-2 text-sm border border-[#374151] text-[#9ca3af] hover:text-white rounded-lg transition-colors">Cancel</button>
            <button onClick={assignVendor} disabled={!selectedVendor || vendorSaving} className="px-5 py-2 text-sm bg-[#f97316] text-white font-bold rounded-lg hover:bg-[#ea6c0a] disabled:opacity-50 flex items-center gap-2">
              {vendorSaving && <Loader2 size={14} className="animate-spin" />} Confirm Assignment
            </button>
          </div>
        }
      >
        <p className="text-[#9ca3af] text-sm mb-1">Route:</p>
        <p className="text-[#f97316] font-bold mb-4">{order.pickup?.city} → {order.delivery?.city}</p>
        <SelectDropdown
          label="Select Vendor"
          options={vendorOptions}
          value={selectedVendor}
          onChange={setSelectedVendor}
          searchable
          placeholder="Search vendors for this route..."
        />
      </Modal>

      {/* Pickup Partner Modal */}
      <Modal isOpen={pickupModal} onClose={() => setPickupModal(false)} title="Assign Pickup Partner"
        footer={
          <div className="flex justify-end gap-3">
            <button onClick={() => setPickupModal(false)} className="px-4 py-2 text-sm border border-[#374151] text-[#9ca3af] hover:text-white rounded-lg transition-colors">Cancel</button>
            <button onClick={assignPickup} disabled={!selectedPickup || pickupSaving} className="px-5 py-2 text-sm bg-[#f97316] text-white font-bold rounded-lg hover:bg-[#ea6c0a] disabled:opacity-50 flex items-center gap-2">
              {pickupSaving && <Loader2 size={14} className="animate-spin" />} Assign
            </button>
          </div>
        }
      >
        <p className="text-[#9ca3af] text-sm mb-4">
          Selecting a pickup partner will automatically advance the order status to <span className="text-[#f97316] font-semibold">"Pickup Assigned"</span>.
        </p>
        <SelectDropdown
          label="Pickup Hub Partners"
          options={pickupOptions}
          value={selectedPickup}
          onChange={setSelectedPickup}
          searchable
          placeholder="Search delivery partners..."
        />
      </Modal>

      {/* Delivery Partner Modal */}
      <Modal isOpen={deliveryModal} onClose={() => setDeliveryModal(false)} title="Assign Last-Mile Delivery Partner"
        footer={
          <div className="flex justify-end gap-3">
            <button onClick={() => setDeliveryModal(false)} className="px-4 py-2 text-sm border border-[#374151] text-[#9ca3af] hover:text-white rounded-lg transition-colors">Cancel</button>
            <button onClick={assignDelivery} disabled={!selectedDelivery || deliverySaving} className="px-5 py-2 text-sm bg-[#f97316] text-white font-bold rounded-lg hover:bg-[#ea6c0a] disabled:opacity-50 flex items-center gap-2">
              {deliverySaving && <Loader2 size={14} className="animate-spin" />} Assign
            </button>
          </div>
        }
      >
        <p className="text-[#9ca3af] text-sm mb-4">
          Selecting a delivery partner will advance the order status to <span className="text-[#f97316] font-semibold">"Out for Delivery"</span>.
        </p>
        <SelectDropdown
          label="Destination Hub Partners"
          options={deliveryOptions}
          value={selectedDelivery}
          onChange={setSelectedDelivery}
          searchable
          placeholder="Search delivery partners..."
        />
      </Modal>

      {/* Status Update Modal */}
      <Modal isOpen={statusModal} onClose={() => setStatusModal(false)} title="Update Order Status"
        footer={
          <div className="flex justify-end gap-3">
            <button onClick={() => setStatusModal(false)} className="px-4 py-2 text-sm border border-[#374151] text-[#9ca3af] hover:text-white rounded-lg transition-colors">Cancel</button>
            <button onClick={updateStatus} disabled={!nextStatus || statusSaving} className="px-5 py-2 text-sm bg-[#f97316] text-white font-bold rounded-lg hover:bg-[#ea6c0a] disabled:opacity-50 flex items-center gap-2">
              {statusSaving && <Loader2 size={14} className="animate-spin" />} Confirm Update
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          <div>
            <p className="text-[#9ca3af] text-xs mb-1">Current Status</p>
            <StatusBadge status={order.status} />
          </div>
          {isFinalStatus ? (
            <p className="text-[#9ca3af] text-sm italic">This order is in a final state. No further status updates are possible.</p>
          ) : (
            <>
              <SelectDropdown
                label="New Status"
                options={nextStatuses.map(s => ({ value: s, label: s }))}
                value={nextStatus}
                onChange={setNextStatus}
              />
              <div>
                <label className="text-[#9ca3af] text-sm font-medium mb-1.5 block">Note (optional)</label>
                <textarea
                  value={statusNote}
                  onChange={e => setStatusNote(e.target.value)}
                  rows={3}
                  placeholder="Add a note about this status change..."
                  className="w-full bg-[#0a0e1a] text-white border border-[#374151] rounded-lg px-4 py-2 resize-none outline-none focus:border-[#f97316] focus:ring-2 focus:ring-[#f97316]/30 transition-all text-sm"
                />
              </div>
            </>
          )}
        </div>
      </Modal>

    </AdminLayout>
  );
};

const OrderDetailPage = () => (
  <ToastProvider>
    <OrderDetailContent />
  </ToastProvider>
);

export default OrderDetailPage;
