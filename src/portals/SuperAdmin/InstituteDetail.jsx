import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api from '../../services/api';
import PageTitle from '../../components/layout/PageTitle';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import ModulePicker from '../../components/modules/ModulePicker';
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
  const { submitting, run } = useAsyncSubmit();

  const load = () => {
    setLoading(true);
    api.get(`/sa/institutes/${id}`)
      .then((res) => {
        setInstitute(res.data.data);
        setModules(res.data.data.activeModules || []);
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

  if (loading) return <p className="text-sm text-gray-500">Loading institute...</p>;
  if (!institute) return <p className="text-sm text-red-600">Institute not found.</p>;

  const summary = summarizeModules(institute.activeModules);

  return (
    <>
      <PageTitle title={institute.name} subtitle={`Code: ${institute.instituteCode}`}>
        <Link to="/sa/institutes"><Button variant="secondary">Back to list</Button></Link>
      </PageTitle>

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
          <p className="text-2xl font-bold text-gray-700">{summary.remainingCount}</p>
          <p className="text-sm text-gray-600">Remaining Available</p>
        </div>
      </div>

      <div className="mb-6 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          <Badge variant={statusVariant[institute.status] || 'default'}>{institute.status}</Badge>
          <span className="text-sm text-gray-600">Plan: {institute.plan?.name || '—'}</span>
          <span className="text-sm text-gray-600">
            Expires: {institute.expiryDate ? new Date(institute.expiryDate).toLocaleDateString() : '—'}
          </span>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="mb-1 text-lg font-semibold text-gray-900">Module Access Management</h2>
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
    </>
  );
}
