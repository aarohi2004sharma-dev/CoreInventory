import { useState, useEffect } from 'react';
import { ArrowRight, ArrowLeftRight, Plus, X } from 'lucide-react';
import api from '../services/api';

export default function Transfers() {
  const [transfers, setTransfers] = useState([]);
  const [products, setProducts] = useState([]);
  const [locations, setLocations] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [from_location_id, setFromLocation] = useState('');
  const [to_location_id, setToLocation] = useState('');
  const [items, setItems] = useState([{ product_id: '', quantity: 1, available_stock: null }]);
  const [processing, setProcessing] = useState(null);

  useEffect(() => {
    fetchTransfers();
    fetchSupportData();
  }, []);

  // Sync available stock for all items when Source Location changes
  useEffect(() => {
    if (from_location_id) {
       refreshAllStock();
    }
  }, [from_location_id]);

  const refreshAllStock = async () => {
    const newItems = [...items];
    for (let i = 0; i < newItems.length; i++) {
       if (newItems[i].product_id && from_location_id) {
          try {
            const res = await api.get('/inventory/stock-lookup', { 
               params: { product_id: newItems[i].product_id, location_id: from_location_id } 
            });
            newItems[i].available_stock = res.data.stock;
          } catch(e) { console.error(e); }
       }
    }
    setItems(newItems);
  };

  const fetchTransfers = async () => {
    try {
      const res = await api.get('/inventory/transfers');
      setTransfers(res.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchSupportData = async () => {
    try {
      const [prodRes, locRes] = await Promise.all([
        api.get('/products'),
        api.get('/warehouses/locations')
      ]);
      setProducts(prodRes.data.products || []);
      setLocations(locRes.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const addItem = () => setItems([...items, { product_id: '', quantity: 1, available_stock: null }]);
  const removeItem = (index) => setItems(items.filter((_, i) => i !== index));
  
  const updateItem = async (index, field, value) => {
    const newItems = [...items];
    newItems[index][field] = value;
    
    if (field === 'product_id' && from_location_id && value) {
      try {
        const res = await api.get('/inventory/stock-lookup', { 
           params: { product_id: value, location_id: from_location_id } 
        });
        newItems[index].available_stock = res.data.stock;
      } catch(e) { console.error(e); }
    }
    
    setItems(newItems);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (from_location_id === to_location_id) {
      alert('Source and destination locations must be different.');
      return;
    }
    
    for (const it of items) {
      if (it.available_stock !== null && it.quantity > it.available_stock) {
        alert(`Insufficient stock at source location. Required: ${it.quantity}, Available: ${it.available_stock}`);
        return;
      }
    }

    try {
      await api.post('/inventory/transfers', { from_location_id, to_location_id, items });
      setShowModal(false);
      setFromLocation('');
      setToLocation('');
      setItems([{ product_id: '', quantity: 1, available_stock: null }]);
      fetchTransfers();
    } catch (err) {
      alert(err.response?.data?.message || 'Error creating transfer');
    }
  };

  const validateTransfer = async (id) => {
    if (!window.confirm('Confirm this transfer? Stock will move between locations immediately.')) return;
    setProcessing(id);
    try {
      await api.post(`/inventory/transfers/${id}/validate`);
      fetchTransfers();
    } catch (err) {
      alert(err.response?.data?.message || 'Error confirming transfer');
    } finally {
      setProcessing(null);
    }
  };

  const locLabel = (id) => {
    const loc = locations.find(l => l.id === parseInt(id));
    return loc ? `${loc.warehouse_name} › ${loc.name}` : id;
  };

  const filtered = statusFilter === 'all' ? transfers : transfers.filter(t => t.status === statusFilter);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Internal Transfers</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '4px' }}>
            Move stock between locations. Both ledger entries logged automatically.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <select
            className="form-control"
            style={{ width: 'auto', minWidth: '130px' }}
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
          >
            <option value="all">All Transfers</option>
            <option value="pending">Pending</option>
            <option value="completed">Completed</option>
          </select>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            <ArrowLeftRight size={16} /> New Transfer
          </button>
        </div>
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Route</th>
              <th>Date</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan="5" style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                No transfers found. Create one to move stock between locations.
              </td></tr>
            ) : filtered.map(t => (
              <tr key={t.id}>
                <td style={{ fontWeight: 500 }}>#{t.id}</td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.875rem' }}>
                    <span style={{ padding: '2px 8px', background: 'rgba(239,68,68,0.1)', color: 'var(--danger)', borderRadius: '4px', fontWeight: 500 }}>
                      {t.from_location}
                    </span>
                    <ArrowRight size={16} color="var(--text-muted)" />
                    <span style={{ padding: '2px 8px', background: 'rgba(34,197,94,0.1)', color: 'var(--success)', borderRadius: '4px', fontWeight: 500 }}>
                      {t.to_location}
                    </span>
                  </div>
                </td>
                <td style={{ color: 'var(--text-muted)' }}>{new Date(t.created_at).toLocaleDateString()}</td>
                <td>
                  {t.status === 'pending'
                    ? <span className="badge badge-warning">Pending</span>
                    : <span className="badge badge-success">✓ Moved</span>
                  }
                </td>
                <td>
                  {t.status === 'pending' ? (
                    <button
                      onClick={() => validateTransfer(t.id)}
                      disabled={processing === t.id}
                      style={{
                        background: 'var(--primary)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        padding: '5px 12px',
                        cursor: 'pointer',
                        fontSize: '0.8rem',
                        fontWeight: 500,
                        opacity: processing === t.id ? 0.6 : 1
                      }}
                    >
                      {processing === t.id ? '...' : '↔ Confirm Move'}
                    </button>
                  ) : (
                    <span style={{ color: 'var(--success)', fontSize: '0.85rem' }}>Ledger updated ✓</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* How it works */}
      <div style={{ marginTop: '12px', fontSize: '0.8rem', color: 'var(--text-muted)', padding: '0 4px' }}>
        On confirm: <strong style={{ color: 'var(--danger)' }}>Source −qty</strong> and <strong style={{ color: 'var(--success)' }}>Destination +qty</strong> are both logged in the Move History
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '620px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
              <div>
                <h2 style={{ margin: 0 }}>New Stock Transfer</h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', margin: '4px 0 0' }}>
                  Stock moves from source to destination on "Confirm Move"
                </p>
              </div>
              <X size={22} style={{ cursor: 'pointer', color: 'var(--text-muted)' }} onClick={() => setShowModal(false)} />
            </div>

            <form onSubmit={handleSubmit}>
              {/* Route selector with visual arrow */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 40px 1fr', gap: '8px', alignItems: 'end', marginBottom: '20px' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label>📤 Source Location</label>
                  <select
                    className="form-control"
                    value={from_location_id}
                    onChange={e => setFromLocation(e.target.value)}
                    required
                  >
                    <option value="">-- Pick Source --</option>
                    {locations.map(loc => (
                      <option key={loc.id} value={loc.id}>{loc.warehouse_name} › {loc.name}</option>
                    ))}
                  </select>
                </div>
                <div style={{ textAlign: 'center', paddingBottom: '6px' }}>
                  <ArrowRight size={20} color="var(--primary)" />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label>📥 Destination Location</label>
                  <select
                    className="form-control"
                    value={to_location_id}
                    onChange={e => setToLocation(e.target.value)}
                    required
                    style={{ borderColor: to_location_id && to_location_id === from_location_id ? 'var(--danger)' : '' }}
                  >
                    <option value="">-- Pick Destination --</option>
                    {locations.map(loc => (
                      <option key={loc.id} value={loc.id} disabled={loc.id === parseInt(from_location_id)}>
                        {loc.warehouse_name} › {loc.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {from_location_id && to_location_id && from_location_id === to_location_id && (
                <div style={{ padding: '8px 12px', background: 'rgba(239,68,68,0.1)', color: 'var(--danger)', borderRadius: '6px', fontSize: '0.8rem', marginBottom: '12px' }}>
                  ⚠ Source and destination must be different locations.
                </div>
              )}

              <div style={{ marginBottom: '10px', fontWeight: 500, fontSize: '0.875rem' }}>Items to Move</div>

              {items.map((item, index) => (
                <div key={index} style={{ marginBottom: '12px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 36px', gap: '8px', marginBottom: '8px' }}>
                    <select
                      className="form-control"
                      value={item.product_id}
                      onChange={e => updateItem(index, 'product_id', e.target.value)}
                      required
                    >
                      <option value="">Select Product</option>
                      {products.map(p => <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>)}
                    </select>
                    {items.length > 1 && (
                      <button type="button" onClick={() => removeItem(index)} style={{ border: 'none', background: 'none', color: 'var(--danger)', cursor: 'pointer' }}>
                        <X size={18} />
                      </button>
                    )}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                       <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Quantity:</span>
                       <input
                        type="number"
                        className="form-control"
                        style={{ width: '80px' }}
                        value={item.quantity}
                        onChange={e => updateItem(index, 'quantity', parseInt(e.target.value))}
                        min="1"
                        required
                      />
                    </div>
                    {item.available_stock !== null && (
                      <div style={{ 
                        fontSize: '0.8rem', 
                        padding: '4px 8px', 
                        borderRadius: '4px', 
                        background: item.quantity > item.available_stock ? 'rgba(239,68,68,0.1)' : 'var(--bg-main)', 
                        color: item.quantity > item.available_stock ? 'var(--danger)' : 'var(--text-muted)',
                        fontWeight: 500
                      }}>
                        Source Stock: {item.available_stock}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              <button type="button" onClick={addItem} className="btn-text" style={{ marginTop: '4px', marginBottom: '20px' }}>
                + Add Another Product
              </button>

              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={from_location_id && to_location_id && from_location_id === to_location_id}
                >
                  Create Transfer (Pending)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
