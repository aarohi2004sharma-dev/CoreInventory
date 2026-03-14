import { useState, useEffect } from 'react';
import { Plus, X } from 'lucide-react';
import api from '../services/api';

export default function Receipts() {
  const [receipts, setReceipts] = useState([]);
  const [products, setProducts] = useState([]);
  const [locations, setLocations] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [supplier, setSupplier] = useState('');
  const [items, setItems] = useState([{ product_id: '', quantity: 1, location_id: '' }]);
  const [processing, setProcessing] = useState(null);

  useEffect(() => {
    fetchReceipts();
    fetchSupportData();
  }, []);

  const fetchReceipts = async () => {
    try {
      const res = await api.get('/inventory/receipts');
      setReceipts(res.data || []);
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

  const addItem = () => setItems([...items, { product_id: '', quantity: 1, location_id: '' }]);
  const removeItem = (index) => setItems(items.filter((_, i) => i !== index));
  const updateItem = (index, field, value) => {
    const newItems = [...items];
    newItems[index][field] = value;
    setItems(newItems);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/inventory/receipts', { supplier, items });
      setShowModal(false);
      setSupplier('');
      setItems([{ product_id: '', quantity: 1, location_id: '' }]);
      fetchReceipts();
    } catch (err) {
      alert(err.response?.data?.message || 'Error creating receipt');
    }
  };

  const validateReceipt = async (id) => {
    if (!window.confirm('Validate this receipt? Stock quantities will increase immediately.')) return;
    setProcessing(id);
    try {
      await api.post(`/inventory/receipts/${id}/validate`);
      fetchReceipts();
    } catch (err) {
      alert(err.response?.data?.message || 'Error validating receipt');
    } finally {
      setProcessing(null);
    }
  };

  const filteredReceipts = receipts.filter(r => statusFilter === 'all' || r.status === statusFilter);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Receipts (Incoming Goods)</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '4px' }}>
            Items arriving from vendors. Validate to increase stock.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <select
            className="form-control"
            style={{ width: 'auto', minWidth: '130px' }}
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
          >
            <option value="all">All Receipts</option>
            <option value="pending">Pending</option>
            <option value="completed">Completed</option>
          </select>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            <Plus size={16} /> New Receipt
          </button>
        </div>
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Receipt ID</th>
              <th>Supplier</th>
              <th>Date</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredReceipts.length === 0 ? (
              <tr><td colSpan="5" style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                No receipts found. Create a new receipt when goods arrive from a vendor.
              </td></tr>
            ) : filteredReceipts.map(r => (
              <tr key={r.id}>
                <td style={{ fontWeight: 500 }}>#{r.id}</td>
                <td>{r.supplier}</td>
                <td style={{ color: 'var(--text-muted)' }}>{new Date(r.created_at).toLocaleDateString()}</td>
                <td>
                  {r.status === 'pending'
                    ? <span className="badge badge-warning">Pending</span>
                    : <span className="badge badge-success">✓ Received</span>
                  }
                </td>
                <td>
                  {r.status === 'pending' ? (
                    <button
                      onClick={() => validateReceipt(r.id)}
                      disabled={processing === r.id}
                      style={{
                        background: 'var(--success)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        padding: '5px 12px',
                        cursor: 'pointer',
                        fontSize: '0.8rem',
                        fontWeight: 500,
                        opacity: processing === r.id ? 0.6 : 1
                      }}
                    >
                      {processing === r.id ? '...' : '📦 Receive & Add to Stock'}
                    </button>
                  ) : (
                    <span style={{ color: 'var(--success)', fontSize: '0.85rem' }}>Stock updated ✓</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Workflow info */}
      <div style={{ marginTop: '12px', fontSize: '0.8rem', color: 'var(--text-muted)', padding: '0 4px' }}>
        <span className="badge badge-warning">Pending</span>
        <span style={{ margin: '0 6px' }}>→</span>
        <span className="badge badge-success">✓ Received</span>
        <span style={{ marginLeft: '8px' }}>· Stock increases only when you click "Receive & Add to Stock"</span>
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '620px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
              <div>
                <h2 style={{ margin: 0 }}>New Incoming Receipt</h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', margin: '4px 0 0' }}>
                  Stock increases when you click "Receive & Add to Stock" after saving.
                </p>
              </div>
              <X size={22} style={{ cursor: 'pointer', color: 'var(--text-muted)' }} onClick={() => setShowModal(false)} />
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Supplier Name *</label>
                <input
                  className="form-control"
                  value={supplier}
                  onChange={e => setSupplier(e.target.value)}
                  required
                  placeholder="e.g. Acme Corp"
                />
              </div>

              <div style={{ marginBottom: '10px', fontWeight: 500, fontSize: '0.875rem' }}>
                Items to Receive
              </div>

              {items.map((item, index) => (
                <div key={index} style={{ display: 'grid', gridTemplateColumns: '1fr 80px 1fr 36px', gap: '8px', marginBottom: '8px' }}>
                  <select
                    className="form-control"
                    value={item.product_id}
                    onChange={e => updateItem(index, 'product_id', e.target.value)}
                    required
                  >
                    <option value="">Select Product</option>
                    {products.map(p => <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>)}
                  </select>
                  <input
                    type="number"
                    className="form-control"
                    value={item.quantity}
                    onChange={e => updateItem(index, 'quantity', parseInt(e.target.value))}
                    min="1"
                    required
                    placeholder="Qty"
                  />
                  <select
                    className="form-control"
                    value={item.location_id}
                    onChange={e => updateItem(index, 'location_id', e.target.value)}
                    required
                  >
                    <option value="">Destination Location</option>
                    {locations.map(loc => (
                      <option key={loc.id} value={loc.id}>{loc.warehouse_name} › {loc.name}</option>
                    ))}
                  </select>
                  {items.length > 1 && (
                    <button type="button" onClick={() => removeItem(index)} style={{ border: 'none', background: 'none', color: 'var(--danger)', cursor: 'pointer' }}>
                      <X size={18} />
                    </button>
                  )}
                </div>
              ))}

              <button type="button" onClick={addItem} className="btn-text" style={{ marginTop: '4px', marginBottom: '20px' }}>
                + Add Another Item
              </button>

              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Receipt (Draft)</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
