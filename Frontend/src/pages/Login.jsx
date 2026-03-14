import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Hexagon, ArrowLeft, ShieldCheck, Mail, Lock, User as UserIcon } from 'lucide-react';
import api from '../services/api';

export default function Login() {
  // modes: 'login', 'signup', 'forgot'
  const [mode, setMode] = useState('login'); 
  // forgot steps: 'request', 'reset'
  const [resetStep, setResetStep] = useState('request'); 

  const [form, setForm] = useState({
    login_id: '',
    name: '',
    email: '',
    password: '',
    otp: '',
    new_password: ''
  });

  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleInputChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      if (mode === 'login') {
        const res = await api.post('/auth/login', { login_id: form.login_id, password: form.password });
        localStorage.setItem('token', res.data.token);
        localStorage.setItem('user', JSON.stringify(res.data.user));
        navigate('/dashboard');
      } else if (mode === 'signup') {
        await api.post('/auth/signup', { 
          login_id: form.login_id, 
          name: form.name, 
          email: form.email, 
          password: form.password 
        });
        // Automatic login after signup
        const loginRes = await api.post('/auth/login', { 
          login_id: form.login_id, 
          password: form.password 
        });
        localStorage.setItem('token', loginRes.data.token);
        localStorage.setItem('user', JSON.stringify(loginRes.data.user));
        navigate('/dashboard');
      } else if (mode === 'forgot') {
        if (resetStep === 'request') {
          const res = await api.post('/auth/request-reset', { email: form.email });
          setResetStep('reset');
          setMessage(res.data.message);
        } else {
          const res = await api.post('/auth/reset-password', { 
            email: form.email, 
            otp: form.otp, 
            new_password: form.new_password 
          });
          setMode('login');
          setResetStep('request');
          setMessage(res.data.message);
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Operation failed');
    } finally {
      setLoading(false);
    }
  };

  const switchMode = (m) => {
    setMode(m);
    setError('');
    setMessage('');
    setResetStep('request');
  };

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      backgroundColor: 'var(--bg-main)'
    }}>
      <div style={{
        backgroundColor: 'var(--bg-card)',
        padding: '40px',
        borderRadius: '16px',
        boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)',
        width: '100%',
        maxWidth: '420px',
        border: '1px solid var(--border-color)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', marginBottom: '12px' }}>
          <Hexagon size={36} color="var(--primary)" weight="fill" />
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, margin: 0 }}>CoreInventory</h1>
        </div>
        
        <p style={{ textAlign: 'center', color: 'var(--text-muted)', marginBottom: '32px', fontSize: '0.9rem' }}>
          {mode === 'login' && 'Sign in to access your inventory dashboard'}
          {mode === 'signup' && 'Create your business inventory account'}
          {mode === 'forgot' && (resetStep === 'request' ? 'Reset your account password' : 'Enter the 6-digit OTP sent to your email')}
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {error && (
            <div style={{ padding: '12px', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', borderRadius: '8px', fontSize: '0.85rem', border: '1px solid rgba(239,68,68,0.2)' }}>
              {error}
            </div>
          )}
          {message && (
            <div style={{ padding: '12px', backgroundColor: 'rgba(16, 185, 129, 0.1)', color: 'var(--success)', borderRadius: '8px', fontSize: '0.85rem', border: '1px solid rgba(16,185,129,0.2)' }}>
              {message}
            </div>
          )}

          {mode === 'login' && (
            <>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>Login ID</label>
                <div style={{ position: 'relative' }}>
                  <ShieldCheck size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input type="text" name="login_id" className="form-control" style={{ paddingLeft: '40px' }} value={form.login_id} onChange={handleInputChange} required placeholder="e.g. admin123" />
                </div>
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <label>Password</label>
                  <button type="button" onClick={() => switchMode('forgot')} className="btn-text" style={{ fontSize: '0.75rem', padding: 0 }}>Forgot?</button>
                </div>
                <div style={{ position: 'relative' }}>
                  <Lock size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input type="password" name="password" className="form-control" style={{ paddingLeft: '40px' }} value={form.password} onChange={handleInputChange} required placeholder="••••••••" />
                </div>
              </div>
            </>
          )}

          {mode === 'signup' && (
            <>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>Full Name</label>
                <div style={{ position: 'relative' }}>
                  <UserIcon size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input type="text" name="name" className="form-control" style={{ paddingLeft: '40px' }} value={form.name} onChange={handleInputChange} required placeholder="John Doe" />
                </div>
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>Email Address</label>
                <div style={{ position: 'relative' }}>
                  <Mail size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input type="email" name="email" className="form-control" style={{ paddingLeft: '40px' }} value={form.email} onChange={handleInputChange} required placeholder="john@example.com" />
                </div>
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>Login ID (6-12 chars)</label>
                <div style={{ position: 'relative' }}>
                  <ShieldCheck size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input type="text" name="login_id" className="form-control" style={{ paddingLeft: '40px' }} value={form.login_id} onChange={handleInputChange} required minLength={6} maxLength={12} placeholder="admin123" />
                </div>
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>Password (8+ chars, complex)</label>
                <div style={{ position: 'relative' }}>
                  <Lock size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input type="password" name="password" className="form-control" style={{ paddingLeft: '40px' }} value={form.password} onChange={handleInputChange} required minLength={8} placeholder="••••••••" />
                </div>
              </div>
            </>
          )}

          {mode === 'forgot' && (
            <>
              {resetStep === 'request' ? (
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>Your Registered Email</label>
                  <div style={{ position: 'relative' }}>
                    <Mail size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input type="email" name="email" className="form-control" style={{ paddingLeft: '40px' }} value={form.email} onChange={handleInputChange} required placeholder="john@example.com" />
                  </div>
                </div>
              ) : (
                <>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label>6-Digit OTP</label>
                    <input type="text" name="otp" className="form-control" style={{ textAlign: 'center', fontSize: '1.25rem', letterSpacing: '8px', fontWeight: 700 }} value={form.otp} onChange={handleInputChange} required placeholder="000000" maxLength={6} />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label>New Password (8+ chars)</label>
                    <div style={{ position: 'relative' }}>
                      <Lock size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                      <input type="password" name="new_password" className="form-control" style={{ paddingLeft: '40px' }} value={form.new_password} onChange={handleInputChange} required placeholder="••••••••" />
                    </div>
                  </div>
                </>
              )}
            </>
          )}

          <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: '10px', height: '44px', fontSize: '1rem' }} disabled={loading}>
            {loading ? 'Processing...' : (
              mode === 'login' ? 'Sign In' : (mode === 'signup' ? 'Create Account' : (resetStep === 'request' ? 'Send OTP' : 'Reset Password'))
            )}
          </button>
        </form>

        <div style={{ marginTop: '24px', textAlign: 'center', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
          {mode === 'login' && (
            <>Don't have an account? <button type="button" onClick={() => switchMode('signup')} className="btn-text">Sign up</button></>
          )}
          {mode === 'signup' && (
            <>Already have an account? <button type="button" onClick={() => switchMode('login')} className="btn-text">Sign in</button></>
          )}
          {mode === 'forgot' && (
            <button type="button" onClick={() => switchMode('login')} className="btn-text" style={{ display: 'flex', alignItems: 'center', gap: '4px', margin: '0 auto' }}>
              <ArrowLeft size={16} /> Back to Sign In
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
