import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import Stock from './pages/Stock';
import Receipts from './pages/Receipts';
import Deliveries from './pages/Deliveries';
import Transfers from './pages/Transfers';
import Warehouses from './pages/Warehouses';
import Locations from './pages/Locations';
import Adjustments from './pages/Adjustments';
import MoveHistory from './pages/MoveHistory';
import Login from './pages/Login';

function AppLayout({ children }) {
  const token = localStorage.getItem('token');
  if (!token) return <Navigate to="/login" replace />;
  
  return (
    <div className="app-container">
      <Sidebar />
      <div className="main-content">
        <Navbar />
        <div className="page-content">
          {children}
        </div>
      </div>
    </div>
  );
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<AppLayout><Dashboard /></AppLayout>} />
        <Route path="/stock" element={<AppLayout><Stock /></AppLayout>} />
        <Route path="/products" element={<AppLayout><Products /></AppLayout>} />
        <Route path="/warehouses" element={<AppLayout><Warehouses /></AppLayout>} />
        <Route path="/locations" element={<AppLayout><Locations /></AppLayout>} />
        <Route path="/receipts" element={<AppLayout><Receipts /></AppLayout>} />
        <Route path="/deliveries" element={<AppLayout><Deliveries /></AppLayout>} />
        <Route path="/transfers" element={<AppLayout><Transfers /></AppLayout>} />
        <Route path="/adjustments" element={<AppLayout><Adjustments /></AppLayout>} />
        <Route path="/history" element={<AppLayout><MoveHistory /></AppLayout>} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
