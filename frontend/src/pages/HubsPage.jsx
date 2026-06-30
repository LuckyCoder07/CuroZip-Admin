import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Eye, Pencil, Building2 } from 'lucide-react';
import axios from 'axios';

import AdminLayout from '../components/AdminLayout';
import HubDrawer from '../components/HubDrawer';
import { PageHeader, DataTable, StatusBadge } from '../components/shared';
import { ToastProvider, useToast } from '../components/shared/ToastContext';
import { useAuth } from '../context/AuthContext';

// ─── Status Toggle Switch ────────────────────────────────────────────────────
const ToggleSwitch = ({ hubId, isActive, token, onToggle }) => {
  const { addToast } = useToast();
  const [loading, setLoading] = useState(false);

  const handleToggle = async (e) => {
    e.stopPropagation();
    setLoading(true);
    try {
      await axios.put(
        `/api/hubs/${hubId}`,
        { isActive: !isActive },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      onToggle(hubId, !isActive);
      addToast(`Hub ${!isActive ? 'activated' : 'deactivated'} successfully.`, 'success');
    } catch {
      addToast('Failed to update hub status.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleToggle}
      disabled={loading}
      title={isActive ? 'Click to deactivate' : 'Click to activate'}
      className={`relative inline-flex items-center h-6 w-11 rounded-full transition-colors duration-200 focus:outline-none
        ${isActive ? 'bg-green-500' : 'bg-cz-border'}
        ${loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
    >
      <span className={`inline-block w-4 h-4 bg-white rounded-full shadow transition-transform duration-200
        ${isActive ? 'translate-x-6' : 'translate-x-1'}`}
      />
    </button>
  );
};

// ─── Pincode Pills ───────────────────────────────────────────────────────────
const PincodePills = ({ pincodes = [] }) => {
  const visible = pincodes.slice(0, 3);
  const extra = pincodes.length - 3;
  return (
    <div className="flex flex-wrap gap-1">
      {visible.map(p => (
        <span key={p} className="bg-cz-border text-cz-text-primary text-[10px] font-mono px-1.5 py-0.5 rounded">
          {p}
        </span>
      ))}
      {extra > 0 && (
        <span className="bg-cz-dark-bg text-cz-text-secondary text-[10px] px-1.5 py-0.5 rounded">
          +{extra} more
        </span>
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
const HubsPageContent = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { token } = useAuth();

  const [hubs, setHubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingHub, setEditingHub] = useState(null);

  const fetchHubs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/hubs?all=true', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setHubs(res.data || []);
    } catch {
      // silently fail; table shows empty
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { fetchHubs(); }, [fetchHubs]);

  // Auto-open drawer from query param (Quick Actions nav)
  useEffect(() => {
    if (searchParams.get('action') === 'add') {
      setEditingHub(null);
      setDrawerOpen(true);
    }
  }, [searchParams]);

  const openDrawer = (hub = null) => {
    setEditingHub(hub);
    setDrawerOpen(true);
  };

  const handleToggle = (hubId, newActive) => {
    setHubs(prev =>
      prev.map(h => h._id === hubId ? { ...h, isActive: newActive } : h)
    );
  };

  const handleDrawerSuccess = () => { fetchHubs(); };

  // ─── Table columns ──────────────────────────────────────────────────────
  const columns = [
    {
      key: 'name',
      label: 'Hub Name',
      render: (val) => <span className="text-white font-bold">{val}</span>,
    },
    {
      key: 'city',
      label: 'City / State',
      render: (val, row) => (
        <div>
          <p className="text-cz-text-primary font-semibold text-sm">{row.city}</p>
          <p className="text-cz-text-secondary text-xs">{row.state}</p>
        </div>
      ),
    },
    {
      key: 'email',
      label: 'Email',
      render: (val) => <span className="text-cz-text-secondary text-sm">{val}</span>,
    },
    {
      key: 'phone',
      label: 'Phone',
      render: (val) => <span className="text-cz-text-secondary text-sm">{val}</span>,
    },
    {
      key: 'serviceablePincodes',
      label: 'Pincodes',
      render: (val) => <PincodePills pincodes={val} />,
    },
    {
      key: 'managerId',
      label: 'Manager',
      render: (val) => val ? (
        <span className="text-white text-sm">{val.name}</span>
      ) : (
        <span className="bg-yellow-500/15 text-yellow-400 text-xs font-semibold px-2 py-0.5 rounded-full">
          Unassigned
        </span>
      ),
    },
    {
      key: 'isActive',
      label: 'Status',
      render: (val, row) => (
        <ToggleSwitch
          hubId={row._id}
          isActive={val}
          token={token}
          onToggle={handleToggle}
        />
      ),
    },
    {
      key: '_id',
      label: 'Actions',
      render: (val, row) => (
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => { e.stopPropagation(); openDrawer(row); }}
            title="Edit Hub"
            className="p-1.5 rounded-lg text-[#9ca3af] hover:text-white hover:bg-white/10 transition-colors"
          >
            <Pencil size={15} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); navigate(`/hubs/${val}`); }}
            title="View Hub"
            className="p-1.5 rounded-lg text-[#9ca3af] hover:text-[#f97316] hover:bg-[#f97316]/10 transition-colors"
          >
            <Eye size={15} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <AdminLayout title="Hubs" breadcrumb="Admin / Hubs">
      <PageHeader
        title="Hubs"
        subtitle="Manage all logistics hubs across Assam"
        actionLabel="+ Add Hub"
        onAction={() => openDrawer(null)}
      />

      <DataTable
        columns={columns}
        data={hubs}
        loading={loading}
        searchable
        emptyIcon={Building2}
        emptyTitle="No hubs added yet"
        emptyActionLabel="+ Add Hub"
        emptyOnAction={() => openDrawer(null)}
      />

      <HubDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        hubData={editingHub}
        onSuccess={handleDrawerSuccess}
      />
    </AdminLayout>
  );
};

// Wrap in ToastProvider since this page needs toasts
const HubsPage = () => (
  <ToastProvider>
    <HubsPageContent />
  </ToastProvider>
);

export default HubsPage;
