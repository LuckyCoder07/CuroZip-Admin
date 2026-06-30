import React, { useState, useEffect, useRef } from 'react';
import { X, Loader2, AlertCircle } from 'lucide-react';
import axios from 'axios';
import { FormInput, SelectDropdown } from './shared';
import { useAuth } from '../context/AuthContext';
import { useToast } from './shared/ToastContext';

// ─── All Indian States + UTs ────────────────────────────────────────────────
const INDIA_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
  'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
  'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
  'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Andaman and Nicobar Islands', 'Chandigarh', 'Dadra and Nagar Haveli and Daman and Diu',
  'Delhi', 'Jammu and Kashmir', 'Ladakh', 'Lakshadweep', 'Puducherry',
].map(s => ({ value: s, label: s }));

const EMPTY_FORM = {
  name: '', email: '', phone: '', address: '',
  city: '', state: '', serviceablePincodes: [], managerId: null,
};

// ─── Tag Input for Pincodes ──────────────────────────────────────────────────
const PincodeTagInput = ({ pincodes, onChange }) => {
  const [input, setInput] = useState('');
  const [error, setError] = useState('');

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const val = input.trim();
      if (!/^\d{6}$/.test(val)) {
        setError('Pincode must be exactly 6 digits.');
        return;
      }
      if (pincodes.includes(val)) {
        setError('Pincode already added.');
        return;
      }
      onChange([...pincodes, val]);
      setInput('');
      setError('');
    }
  };

  const remove = (pin) => onChange(pincodes.filter(p => p !== pin));

  return (
    <div>
      <label className="text-cz-text-secondary text-sm font-medium mb-1.5 block">
        Serviceable Pincodes
      </label>

      {/* Tags */}
      <div className="flex flex-wrap gap-1.5 mb-2 min-h-[28px]">
        {pincodes.map(pin => (
          <span key={pin}
            className="flex items-center gap-1 bg-[#1f2937] text-white text-xs px-2 py-1 rounded font-mono">
            {pin}
            <button type="button" onClick={() => remove(pin)}
              className="text-[#9ca3af] hover:text-white ml-0.5">
              <X size={10} />
            </button>
          </span>
        ))}
      </div>

      <input
        type="text"
        value={input}
        onChange={e => { setInput(e.target.value); setError(''); }}
        onKeyDown={handleKeyDown}
        placeholder="Type 6-digit pincode + Enter"
        maxLength={6}
        className="w-full bg-cz-dark-bg text-white border border-cz-border rounded-lg px-4 py-2 outline-none focus:border-cz-accent-orange focus:ring-2 focus:ring-cz-accent-orange/50 transition-all"
      />
      {error && <span className="text-red-500 text-xs mt-1 block">{error}</span>}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
const HubDrawer = ({ isOpen, onClose, hubData, onSuccess }) => {
  const { token } = useAuth();
  const { addToast } = useToast();
  const isEdit = !!hubData;

  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [managers, setManagers] = useState([]);

  // Populate form when editing
  useEffect(() => {
    if (isOpen) {
      if (hubData) {
        setForm({
          name: hubData.name || '',
          email: hubData.email || '',
          phone: hubData.phone || '',
          address: hubData.address || '',
          city: hubData.city || '',
          state: hubData.state || '',
          serviceablePincodes: hubData.serviceablePincodes || [],
          managerId: hubData.managerId?._id || hubData.managerId || null,
        });
      } else {
        setForm(EMPTY_FORM);
      }
      setErrors({});

      // Fetch hub managers
      axios.get('http://localhost:5000/api/users', {
        headers: { Authorization: `Bearer ${token}` },
      }).then(res => {
        const opts = [{ value: null, label: '— No Manager —' }];
        const mgrs = (res.data || [])
          .filter(u => u.role === 'hub_manager')
          .map(u => ({ value: u._id, label: `${u.name} — ${u.email}` }));
        setManagers([...opts, ...mgrs]);
      }).catch(() => setManagers([{ value: null, label: '— No Manager —' }]));
    }
  }, [isOpen, hubData, token]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'This field is required';
    if (!form.email.trim()) e.email = 'This field is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Please enter a valid email';
    if (!form.city.trim()) e.city = 'This field is required';
    if (!form.state) e.state = 'This field is required';
    return e;
  };

  const hasErrors = Object.keys(validate()).length > 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setSubmitting(true);
    const payload = { ...form, managerId: form.managerId || null };
    try {
      let res;
      if (isEdit) {
        res = await axios.put(`http://localhost:5000/api/hubs/${hubData._id}`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
        addToast('Hub updated successfully.', 'success');
      } else {
        res = await axios.post('http://localhost:5000/api/hubs', payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
        addToast('Hub created successfully.', 'success');
      }
      onSuccess(res.data);
      onClose();
    } catch (err) {
      addToast(err.response?.data?.message || 'Something went wrong.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Lock body scroll while open
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  return (
    <>
      {/* Overlay */}
      <div
        className={`fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity duration-300
          ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />

      {/* Drawer Panel */}
      <div
        className={`fixed right-0 top-0 h-full w-[480px] max-w-full z-50 bg-[#111827] shadow-2xl
          flex flex-col transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#1f2937] flex-shrink-0">
          <h2 className="text-white font-bold text-lg">
            {isEdit ? 'Edit Hub' : 'Add New Hub'}
          </h2>
          <button onClick={onClose}
            className="text-[#9ca3af] hover:text-white hover:bg-white/10 p-1.5 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">

            <FormInput label="Hub Name *" name="name" value={form.name}
              onChange={handleChange} placeholder="e.g. Guwahati Central Hub"
              error={errors.name} />

            <FormInput label="Email *" name="email" type="email" value={form.email}
              onChange={handleChange} placeholder="hub@curozip.com"
              error={errors.email} />

            <FormInput label="Contact Number" name="phone" type="tel" value={form.phone}
              onChange={handleChange} placeholder="+91 XXXXX XXXXX" />

            <FormInput label="Address" name="address" as="textarea" rows={3}
              value={form.address} onChange={handleChange}
              placeholder="Full hub address..." />

            <div className="grid grid-cols-2 gap-4">
              <FormInput label="City *" name="city" value={form.city}
                onChange={handleChange} placeholder="e.g. Guwahati"
                error={errors.city} />

              <SelectDropdown
                label="State *"
                options={INDIA_STATES}
                value={form.state}
                onChange={val => {
                  setForm(prev => ({ ...prev, state: val }));
                  if (errors.state) setErrors(prev => ({ ...prev, state: '' }));
                }}
                searchable
                placeholder="Select state..."
                error={errors.state}
              />
            </div>

            <PincodeTagInput
              pincodes={form.serviceablePincodes}
              onChange={pins => setForm(prev => ({ ...prev, serviceablePincodes: pins }))}
            />

            <SelectDropdown
              label="Assign Hub Manager"
              options={managers}
              value={form.managerId}
              onChange={val => setForm(prev => ({ ...prev, managerId: val }))}
              searchable
              placeholder="Select manager..."
            />

          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-[#1f2937] flex justify-end gap-3 flex-shrink-0">
            <button type="button" onClick={onClose}
              className="px-5 py-2 rounded-lg border border-[#374151] text-[#9ca3af] hover:text-white hover:border-[#9ca3af] transition-colors text-sm font-medium">
              Cancel
            </button>
            <button type="submit" disabled={submitting || hasErrors}
              className="px-6 py-2 rounded-lg bg-[#f97316] text-white font-bold hover:bg-[#ea6c0a] transition-colors text-sm disabled:opacity-60 flex items-center gap-2">
              {submitting && <Loader2 size={15} className="animate-spin" />}
              {isEdit ? 'Update Hub' : 'Create Hub'}
            </button>
          </div>
        </form>
      </div>
    </>
  );
};

export default HubDrawer;
