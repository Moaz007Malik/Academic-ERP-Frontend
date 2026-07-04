import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { hasModule } from '../../utils/constants';

export default function ModuleRouteGuard({ moduleKey, children }) {
  const { user } = useSelector((s) => s.auth);
  if (!hasModule(user, moduleKey)) {
    return <Navigate to="/access-denied" replace />;
  }
  return children;
}
