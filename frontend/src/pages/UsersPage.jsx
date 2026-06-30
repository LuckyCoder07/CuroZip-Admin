import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Pencil, X, Loader2, Users, User, Shield, AlertTriangle } from 'lucide-react';
import axios from 'axios';
import AdminLayout from '../components/AdminLayout';
import { PageHeader, DataTable, FormInput, SelectDropdown, Modal } from '../components/shared';
import { ToastProvider, useToast } from '../components/shared/ToastContext';
import { useAuth } from '../context/AuthContext';

const API = '';

const ROLE_META = {
  super_admin:      { label: 'Super Admin',      color: '#ef4444', bg: '#ef444420' },
  hub_manager:      { label: 'Hub Manager',       color: '#3b82f6', bg: '#3b82f620' },
  delivery_partner: { label: 'Delivery Partner',  color: '#22c55e', bg: '#22c55e20' },
};

const AVATAR_COLORS = {
  super_admin:      '#ef4444',
  hub_manager:      '#3b82f6',
  delivery_partner: '#22c55e',
};

const fmtDate = d => d ? new Date(d).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' }) : '—';

const EMPTY_FORM = { name:'', email:'', phone:'', role:'hub_manager', hubId:'', department:'', password:'', confirmPassword:'', isActive:true };

const UserDrawer = ({ isOpen, onClose, userData, hubs, departments, onSuccess }) => {
  const { token } = useAuth();
  const { addToast } = useToast();
  const isEdit = !!userData;
  
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('profile'); // 'profile' | 'security'
  const [resetPwd, setResetPwd] = useState({ password: '', confirmPassword: '' });
  
  // Danger zone Modals
  const [deactivateModalOpen, setDeactivateModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (isEdit) {
        setForm({
          name: userData.name || '',
          email: userData.email || '',
          phone: userData.phone || '',
          role: userData.role || 'hub_manager',
          hubId: userData.hubId?._id || userData.hubId || '',
          department: userData.department?._id || userData.department || '',
          isActive: userData.isActive ?? true,
        });
      } else {
        setForm(EMPTY_FORM);
      }
      setErrors({});
      setResetPwd({ password: '', confirmPassword: '' });
      setActiveTab('profile');
    }
  }, [isOpen, userData]);

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    const payload = { ...form };
    try {
      if (isEdit) {
        await axios.put(`${API}/api/users/${userData._id}`, payload, { headers: { Authorization: `Bearer ${token}` }});
        addToast('User updated successfully', 'success');
      } else {
        if (!payload.password) return addToast('Password required', 'error');
        await axios.post(`${API}/api/users`, payload, { headers: { Authorization: `Bearer ${token}` }});
        addToast('User created successfully', 'success');
        onClose();
      }
      onSuccess();
    } catch (err) {
      addToast(err.response?.data?.message || 'Error updating user', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePasswordReset = async (e) => {
    e.preventDefault();
    if (!resetPwd.password || resetPwd.password.length < 8) return addToast('Min 8 characters required', 'error');
    if (resetPwd.password !== resetPwd.confirmPassword) return addToast('Passwords do not match', 'error');
    
    setSubmitting(true);
    try {
      await axios.put(`${API}/api/users/${userData._id}/reset-password`, { newPassword: resetPwd.password }, { headers: { Authorization: `Bearer ${token}` }});
      addToast('Password reset successfully', 'success');
      setResetPwd({ password: '', confirmPassword: '' });
    } catch (err) {
      addToast('Error resetting password', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeactivate = async () => {
    try {
      await axios.put(`${API}/api/users/${userData._id}`, { isActive: false }, { headers: { Authorization: `Bearer ${token}` }});
      addToast('User deactivated', 'success');
      setDeactivateModalOpen(false);
      setForm(p => ({ ...p, isActive: false }));
      onSuccess();
    } catch (err) { addToast('Error deactivating user', 'error'); }
  };

  const handleDelete = async () => {
    try {
      await axios.delete(`${API}/api/users/${userData._id}`, { headers: { Authorization: `Bearer ${token}` }});
      addToast('User deleted permanently', 'success');
      setDeleteModalOpen(false);
      onClose();
      onSuccess();
    } catch (err) { addToast('Error deleting user', 'error'); }
  };

  const roleOptions = [
    { value:'super_admin', label:'Super Admin' },
    { value:'hub_manager', label:'Hub Manager' },
    { value:'delivery_partner', label:'Delivery Partner' },
  ];
  const hubOptions = [{ value:'', label:'— Select Hub —' }, ...hubs.map(h => ({ value: h._id, label: h.name }))];
  const deptOptions = [{ value:'', label:'— Select Department —' }, ...departments.map(d => ({ value: d._id, label: d.name }))];

  const initials = form.name?.split(' ').map(n=>n[0]).join('').substring(0,2).toUpperCase() || '?';
  const color = AVATAR_COLORS[form.role] || '#9ca3af';
  const roleName = ROLE_META[form.role]?.label || form.role;

  return (
    <>
      <div className={`fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`} onClick={onClose} />
      <div className={`fixed right-0 top-0 h-full w-[600px] max-w-full z-50 bg-cz-card-bg shadow-2xl flex flex-col transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        
        {/* Drawer Header */}
        <div className="flex items-start justify-between p-6 border-b border-cz-border bg-cz-nav-bg">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full flex items-center justify-center font-bold text-2xl text-white shadow-md flex-shrink-0" style={{ backgroundColor: color }}>
              {initials}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white mb-1">{isEdit ? form.name : 'Add New User'}</h2>
              {isEdit && (
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: ROLE_META[form.role]?.bg, color: ROLE_META[form.role]?.color }}>
                    {roleName}
                  </span>
                  {userData?.hubId && <span className="text-xs text-cz-text-secondary">• {userData.hubId.name || userData.hubId}</span>}
                  {!form.isActive && <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-red-500/15 text-red-400">Inactive</span>}
                </div>
              )}
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-cz-text-secondary hover:text-white bg-white/5 rounded-full transition-colors"><X size={20} /></button>
        </div>

        {/* Tabs */}
        {isEdit && (
          <div className="flex border-b border-cz-border bg-cz-card-bg px-6">
            <button 
              onClick={() => setActiveTab('profile')} 
              className={`flex items-center gap-2 py-4 px-2 border-b-2 font-medium text-sm transition-colors ${activeTab === 'profile' ? 'border-cz-accent-orange text-cz-accent-orange' : 'border-transparent text-cz-text-secondary hover:text-white'}`}
            >
              <User size={16} /> Profile
            </button>
            <button 
              onClick={() => setActiveTab('security')} 
              className={`flex items-center gap-2 py-4 px-2 ml-6 border-b-2 font-medium text-sm transition-colors ${activeTab === 'security' ? 'border-cz-accent-orange text-cz-accent-orange' : 'border-transparent text-cz-text-secondary hover:text-white'}`}
            >
              <Shield size={16} /> Security
            </button>
          </div>
        )}

        {/* Drawer Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {(!isEdit || activeTab === 'profile') && (
            <form id="profile-form" onSubmit={handleProfileSubmit} className="space-y-4">
              <FormInput label="Full Name *" name="name" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
              <FormInput label="Email *" name="email" type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} />
              <FormInput label="Phone" name="phone" type="tel" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} />
              <div className="grid grid-cols-2 gap-4">
                <SelectDropdown label="Role *" options={roleOptions} value={form.role} onChange={v => setForm({...form, role: v})} />
                <SelectDropdown label="Department" options={deptOptions} value={form.department} onChange={v => setForm({...form, department: v})} />
              </div>
              <SelectDropdown label="Assign Hub" options={hubOptions} value={form.hubId} onChange={v => setForm({...form, hubId: v})} searchable />
              
              {!isEdit && (
                <FormInput label="Initial Password *" name="password" type="password" value={form.password} onChange={e => setForm({...form, password: e.target.value})} placeholder="Min 8 characters" />
              )}

              <div className="flex items-center justify-between p-4 border border-cz-border rounded-lg bg-white/5">
                <div>
                  <p className="text-sm font-medium text-white">Account Status</p>
                  <p className="text-xs text-cz-text-secondary">{form.isActive ? 'Active — can log in' : 'Inactive — login disabled'}</p>
                </div>
                <button 
                  type="button" onClick={() => setForm(f => ({...f, isActive: !f.isActive}))}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${form.isActive ? 'bg-green-500' : 'bg-cz-border'}`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${form.isActive ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>
            </form>
          )}

          {isEdit && activeTab === 'security' && (
            <div className="space-y-6">
              {/* Reset Password */}
              <div className="bg-white/5 border border-cz-border rounded-xl p-5">
                <h3 className="text-white font-bold mb-4">Reset Password</h3>
                <form onSubmit={handlePasswordReset} className="space-y-4">
                  <FormInput label="New Password" type="password" value={resetPwd.password} onChange={e => setResetPwd({...resetPwd, password: e.target.value})} />
                  <FormInput label="Confirm Password" type="password" value={resetPwd.confirmPassword} onChange={e => setResetPwd({...resetPwd, confirmPassword: e.target.value})} />
                  <button type="submit" disabled={submitting} className="w-full py-2 bg-cz-accent-orange text-white font-bold rounded-lg hover:bg-[#ea6c0a] transition-colors">
                    Reset Password
                  </button>
                </form>
              </div>

              {/* Account Info */}
              <div className="bg-white/5 border border-cz-border rounded-xl p-5">
                <h3 className="text-white font-bold mb-4">Account Info</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between"><span className="text-cz-text-secondary">Created:</span><span className="text-white font-medium">{fmtDate(userData?.createdAt)}</span></div>
                  <div className="flex justify-between"><span className="text-cz-text-secondary">User ID:</span><span className="text-white font-mono">{userData?._id}</span></div>
                </div>
              </div>

              {/* Danger Zone */}
              <div className="border border-red-500/30 rounded-xl p-5 bg-red-500/5">
                <div className="flex items-center gap-2 text-red-400 mb-4">
                  <AlertTriangle size={18} />
                  <h3 className="font-bold">Danger Zone</h3>
                </div>
                <div className="space-y-3">
                  {userData?.isActive && (
                    <button onClick={() => setDeactivateModalOpen(true)} className="w-full py-2 border border-red-500/50 text-red-400 font-bold rounded-lg hover:bg-red-500/10 transition-colors">
                      Deactivate Account
                    </button>
                  )}
                  <button onClick={() => setDeleteModalOpen(true)} className="w-full py-2 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 transition-colors">
                    Delete User
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Drawer Footer */}
        {(!isEdit || activeTab === 'profile') && (
          <div className="p-4 border-t border-cz-border flex justify-end gap-3 bg-cz-nav-bg">
            <button onClick={onClose} className="px-4 py-2 text-sm text-cz-text-secondary hover:text-white">Cancel</button>
            <button type="submit" form="profile-form" disabled={submitting} className="px-6 py-2 text-sm bg-cz-accent-orange text-white font-bold rounded-lg hover:bg-[#ea6c0a] flex items-center gap-2 w-full justify-center">
              {submitting && <Loader2 size={14} className="animate-spin" />}
              {isEdit ? 'Save Changes' : 'Create User'}
            </button>
          </div>
        )}
      </div>

      {/* Danger Modals */}
      <Modal isOpen={deactivateModalOpen} onClose={() => setDeactivateModalOpen(false)} title="Deactivate User"
        footer={<div className="flex justify-end gap-3"><button onClick={()=>setDeactivateModalOpen(false)} className="px-4 py-2 text-cz-text-secondary border border-cz-border rounded-lg">Cancel</button><button onClick={handleDeactivate} className="px-5 py-2 bg-red-600 text-white font-bold rounded-lg">Deactivate</button></div>}
      >
        <p className="text-white">Deactivate {userData?.name}? They will lose access immediately.</p>
      </Modal>
      <Modal isOpen={deleteModalOpen} onClose={() => setDeleteModalOpen(false)} title="Permanently Delete User"
        footer={<div className="flex justify-end gap-3"><button onClick={()=>setDeleteModalOpen(false)} className="px-4 py-2 text-cz-text-secondary border border-cz-border rounded-lg">Cancel</button><button onClick={handleDelete} className="px-5 py-2 bg-red-600 text-white font-bold rounded-lg">Delete</button></div>}
      >
        <p className="text-white">Permanently delete {userData?.name}? This cannot be undone.</p>
      </Modal>
    </>
  );
};

const UsersPageContent = () => {
  const { token } = useAuth();
  const [searchParams] = useSearchParams();
  const [users, setUsers] = useState([]);
  const [hubs, setHubs] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);

  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [hubFilter, setHubFilter] = useState('');
  const debounceRef = useRef(null);

  // Auto-open drawer from Quick Actions
  useEffect(() => {
    if (searchParams.get('action') === 'add') {
      setEditingUser(null);
      setDrawerOpen(true);
    }
  }, [searchParams]);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    const q = new URLSearchParams();
    if (search) q.set('search', search);
    if (roleFilter) q.set('role', roleFilter);
    if (hubFilter) q.set('hubId', hubFilter);
    
    try {
      const res = await axios.get(`${API}/api/users?${q}`, { headers: { Authorization:`Bearer ${token}` } });
      setUsers(res.data || []);
    } catch { setUsers([]); }
    finally { setLoading(false); }
  }, [token, search, roleFilter, hubFilter]);

  useEffect(() => {
    Promise.all([
      axios.get(`${API}/api/hubs`, { headers: { Authorization:`Bearer ${token}` } }),
      axios.get(`${API}/api/departments`, { headers: { Authorization:`Bearer ${token}` } })
    ]).then(([resHubs, resDepts]) => {
      setHubs(resHubs.data || []);
      setDepartments(resDepts.data || []);
    }).catch(() => {});
  }, [token]);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => { fetchUsers(); }, 300);
    return () => clearTimeout(debounceRef.current);
  }, [fetchUsers]);

  const openDrawer = (user = null) => { setEditingUser(user); setDrawerOpen(true); };

  const roleOptions = [{ value:'', label:'All Roles' }, ...Object.keys(ROLE_META).map(k => ({ value:k, label:ROLE_META[k].label }))];
  const hubOptions = [{ value:'', label:'All Hubs' }, ...hubs.map(h => ({ value:h._id, label:h.name }))];

  const columns = [
    {
      key: 'name', label: 'User',
      render: (val, row) => {
        const initials = val?.split(' ').map(n=>n[0]).join('').substring(0,2).toUpperCase() || '?';
        const color = AVATAR_COLORS[row.role] || '#9ca3af';
        return (
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm text-white flex-shrink-0" style={{ backgroundColor: color }}>
              {initials}
            </div>
            <div>
              <p className="text-white font-semibold text-sm">{val}</p>
              <p className="text-cz-text-secondary text-xs">{row.email}</p>
            </div>
          </div>
        );
      },
    },
    { key:'phone', label:'Phone', render: v => <span className="text-cz-text-secondary text-sm">{v || '—'}</span> },
    {
      key:'role', label:'Role',
      render: v => {
        const m = ROLE_META[v] || { label: v, color:'#9ca3af', bg:'#9ca3af20' };
        return <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ color:m.color, backgroundColor:m.bg }}>{m.label}</span>;
      },
    },
    { key:'hubId', label:'Hub', render: v => <span className="text-cz-text-secondary text-sm">{v?.name || '—'}</span> },
    {
      key:'isActive', label:'Status',
      render: v => v
        ? <span className="bg-green-500/15 text-green-400 text-xs font-bold px-2 py-0.5 rounded-full">Active</span>
        : <span className="bg-red-500/15 text-red-400 text-xs font-bold px-2 py-0.5 rounded-full">Inactive</span>,
    },
    { key:'createdAt', label:'Joined', render: v => <span className="text-cz-text-secondary text-xs">{fmtDate(v)}</span> },
  ];

  return (
    <AdminLayout title="Users" breadcrumb="Admin / Users">
      <PageHeader title="Users" subtitle="Manage platform users across all hubs" actionLabel="+ Add User" onAction={() => openDrawer(null)} />

      <div className="bg-cz-card-bg border border-cz-border rounded-xl p-4 flex flex-col sm:flex-row gap-3 mb-5">
        <input
          value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search by name or email..."
          className="flex-1 bg-cz-dark-bg text-white border border-cz-border rounded-lg px-4 py-2 text-sm focus:border-cz-accent-orange outline-none transition-all"
        />
        <div className="w-full sm:w-44">
          <SelectDropdown options={roleOptions} value={roleFilter} onChange={setRoleFilter} placeholder="All Roles" />
        </div>
        <div className="w-full sm:w-48">
          <SelectDropdown options={hubOptions} value={hubFilter} onChange={setHubFilter} placeholder="All Hubs" searchable />
        </div>
      </div>

      <DataTable columns={columns} data={users} loading={loading} emptyIcon={Users} emptyTitle="No users found" onRowClick={openDrawer} />

      <UserDrawer isOpen={drawerOpen} onClose={() => setDrawerOpen(false)} userData={editingUser} hubs={hubs} departments={departments} onSuccess={fetchUsers} />
    </AdminLayout>
  );
};

export default function UsersPage() {
  return <ToastProvider><UsersPageContent /></ToastProvider>;
}
