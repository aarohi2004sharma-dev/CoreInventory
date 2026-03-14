import { useState, useEffect } from 'react';
import { ClipboardCheck, Plus, X, ArrowRight, AlertTriangle } from 'lucide-react';
import api from '../services/api';

export default function Adjustments() {
  const [adjustments, setAdjustments] = useState([]);
  const [products, setProducts] = useState([]);
  const [locations, setLocations] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [recordedStock, setRecordedStock] = useState(0);
  const [fetchingStock, setFetchingStock] = useState(false);
  
  const [formData, setFormData] = useState({
    product_id: '',
    location_id: '',
    counted_quantity: 0
  });

  useEffect(() => {
    fetchData();
  }, []);

  // Fetch current stock whenever product or location changes
  useEffect(() => {
    if (formData.product_id && formData.location_id) {
      fetchCurrentStock();
    } else {
      setRecordedStock(0);
    }
  }, [formData.product_id, formData.location_id]);

  const fetchData = async () => {
    try {
      const [adjRes, prodRes, locRes] = await Promise.all([
        api.get('/inventory/adjustments'),
        api.get('/products'),
        api.get('/warehouses/locations')
      ]);
      setAdjustments(adjRes.data);
      setProducts(prodRes.data.products);
      setLocations(locRes.data);
    } catch (err) {
      console.error("Error fetching adjustment data", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCurrentStock = async () => {
    setFetchingStock(true);
    try {
      const res = await api.get('/inventory/stock-lookup', {
        params: {
          product_id: formData.product_id,
          location_id: formData.location_id
        }
      });
      setRecordedStock(res.data.stock);
    } catch (err) {
      console.error("Error fetching current stock", err);
    } finally {
      setFetchingStock(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/inventory/adjustments', formData);
      setShowModal(false);
      fetchData();
      setFormData({ product_id: '', location_id: '', counted_quantity: 0 });
      setRecordedStock(0);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to create adjustment");
    }
  };

  const difference = formData.counted_quantity - recordedStock;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Stock Adjustments</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '4px' }}>
            Sync recorded stock with physical counts. Adjustments are logged automatically.
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={18} /> New Adjustment
        </button>
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Product</th>
              <th>Location</th>
              <th>Physical Count</th>
              <th>Difference</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {adjustments.map(adj => (
              <tr key={adj.id}>
                <td>#{adj.id}</td>
                <td>{adj.product_name}</td>
                <td>{adj.location_name}</td>
                <td style={{ fontWeight: 500 }}>{adj.counted_quantity}</td>
                <td style={{ 
                  color: adj.difference < 0 ? 'var(--danger)' : adj.difference > 0 ? 'var(--success)' : 'var(--text-muted)', 
                  fontWeight: '600' 
                }}>
                  {adj.difference > 0 ? `+${adj.difference}` : adj.difference === 0 ? '±0' : adj.difference}
                </td>
                <td>{new Date(adj.created_at).toLocaleDateString()}</td>
              </tr>
            ))}
            {adjustments.length === 0 && !loading && (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: '48px', color: 'var(--text-muted)' }}>
                  No adjustments found. Perform a physical count to sync stock.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '500px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ margin: 0 }}>Physical Count Sync</h2>
              <button 
                onClick={() => setShowModal(false)} 
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Product</label>
                <select 
                  className="form-control"
                  value={formData.product_id}
                  onChange={e => setFormData({...formData, product_id: e.target.value})}
                  required
                >
                  <option value="">-- Choose Product --</option>
                  {products.map(p => <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>)}
                </select>
              </div>

              <div className="form-group">
                <label>Location</label>
                <select 
                  className="form-control"
                  value={formData.location_id}
                  onChange={e => setFormData({...formData, location_id: e.target.value})}
                  required
                >
                  <option value="">-- Choose Location --</option>
                  {locations.map(loc => <option key={loc.id} value={loc.id}>{loc.warehouse_name} › {loc.name}</option>)}
                </select>
              </div>

              {/* Comparison Section */}
              {(formData.product_id && formData.location_id) && (
                <div style={{ 
                  background: 'var(--bg-secondary)', 
                  padding: '20px', 
                  borderRadius: '12px', 
                  marginBottom: '20px',
                  border: '1px solid var(--border-color)'
                }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 40px 1fr', alignItems: 'center', textAlign: 'center' }}>
                    <div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Recorded
                      </div>
                      <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>
                        {fetchingStock ? '...' : recordedStock}
                      </div>
                    </div>
                    
                    <ArrowRight size={20} color="var(--text-muted)" style={{ margin: '0 auto' }} />
                    
                    <div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Physical
                      </div>
                      <input 
                        type="number" 
                        className="form-control"
                        style={{ textAlign: 'center', fontSize: '1.5rem', fontWeight: 700, height: 'auto', padding: '4px' }}
                        value={formData.counted_quantity}
                        onChange={e => setFormData({...formData, counted_quantity: parseInt(e.target.value) || 0})}
                        required
                        min="0"
                      />
                    </div>
                  </div>

                  <div style={{ 
                    marginTop: '20px', 
                    paddingTop: '16px', 
                    borderTop: '1px solid var(--border-color)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Difference</span>
                    <span style={{ 
                      fontSize: '1.125rem', 
                      fontWeight: 700,
                      color: difference < 0 ? 'var(--danger)' : difference > 0 ? 'var(--success)' : 'var(--text-muted)'
                    }}>
                      {difference > 0 ? `+${difference} Gain` : difference < 0 ? `${difference} Loss` : '±0 Match'}
                    </span>
                  </div>
                </div>
              )}

              {difference !== 0 && (
                <div style={{ 
                  display: 'flex', 
                  gap: '12px', 
                  padding: '12px', 
                  background: 'rgba(245,158,11,0.1)', 
                  borderRadius: '8px', 
                  marginBottom: '20px',
                  border: '1px solid rgba(245,158,11,0.2)'
                }}>
                  <AlertTriangle size={20} color="var(--warning)" style={{ flexShrink: 0 }} />
                  <p style={{ margin: 0, fontSize: '0.8rem', color: '#92400e' }}>
                    Saving this will create a stock ledger entry of <strong>{difference > 0 ? `+${difference}` : difference}</strong> units to match your physical count.
                  </p>
                </div>
              )}

              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={!formData.product_id || !formData.location_id}>
                  Sync Physical Count
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
