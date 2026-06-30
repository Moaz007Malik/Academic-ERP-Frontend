import { NavLink, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../../features/auth/authSlice';
import Button from '../common/Button';

export default function Sidebar({ links, title }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((s) => s.auth);

  const handleLogout = async () => {
    await dispatch(logout());
    navigate('/login');
  };

  return (
    <aside className="flex h-screen w-64 flex-col border-r border-gray-200 bg-white">
      <div className="border-b border-gray-200 p-4">
        <h1 className="text-lg font-bold text-primary-700">{title}</h1>
        {user && (
          <p className="mt-1 truncate text-xs text-gray-500">
            {user.firstName} {user.lastName}
          </p>
        )}
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.end}
            className={({ isActive }) =>
              `block rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-primary-50 text-primary-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`
            }
          >
            {link.label}
          </NavLink>
        ))}
      </nav>
      <div className="border-t border-gray-200 p-3">
        <Button variant="ghost" className="w-full" onClick={handleLogout}>
          Logout
        </Button>
      </div>
    </aside>
  );
}
