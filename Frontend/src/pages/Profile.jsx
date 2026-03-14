import { useState } from 'react';
import { User, Mail, Shield, Key } from 'lucide-react';

export default function Profile() {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const [isEditing, setIsEditing] = useState(false);

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">My Profile</h1>
      </div>

      <div className="card" style={{ maxWidth: '800px', margin: '0 auto', padding: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px', marginBottom: '40px', paddingBottom: '32px', borderBottom: '1px solid #e2e8f0' }}>
          <div style={{ width: '100px', height: '100px', borderRadius: '50%', backgroundColor: 'var(--primary)', display: 'flex', alignItems: 'center', justifyCenter: 'center', color: 'white', fontSize: '2.5rem', fontWeight: 600 }}>
            {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
          </div>
          <div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '4px' }}>{user.name || 'User Name'}</h2>
            <p style={{ color: 'var(--text-muted)' }}>{user.role === 'inventory_manager' ? 'Inventory Manager' : 'Staff Member'}</p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
          <div className="info-group">
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-muted)', marginBottom: '8px' }}>
              <User size={16} /> Login ID
            </label>
            <p style={{ fontSize: '1rem', fontWeight: 500 }}>{user.login_id || 'N/A'}</p>
          </div>

          <div className="info-group">
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-muted)', marginBottom: '8px' }}>
              <Mail size={16} /> Email Address
            </label>
            <p style={{ fontSize: '1rem', fontWeight: 500 }}>{user.email || 'N/A'}</p>
          </div>

          <div className="info-group">
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-muted)', marginBottom: '8px' }}>
              <Shield size={16} /> Account Role
            </label>
            <p style={{ fontSize: '1rem', fontWeight: 500 }}>{user.role === 'inventory_manager' ? 'Full Access Manager' : 'Staff'}</p>
          </div>

          <div className="info-group">
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-muted)', marginBottom: '8px' }}>
              <Key size={16} /> Security
            </label>
            <button className="btn-text" style={{ padding: 0 }}>Change Password</button>
          </div>
        </div>

        <div style={{ marginTop: '48px', paddingTop: '32px', borderTop: '1px solid #e2e8f0' }}>
          <button className="btn btn-primary" onClick={() => alert("Profile updates are currently disabled for security.")}>
            Edit Profile Info
          </button>
        </div>
      </div>
    </div>
  );
}
