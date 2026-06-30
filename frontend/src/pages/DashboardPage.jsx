import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid
} from 'recharts';
import {
  Package, Building2, Users, TrendingUp, Activity,
  Users2, Plus, ArrowRight, Truck
} from 'lucide-react';

import AdminLayout from '../components/AdminLayout';
import { StatCard, DataTable, StatusBadge } from '../components/shared';
import { useAuth } from '../context/AuthContext';

const STATUS_COLORS = {
  'Booked':                '#3b82f6',
  'Pickup Assigned':       '#8b5cf6',
  'Picked Up':             '#6366f1',
  'In Transit':            '#eab308',
  'At Destination Hub':    '#f97316',
  'Out for Delivery':      '#06b6d4',
  'Delivered':             '#22c55e',
  'Failed / Returned':     '#ef4444',
};

const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

const fmtCurrency = (n) =>
  typeof n === 'number' ? '₹' + n.toLocaleString('en-IN', { maximumFractionDigits: 0 }) : '₹0';

const api = (path, token) =>
  axios.get(`${path}`, { headers: { Authorization: `Bearer ${token}` } });

// ─── Themed Tooltip ──────────────────────────────────────────────────────────
const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-cz-card-bg border border-cz-border rounded-lg px-3 py-2 text-sm shadow-xl">
      {label && <p className="text-cz-text-secondary mb-1">{label}</p>}
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color || '#f97316' }} className="font-semibold">
          {p.name}: {p.value}
        </p>
      ))}
    </div>
  );
};

// ─── Order Columns ────────────────────────────────────────────────────────────
const ORDER_COLUMNS = [
  {
    key: 'trackingId', label: 'Tracking ID',
    render: (val) => <span className="font-mono text-xs text-cz-accent-orange font-semibold">{val}</span>,
  },
  { key: 'customerName', label: 'Customer' },
  {
    key: 'route', label: 'Route',
    render: (val) => <span className="text-cz-text-secondary text-xs">{val}</span>,
  },
  {
    key: 'status', label: 'Status',
    render: (val) => <StatusBadge status={val} />,
  },
  {
    key: 'createdAt', label: 'Date',
    render: (val) => <span className="text-cz-text-secondary text-xs">{fmtDate(val)}</span>,
  },
];

// ─── Hub Activity Row ─────────────────────────────────────────────────────────
const HubRow = ({ hub, maxCount }) => {
  const pct = maxCount > 0 ? Math.round((hub.orderCount / maxCount) * 100) : 0;
  return (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-1.5">
        <div>
          <p className="text-cz-text-primary text-sm font-medium">{hub.name}</p>
          <p className="text-cz-text-secondary text-xs">{hub.city}</p>
        </div>
        <span className="bg-cz-accent-orange/20 text-cz-accent-orange text-xs font-bold px-2 py-1 rounded-full ml-4">
          {hub.orderCount}
        </span>
      </div>
      <div className="h-1.5 bg-cz-border rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, backgroundColor: '#f97316' }} />
      </div>
    </div>
  );
};

// ─── Donut Legend ─────────────────────────────────────────────────────────────
const DonutLegend = ({ data }) => (
  <div className="grid grid-cols-2 gap-x-6 gap-y-2 mt-4 px-2">
    {data.map((entry) => (
      <div key={entry.name} className="flex items-center gap-2">
        <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: STATUS_COLORS[entry.name] || '#9ca3af' }} />
        <span className="text-cz-text-secondary text-xs truncate flex-1">{entry.name}</span>
        <span className="text-cz-text-primary text-xs font-bold">{entry.value}</span>
      </div>
    ))}
  </div>
);

// ─── Quick Action Card ────────────────────────────────────────────────────────
const QuickActionCard = ({ icon: Icon, iconColor, label, description, onClick }) => (
  <button
    onClick={onClick}
    className="group flex items-start gap-4 bg-cz-card-bg border border-cz-border rounded-xl p-5 text-left hover:border-cz-accent-orange hover:scale-[1.02] transition-all duration-200 w-full shadow-sm"
  >
    <div className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: iconColor + '20' }}>
      <Icon size={28} style={{ color: iconColor }} />
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-cz-text-primary font-bold text-base leading-tight">{label}</p>
      <p className="text-cz-text-secondary text-xs mt-1">{description}</p>
    </div>
    <ArrowRight size={18} className="text-cz-text-secondary group-hover:text-cz-accent-orange group-hover:translate-x-1 transition-all mt-1 flex-shrink-0" />
  </button>
);

