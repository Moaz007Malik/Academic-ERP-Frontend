import { NavLink, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../../features/auth/authSlice';
import Button from '../common/Button';

export default function Sidebar({ links, title, logoUrl }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((s) => s.auth);

  const logo = logoUrl || user?.instituteLogo || user?.institute?.logo;

  const handleLogout = async () => {
    await dispatch(logout());
    navigate('/login');
  };

  return (
    <aside className="flex h-full w-64 flex-col border-r border-gray-200 bg-white">
      <div className="shrink-0 border-b border-gray-200 p-4">
        {logo ? (
          <div className="mb-2 flex items-center gap-3">
            <img
              src={logo}
              alt={`${title} logo`}
              className="h-10 w-10 rounded-lg border border-gray-200 object-contain bg-white"
            />
            <h1 className="line-clamp-2 text-sm font-bold leading-tight text-primary-700">{title}</h1>
          </div>
        ) : (
          <h1 className="text-lg font-bold text-primary-700">{title}</h1>
        )}
        {user && (
          <p className="mt-1 truncate text-xs text-gray-500">
            {user.firstName} {user.lastName}
          </p>
        )}
      </div>
      <nav className="min-h-0 flex-1 space-y-1 overflow-y-auto p-3">
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
      <div className="shrink-0 border-t border-gray-200 p-3">
        <Button variant="ghost" className="w-full" onClick={handleLogout}>
          Logout
        </Button>
      </div>
    </aside>
  );
}
