import { useState, useEffect } from 'react';
import { Send, Plus, X, PackageOpen, CheckCircle2, Truck } from 'lucide-react';
import api from '../services/api';

const STATUS_FLOW = {
  pending:   { label: 'Pending',  badge: 'badge-warning', next: 'picked',    action: '✓ Mark as Picked' },
  picked:    { label: 'Picked',   badge: 'badge-info',    next: 'packed',     action: '✓ Mark as Packed' },
  packed:    { label: 'Packed',   badge: 'badge-primary', next: 'validate',   action: '🚚 Ship & Reduce Stock' },
  completed: { label: 'Shipped',  badge: 'badge-success', next: null,         action: null },
};

export default function Deliveries() {
  const [deliveries, setDeliveries] = useState([]);
  const [products, setProducts] = useState([]);
  const [locations, setLocations] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [customer, setCustomer] = useState('');
  const [items, setItems] = useState([{ product_id: '', quantity: 1, location_id: '', available_stock: null }]);
  const [processing, setProcessing] = useState(null);

  useEffect(() => {
    fetchDeliveries();
    fetchSupportData();
  }, []);

  const fetchDeliveries = async () => {
    try {
      const res = await api.get('/inventory/deliveries');
      setDeliveries(res.data || []);
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

  const addItem = () => setItems([...items, { product_id: '', quantity: 1, location_id: '', available_stock: null }]);
  const removeItem = (index) => setItems(items.filter((_, i) => i !== index));
  
  const updateItem = async (index, field, value) => {
    const newItems = [...items];
    newItems[index][field] = value;
    
    // If product or location changed, sync available stock
    if (field === 'product_id' || field === 'location_id') {
      const prodId = newItems[index].product_id;
      const locId = newItems[index].location_id;
      
      if (prodId && locId) {
        try {
          const res = await api.get('/inventory/stock-lookup', { params: { product_id: prodId, location_id: locId } });
          newItems[index].available_stock = res.data.stock;
        } catch (err) {
          console.error(err);
        }
      } else {
        newItems[index].available_stock = null;
      }
    }
    
    setItems(newItems);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Validate stock before submittal (client-side check)
    for (const it of items) {
      if (it.available_stock !== null && it.quantity > it.available_stock) {
        alert(`Insufficient stock. Current available: ${it.available_stock}`);
        return;
      }
    }
    
    try {
      await api.post('/inventory/deliveries', { customer, items });
      setShowModal(false);
      fetchDeliveries();
      setCustomer('');
      setItems([{ product_id: '', quantity: 1, location_id: '', available_stock: null }]);
    } catch (err) {
      alert(err.response?.data?.message || 'Error creating delivery order');
    }
  };

  const handleStep = async (delivery) => {
    const flow = STATUS_FLOW[delivery.status];
    if (!flow || !flow.next) return;
    setProcessing(delivery.id);
    try {
      if (flow.next === 'validate') {
        await api.post(`/inventory/deliveries/${delivery.id}/validate`);
      } else {
        // Update intermediate status
        await api.patch(`/inventory/deliveries/${delivery.id}/status`, { status: flow.next });
      }
      fetchDeliveries();
    } catch (err) {
      alert(err.response?.data?.message || 'Error updating delivery');
    } finally {
      setProcessing(null);
    }
  };

  const filtered = statusFilter === 'all' ? deliveries : deliveries.filter(d => d.status === statusFilter);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Delivery Orders</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '4px' }}>
            Stock leaves the warehouse. Validate to reduce inventory.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <select
            className="form-control"
            style={{ width: 'auto', minWidth: '130px' }}
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
          >
            <option value="all">All Orders</option>
            <option value="pending">Pending</option>
            <option value="picked">Picked</option>
            <option value="packed">Packed</option>
            <option value="completed">Shipped</option>
          </select>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            <Plus size={16} /> New Delivery
          </button>
        </div>
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Order ID</th>
              <th>Customer</th>
              <th>Date</th>
              <th>Status</th>
              <th>Next Step</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan="5" style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                No delivery orders found.
              </td></tr>
            ) : filtered.map(d => {
              const flow = STATUS_FLOW[d.status] || STATUS_FLOW['completed'];
              return (
                <tr key={d.id}>
                  <td style={{ fontWeight: 500 }}>#{d.id}</td>
                  <td>{d.customer}</td>
                  <td style={{ color: 'var(--text-muted)' }}>{new Date(d.created_at).toLocaleDateString()}</td>
                  <td>
                    <span className={`badge ${flow.badge}`}>{flow.label}</span>
                  </td>
                  <td>
                    {flow.action && (
                      <button
                        onClick={() => handleStep(d)}
                        disabled={processing === d.id}
                        style={{
                          background: d.status === 'packed' ? 'var(--success)' : 'var(--primary)',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          padding: '5px 12px',
                          cursor: 'pointer',
                          fontSize: '0.8rem',
                          fontWeight: 500,
                          opacity: processing === d.id ? 0.6 : 1
                        }}
                      >
                        {processing === d.id ? '...' : flow.action}
                      </button>
                    )}
                    {!flow.action && <span style={{ color: 'var(--success)', fontSize: '0.85rem' }}>✓ Done</span>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Workflow legend */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '16px', padding: '0 4px' }}>
        {['pending','picked','packed','completed'].map((s, i) => (
          <div key={s} style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            {i > 0 && <span>→</span>}
            <span className={`badge ${STATUS_FLOW[s].badge}`}>{STATUS_FLOW[s].label}</span>
          </div>
        ))}
        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>· Stock decreases only on Ship</span>
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '620px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
              <div>
                <h2 style={{ margin: 0 }}>New Delivery Order</h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', margin: '4px 0 0' }}>Stock will decrease when you click "Ship & Reduce Stock"</p>
              </div>
              <X size={22} style={{ cursor: 'pointer', color: 'var(--text-muted)' }} onClick={() => setShowModal(false)} />
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Customer Name *</label>
                <input className="form-control" value={customer} onChange={e => setCustomer(e.target.value)} required placeholder="e.g. Retail Store Alpha" />
              </div>

              <div style={{ marginBottom: '10px', fontWeight: 500, fontSize: '0.875rem' }}>Items to Ship</div>

              {items.map((item, index) => (
                <div key={index} style={{ marginBottom: '12px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 36px', gap: '8px', marginBottom: '8px' }}>
                    <select className="form-control" value={item.product_id} onChange={e => updateItem(index, 'product_id', e.target.value)} required>
                      <option value="">Select Product</option>
                      {products.map(p => <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>)}
                    </select>
                    <select className="form-control" value={item.location_id} onChange={e => updateItem(index, 'location_id', e.target.value)} required>
                      <option value="">Source Location</option>
                      {locations.map(loc => <option key={loc.id} value={loc.id}>{loc.warehouse_name} › {loc.name}</option>)}
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
                       <input type="number" className="form-control" style={{ width: '80px' }} value={item.quantity} onChange={e => updateItem(index, 'quantity', parseInt(e.target.value))} min="1" required />
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
                        On Hand: {item.available_stock}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              <button type="button" onClick={addItem} className="btn-text" style={{ marginTop: '4px', marginBottom: '20px' }}>
                + Add Another Item
              </button>

              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Create Order (Draft)</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
