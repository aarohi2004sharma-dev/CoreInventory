import { NavLink, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { 
  LayoutDashboard, Package, ArrowLeftRight, ArchiveRestore, 
  Send, LogOut, Hexagon, Warehouse as WarehouseIcon, 
  MapPin, History, Layers, ClipboardCheck, Moon, Sun
} from 'lucide-react';

export default function Sidebar() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(theme === 'light' ? 'dark' : 'light');

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <div className="sidebar">
      <div className="sidebar-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Hexagon size={28} className="logo-icon" />
          <h2>CoreInventory</h2>
        </div>
        <button 
          onClick={toggleTheme} 
          style={{ 
            background: 'none', 
            border: 'none', 
            color: 'rgba(255,255,255,0.7)', 
            cursor: 'pointer',
            padding: '4px',
            borderRadius: '6px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s'
          }}
          title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
        >
          {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
        </button>
      </div>

      <nav className="sidebar-nav">
        {/* 1. Products Section */}
        <div className="nav-section">Products</div>
        <NavLink to="/products" className="nav-item">
          <Package size={20} />
          <span>Products Management</span>
        </NavLink>
        <NavLink to="/stock" className="nav-item">
          <Layers size={20} />
          <span>Stock Availability</span>
        </NavLink>

        {/* 2. Operations Section */}
        <div className="nav-section">Operations</div>
        <NavLink to="/receipts" className="nav-item">
          <ArchiveRestore size={20} />
          <span>Receipts</span>
        </NavLink>

        <NavLink to="/deliveries" className="nav-item">
          <Send size={20} />
          <span>Delivery Orders</span>
        </NavLink>

        <NavLink to="/adjustments" className="nav-item">
          <ClipboardCheck size={20} />
          <span>Inventory Adjustment</span>
        </NavLink>

        <NavLink to="/history" className="nav-item">
          <History size={20} />
          <span>Move History</span>
        </NavLink>

        <NavLink to="/dashboard" className="nav-item">
          <LayoutDashboard size={20} />
          <span>Dashboard</span>
        </NavLink>

        {/* 2.6 Settings inside Operations */}
        <NavLink to="/warehouses" className="nav-item" style={{ paddingLeft: '32px', fontSize: '0.85rem', opacity: 0.9 }}>
          <WarehouseIcon size={18} />
          <span>Warehouse Setting</span>
        </NavLink>
      </nav>

      {/* 3. Profile Section */}
      <div className="sidebar-footer" style={{ borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
        <NavLink to="/profile" className="nav-item" style={{ marginBottom: '8px' }}>
          <div className="avatar" style={{ width: '24px', height: '24px', fontSize: '0.75rem' }}>
            {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
          </div>
          <span>My Profile</span>
        </NavLink>
        <button className="nav-item" onClick={handleLogout} style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', color: 'var(--danger)' }}>
          <LogOut size={20} />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
}
