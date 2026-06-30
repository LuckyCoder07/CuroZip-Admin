import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import FormInput from '../components/shared/FormInput';
import { Loader2, AlertCircle } from 'lucide-react';

const LoginPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [form, setForm] = useState({ email: '', password: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) {
      setError('Please enter your email and password.');
      return;
    }
    setIsSubmitting(true);
    setError('');
    try {
      const response = await axios.post('http://localhost:5000/api/auth/login', {
        email: form.email,
        password: form.password,
      });
      const { token, user } = response.data;
      login(token, user);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError('Invalid email or password. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0e1a] flex flex-row overflow-hidden">

      {/* ===== LEFT PANEL — Brand ===== */}
      <div
        className="hidden lg:flex flex-col flex-1 items-center justify-between py-12 px-10 relative overflow-hidden"
        style={{ background: 'linear-gradient(160deg, #0a0e1a 0%, #0d1220 60%, #0f1a2e 100%)' }}
      >
        {/* Background subtle grid */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: 'linear-gradient(rgba(249,115,22,1) 1px, transparent 1px), linear-gradient(90deg, rgba(249,115,22,1) 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }}
        />

        {/* Top — Logo & Heading */}
        <div className="flex-1 flex flex-col items-center justify-center relative z-10 text-center px-8">
          <img
            src="https://finixia.in/logo%27s/curozip.png?v=1.4"
            alt="Curozip Logo"
            style={{ width: 180 }}
            className="mb-8 drop-shadow-2xl"
          />
          <h2 className="text-white font-bold text-2xl mb-3 leading-tight">
            Logistics Command Center
          </h2>
          <p className="text-[#6b7280] text-sm max-w-xs leading-relaxed">
            Manage hubs, users and orders across Assam's intercity delivery network
          </p>

          {/* SVG Route Animation */}
          <div className="mt-12 w-full max-w-sm">
            <style>{`
              @keyframes movePkg {
                0%   { offset-distance: 0%; }
                100% { offset-distance: 100%; }
              }
              .pkg-dot {
                offset-path: path('M 20,50 Q 175,10 330,50');
                animation: movePkg 3s ease-in-out infinite;
                offset-rotate: auto;
              }
            `}</style>
            <svg viewBox="0 0 350 100" xmlns="http://www.w3.org/2000/svg" className="w-full">
              {/* Dashed route line */}
              <path
                d="M 20,50 Q 175,10 330,50"
                fill="none"
                stroke="#f97316"
                strokeWidth="1.5"
                strokeDasharray="6 5"
                opacity="0.5"
              />
              {/* City nodes */}
              <circle cx="20" cy="50" r="5" fill="#f97316" opacity="0.8" />
              <circle cx="330" cy="50" r="5" fill="#f97316" opacity="0.8" />
              {/* City labels */}
              <text x="20" y="70" textAnchor="middle" fill="#9ca3af" fontSize="9" fontFamily="sans-serif">Dibrugarh</text>
              <text x="330" y="70" textAnchor="middle" fill="#9ca3af" fontSize="9" fontFamily="sans-serif">Guwahati</text>
              {/* Animated package */}
              <rect
                className="pkg-dot"
                x="-7" y="-7"
                width="14" height="14"
                rx="2"
                fill="#f97316"
                opacity="0.9"
              />
            </svg>
          </div>
        </div>

        {/* Footer */}
        <p className="relative z-10 text-[#374151] text-xs text-center">
          © Curozip · Powered by Finixia Dedecons Private Limited
        </p>
      </div>

      {/* ===== RIGHT PANEL — Form ===== */}
      <div className="flex-1 lg:max-w-[480px] flex items-center justify-center px-8 py-12 bg-[#0a0e1a]">
        <div className="w-full max-w-[420px]">

          {/* Portal label */}
          <p
            className="font-bold mb-3"
            style={{ color: '#f97316', fontSize: 11, letterSpacing: '4px', textTransform: 'uppercase' }}
          >
            Admin Portal
          </p>

          <h1 className="text-white font-bold mb-1" style={{ fontSize: 32 }}>
            Welcome back
          </h1>
          <p className="text-[#9ca3af] text-sm mb-8">
            Sign in to your admin account
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <FormInput
              label="Email address"
              type="email"
              name="email"
              placeholder="admin@curozip.com"
              value={form.email}
              onChange={handleChange}
            />
            <FormInput
              label="Password"
              type="password"
              name="password"
              placeholder="••••••••"
              value={form.password}
              onChange={handleChange}
            />

            <div className="text-right">
              <a href="#" className="text-xs text-[#6b7280] hover:text-[#9ca3af] transition-colors">
                Forgot password?
              </a>
            </div>

            {/* Error Card */}
            {error && (
              <div className="flex items-start gap-3 bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3">
                <AlertCircle size={16} className="text-red-400 mt-0.5 flex-shrink-0" />
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-2 font-bold text-white rounded-lg transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed"
              style={{
                backgroundColor: '#f97316',
                height: 48,
                transform: isSubmitting ? 'none' : undefined,
              }}
              onMouseEnter={e => { if (!isSubmitting) e.currentTarget.style.backgroundColor = '#ea6c0a'; e.currentTarget.style.transform = 'scale(1.01)'; }}
              onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#f97316'; e.currentTarget.style.transform = 'scale(1)'; }}
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  <span>Signing in…</span>
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
