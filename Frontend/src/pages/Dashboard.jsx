import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Package, AlertTriangle, ArchiveRestore, Send, ArrowLeftRight } from 'lucide-react';
import api from '../services/api';

export default function Dashboard() {
  const location = useLocation();
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const [stats, setStats] = useState({
    total_products_in_stock: 0,
    total_stock_units: 0,
    low_stock: 0,
    pending_receipts: 0,
    pending_deliveries: 0,
    internal_transfers: 0
  });
  const [loading, setLoading] = useState(true);

  const [lowStockItems, setLowStockItems] = useState([]);

  // Re-fetch every time the user navigates to the dashboard
  useEffect(() => {
    setLoading(true);
    fetchStats();
    fetchLowStockItems();
    const interval = setInterval(() => {
      fetchStats();
      fetchLowStockItems();
    }, 15000);
    return () => clearInterval(interval);
  }, [location.pathname]);

  const fetchStats = async () => {
    try {
      const res = await api.get('/dashboard/stats');
      setStats(res.data);
    } catch (err) {
      console.error('Failed to fetch dashboard stats', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchLowStockItems = async () => {
    try {
      const res = await api.get('/products');
      const all = res.data.products || [];
      const low = all.filter(p => (p.stock ?? 0) <= (p.reorder_level ?? 0));
      setLowStockItems(low);
    } catch (err) {
      console.error(err);
    }
  };

  const isNew = !loading && stats.total_products_in_stock === 0 && stats.pending_receipts === 0;

  const kpis = [
    { label: 'Total Products in Stock', value: stats.total_products_in_stock, subValue: `${stats.total_stock_units} units`, icon: <Package size={24} />, color: 'primary' },
    { label: 'Low / Out of Stock Items', value: stats.low_stock, icon: <AlertTriangle size={24} />, color: 'danger' },
    { label: 'Pending Receipts', value: stats.pending_receipts, icon: <ArchiveRestore size={24} />, color: 'warning' },
    { label: 'Pending Deliveries', value: stats.pending_deliveries, icon: <Send size={24} />, color: 'success' },
    { label: 'Internal Transfers Scheduled', value: stats.internal_transfers, icon: <ArrowLeftRight size={24} />, color: 'info' },
  ];

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Welcome back, {user.name || 'User'} 👋</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '4px' }}>
            Here's a live snapshot of your inventory operations.
          </p>
        </div>
      </div>

      {loading ? (
        <div style={{ padding: '48px', textAlign: 'center', color: 'var(--text-muted)' }}>
          Loading your inventory data...
        </div>
      ) : (
        <>
          <div className="stats-grid">
            {kpis.map((kpi) => (
              <div className="stat-card" key={kpi.label}>
                <div className="stat-info">
                  <h3>{kpi.label}</h3>
                  <p style={{ fontSize: '2rem', fontWeight: 700, margin: 0 }}>{kpi.value}</p>
                  {kpi.subValue && <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{kpi.subValue}</span>}
                </div>
                <div className={`stat-icon ${kpi.color}`}>
                  {kpi.icon}
                </div>
              </div>
            ))}
          </div>

          {!isNew && lowStockItems.length > 0 && (
            <div style={{ marginBottom: '32px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                <AlertTriangle size={20} color="var(--danger)" />
                <h3 style={{ margin: 0, fontSize: '1.125rem' }}>Critical Stock Alerts</h3>
              </div>
              <div className="table-container">
                <table style={{ border: 'none' }}>
                  <thead>
                    <tr>
                      <th>SKU</th>
                      <th>Product</th>
                      <th>Current Stock</th>
                      <th>Reorder Level</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lowStockItems.slice(0, 5).map(p => (
                      <tr key={p.id}>
                        <td style={{ fontWeight: 500 }}>{p.sku}</td>
                        <td>{p.name}</td>
                        <td style={{ color: (p.stock ?? 0) === 0 ? 'var(--danger)' : 'var(--warning)', fontWeight: 600 }}>
                          {p.stock ?? 0} {p.unit}
                        </td>
                        <td>{p.reorder_level}</td>
                        <td><a href="/receipts" className="btn-text" style={{ padding: 0 }}>Order Now</a></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {lowStockItems.length > 5 && (
                  <div style={{ padding: '12px 24px', borderTop: '1px solid var(--border-color)', fontSize: '0.875rem' }}>
                    <a href="/products" style={{ color: 'var(--primary)', textDecoration: 'none', fontWeight: 500 }}>
                      View all {lowStockItems.length} alerts →
                    </a>
                  </div>
                )}
              </div>
            </div>
          )}

          {isNew && (
            <div style={{
              marginTop: '32px',
              padding: '32px',
              borderRadius: '12px',
              border: '2px dashed #e2e8f0',
              textAlign: 'center',
              color: 'var(--text-muted)'
            }}>
              <Package size={48} style={{ marginBottom: '12px', opacity: 0.4 }} />
              <h3 style={{ marginBottom: '8px', color: 'var(--text-main)' }}>Your inventory is empty</h3>
              <p style={{ fontSize: '0.9rem', marginBottom: '16px' }}>
                Get started by setting up your warehouse, adding products, and creating your first receipt.
              </p>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
                <a href="/warehouses" style={{ padding: '8px 18px', background: 'var(--primary)', color: 'white', borderRadius: '8px', textDecoration: 'none', fontSize: '0.875rem' }}>1. Add a Warehouse</a>
                <a href="/products" style={{ padding: '8px 18px', background: 'var(--primary)', color: 'white', borderRadius: '8px', textDecoration: 'none', fontSize: '0.875rem' }}>2. Add Products</a>
                <a href="/receipts" style={{ padding: '8px 18px', background: 'var(--primary)', color: 'white', borderRadius: '8px', textDecoration: 'none', fontSize: '0.875rem' }}>3. Create a Receipt</a>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
