import { useState, useEffect } from 'react';
import { History, ArrowUpRight, ArrowDownRight, Filter, Search, RotateCcw } from 'lucide-react';
import api from '../services/api';

export default function MoveHistory() {
  const [moves, setMoves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState([]);
  const [warehouses, setWarehouses] = useState([]);

  // Filter states
  const [filters, setFilters] = useState({
    type: '',
    warehouse_id: '',
    category_id: ''
  });

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    fetchMoves();
  }, [filters]);

  const fetchInitialData = async () => {
    try {
      const [catRes, whRes] = await Promise.all([
        api.get('/products/categories'),
        api.get('/warehouses')
      ]);
      setCategories(catRes.data || []);
      setWarehouses(whRes.data || []);
    } catch (err) {
      console.error('Failed to load filters', err);
    }
  };

  const fetchMoves = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.type) params.append('type', filters.type);
      if (filters.warehouse_id) params.append('warehouse_id', filters.warehouse_id);
      if (filters.category_id) params.append('category_id', filters.category_id);

      const res = await api.get(`/inventory/moves?${params.toString()}`);
      setMoves(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const resetFilters = () => {
    setFilters({ type: '', warehouse_id: '', category_id: '' });
  };

  const getOpBadgeColor = (type) => {
    switch (type) {
      case 'receipt': return 'var(--success)';
      case 'delivery': return 'var(--primary)';
      case 'transfer': return 'var(--warning)';
      case 'adjustment': return 'var(--danger)';
      default: return 'var(--text-muted)';
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Move History</h1>
          <p style={{color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '4px'}}>
            Advanced stock ledger with dynamic filtering
          </p>
        </div>
      </div>

      <div style={{ 
        display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap', 
        background: 'var(--bg-card)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-color)' 
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', marginRight: '8px' }}>
          <Filter size={18} />
          <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>Filters:</span>
        </div>

        <select 
          className="form-control" 
          style={{ width: 'auto', minWidth: '150px' }}
          value={filters.type}
          onChange={e => setFilters({...filters, type: e.target.value})}
        >
          <option value="">All Operation Types</option>
          <option value="receipt">Receipts (Incoming)</option>
          <option value="delivery">Delivery Orders (Outgoing)</option>
          <option value="transfer">Internal Transfers</option>
          <option value="adjustment">Stock Adjustments</option>
          <option value="opening_stock">Opening Stock</option>
        </select>

        <select 
          className="form-control" 
          style={{ width: 'auto', minWidth: '180px' }}
          value={filters.warehouse_id}
          onChange={e => setFilters({...filters, warehouse_id: e.target.value})}
        >
          <option value="">All Warehouses</option>
          {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
        </select>

        <select 
          className="form-control" 
          style={{ width: 'auto', minWidth: '160px' }}
          value={filters.category_id}
          onChange={e => setFilters({...filters, category_id: e.target.value})}
        >
          <option value="">All Categories</option>
          {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>

        <button 
          onClick={resetFilters}
          className="btn btn-secondary"
          style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px' }}
        >
          <RotateCcw size={16} /> Reset
        </button>
      </div>

      {loading ? (
        <div style={{ padding: '48px', textAlign: 'center', color: 'var(--text-muted)' }}>
          Loading ledger entries...
        </div>
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Time</th>
                <th>Product</th>
                <th>Location (Warehouse › Rack)</th>
                <th>Operation</th>
                <th>Reference</th>
                <th>Qty Change</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {moves.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '48px', color: 'var(--text-muted)' }}>
                    No movements match your current filters.
                  </td>
                </tr>
              ) : (
                moves.map(m => (
                  <tr key={m.id}>
                    <td style={{ fontSize: '0.85rem' }}>
                      <div style={{ color: 'var(--text-main)', fontWeight: 500 }}>
                        {new Date(m.created_at).toLocaleDateString()}
                      </div>
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                        {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{m.product_name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>ID: {m.product_id}</div>
                    </td>
                    <td>{m.location_name}</td>
                    <td>
                      <span className="badge" style={{ backgroundColor: 'transparent', border: `1px solid ${getOpBadgeColor(m.operation_type)}`, color: getOpBadgeColor(m.operation_type), textTransform: 'capitalize' }}>
                        {m.operation_type.replace('_', ' ')}
                      </span>
                    </td>
                    <td style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                      {m.reference_id ? `#${m.reference_id}` : 'Manual'}
                    </td>
                    <td style={{ fontWeight: 700, fontSize: '1rem', color: m.quantity_change > 0 ? 'var(--success)' : (m.quantity_change < 0 ? 'var(--danger)' : 'var(--text-muted)') }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        {m.quantity_change > 0 ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
                        {m.quantity_change > 0 ? '+' : ''}{m.quantity_change}
                      </div>
                    </td>
                    <td>
                      <span className="badge badge-success">Done</span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
