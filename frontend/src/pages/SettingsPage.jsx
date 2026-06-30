import React, { useState, useEffect } from 'react';
import { Copy, Save, LogOut, Loader2, ArrowRight, Check } from 'lucide-react';
import axios from 'axios';
import AdminLayout from '../components/AdminLayout';
import { PageHeader, FormInput } from '../components/shared';
import { ToastProvider, useToast } from '../components/shared/ToastContext';
import { useAuth } from '../context/AuthContext';

const API = 'http://localhost:5000';

// ─── Inline "Save" button with ✓ Saved animation ────────────────────────────
const SaveFieldButton = ({ onClick, loading, label = 'Save' }) => {
  const [saved, setSaved] = useState(false);

  const handleClick = async () => {
    await onClick();
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className="h-[42px] px-4 bg-cz-card-bg border border-cz-border hover:border-cz-accent-orange text-white rounded-lg font-semibold transition-colors flex items-center justify-center gap-2 min-w-[80px]"
    >
      {loading ? <Loader2 size={16} className="animate-spin" /> : saved ? <Check size={16} className="text-green-400" /> : <Save size={16} />}
      {saved ? 'Saved' : label}
    </button>
  );
};

// ─── Settings Page Content ───────────────────────────────────────────────────
const SettingsPageContent = () => {
  const { logout, user, token } = useAuth();
  const { addToast } = useToast();

  const [platformName, setPlatformName] = useState('Curozip');
  const [supportEmail, setSupportEmail] = useState('support@curozip.com');
  const [supportPhone, setSupportPhone] = useState('+91 80000 00000');
  const trackingUrl = 'hub.curozip.com/track';

  const [profile, setProfile] = useState({ name: '', phone: '' });
  const [passwords, setPasswords] = useState({ current: '', new: '', confirm: '' });
  const [pwdLoading, setPwdLoading] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  const [settingSaving, setSettingSaving] = useState(null);

  // ── Load settings + profile on mount ───────────────────────────────────
  useEffect(() => {
    // Load platform settings
    axios.get(`${API}/api/settings`, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => {
        if (res.data.platform_name) setPlatformName(res.data.platform_name);
        if (res.data.support_email) setSupportEmail(res.data.support_email);
        if (res.data.support_phone) setSupportPhone(res.data.support_phone);
      }).catch(() => {});

    // Load current user profile
    if (user) {
      setProfile({ name: user.name || '', phone: user.phone || '' });
    }
  }, [token, user]);

  const saveSetting = async (key, value) => {
    setSettingSaving(key);
    try {
      await axios.put(`${API}/api/settings`, { key, value }, { headers: { Authorization: `Bearer ${token}` } });
    } catch {
      addToast('Failed to save setting', 'error');
    } finally {
      setSettingSaving(null);
    }
  };

  const saveProfile = async () => {
    if (!profile.name) return addToast('Name is required', 'error');
    setProfileLoading(true);
    try {
      await axios.put(`${API}/api/users/${user._id}`, profile, { headers: { Authorization: `Bearer ${token}` } });
      addToast('Profile updated successfully', 'success');
    } catch {
      addToast('Failed to update profile', 'error');
    } finally {
      setProfileLoading(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (!passwords.current || !passwords.new || !passwords.confirm) {
      return addToast('All fields are required', 'error');
    }
    if (passwords.new.length < 8) {
      return addToast('New password must be at least 8 characters', 'error');
    }
    if (passwords.new !== passwords.confirm) {
      return addToast('Passwords do not match', 'error');
    }
    setPwdLoading(true);
    try {
      await axios.put(
        `${API}/api/users/${user._id}/reset-password`,
        { currentPassword: passwords.current, newPassword: passwords.new },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      addToast('Password changed successfully', 'success');
      setPasswords({ current: '', new: '', confirm: '' });
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to change password', 'error');
    } finally {
      setPwdLoading(false);
    }
  };

  const copyTrackingUrl = async () => {
    try {
      await navigator.clipboard.writeText(trackingUrl);
      addToast('Tracking URL copied!', 'success');
    } catch {
      addToast('Failed to copy', 'error');
    }
  };

  return (
    <AdminLayout title="Settings" breadcrumb="Admin / Settings">
      <PageHeader title="Settings" subtitle="Manage platform configuration and your account" />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* ── LEFT COLUMN ─────────────────────────────────────────────────── */}
        <div className="space-y-8">

          {/* Platform Settings */}
          <section className="bg-cz-card-bg border border-cz-border rounded-xl p-6">
            <h2 className="text-cz-text-primary font-bold text-lg mb-5">General Settings</h2>
            <div className="space-y-5">
              <div className="flex items-end gap-3">
                <div className="flex-1">
                  <FormInput label="Platform Name" value={platformName} onChange={e => setPlatformName(e.target.value)} />
                </div>
                <SaveFieldButton onClick={() => saveSetting('platform_name', platformName)} loading={settingSaving === 'platform_name'} />
              </div>

              <div className="flex items-end gap-3">
                <div className="flex-1">
                  <FormInput label="Support Email" type="email" value={supportEmail} onChange={e => setSupportEmail(e.target.value)} />
                </div>
                <SaveFieldButton onClick={() => saveSetting('support_email', supportEmail)} loading={settingSaving === 'support_email'} />
              </div>

              <div className="flex items-end gap-3">
                <div className="flex-1">
                  <FormInput label="Support Phone" type="tel" value={supportPhone} onChange={e => setSupportPhone(e.target.value)} />
                </div>
                <SaveFieldButton onClick={() => saveSetting('support_phone', supportPhone)} loading={settingSaving === 'support_phone'} />
              </div>

              <div className="pt-2">
                <label className="text-cz-text-secondary text-sm font-medium mb-1.5 block">Public Tracking URL</label>
                <div className="flex items-center gap-2">
                  <input readOnly value={trackingUrl} className="flex-1 bg-cz-dark-bg text-cz-text-secondary border border-cz-border rounded-lg px-4 py-2 outline-none" />
                  <button onClick={copyTrackingUrl} className="h-[42px] px-4 bg-cz-card-bg border border-cz-border hover:border-cz-accent-orange text-cz-text-primary rounded-lg font-semibold transition-colors flex items-center justify-center">
                    <Copy size={16} />
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* My Account */}
          <section className="bg-cz-card-bg border border-cz-border rounded-xl p-6">
            <h2 className="text-cz-text-primary font-bold text-lg mb-5">My Account</h2>
            <div className="space-y-4 mb-6">
              <FormInput label="Display Name" value={profile.name} onChange={e => setProfile(p => ({ ...p, name: e.target.value }))} />
              <FormInput label="Phone Number" type="tel" value={profile.phone} onChange={e => setProfile(p => ({ ...p, phone: e.target.value }))} />
              <button onClick={saveProfile} disabled={profileLoading} className="w-full h-[42px] bg-cz-accent-orange text-white font-bold rounded-lg hover:bg-[#ea6c0a] disabled:opacity-50 transition-colors flex items-center justify-center gap-2">
                {profileLoading ? <Loader2 size={16} className="animate-spin" /> : 'Save Profile'}
              </button>
            </div>

            <div className="pt-6 border-t border-cz-border">
              <h3 className="text-cz-text-primary font-bold mb-4">Change Password</h3>
              <form onSubmit={handlePasswordChange} className="space-y-4">
                <FormInput label="Current Password" type="password" value={passwords.current} onChange={e => setPasswords(p => ({ ...p, current: e.target.value }))} />
                <FormInput label="New Password" type="password" value={passwords.new} onChange={e => setPasswords(p => ({ ...p, new: e.target.value }))} />
                <FormInput label="Confirm New Password" type="password" value={passwords.confirm} onChange={e => setPasswords(p => ({ ...p, confirm: e.target.value }))} />
                <button type="submit" disabled={pwdLoading} className="w-full h-[42px] bg-cz-card-bg border border-cz-accent-orange text-cz-accent-orange font-bold rounded-lg hover:bg-cz-accent-orange hover:text-white disabled:opacity-50 transition-colors flex items-center justify-center gap-2">
                  {pwdLoading ? <Loader2 size={16} className="animate-spin" /> : 'Update Password'}
                </button>
              </form>
            </div>

            <div className="mt-6 pt-6 border-t border-cz-border">
              <button onClick={logout} className="w-full h-[42px] border border-red-500/30 text-red-400 hover:bg-red-500/10 font-bold rounded-lg transition-colors flex items-center justify-center gap-2">
                <LogOut size={16} /> Logout from Admin Panel
              </button>
            </div>
          </section>
        </div>

        {/* ── RIGHT COLUMN ─────────────────────────────────────────────────── */}
        <div className="space-y-8">
          {/* Order Status Flow Reference */}
          <section className="bg-cz-card-bg border border-cz-border rounded-xl p-6">
            <div className="mb-6">
              <h2 className="text-cz-text-primary font-bold text-lg">Order Status Flow</h2>
              <p className="text-cz-text-secondary text-sm mt-1">Status transitions are enforced system-wide.</p>
            </div>

            <div className="flex flex-col gap-2">
              {[
                { s: 'Booked',              c: 'bg-gray-500/20 text-gray-300 border border-gray-500/30' },
                { s: 'Pickup Assigned',     c: 'bg-blue-500/20 text-blue-400 border border-blue-500/30' },
                { s: 'Picked Up',           c: 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30' },
                { s: 'In Transit',          c: 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' },
                { s: 'At Destination Hub',  c: 'bg-orange-500/20 text-orange-400 border border-orange-500/30' },
                { s: 'Out for Delivery',    c: 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' },
                { s: 'Delivered',           c: 'bg-green-500/20 text-green-400 border border-green-500/30' },
              ].map((step, idx, arr) => (
                <div key={idx} className="flex flex-col items-center">
                  <div className={`px-4 py-2 w-full text-center rounded-lg text-sm font-bold ${step.c}`}>{step.s}</div>
                  {idx < arr.length - 1 && <ArrowRight size={16} className="text-cz-border my-2 rotate-90" />}
                </div>
              ))}
            </div>

            <div className="mt-6 pt-4 border-t border-cz-border">
              <div className="px-4 py-2 w-full text-center rounded-lg text-sm font-bold bg-red-500/20 text-red-400 border border-red-500/30">
                Failed / Returned
              </div>
              <p className="text-cz-text-secondary text-xs mt-3 text-center">Can be triggered from any active state when delivery fails.</p>
            </div>
          </section>

          {/* App Info */}
          <section className="bg-cz-card-bg border border-cz-border rounded-xl p-6">
            <h2 className="text-cz-text-primary font-bold text-lg mb-4">App Info</h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-cz-text-secondary">Platform</span><span className="text-cz-text-primary font-semibold">Curozip Admin</span></div>
              <div className="flex justify-between"><span className="text-cz-text-secondary">Version</span><span className="text-cz-text-primary font-semibold">2.0.0</span></div>
              <div className="flex justify-between"><span className="text-cz-text-secondary">Logged in as</span><span className="text-cz-accent-orange font-semibold">{user?.email || '—'}</span></div>
              <div className="flex justify-between"><span className="text-cz-text-secondary">Role</span><span className="text-cz-text-primary font-semibold capitalize">{user?.role?.replace('_', ' ') || '—'}</span></div>
            </div>
          </section>
        </div>
      </div>
    </AdminLayout>
  );
};

export default function SettingsPage() {
  return <ToastProvider><SettingsPageContent /></ToastProvider>;
}
