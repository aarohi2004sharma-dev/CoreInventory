import { useState, useEffect } from 'react';
import { MapPin, Plus, X } from 'lucide-react';
import api from '../services/api';

export default function Locations() {
  const [locations, setLocations] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ warehouse_id: '', name: '', short_code: '' });
  const [error, setError] = useState('');

  useEffect(() => {
    fetchLocations();
    fetchWarehouses();
  }, []);

  const fetchLocations = async () => {
    try {
      const res = await api.get('/warehouses/locations');
      setLocations(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchWarehouses = async () => {
    try {
      const res = await api.get('/warehouses');
      setWarehouses(res.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const openAdd = () => {
    setForm({ warehouse_id: '', name: '', short_code: '' });
    setError('');
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.warehouse_id) { setError('Please select a warehouse'); return; }
    try {
      await api.post(`/warehouses/${form.warehouse_id}/locations`, { name: form.name, short_code: form.short_code });
      setShowModal(false);
      fetchLocations();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create location');
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Locations</h1>
        <button className="btn btn-primary" onClick={openAdd}>
          <Plus size={18} /> New Location
        </button>
      </div>

      {loading ? (
        <div style={{ padding: '24px' }}>Loading locations...</div>
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Location Name</th>
                <th>Short Code</th>
                <th>Warehouse</th>
              </tr>
            </thead>
            <tbody>
              {locations.length === 0 ? (
                <tr><td colSpan="4" style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>No locations yet. Add a warehouse first, then add locations!</td></tr>
              ) : (
                locations.map(loc => (
                  <tr key={loc.id}>
                    <td style={{ fontWeight: 500 }}>#{loc.id}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <MapPin size={16} color="var(--primary)" />
                        {loc.name}
                      </div>
                    </td>
                    <td><span className="badge" style={{ background: 'rgba(37,99,235,0.1)', color: 'var(--primary)' }}>{loc.short_code}</span></td>
                    <td style={{ color: 'var(--text-muted)' }}>{loc.warehouse_name}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ margin: 0 }}>New Location</h2>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} /></button>
            </div>
            {error && <div style={{ padding: '10px', background: 'rgba(239,68,68,0.1)', color: 'var(--danger)', borderRadius: '6px', marginBottom: '16px', fontSize: '0.875rem' }}>{error}</div>}
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Warehouse *</label>
                <select className="form-control" value={form.warehouse_id} onChange={e => setForm({ ...form, warehouse_id: e.target.value })} required>
                  <option value="">-- Select Warehouse --</option>
                  {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                </select>
                {warehouses.length === 0 && <small style={{ color: 'var(--text-muted)' }}>No warehouses found. Please create a warehouse first.</small>}
              </div>
              <div className="form-group">
                <label>Location Name *</label>
                <input type="text" className="form-control" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required placeholder="e.g. Rack A1" />
              </div>
              <div className="form-group">
                <label>Short Code</label>
                <input type="text" className="form-control" value={form.short_code} onChange={e => setForm({ ...form, short_code: e.target.value })} placeholder="e.g. R-A1" />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Create Location</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
