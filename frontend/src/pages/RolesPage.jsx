import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Pencil, Trash2, Shield, Lock, X, Package, Settings, Building2, Bike, BarChart, Check } from 'lucide-react';
import AdminLayout from '../components/AdminLayout';
import { DataTable, FormInput, PageHeader } from '../components/shared';
import { ToastProvider, useToast } from '../components/shared/ToastContext';
import { useAuth } from '../context/AuthContext';

const API = 'http://localhost:5000';

const PERMISSION_GROUPS = [
  {
    name: 'Orders',
    icon: Package,
    permissions: [
      { id: 'view_all_orders', label: 'View all orders across all hubs' },
      { id: 'create_order', label: 'Create new orders' },
      { id: 'assign_vendor', label: 'Assign fleet vendors to orders' },
      { id: 'assign_partner', label: 'Assign delivery partners to orders' },
      { id: 'update_status', label: 'Update order status' },
    ]
  },
  {
    name: 'Management',
    icon: Settings,
    permissions: [
      { id: 'manage_hubs', label: 'Create, edit and delete hubs' },
      { id: 'manage_users', label: 'Create, edit and delete users' },
      { id: 'manage_vendors', label: 'Create, edit and delete vendors' },
      { id: 'manage_departments', label: 'Create, edit and delete departments' },
      { id: 'manage_roles', label: 'Create, edit and delete roles' },
    ]
  },
  {
    name: 'Hub Operations',
    icon: Building2,
    permissions: [
      { id: 'view_hub_orders', label: 'View orders for assigned hub only' },
      { id: 'manage_partners', label: 'Add and manage delivery partners' },
    ]
  },
  {
    name: 'Delivery',
    icon: Bike,
    permissions: [
      { id: 'view_assigned_orders', label: 'View orders personally assigned' },
      { id: 'update_delivery_status', label: 'Update status of assigned deliveries' },
    ]
  },
  {
    name: 'Analytics',
    icon: BarChart,
    permissions: [
      { id: 'view_analytics', label: 'Access analytics dashboard' },
    ]
  }
];

