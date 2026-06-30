import { useSelector } from 'react-redux';

export default function ModuleGuard({ moduleKey, children, fallback = null }) {
  const { user } = useSelector((s) => s.auth);
  if (!user) return fallback;
  if (user.role === 'SUPER_ADMIN') return children;
  const modules = user.modules || [];
  if (!modules.includes(moduleKey)) return fallback;
  return children;
}
