import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Pencil, Trash2, X, Users as UsersIcon } from 'lucide-react';
import AdminLayout from '../components/AdminLayout';
import { DataTable, FormInput, PageHeader, Modal } from '../components/shared';
import { ToastProvider, useToast } from '../components/shared/ToastContext';
import { useAuth } from '../context/AuthContext';

const API = 'http://localhost:5000';

const DepartmentDrawer = ({ isOpen, onClose, deptData, onSuccess }) => {
  const { token } = useAuth();
  const { addToast } = useToast();
  const isEdit = !!deptData;
  
  const [form, setForm] = useState({
    name: '',
    description: '',
    isActive: true
  });

  useEffect(() => {
    if (isOpen) {
      if (deptData) {
        setForm({ ...deptData });
      } else {
        setForm({ name: '', description: '', isActive: true });
      }
    }
  }, [isOpen, deptData]);

  const handleSubmit = async () => {
    if (!form.name.trim()) return addToast('Department name is required', 'error');
    try {
      if (isEdit) {
        await axios.put(`${API}/api/departments/${deptData._id}`, form, { headers: { Authorization: `Bearer ${token}` }});
        addToast('Department updated successfully', 'success');
      } else {
        await axios.post(`${API}/api/departments`, form, { headers: { Authorization: `Bearer ${token}` }});
        addToast('Department created successfully', 'success');
      }
      onSuccess();
      onClose();
    } catch (err) {
      addToast(err.response?.data?.message || 'Error saving department', 'error');
    }
  };

  return (
    <div className={`fixed inset-0 z-50 flex justify-end transition-opacity ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className={`relative w-[480px] bg-cz-card-bg h-full flex flex-col shadow-2xl transition-transform duration-300 ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        
        <div className="flex items-center justify-between p-6 border-b border-cz-border bg-cz-nav-bg">
          <h2 className="text-xl font-bold text-white">{isEdit ? `Edit Department: ${deptData.name}` : 'Add Department'}</h2>
          <button onClick={onClose} className="p-2 text-cz-text-secondary hover:text-white bg-white/5 rounded-full"><X size={20} /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <FormInput label="Department Name *" name="name" value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="e.g. Finance" />
          <FormInput label="Description" name="description" as="textarea" rows={3} value={form.description} onChange={e => setForm({...form, description: e.target.value})} />
          
          <div className="flex items-center justify-between p-4 border border-cz-border rounded-lg bg-white/5">
            <span className="text-sm font-medium text-white">Status</span>
            <button 
              type="button" 
              onClick={() => setForm(f => ({...f, isActive: !f.isActive}))}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${form.isActive ? 'bg-cz-accent-orange' : 'bg-cz-border'}`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${form.isActive ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
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

const DeleteModal = ({ isOpen, onClose, deptData, onSuccess }) => {
  const { token } = useAuth();
  const { addToast } = useToast();

  const handleDelete = async () => {
    try {
      await axios.delete(`${API}/api/departments/${deptData._id}`, { headers: { Authorization: `Bearer ${token}` }});
      addToast('Department deleted successfully', 'success');
      onSuccess();
      onClose();
    } catch (error) {
      addToast(error.response?.data?.message || 'Failed to delete department', 'error');
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Delete Department"
      footer={
        <div className="flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-sm border border-cz-border text-cz-text-secondary hover:text-white rounded-lg transition-colors">Cancel</button>
          <button onClick={handleDelete} className="px-5 py-2 text-sm bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 transition-colors">Delete</button>
        </div>
      }
    >
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-full bg-red-500/15 flex items-center justify-center flex-shrink-0">
          <Trash2 size={18} className="text-red-500" />
        </div>
        <div>
          <p className="text-white font-semibold mb-1">Delete "{deptData?.name}"?</p>
          <p className="text-cz-text-secondary text-sm">Users in this department will be unaffected, but their department field will be orphaned.</p>
        </div>
      </div>
    </Modal>
  );
};

const DepartmentsPageContent = () => {
  const { token } = useAuth();
  const { addToast } = useToast();
  
  const [departments, setDepartments] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingDept, setEditingDept] = useState(null);
  
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletingDept, setDeletingDept] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [resDepts, resUsers] = await Promise.all([
        axios.get(`${API}/api/departments`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API}/api/users`, { headers: { Authorization: `Bearer ${token}` } })
      ]);
      setDepartments(resDepts.data);
      setUsers(resUsers.data);
    } catch (error) {
      addToast('Failed to fetch data', 'error');
    }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [token]);

  const toggleStatus = async (dept) => {
    try {
      await axios.put(`${API}/api/departments/${dept._id}`, { isActive: !dept.isActive }, { headers: { Authorization: `Bearer ${token}` }});
      fetchData();
      addToast(`Department marked as ${!dept.isActive ? 'Active' : 'Inactive'}`, 'success');
    } catch (error) {
      addToast('Failed to update status', 'error');
    }
  };

  const columns = [
    {
      key: 'name', label: 'Department Name',
      render: (v) => <span className="text-white font-bold">{v}</span>
    },
    {
      key: 'description', label: 'Description',
      render: (v) => (
        <span className="text-cz-text-secondary text-sm" title={v}>
          {v ? (v.length > 80 ? v.slice(0, 80) + '...' : v) : '—'}
        </span>
      )
    },
    {
      key: 'employeeCount', label: 'Employee Count',
      render: (v, row) => {
        const count = users.filter(u => u.department === row._id).length;
        return <span className="bg-blue-500/15 text-blue-400 text-xs font-bold px-2.5 py-1 rounded-full">{count}</span>;
      }
    },
    {
      key: 'isActive', label: 'Status',
      render: (v, row) => (
        <button 
          onClick={() => toggleStatus(row)}
          className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${v ? 'bg-green-500' : 'bg-cz-border'}`}
        >
          <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${v ? 'translate-x-5' : 'translate-x-1'}`} />
        </button>
      )
    },
    {
      key: 'createdAt', label: 'Created Date',
      render: (v) => <span className="text-cz-text-secondary text-sm">{new Date(v).toLocaleDateString()}</span>
    },
    {
      key: '_id', label: 'Actions',
      render: (v, row) => (
        <div className="flex items-center gap-2">
          <button onClick={() => { setEditingDept(row); setDrawerOpen(true); }} className="p-1.5 rounded text-cz-text-secondary hover:text-white hover:bg-white/10">
            <Pencil size={16} />
          </button>
          <button onClick={() => { setDeletingDept(row); setDeleteModalOpen(true); }} className="p-1.5 rounded text-cz-text-secondary hover:text-red-400 hover:bg-red-400/10">
            <Trash2 size={16} />
          </button>
        </div>
      )
    }
  ];

  return (
    <AdminLayout title="Departments" breadcrumb="Admin / Departments">
      <PageHeader 
        title="Departments" 
        subtitle="Manage company departments" 
        actionLabel="+ Add Department" 
        onAction={() => { setEditingDept(null); setDrawerOpen(true); }} 
      />
      
      <DataTable columns={columns} data={departments} loading={loading} emptyIcon={UsersIcon} />
      
      <DepartmentDrawer 
        isOpen={drawerOpen} 
        onClose={() => setDrawerOpen(false)} 
        deptData={editingDept} 
        onSuccess={fetchData} 
      />
      
      <DeleteModal 
        isOpen={deleteModalOpen} 
        onClose={() => setDeleteModalOpen(false)} 
        deptData={deletingDept} 
        onSuccess={fetchData} 
      />
    </AdminLayout>
  );
};

export default function DepartmentsPage() {
  return <ToastProvider><DepartmentsPageContent /></ToastProvider>;
}
