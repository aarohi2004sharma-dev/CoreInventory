import { useState, useEffect } from 'react';
import { Layers, AlertCircle, Search } from 'lucide-react';
import api from '../services/api';

export default function Stock() {
  const [stock, setStock] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [warehouseFilter, setWarehouseFilter] = useState('');

  useEffect(() => {
    fetchStock();
  }, []);

  const fetchStock = async () => {
    try {
      const res = await api.get('/inventory/stock');
      setStock(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const uniqueWarehouses = [...new Set(stock.map(s => s.warehouse_name))].filter(Boolean);

  const filteredStock = stock.filter(s => {
    const matchSearch = s.product_name?.toLowerCase().includes(search.toLowerCase()) || s.sku?.toLowerCase().includes(search.toLowerCase());
    const matchLocation = warehouseFilter ? s.warehouse_name === warehouseFilter : true;
    return matchSearch && matchLocation;
  });

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Stock Overview</h1>
          <p style={{color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '4px'}}>Current inventory levels across all locations</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <select 
            value={warehouseFilter}
            onChange={(e) => setWarehouseFilter(e.target.value)}
            className="form-control"
            style={{ width: 'auto', minWidth: '160px' }}
          >
            <option value="">All Warehouses</option>
            {uniqueWarehouses.map(w => <option key={w} value={w}>{w}</option>)}
          </select>

          <div style={{ 
            display: 'flex', alignItems: 'center', background: 'var(--bg-card)', 
            padding: '0 12px', borderRadius: '8px', border: '1px solid var(--border-color)',
            width: '280px'
          }}>
            <Search size={16} color="var(--text-muted)" style={{ marginRight: '8px' }}/>
            <input 
              type="text" 
              placeholder="Search SKU or name..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ border: 'none', outline: 'none', width: '100%', height: '40px', fontSize: '0.875rem', background: 'transparent', color: 'var(--text-main)' }} 
            />
          </div>
        </div>
      </div>

      {loading ? (
        <div style={{ padding: '24px' }}>Loading stock levels...</div>
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Product</th>
                <th>SKU</th>
                <th>Category</th>
                <th>Warehouse / Location</th>
                <th>On Hand</th>
                <th>Reserved</th>
                <th>Free To Use</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredStock.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '24px' }}>No stock available</td>
                </tr>
              ) : (
                filteredStock.map((s, idx) => (
                  <tr key={idx}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 500 }}>
                        <Layers size={16} color="var(--primary)" />
                        {s.product_name}
                      </div>
                    </td>
                    <td style={{ color: 'var(--text-muted)' }}>{s.sku}</td>
                    <td>{s.category_name}</td>
                    <td>
                      <div>{s.warehouse_name}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{s.location_name}</div>
                    </td>
                    <td style={{ fontWeight: 600 }}>{s.quantity}</td>
                    <td style={{ color: 'var(--text-muted)' }}>{s.reserved_quantity}</td>
                    <td style={{ fontWeight: 600, color: 'var(--success)' }}>{s.free_to_use}</td>
                    <td>
                      {s.quantity < 10 ? (
                        <span className="badge badge-warning" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <AlertCircle size={12} /> Low Stock
                        </span>
                      ) : (
                        <span className="badge badge-success">Sufficient</span>
                      )}
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
