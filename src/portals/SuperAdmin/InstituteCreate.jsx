import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import PageTitle from '../../components/layout/PageTitle';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import CredentialsRevealModal from '../../components/common/CredentialsRevealModal';

export default function InstituteCreate() {
  const navigate = useNavigate();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [credentials, setCredentials] = useState(null);
  const [form, setForm] = useState({
    name: '',
    instituteCode: '',
    planId: '',
    adminEmail: '',
    adminFirstName: '',
    adminLastName: '',
    expiryDate: '',
  });

  useEffect(() => {
    api.get('/sa/plans').then((res) => {
      setPlans(res.data.data);
      if (res.data.data[0]) {
        setForm((f) => ({ ...f, planId: res.data.data[0].id }));
      }
    });
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const expiry = form.expiryDate
        ? new Date(form.expiryDate).toISOString()
        : new Date(Date.now() + 365 * 86400000).toISOString();

      const { data } = await api.post('/sa/institutes', { ...form, expiryDate: expiry });
      setCredentials({
        instituteName: data.data.institute?.name || form.name,
        email: data.data.adminCredentials.email,
        password: data.data.adminCredentials.tempPassword,
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create institute');
    } finally {
      setLoading(false);
    }
  };

  const handleCredentialsOk = () => {
    setCredentials(null);
    navigate('/sa/institutes');
  };

  return (
    <>
      <PageTitle title="Create Institute" />
      <form onSubmit={handleSubmit} className="mx-auto max-w-lg space-y-4 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <Input label="Institute Name" required value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <Input label="Institute Code" required placeholder="e.g. GCU-LHR" value={form.instituteCode}
          onChange={(e) => setForm({ ...form, instituteCode: e.target.value.toUpperCase() })} />
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Plan</label>
          <select className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            value={form.planId} onChange={(e) => setForm({ ...form, planId: e.target.value })} required>
            {plans.map((p) => (
              <option key={p.id} value={p.id}>{p.name} — PKR {p.price}/{p.billingCycle}</option>
            ))}
          </select>
        </div>
        <Input label="Admin Email" type="text" inputMode="email" required value={form.adminEmail}
          onChange={(e) => setForm({ ...form, adminEmail: e.target.value })} />
        <div className="grid grid-cols-2 gap-3">
          <Input label="Admin First Name" value={form.adminFirstName}
            onChange={(e) => setForm({ ...form, adminFirstName: e.target.value })} />
          <Input label="Admin Last Name" value={form.adminLastName}
            onChange={(e) => setForm({ ...form, adminLastName: e.target.value })} />
        </div>
        <Input label="Expiry Date" type="date" value={form.expiryDate}
          onChange={(e) => setForm({ ...form, expiryDate: e.target.value })} />
        {error && <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>}
        <div className="flex gap-3">
          <Button type="submit" disabled={loading || !!credentials}>{loading ? 'Creating...' : 'Create Institute'}</Button>
          <Button type="button" variant="secondary" onClick={() => navigate('/sa/institutes')}>Cancel</Button>
        </div>
      </form>

      <CredentialsRevealModal
        open={!!credentials}
        title="Institute created"
        subtitle={credentials?.instituteName}
        email={credentials?.email}
        password={credentials?.password}
        onConfirm={handleCredentialsOk}
      />
    </>
  );
}
