export default function Navbar() {
  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : { name: 'User' };
  const initial = user.name ? user.name.charAt(0).toUpperCase() : 'U';

  return (
    <div className="navbar">
      <div className="navbar-search">
        {/* Placeholder for smart search */}
      </div>
      <div className="navbar-user">
        <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>{user.name}</span>
        <div className="avatar">{initial}</div>
      </div>
    </div>
  );
}
