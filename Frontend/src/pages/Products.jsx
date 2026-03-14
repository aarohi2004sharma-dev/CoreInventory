import { useState, useEffect } from 'react';
import { Plus, Search, X, MapPin, AlertCircle, Info } from 'lucide-react';
import api from '../services/api';

export default function Products() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editProduct, setEditProduct] = useState(null);
  
  // Custom Category State: can be existing ID or custom name
  const [form, setForm] = useState({ 
    name: '', sku: '', category_name: '', unit: 'pcs', 
    reorder_level: 0, initial_stock: 0, initial_location_id: '' 
  });
  
  const [error, setError] = useState('');
  
  // Availability Modal State
  const [availabilityProduct, setAvailabilityProduct] = useState(null);
  const [productStock, setProductStock] = useState([]);
  const [availabilityLoading, setAvailabilityLoading] = useState(false);

  useEffect(() => {
    fetchProducts();
    fetchCategories();
    fetchLocations();
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await api.get('/products');
      setProducts(res.data.products || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await api.get('/products/categories');
      setCategories(res.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchLocations = async () => {
    try {
      const res = await api.get('/warehouses/locations');
      setLocations(res.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchAvailability = async (product) => {
    setAvailabilityProduct(product);
    setAvailabilityLoading(true);
    setProductStock([]);
    try {
      const res = await api.get(`/inventory/stock/product/${product.id}`);
      setProductStock(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setAvailabilityLoading(false);
    }
  };

  const openAdd = () => {
    setEditProduct(null);
    setForm({ name: '', sku: '', category_name: '', unit: 'pcs', reorder_level: 0, initial_stock: 0, initial_location_id: '' });
    setError('');
    setShowModal(true);
  };

  const openEdit = (p) => {
    setEditProduct(p);
    setForm({ 
      name: p.name, 
      sku: p.sku, 
      category_name: p.category_name || '', 
      unit: p.unit || 'pcs', 
      reorder_level: p.reorder_level || 0, 
      initial_stock: 0, 
      initial_location_id: '' 
    });
    setError('');
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      if (editProduct) {
        await api.put(`/products/${editProduct.id}`, form);
      } else {
        await api.post('/products/', form);
      }
      setShowModal(false);
      fetchProducts();
      fetchCategories(); // Refresh categories in case a new one was added
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save product');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this product? This cannot be undone.')) return;
    try {
      await api.delete(`/products/${id}`);
      fetchProducts();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete product');
    }
  };

  const [selectedCategory, setSelectedCategory] = useState('all');
  const [stockStatus, setStockStatus] = useState('all');

  const filteredProducts = products.filter(p => {
    const matchesSearch = !search || 
      p.name?.toLowerCase().includes(search.toLowerCase()) ||
      p.sku?.toLowerCase().includes(search.toLowerCase());
    
    const matchesCategory = selectedCategory === 'all' || p.category_id?.toString() === selectedCategory;
    
    const currentStock = p.stock ?? 0;
    const isLow = currentStock > 0 && currentStock <= p.reorder_level;
    const isOut = currentStock === 0;
    
    let matchesStock = true;
    if (stockStatus === 'low') matchesStock = isLow;
    else if (stockStatus === 'out') matchesStock = isOut;
    else if (stockStatus === 'in') matchesStock = currentStock > p.reorder_level;

    return matchesSearch && matchesCategory && matchesStock;
  });

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Products Management</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '4px' }}>
            {filteredProducts.length} items found. Manage reordering rules and availability.
          </p>
        </div>
        <button className="btn btn-primary" onClick={openAdd}>
          <Plus size={16} /> Add Product
        </button>
      </div>

      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', background: 'var(--bg-card)', padding: '0 12px', borderRadius: '8px', border: '1px solid var(--border-color)', width: '300px' }}>
          <Search size={16} color="var(--text-muted)" style={{ marginRight: '8px' }} />
          <input
            type="text"
            placeholder="Search SKU or name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ border: 'none', outline: 'none', width: '100%', height: '40px', fontSize: '0.875rem', background: 'transparent', color: 'var(--text-main)' }}
          />
        </div>
        
        <select 
          className="form-control" 
          style={{ width: 'auto', minWidth: '160px' }}
          value={selectedCategory}
          onChange={e => setSelectedCategory(e.target.value)}
        >
          <option value="all">All Categories</option>
          {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>

        <select 
          className="form-control" 
          style={{ width: 'auto', minWidth: '160px' }}
          value={stockStatus}
          onChange={e => setStockStatus(e.target.value)}
        >
          <option value="all">Any Stock Level</option>
          <option value="in">In Stock Only</option>
          <option value="low">Low Stock Only</option>
          <option value="out">Out of Stock Only</option>
        </select>
      </div>

      {loading ? (
        <div style={{ padding: '24px' }}>Loading products...</div>
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>SKU</th>
                <th>Name</th>
                <th>Category</th>
                <th>Reorder Level</th>
                <th>Availability</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.length === 0 ? (
                <tr><td colSpan="7" style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>No products found. Add your first product!</td></tr>
              ) : (
                filteredProducts.map(p => (
                  <tr key={p.id}>
                    <td style={{ fontWeight: 500 }}>{p.sku}</td>
                    <td>{p.name}</td>
                    <td>
                      <span className="badge" style={{ background: 'rgba(37,99,235,0.1)', color: 'var(--primary)', fontWeight: 400 }}>
                        {p.category_name || 'Uncategorized'}
                      </span>
                    </td>
                    <td>{p.reorder_level} {p.unit}</td>
                    <td>
                      <button 
                        onClick={() => fetchAvailability(p)}
                        style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', color: 'var(--text-main)', cursor: 'pointer', padding: '4px 8px', borderRadius: '4px', hover: { background: 'var(--bg-main)'}}}
                      >
                         <strong style={{ fontSize: '1.1rem' }}>{p.stock ?? 0}</strong>
                         <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{p.unit}</span>
                         <Info size={14} color="var(--primary)" />
                      </button>
                    </td>
                    <td>
                      {(p.stock ?? 0) <= p.reorder_level
                        ? <span className="badge badge-warning" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><AlertCircle size={12} /> Low Stock</span>
                        : <span className="badge badge-success">Sufficient</span>
                      }
                    </td>
                    <td>
                      <button onClick={() => openEdit(p)} style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontWeight: 500, marginRight: '16px' }}>Edit</button>
                      <button onClick={() => handleDelete(p.id)} style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', fontWeight: 500 }}>Delete</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Product Edit/Add Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ margin: 0 }}>{editProduct ? 'Edit Product' : 'Add New Product'}</h2>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} /></button>
            </div>
            {error && <div style={{ padding: '10px', background: 'rgba(239,68,68,0.1)', color: 'var(--danger)', borderRadius: '6px', marginBottom: '16px', fontSize: '0.875rem' }}>{error}</div>}
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Product Name *</label>
                <input type="text" className="form-control" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
              </div>
              <div className="form-group">
                <label>SKU (Barcode/Identifier) *</label>
                <input type="text" className="form-control" value={form.sku} onChange={e => setForm({ ...form, sku: e.target.value })} required placeholder="e.g. BARCODE-001" />
              </div>
              
              <div className="form-group">
                <label>Category (Type or Select)</label>
                <input 
                  type="text" 
                  className="form-control" 
                  list="category-suggestions" 
                  value={form.category_name} 
                  onChange={e => setForm({ ...form, category_name: e.target.value })}
                  placeholder="Type new or select existing..."
                />
                <datalist id="category-suggestions">
                    {categories.map(c => <option key={c.id} value={c.name} />)}
                </datalist>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label>Unit of Measure</label>
                  <select className="form-control" value={form.unit} onChange={e => setForm({ ...form, unit: e.target.value })}>
                    <option value="pcs">pcs — Pieces</option>
                    <option value="kg">kg — Kilograms</option>
                    <option value="litre">litre — Litres</option>
                    <option value="box">box — Boxes</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Reorder Point (Threshold)</label>
                  <input type="number" className="form-control" min="0" value={form.reorder_level} onChange={e => setForm({ ...form, reorder_level: parseInt(e.target.value) || 0 })} />
                </div>
              </div>

              {!editProduct && (
                <div style={{ marginTop: '4px', padding: '14px', borderRadius: '8px', background: 'var(--bg-main)', border: '1px solid var(--border-color)' }}>
                  <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--primary)', marginBottom: '10px' }}>📦 Opening Stock Configuration</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label style={{ fontSize: '0.8rem' }}>Initial Qty</label>
                      <input type="number" className="form-control" value={form.initial_stock} onChange={e => setForm({ ...form, initial_stock: parseInt(e.target.value) || 0 })} />
                    </div>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label style={{ fontSize: '0.8rem' }}>Default Location</label>
                      <select className="form-control" value={form.initial_location_id} onChange={e => setForm({ ...form, initial_location_id: e.target.value })}>
                        <option value="">-- Choose --</option>
                        {locations.map(loc => <option key={loc.id} value={loc.id}>{loc.warehouse_name} › {loc.name}</option>)}
                      </select>
                    </div>
                  </div>
                </div>
              )}

              <div className="modal-actions" style={{ marginTop: '24px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">{editProduct ? 'Update Product' : 'Create Product'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Availability Detail Modal */}
      {availabilityProduct && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '400px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
               <h3 style={{ margin: 0 }}>Stock Availability</h3>
               <button onClick={() => setAvailabilityProduct(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={18} /></button>
            </div>
            <div style={{ marginBottom: '20px' }}>
                <div style={{ fontWeight: 600, fontSize: '1.1rem' }}>{availabilityProduct.name}</div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>SKU: {availabilityProduct.sku}</div>
            </div>

            {availabilityLoading ? (
                <div style={{ padding: '20px', textAlign: 'center' }}>Loading location data...</div>
            ) : (
                <div className="availability-list" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {productStock.length === 0 ? (
                        <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)', background: 'var(--bg-main)', borderRadius: '8px' }}>
                            Oops! This product is not stored in any location yet.
                        </div>
                    ) : (
                        productStock.map(s => (
                            <div key={s.location_id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: 'var(--bg-main)', borderRadius: '8px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <MapPin size={16} color="var(--primary)" />
                                    <div>
                                        <div style={{ fontSize: '0.9rem', fontWeight: 500 }}>{s.location_name}</div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{s.warehouse_name}</div>
                                    </div>
                                </div>
                                <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>{s.quantity}</div>
                            </div>
                        ))
                    )}
                </div>
            )}
            
            <div style={{ marginTop: '24px', textAlign: 'center' }}>
                <button 
                  onClick={() => setAvailabilityProduct(null)} 
                  className="btn btn-secondary" 
                  style={{ width: '100%' }}
                >
                    Close
                </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
