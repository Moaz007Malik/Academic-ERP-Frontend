import { useSearchParams } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { logout } from '../features/auth/authSlice';
import Button from '../components/common/Button';

const MESSAGES = {
  blocked: {
    title: 'Account Blocked',
    body: 'Your institute account has been blocked by the Super Administrator. All portal access has been revoked.',
  },
  suspended: {
    title: 'Account Suspended',
    body: 'Your institute account is suspended. Contact the Super Administrator to restore access.',
  },
  expired: {
    title: 'Subscription Expired',
    body: 'Your institute subscription has expired. Contact your institute administrator or the Super Administrator to renew.',
  },
};

export default function AccessDeniedPage() {
  const [params] = useSearchParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const reason = params.get('reason') || 'blocked';
  const msg = MESSAGES[reason] || MESSAGES.blocked;

  const handleLogout = async () => {
    await dispatch(logout());
    navigate('/login');
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md rounded-2xl border border-red-200 bg-white p-8 text-center shadow-lg">
        <div className="mb-4 text-4xl">🔒</div>
        <h1 className="text-xl font-bold text-gray-900">{msg.title}</h1>
        <p className="mt-3 text-sm text-gray-600">{msg.body}</p>
        <Button className="mt-6 w-full" onClick={handleLogout}>Back to Login</Button>
      </div>
    </div>
  );
}
