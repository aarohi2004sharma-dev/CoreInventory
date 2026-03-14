import { useState, useEffect } from 'react';
import { Warehouse as WarehouseIcon, MapPin, Plus, X } from 'lucide-react';
import api from '../services/api';

export default function Warehouses() {
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', short_code: '', address: '' });
  const [error, setError] = useState('');
  
  const [selectedWarehouse, setSelectedWarehouse] = useState(null);
  const [locations, setLocations] = useState([]);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [locationForm, setLocationForm] = useState({ name: '', short_code: '' });
  const [locationLoading, setLocationLoading] = useState(false);

  useEffect(() => { fetchWarehouses(); }, []);

  const fetchWarehouses = async () => {
    try {
      const res = await api.get('/warehouses');
      setWarehouses(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchLocations = async (warehouse) => {
    setSelectedWarehouse(warehouse);
    setShowLocationModal(true);
    setLocationLoading(true);
    try {
      const res = await api.get(`/warehouses/${warehouse.id}/locations`);
      setLocations(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLocationLoading(false);
    }
  };

  const handleLocationSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/warehouses/${selectedWarehouse.id}/locations`, locationForm);
      setLocationForm({ name: '', short_code: '' });
      const res = await api.get(`/warehouses/${selectedWarehouse.id}/locations`);
      setLocations(res.data || []);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to add location');
    }
  };

  const openAdd = () => {
    setForm({ name: '', short_code: '', address: '' });
    setError('');
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api.post('/warehouses/', form);
      setShowModal(false);
      fetchWarehouses();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create warehouse');
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
           <h1 className="page-title">Warehouses & Locations</h1>
           <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Define your physical storage hierarchy.</p>
        </div>
        <button className="btn btn-primary" onClick={openAdd}>
          <Plus size={18} /> New Warehouse
        </button>
      </div>

      {loading ? (
        <div style={{ padding: '24px' }}>Loading warehouses...</div>
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Short Code</th>
                <th>Address</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {warehouses.length === 0 ? (
                <tr><td colSpan="5" style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>No warehouses yet. Add your first warehouse!</td></tr>
              ) : (
                warehouses.map(w => (
                  <tr key={w.id}>
                    <td style={{ fontWeight: 500 }}>#{w.id}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <WarehouseIcon size={16} color="var(--primary)" />
                        {w.name}
                      </div>
                    </td>
                    <td><span className="badge" style={{ background: 'rgba(37,99,235,0.1)', color: 'var(--primary)' }}>{w.short_code}</span></td>
                    <td style={{ color: 'var(--text-muted)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <MapPin size={14} />
                        {w.address || 'N/A'}
                      </div>
                    </td>
                    <td>
                      <button 
                        className="btn-text" 
                        style={{ padding: 0, fontWeight: 600 }}
                        onClick={() => fetchLocations(w)}
                      >
                         Manage Locations
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Warehouse Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ margin: 0 }}>New Warehouse</h2>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} /></button>
            </div>
            {error && <div style={{ padding: '10px', background: 'rgba(239,68,68,0.1)', color: 'var(--danger)', borderRadius: '6px', marginBottom: '16px', fontSize: '0.875rem' }}>{error}</div>}
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Warehouse Name *</label>
                <input type="text" className="form-control" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required placeholder="e.g. Main Hub" />
              </div>
              <div className="form-group">
                <label>Short Code</label>
                <input type="text" className="form-control" value={form.short_code} onChange={e => setForm({ ...form, short_code: e.target.value })} placeholder="e.g. WH-MAIN" />
              </div>
              <div className="form-group">
                <label>Address</label>
                <input type="text" className="form-control" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} placeholder="e.g. New York, NY" />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Create Warehouse</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Locations Modal */}
      {showLocationModal && selectedWarehouse && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '500px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <h2 style={{ margin: 0 }}>Locations</h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Storage areas in {selectedWarehouse.name}</p>
              </div>
              <button onClick={() => setShowLocationModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} /></button>
            </div>

            <form onSubmit={handleLocationSubmit} style={{ display: 'flex', gap: '8px', marginBottom: '24px', alignItems: 'end' }}>
               <div style={{ flex: 2 }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: 600 }}>Name (e.g. Rack A1)</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    value={locationForm.name} 
                    onChange={e => setLocationForm({...locationForm, name: e.target.value})}
                    required
                  />
               </div>
               <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: 600 }}>Code</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    value={locationForm.short_code} 
                    onChange={e => setLocationForm({...locationForm, short_code: e.target.value})}
                  />
               </div>
               <button type="submit" className="btn btn-primary" style={{ height: '38px' }}>Add</button>
            </form>

            <div className="location-list" style={{ maxHeight: '300px', overflowY: 'auto' }}>
               {locationLoading ? (
                 <div>Loading items...</div>
               ) : locations.length === 0 ? (
                 <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)', background: 'var(--bg-main)', borderRadius: '8px' }}>
                   No locations defined yet.
                 </div>
               ) : (
                 <table style={{ background: 'transparent' }}>
                    <thead>
                       <tr><th>Name</th><th>Code</th></tr>
                    </thead>
                    <tbody>
                       {locations.map(loc => (
                         <tr key={loc.id}>
                            <td style={{ padding: '8px 0' }}>{loc.name}</td>
                            <td style={{ padding: '8px 0' }}><span className="badge" style={{ background: 'var(--bg-card)' }}>{loc.short_code}</span></td>
                         </tr>
                       ))}
                    </tbody>
                 </table>
               )}
            </div>

            <div style={{ marginTop: '24px', textAlign: 'right' }}>
               <button className="btn btn-secondary" onClick={() => setShowLocationModal(false)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