const RoleDrawer = ({ isOpen, onClose, roleData, onSuccess }) => {
  const { token } = useAuth();
  const { addToast } = useToast();
  const isEdit = !!roleData;
  const isSystemRole = roleData?.isSystemRole || false;
  
  const [form, setForm] = useState({
    name: '',
    slug: '',
    description: '',
    isActive: true,
    permissions: []
  });

  useEffect(() => {
    if (isOpen) {
      if (roleData) {
        setForm({ ...roleData, permissions: roleData.permissions || [] });
      } else {
        setForm({ name: '', slug: '', description: '', isActive: true, permissions: [] });
      }
    }
  }, [isOpen, roleData]);

  const handleNameChange = (e) => {
    const name = e.target.value;
    if (!isEdit) {
      const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/(^_|_$)/g, '');
      setForm(prev => ({ ...prev, name, slug }));
    } else {
      setForm(prev => ({ ...prev, name }));
    }
  };

  const togglePermission = (id) => {
    if (isSystemRole) return;
    setForm(prev => ({
      ...prev,
      permissions: prev.permissions.includes(id) 
        ? prev.permissions.filter(p => p !== id) 
        : [...prev.permissions, id]
    }));
  };

  const toggleGroup = (groupPermissions) => {
    if (isSystemRole) return;
    const allSelected = groupPermissions.every(p => form.permissions.includes(p.id));
    
    if (allSelected) {
      setForm(prev => ({
        ...prev,
        permissions: prev.permissions.filter(p => !groupPermissions.some(gp => gp.id === p))
      }));
    } else {
      setForm(prev => ({
        ...prev,
        permissions: [...new Set([...prev.permissions, ...groupPermissions.map(p => p.id)])]
      }));
    }
  };

  const selectAllPermissions = () => {
    if (isSystemRole) return;
    const allIds = PERMISSION_GROUPS.flatMap(g => g.permissions.map(p => p.id));
    setForm(prev => ({ ...prev, permissions: allIds }));
  };

  const handleSubmit = async () => {
    if (!form.name.trim()) return addToast('Name is required', 'error');
    try {
      if (isEdit) {
        await axios.put(`${API}/api/roles/${roleData._id}`, form, { headers: { Authorization: `Bearer ${token}` }});
        addToast('Role updated successfully', 'success');
      } else {
        await axios.post(`${API}/api/roles`, form, { headers: { Authorization: `Bearer ${token}` }});
        addToast('Role created successfully', 'success');
      }
      onSuccess();
      onClose();
    } catch (err) {
      addToast(err.response?.data?.message || 'Error saving role', 'error');
    }
  };

  return (
    <div className={`fixed inset-0 z-50 flex justify-end transition-opacity ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className={`relative w-[520px] bg-cz-card-bg h-full flex flex-col shadow-2xl transition-transform duration-300 ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        
        <div className="flex items-center justify-between p-6 border-b border-cz-border bg-cz-nav-bg">
          <h2 className="text-xl font-bold text-white">{isEdit ? `Edit Role: ${roleData.name}` : 'Create New Role'}</h2>
          <button onClick={onClose} className="p-2 text-cz-text-secondary hover:text-white bg-white/5 rounded-full"><X size={20} /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="space-y-4">
            <div>
              <FormInput label="Role Name *" name="name" value={form.name} onChange={handleNameChange} placeholder="e.g. Warehouse Manager" />
              {form.slug && (
                <p className="text-xs text-cz-text-secondary mt-1 font-mono">slug: {form.slug}</p>
              )}
            </div>
            
            <FormInput label="Description" name="description" as="textarea" rows={3} value={form.description} onChange={e => setForm({...form, description: e.target.value})} />
            
            <div className="flex items-center justify-between p-4 border border-cz-border rounded-lg bg-white/5">
              <span className="text-sm font-medium text-white">Status</span>
              <button 
                type="button" 
                disabled={isSystemRole}
                onClick={() => setForm(f => ({...f, isActive: !f.isActive}))}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${form.isActive ? 'bg-cz-accent-orange' : 'bg-cz-border'} ${isSystemRole ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${form.isActive ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>
          </div>

          <div className="pt-4 border-t border-cz-border">
            <div className="flex items-end justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-white">Permissions</h3>
                <p className="text-xs text-cz-text-secondary mt-1">Select what this role can do</p>
              </div>
              {!isSystemRole && (
                <button type="button" onClick={selectAllPermissions} className="text-sm text-cz-accent-orange hover:underline">
                  Select All Permissions
                </button>
              )}
            </div>

            <div className="space-y-4">
              {PERMISSION_GROUPS.map((group, idx) => (
                <div key={idx} className="bg-white/5 border border-cz-border rounded-xl p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2 text-white font-medium">
                      <group.icon size={18} className="text-cz-accent-orange" />
                      {group.name}
                    </div>
                    {!isSystemRole && (
                      <button type="button" onClick={() => toggleGroup(group.permissions)} className="text-xs text-cz-text-secondary hover:text-white">
                        {group.permissions.every(p => form.permissions.includes(p.id)) ? 'Deselect All' : 'Select All'}
                      </button>
                    )}
                  </div>

                  <div className="space-y-3">
                    {group.permissions.map((perm) => {
                      const isChecked = form.permissions.includes(perm.id);
                      return (
                        <label key={perm.id} className={`flex items-start gap-3 p-2 rounded-lg ${isSystemRole ? '' : 'cursor-pointer hover:bg-white/5'}`}>
                          <div className={`w-5 h-5 mt-0.5 rounded border flex items-center justify-center transition-colors ${isChecked ? 'bg-cz-accent-orange border-cz-accent-orange' : 'border-cz-border bg-transparent'} ${isSystemRole ? 'opacity-60' : ''}`}>
                            {isChecked && <Check size={14} className="text-white" />}
                          </div>
                          <div>
                            <p className="text-sm text-white font-medium">{perm.id}</p>
                            <p className="text-xs text-cz-text-secondary">{perm.label}</p>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-cz-border flex justify-end gap-3 bg-cz-nav-bg">
          <button onClick={onClose} className="px-4 py-2 text-sm text-cz-text-secondary hover:text-white">Cancel</button>
          <button onClick={handleSubmit} className="px-6 py-2 text-sm bg-cz-accent-orange text-white font-bold rounded-lg hover:bg-[#ea6c0a]">
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

const RolesPageContent = () => {
  const { token } = useAuth();
  const { addToast } = useToast();
  
  const [roles, setRoles] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingRole, setEditingRole] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [resRoles, resUsers] = await Promise.all([
        axios.get(`${API}/api/roles`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API}/api/users`, { headers: { Authorization: `Bearer ${token}` } })
      ]);
      setRoles(resRoles.data);
      setUsers(resUsers.data);
    } catch (error) {
      addToast('Failed to fetch data', 'error');
    }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [token]);

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this role?')) return;
    try {
      await axios.delete(`${API}/api/roles/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      addToast('Role deleted successfully', 'success');
      fetchData();
    } catch (error) {
      addToast(error.response?.data?.message || 'Failed to delete', 'error');
    }
  };

  const columns = [
    {
      key: 'name', label: 'Role Name',
      render: (v, row) => (
        <div className="flex items-center gap-2">
          <span className="text-white font-bold">{v}</span>
          {row.isSystemRole && <span className="bg-white/10 text-cz-text-secondary text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">System Role</span>}
        </div>
      )
    },
    {
      key: 'slug', label: 'Slug',
      render: (v) => <span className="text-cz-text-secondary text-xs font-mono">{v}</span>
    },
    {
      key: 'description', label: 'Description',
      render: (v) => <span className="text-cz-text-secondary text-sm truncate max-w-[200px] inline-block">{v || '—'}</span>
    },
    {
      key: 'permissions', label: 'Permissions',
      render: (v, row) => {
        const hasAll = v.includes('all');
        if (hasAll) return <span className="bg-cz-accent-orange/20 text-cz-accent-orange text-xs px-2 py-1 rounded-full">All Permissions</span>;
        
        const show = v.slice(0, 3);
        const more = v.length - 3;
        return (
          <div className="flex items-center gap-1 flex-wrap">
            {show.map((p, i) => <span key={i} className="bg-cz-accent-orange/10 border border-cz-accent-orange/20 text-cz-accent-orange text-[10px] px-2 py-0.5 rounded-full">{p}</span>)}
            {more > 0 && <span className="bg-white/10 text-cz-text-secondary text-[10px] px-2 py-0.5 rounded-full">+{more} more</span>}
            {v.length === 0 && <span className="text-cz-text-secondary text-xs">—</span>}
          </div>
        );
      }
    },
    {
      key: 'userCount', label: 'Users',
      render: (v, row) => {
        const count = users.filter(u => u.role === row.slug).length;
        return <span className="bg-blue-500/15 text-blue-400 text-xs font-bold px-2.5 py-1 rounded-full">{count}</span>;
      }
    },
    {
      key: 'isActive', label: 'Status',
      render: (v) => (
        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${v ? 'bg-green-500/15 text-green-400' : 'bg-red-500/15 text-red-400'}`}>
          {v ? 'Active' : 'Inactive'}
        </span>
      )
    },
    {
      key: '_id', label: 'Actions',
      render: (v, row) => (
        <div className="flex items-center gap-2">
          <button onClick={() => { setEditingRole(row); setDrawerOpen(true); }} className="p-1.5 rounded text-cz-text-secondary hover:text-white hover:bg-white/10">
            <Pencil size={16} />
          </button>
          {row.isSystemRole ? (
            <div title="System role — cannot be deleted" className="p-1.5 text-cz-text-secondary/50 cursor-not-allowed">
              <Lock size={16} />
            </div>
          ) : (
            <button onClick={() => handleDelete(v)} className="p-1.5 rounded text-cz-text-secondary hover:text-red-400 hover:bg-red-400/10">
              <Trash2 size={16} />
            </button>
          )}
        </div>
      )
    }
  ];

  return (
    <AdminLayout title="Roles" breadcrumb="Admin / Roles">
      <PageHeader 
        title="Roles" 
        subtitle="Manage user roles and their permissions" 
        actionLabel="+ Create Role" 
        onAction={() => { setEditingRole(null); setDrawerOpen(true); }} 
      />
      <DataTable columns={columns} data={roles} loading={loading} />
      
      <RoleDrawer 
        isOpen={drawerOpen} 
        onClose={() => setDrawerOpen(false)} 
        roleData={editingRole} 
        onSuccess={fetchData} 
      />
    </AdminLayout>
  );
};

export default function RolesPage() {
  return <ToastProvider><RolesPageContent /></ToastProvider>;
}
