import { Navigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { getPortalRouteForRole } from '../../utils/constants';
import {
  isInstituteAccessBlocked,
  isSubscriptionExpiredForUser,
  getAccessDeniedRedirect,
} from '../../utils/instituteAccess';

const EXPIRED_ALLOWED = ['/admin/subscription', '/admin/tickets', '/admin/subscription/expired'];

export default function AuthGuard({ children, allowedRoles, allowExpiredAdmin = false }) {
  const { isAuthenticated, user } = useSelector((s) => s.auth);
  const location = useLocation();

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to={getPortalRouteForRole(user.role)} replace />;
  }

  if (isInstituteAccessBlocked(user)) {
    return <Navigate to={getAccessDeniedRedirect(user)} replace />;
  }

  const expired = isSubscriptionExpiredForUser(user);

  if (expired && user.role === 'INSTITUTE_ADMIN') {
    const path = location.pathname;
    const allowed = allowExpiredAdmin || EXPIRED_ALLOWED.some((p) => path.startsWith(p));
    if (!allowed) {
      return <Navigate to="/admin/subscription" replace />;
    }
  } else if (expired) {
    return <Navigate to={getAccessDeniedRedirect(user)} replace />;
  }

  return children;
}
