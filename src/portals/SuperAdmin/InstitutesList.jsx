import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import PageTitle from '../../components/layout/PageTitle';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';

const statusVariant = {
  ACTIVE: 'success',
  SUSPENDED: 'warning',
  BLOCKED: 'danger',
  EXPIRED: 'danger',
};

async function instituteAction(id, action) {
  await api.post(`/sa/institutes/${id}/${action}`);
}

export default function InstitutesList() {
  const [institutes, setInstitutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(null);

  const load = () => {
    setLoading(true);
    api.get('/sa/institutes')
      .then((res) => setInstitutes(res.data.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleAction = async (id, action) => {
    setActing(id);
    try {
      await instituteAction(id, action);
      load();
    } catch (err) {
      alert(err.response?.data?.message || 'Action failed');
    } finally {
      setActing(null);
    }
  };

  const handleRenew = async (inst) => {
    const days = prompt('Extend subscription by how many days?', '365');
    if (!days) return;
    const expiry = new Date();
    expiry.setDate(expiry.getDate() + parseInt(days, 10));
    setActing(inst.id);
    try {
      await api.put(`/sa/institutes/${inst.id}/renew`, {
        expiryDate: expiry.toISOString(),
        planId: inst.planId,
        paymentRef: `MANUAL-${Date.now()}`,
      });
      load();
    } catch (err) {
      alert(err.response?.data?.message || 'Renewal failed');
    } finally {
      setActing(null);
    }
  };

  return (
    <>
      <PageTitle title="Institutes">
        <Link to="/sa/institutes/new">
          <Button>Create Institute</Button>
        </Link>
      </PageTitle>

      <p className="mb-4 text-sm text-gray-500">
        Control institute access: suspend, block, or renew subscriptions.
      </p>

      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Code</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Name</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Plan</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Status</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Expiry</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {loading ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-500">Loading...</td></tr>
            ) : institutes.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-500">No institutes yet</td></tr>
            ) : (
              institutes.map((inst) => (
                <tr key={inst.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-mono">{inst.instituteCode}</td>
                  <td className="px-4 py-3 text-sm">{inst.name}</td>
                  <td className="px-4 py-3 text-sm">{inst.plan?.name || '—'}</td>
                  <td className="px-4 py-3"><Badge variant={statusVariant[inst.status]}>{inst.status}</Badge></td>
                  <td className="px-4 py-3 text-sm">{inst.expiryDate ? new Date(inst.expiryDate).toLocaleDateString() : '—'}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      <Link to={`/sa/institutes/${inst.id}`}>
                        <Button variant="ghost" className="!px-2 !py-1 text-xs">View</Button>
                      </Link>
                      {inst.status !== 'ACTIVE' && (
                        <Button variant="ghost" className="!px-2 !py-1 text-xs" disabled={acting === inst.id}
                          onClick={() => handleAction(inst.id, 'activate')}>Activate</Button>
                      )}
                      {inst.status === 'ACTIVE' && (
                        <Button variant="ghost" className="!px-2 !py-1 text-xs" disabled={acting === inst.id}
                          onClick={() => handleAction(inst.id, 'suspend')}>Suspend</Button>
                      )}
                      <Button variant="ghost" className="!px-2 !py-1 text-xs" disabled={acting === inst.id}
                        onClick={() => handleRenew(inst)}>Renew</Button>
                      <Button variant="danger" className="!px-2 !py-1 text-xs" disabled={acting === inst.id}
                        onClick={() => handleAction(inst.id, 'block')}>Block</Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
