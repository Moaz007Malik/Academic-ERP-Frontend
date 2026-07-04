import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api from '../../services/api';
import PageTitle from '../../components/layout/PageTitle';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import Input from '../../components/common/Input';
import Modal from '../../components/common/Modal';
import ModulePicker from '../../components/modules/ModulePicker';
import CredentialsRevealModal from '../../components/common/CredentialsRevealModal';
import { summarizeModules } from '../../utils/constants';
import { useAsyncSubmit } from '../../hooks/useAsyncSubmit';

const statusVariant = {
  ACTIVE: 'success',
  SUSPENDED: 'warning',
  BLOCKED: 'danger',
  EXPIRED: 'danger',
};

export default function InstituteDetail() {
  const { id } = useParams();
  const [institute, setInstitute] = useState(null);
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [resetOpen, setResetOpen] = useState(false);
  const [customPassword, setCustomPassword] = useState('');
  const [revealed, setRevealed] = useState(null);
  const { submitting, run } = useAsyncSubmit();

  const load = () => {
    setLoading(true);
    api.get(`/sa/institutes/${id}`)
      .then((res) => {
        const data = res.data.data;
        setInstitute(data);
        setModules(data.activeModules || []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [id]);

  const saveModules = async () => {
    setMessage('');
    await run(async () => {
      await api.put(`/sa/institutes/${id}/modules`, { activeModules: modules });
      setMessage('Module access updated successfully.');
      load();
    });
  };

  const resetAdminPassword = async (e) => {
    e.preventDefault();
    await run(async () => {
      const body = customPassword.trim() ? { password: customPassword.trim() } : {};
      const res = await api.post(`/sa/institutes/${id}/reset-admin-password`, body);
      const data = res.data.data;
      setResetOpen(false);
      setCustomPassword('');
      setRevealed({ email: data.email, password: data.password, name: data.name });
      load();
    });
  };

  const copy = async (text) => {
    try { await navigator.clipboard.writeText(text); } catch { /* ignore */ }
  };

  if (loading) return <p className="text-sm text-gray-500">Loading institute...</p>;
  if (!institute) return <p className="text-sm text-red-600">Institute not found.</p>;

  const summary = institute.moduleSummary || summarizeModules(institute.activeModules);
  const admin = institute.adminUser;
  const counts = institute._count || {};

  return (
    <>
      <PageTitle title={institute.name} subtitle={`Code: ${institute.instituteCode}`}>
        <Link to="/sa/institutes"><Button variant="secondary">Back to list</Button></Link>
      </PageTitle>

      {/* Overview */}
      <div className="mb-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">Institute Details</h2>
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <Badge variant={statusVariant[institute.status] || 'default'}>{institute.status}</Badge>
          {institute.logo && (
            <img src={institute.logo} alt="" className="h-12 w-12 rounded-lg border object-contain" />
          )}
        </div>
        <dl className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2 lg:grid-cols-3">
          <div><dt className="text-gray-500">Institute Code</dt><dd className="font-medium font-mono">{institute.instituteCode}</dd></div>
          <div><dt className="text-gray-500">Contact Email</dt><dd className="font-medium">{institute.email || '—'}</dd></div>
          <div><dt className="text-gray-500">Phone</dt><dd className="font-medium">{institute.phone || '—'}</dd></div>
          <div><dt className="text-gray-500">Plan</dt><dd className="font-medium">{institute.plan?.name || '—'}</dd></div>
          <div><dt className="text-gray-500">Expiry</dt><dd className="font-medium">{institute.expiryDate ? new Date(institute.expiryDate).toLocaleDateString() : '—'}</dd></div>
          <div><dt className="text-gray-500">Storage</dt><dd className="font-medium">{((institute.storageUsedMB || 0) / 1024).toFixed(1)} / {(institute.storageQuotaMB / 1024).toFixed(0)} GB</dd></div>
          <div><dt className="text-gray-500">Students</dt><dd className="font-medium">{counts.students ?? '—'}</dd></div>
          <div><dt className="text-gray-500">Teachers</dt><dd className="font-medium">{counts.teachers ?? '—'}</dd></div>
          <div><dt className="text-gray-500">Total Users</dt><dd className="font-medium">{counts.users ?? '—'}</dd></div>
          {institute.address && (
            <div className="sm:col-span-2 lg:col-span-3"><dt className="text-gray-500">Address</dt><dd className="font-medium">{institute.address}</dd></div>
          )}
        </dl>
      </div>

      {/* Module stats */}
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-green-200 bg-green-50 p-4">
          <p className="text-2xl font-bold text-green-700">{summary.activeCount}</p>
          <p className="text-sm text-green-800">Active Modules</p>
        </div>
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
          <p className="text-2xl font-bold text-amber-700">{summary.disabledCount}</p>
          <p className="text-sm text-amber-800">Disabled Modules</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
          <p className="text-2xl font-bold text-gray-700">{summary.totalCount}</p>
          <p className="text-sm text-gray-600">Total Available</p>
        </div>
      </div>

      {/* Admin credentials */}
      <div className="mb-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Institute Admin Login</h2>
            <p className="text-sm text-gray-500">View or reset the institute admin password if they forget it.</p>
          </div>
          <Button variant="secondary" onClick={() => { setResetOpen(true); setCustomPassword(''); }}>
            Reset password
          </Button>
        </div>
        {admin ? (
          <dl className="grid gap-4 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-gray-500">Admin Name</dt>
              <dd className="font-medium">{admin.firstName} {admin.lastName}</dd>
            </div>
            <div>
              <dt className="text-gray-500">Login Email</dt>
              <dd className="flex items-center gap-2 font-mono font-medium">
                {admin.email}
                <button type="button" className="text-xs text-primary-600 hover:underline" onClick={() => copy(admin.email)}>Copy</button>
              </dd>
            </div>
            <div>
              <dt className="text-gray-500">Current Password</dt>
              <dd className="flex items-center gap-2 font-mono font-medium">
                {admin.portalPassword ? (
                  <>
                    <span>{admin.portalPassword}</span>
                    <button type="button" className="text-xs text-primary-600 hover:underline" onClick={() => copy(admin.portalPassword)}>Copy</button>
                  </>
                ) : (
                  <span className="italic text-gray-400">Not on file — admin changed it. Use Reset password.</span>
                )}
              </dd>
            </div>
            <div>
              <dt className="text-gray-500">Last Login</dt>
              <dd className="font-medium">{admin.lastLoginAt ? new Date(admin.lastLoginAt).toLocaleString() : 'Never'}</dd>
            </div>
          </dl>
        ) : (
          <p className="text-sm text-amber-700">No institute admin account found for this institute.</p>
        )}
      </div>

      {/* Module management */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="mb-1 text-lg font-semibold text-gray-900">Module Access</h2>
        <p className="mb-4 text-sm text-gray-500">
          Enable or disable modules for this institute. Disabled modules are hidden from sidebar, routes, and APIs.
        </p>

        <ModulePicker value={modules} onChange={setModules} />

        {message && <p className="mt-4 text-sm text-green-600">{message}</p>}

        <div className="mt-6 flex justify-end">
          <Button onClick={saveModules} disabled={submitting}>
            {submitting ? 'Saving...' : 'Save Module Access'}
          </Button>
        </div>
      </div>

      {institute.subscriptionInvoices?.length > 0 && (
        <div className="mt-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Recent Invoices</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs uppercase text-gray-500">
                  <th className="pb-2 pr-4">Invoice #</th>
                  <th className="pb-2 pr-4">Type</th>
                  <th className="pb-2 pr-4">Amount</th>
                  <th className="pb-2 pr-4">Status</th>
                  <th className="pb-2">Date</th>
                </tr>
              </thead>
              <tbody>
                {institute.subscriptionInvoices.map((inv) => (
                  <tr key={inv.id} className="border-b border-gray-100">
                    <td className="py-2 pr-4 font-mono">{inv.invoiceNumber}</td>
                    <td className="py-2 pr-4">{inv.type}</td>
                    <td className="py-2 pr-4">{inv.amount?.toLocaleString()}</td>
                    <td className="py-2 pr-4"><Badge>{inv.status}</Badge></td>
                    <td className="py-2">{inv.issuedAt ? new Date(inv.issuedAt).toLocaleDateString() : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal open={resetOpen} onClose={() => setResetOpen(false)} title="Reset institute admin password">
        <form onSubmit={resetAdminPassword} className="space-y-3">
          <p className="text-sm text-gray-600">
            Leave blank to auto-generate a temporary password, or enter a custom one.
          </p>
          <Input
            label="Custom password (optional)"
            type="text"
            value={customPassword}
            onChange={(e) => setCustomPassword(e.target.value)}
            placeholder="Auto-generate if empty"
          />
          <Button type="submit" disabled={submitting}>{submitting ? 'Resetting...' : 'Reset password'}</Button>
        </form>
      </Modal>

      <CredentialsRevealModal
        open={!!revealed}
        title="Institute admin credentials"
        subtitle={revealed?.name}
        email={revealed?.email || ''}
        password={revealed?.password || ''}
        onConfirm={() => setRevealed(null)}
      />
    </>
  );
}
