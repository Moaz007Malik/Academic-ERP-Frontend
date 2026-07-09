import { useEffect, useState } from 'react';
import api from '../../services/api';
import PageTitle from '../../components/layout/PageTitle';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Badge from '../../components/common/Badge';
import Modal from '../../components/common/Modal';
import CredentialsRevealModal from '../../components/common/CredentialsRevealModal';

const ROLE_LABELS = {
  INSTITUTE_ADMIN: 'Admin',
  TEACHER: 'Teacher',
  STUDENT: 'Student',
  PARENT: 'Parent',
  ACCOUNTANT: 'Accountant',
  HR: 'HR',
  LIBRARIAN: 'Librarian',
  RECEPTIONIST: 'Receptionist',
  STAFF: 'Staff',
};

export default function PortalLogins() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [error, setError] = useState('');
  const [resetTarget, setResetTarget] = useState(null);
  const [customPassword, setCustomPassword] = useState('');
  const [revealed, setRevealed] = useState(null);
  const [resetting, setResetting] = useState(false);

  const load = () => {
    setLoading(true);
    api.get('/admin/credentials')
      .then((res) => setUsers(res.data.data || []))
      .catch((err) => setError(err.response?.data?.message || 'Failed to load credentials'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const filtered = users.filter((u) => {
    const q = search.toLowerCase();
    const name = `${u.firstName || ''} ${u.lastName || ''}`.toLowerCase();
    const matchSearch = !q || name.includes(q) || u.email.toLowerCase().includes(q)
      || u.student?.rollNumber?.toLowerCase().includes(q)
      || u.teacher?.employeeCode?.toLowerCase().includes(q);
    const matchRole = !roleFilter || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  const handleReset = async (e) => {
    e.preventDefault();
    if (!resetTarget) return;
    setResetting(true);
    setError('');
    try {
      const body = customPassword.trim() ? { password: customPassword.trim() } : {};
      const res = await api.post(`/admin/credentials/${resetTarget.id}/reset-password`, body);
      const data = res.data.data;
      setResetTarget(null);
      setCustomPassword('');
      setRevealed({ email: data.email, password: data.password, name: data.name });
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reset password');
    } finally {
      setResetting(false);
    }
  };

  const copy = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch { /* ignore */ }
  };

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <PageTitle title="Portal Logins" subtitle="View and manage portal passwords for all users" />
      </div>

      {error && <p className="mb-3 text-sm text-red-600">{error}</p>}

      <div className="mb-4 flex flex-wrap gap-3">
        <Input
          className="min-w-[200px] flex-1"
          placeholder="Search name, email, roll #, employee code..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
        >
          <option value="">All roles</option>
          {Object.entries(ROLE_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
      </div>

      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Name</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Role</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Email</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Password</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">ID</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {loading ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-500">Loading...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-500">No portal users found</td></tr>
            ) : (
              filtered.map((u) => (
                <tr key={u.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm">{u.firstName} {u.lastName}</td>
                  <td className="px-4 py-3"><Badge>{ROLE_LABELS[u.role] || u.role}</Badge></td>
                  <td className="px-4 py-3 text-sm font-mono">{u.email}</td>
                  <td className="px-4 py-3 text-sm font-mono">
                    {u.portalPassword ? (
                      <span className="inline-flex items-center gap-2">
                        <span>{u.portalPassword}</span>
                        <button type="button" className="text-xs text-primary-600 hover:underline" onClick={() => copy(u.portalPassword)}>Copy</button>
                      </span>
                    ) : (
                      <span className="text-gray-400 italic">Not set — reset to generate</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {u.student?.rollNumber || u.teacher?.employeeCode || '—'}
                  </td>
                  <td className="px-4 py-3">
                    <Button type="button" variant="secondary" className="text-xs" onClick={() => { setResetTarget(u); setCustomPassword(''); setError(''); }}>
                      Reset password
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <p className="mt-3 text-xs text-gray-500">
        Passwords shown here match what users sign in with. If a user changes their own password in Profile Settings, the new password is updated here automatically.
      </p>

      <Modal open={!!resetTarget} onClose={() => setResetTarget(null)} title={`Reset password — ${resetTarget?.firstName} ${resetTarget?.lastName}`}>
        <form onSubmit={handleReset} className="space-y-3">
          <p className="text-sm text-gray-600">
            Leave blank to generate a random temporary password, or enter a custom password below.
          </p>
          <Input
            label="Custom password (optional)"
            type="text"
            value={customPassword}
            onChange={(e) => setCustomPassword(e.target.value)}
            placeholder="Auto-generate if empty"
          />
          <Button type="submit" disabled={resetting}>{resetting ? 'Resetting...' : 'Reset & reveal'}</Button>
        </form>
      </Modal>

      <CredentialsRevealModal
        open={!!revealed}
        title="Password reset"
        subtitle={revealed?.name}
        email={revealed?.email || ''}
        password={revealed?.password || ''}
        onConfirm={() => setRevealed(null)}
      />
    </>
  );
}