// ═══════════════════════════════════════════════════════════════════════════════
const DashboardPage = () => {
  const navigate = useNavigate();
  const { token } = useAuth();

  const [overviewLoading, setOverviewLoading] = useState(true);
  const [ordersLoading,   setOrdersLoading]   = useState(true);
  const [chartsLoading,   setChartsLoading]   = useState(true);

  const [overview,      setOverview]      = useState(null);
  const [recentOrders,  setRecentOrders]  = useState([]);
  const [byStatus,      setByStatus]      = useState([]);
  const [byCity,        setByCity]        = useState([]);
  const [hubActivity,   setHubActivity]   = useState([]);

  // ── Overview ─────────────────────────────────────────────────────────────
  useEffect(() => {
    api('/api/analytics/overview', token)
      .then(r => setOverview(r.data))
      .catch(() => {})
      .finally(() => setOverviewLoading(false));
  }, [token]);

  // ── Recent Orders ─────────────────────────────────────────────────────────
  useEffect(() => {
    api('/api/orders', token)
      .then(r => {
        const raw = Array.isArray(r.data) ? r.data.slice(0, 10) : [];
        setRecentOrders(raw.map(o => ({
          ...o,
          id: o._id,
          customerName: o.customer?.name || o.customerName || '—',
          route: `${o.pickup?.city || '—'} → ${o.delivery?.city || '—'}`,
        })));
      })
      .catch(() => {})
      .finally(() => setOrdersLoading(false));
  }, [token]);

  // ── Charts + Hub Activity ─────────────────────────────────────────────────
  useEffect(() => {
    Promise.all([
      api('/api/analytics/orders-by-status', token),
      api('/api/analytics/orders-by-city', token),
      api('/api/hubs', token),
    ]).then(([statusRes, cityRes, hubRes]) => {
      setByStatus(Array.isArray(statusRes.data) ? statusRes.data : []);

      const cityData = Array.isArray(cityRes.data) ? cityRes.data : [];
      setByCity(cityData.sort((a, b) => b.count - a.count).slice(0, 6));

      const hubs = Array.isArray(hubRes.data) ? hubRes.data : [];
      const cityMap = {};
      cityData.forEach(c => { cityMap[c.city] = c.count; });
      const hubAct = hubs.map(h => ({
        name: h.name, city: h.city, orderCount: cityMap[h.city] || 0,
      })).sort((a, b) => b.orderCount - a.orderCount).slice(0, 6);
      setHubActivity(hubAct);
    }).catch(() => {}).finally(() => setChartsLoading(false));
  }, [token]);

  const maxHubCount = hubActivity.length > 0 ? Math.max(hubActivity[0].orderCount, 1) : 1;

  // Navigate to page and optionally trigger the add drawer via query param
  const goTo = (path) => navigate(path);

  return (
    <AdminLayout title="Dashboard" breadcrumb="Home / Dashboard">

      {/* ── ROW 1 — Five Stat Cards ───────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4 mb-6">
        <StatCard
          title="Total Orders"
          value={overviewLoading ? undefined : overview?.totalOrders?.toLocaleString('en-IN') || '0'}
          icon={Package} color="#3b82f6" loading={overviewLoading}
        />
        <StatCard
          title="Active Hubs"
          value={overviewLoading ? undefined : overview?.totalHubs?.toString() || '0'}
          icon={Building2} color="#f97316" loading={overviewLoading}
        />
        <StatCard
          title="Active Partners"
          value={overviewLoading ? undefined : overview?.activePartners?.toLocaleString('en-IN') || '0'}
          icon={Users} color="#22c55e" loading={overviewLoading}
        />
        <StatCard
          title="Revenue (Month)"
          value={overviewLoading ? undefined : fmtCurrency(overview?.totalRevenue)}
          icon={TrendingUp} color="#8b5cf6" loading={overviewLoading}
        />
        <StatCard
          title="Total Customers"
          value={overviewLoading ? undefined : overview?.totalCustomers?.toLocaleString('en-IN') || '0'}
          icon={Users2} color="#06b6d4" loading={overviewLoading}
        />
      </div>

      {/* ── ROW 2 — Recent Orders + Donut ─────────────────────────────────────── */}
      <div className="flex flex-col xl:flex-row gap-6 mb-6">
        <div className="xl:w-[60%]">
          <p className="text-cz-text-primary font-bold text-sm mb-3">Recent Orders</p>
          <DataTable
            columns={ORDER_COLUMNS}
            data={recentOrders}
            loading={ordersLoading}
            onRowClick={(row) => navigate(`/orders/${row._id}`)}
          />
        </div>

        <div className="xl:w-[40%]">
          <p className="text-cz-text-primary font-bold text-sm mb-3">Orders by Status</p>
          <div className="bg-cz-card-bg rounded-xl border border-cz-border p-5">
            {chartsLoading ? (
              <div className="h-56 flex items-center justify-center">
                <div className="w-32 h-32 rounded-full border-4 border-cz-border border-t-cz-accent-orange animate-spin" />
              </div>
            ) : byStatus.length === 0 ? (
              <p className="text-cz-text-secondary text-sm text-center py-12">No data available</p>
            ) : (
              <>
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={byStatus} dataKey="value" nameKey="name" cx="50%" cy="50%"
                      innerRadius={55} outerRadius={100} paddingAngle={2} stroke="none">
                      {byStatus.map((entry, i) => (
                        <Cell key={`cell-${i}`} fill={STATUS_COLORS[entry.name] || '#9ca3af'} />
                      ))}
                    </Pie>
                    <Tooltip content={<ChartTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                <DonutLegend data={byStatus} />
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── ROW 3 — Bar Chart + Hub Activity ─────────────────────────────────── */}
      <div className="flex flex-col xl:flex-row gap-6 mb-6">
        <div className="xl:w-[55%]">
          <p className="text-cz-text-primary font-bold text-sm mb-3">Orders by City (Top 6)</p>
          <div className="bg-cz-card-bg rounded-xl border border-cz-border p-5">
            {chartsLoading ? (
              <div className="h-64 flex items-center justify-center">
                <div className="w-10 h-10 rounded-full border-4 border-cz-border border-t-cz-accent-orange animate-spin" />
              </div>
            ) : byCity.length === 0 ? (
              <p className="text-cz-text-secondary text-sm text-center py-12">No data available</p>
            ) : (
              <ResponsiveContainer width="100%" height={byCity.length * 44 + 20}>
                <BarChart data={byCity} layout="vertical" margin={{ top: 0, right: 24, left: 8, bottom: 0 }}>
                  <XAxis type="number" tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="city" width={90} tick={{ fill: '#9ca3af', fontSize: 12 }} axisLine={false} tickLine={false} />
                  <CartesianGrid horizontal={false} stroke="transparent" />
                  <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(249,115,22,0.08)' }} />
                  <Bar dataKey="count" name="Orders" fill="#f97316" radius={[0, 4, 4, 0]} maxBarSize={20} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="xl:w-[45%]">
          <p className="text-cz-text-primary font-bold text-sm mb-3">Hub Activity</p>
          <div className="bg-cz-card-bg rounded-xl border border-cz-border p-5 h-full">
            {chartsLoading ? (
              <div className="space-y-4 animate-pulse">
                {[...Array(5)].map((_, i) => (
                  <div key={i}>
                    <div className="flex justify-between mb-2">
                      <div className="h-4 w-28 bg-cz-border rounded" />
                      <div className="h-4 w-10 bg-cz-border rounded-full" />
                    </div>
                    <div className="h-1.5 bg-cz-border rounded-full" />
                  </div>
                ))}
              </div>
            ) : hubActivity.length === 0 ? (
              <p className="text-cz-text-secondary text-sm text-center py-12">No hub data</p>
            ) : (
              <div>
                {hubActivity.map((hub, i) => (
                  <HubRow key={i} hub={hub} maxCount={maxHubCount} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── ROW 4 — Quick Actions ─────────────────────────────────────────────── */}
      <div className="mb-2">
        <p className="text-cz-text-primary font-bold text-sm mb-3">Quick Actions</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <QuickActionCard
            icon={Package} iconColor="#f97316"
            label="Create Order"
            description="Book a new shipment for a customer"
            onClick={() => goTo('/orders?action=create')}
          />
          <QuickActionCard
            icon={Building2} iconColor="#3b82f6"
            label="Add Hub"
            description="Configure a new hub location"
            onClick={() => goTo('/hubs?action=add')}
          />
          <QuickActionCard
            icon={Users} iconColor="#22c55e"
            label="Add User"
            description="Create a new admin or delivery partner"
            onClick={() => goTo('/users?action=add')}
          />
          <QuickActionCard
            icon={Truck} iconColor="#8b5cf6"
            label="Add Vendor"
            description="Register a new intercity fleet vendor"
            onClick={() => goTo('/vendors?action=add')}
          />
        </div>
      </div>

    </AdminLayout>
  );
};

export default DashboardPage;
