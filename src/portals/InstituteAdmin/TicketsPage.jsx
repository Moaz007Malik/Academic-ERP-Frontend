import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import PageTitle from '../../components/layout/PageTitle';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import { useAsyncSubmit } from '../../hooks/useAsyncSubmit';

const statusVariant = { OPEN: 'warning', IN_PROGRESS: 'info', RESOLVED: 'success', CLOSED: 'default' };
const roleLabel = { STUDENT: 'Student', TEACHER: 'Teacher' };

export default function TicketsPage() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ subject: '', category: 'OTHER', description: '' });
  const { submitting, run } = useAsyncSubmit();

  const load = () => {
    setLoading(true);
    api.get('/admin/tickets')
      .then((res) => setTickets(res.data.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { skipped } = await run(async () => {
      try {
        await api.post('/admin/tickets', form);
        setShowForm(false);
        setForm({ subject: '', category: 'OTHER', description: '' });
        load();
      } catch (err) {
        alert(err.response?.data?.message || 'Failed to submit ticket');
        throw err;
      }
    });
    if (skipped) return;
  };

  return (
    <>
      <PageTitle title="Support Tickets" subtitle="Student & teacher requests appear here first. Resolve locally or forward technical issues to Super Admin." />
      <div className="mb-5 flex justify-end">
        <Button onClick={() => setShowForm(!showForm)} className="shadow-sm">{showForm ? 'Cancel' : 'New Platform Ticket'}</Button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="mb-6 space-y-3 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <Input label="Subject" required value={form.subject}
            onChange={(e) => setForm({ ...form, subject: e.target.value })} />
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Category</label>
            <select className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm transition focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
              <option value="SUBSCRIPTION">Subscription</option>
              <option value="LOGO_UPDATE">Logo Update</option>
              <option value="FEATURE_REQUEST">Feature Request</option>
              <option value="OTHER">Other</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Description</label>
            <textarea className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm transition focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500" rows={3} required
              value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <Button type="submit" disabled={submitting} className="w-full sm:w-auto">{submitting ? 'Submitting...' : 'Submit Ticket'}</Button>
        </form>
      )}

      {loading ? (
        <p className="text-sm text-gray-500">Loading tickets...</p>
      ) : tickets.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-gray-200 py-10 text-center text-sm text-gray-400">No tickets yet.</p>
      ) : (
        <div className="space-y-3">
          {tickets.map((t) => (
            <div key={t.id} className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm transition hover:shadow-md">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="font-medium text-gray-900">{t.subject}</h3>
                <Badge variant={statusVariant[t.status]}>{t.status.replace('_', ' ')}</Badge>
              </div>
              <p className="mt-2 text-sm text-gray-600">{t.description}</p>
              <p className="mt-2 flex flex-wrap items-center gap-1.5 text-xs text-gray-400">
                <span className="rounded bg-gray-100 px-1.5 py-0.5">{t.category}</span>
                {t.createdBy?.role && <span>{roleLabel[t.createdBy.role] || t.createdBy.role}</span>}
                {t.escalatedToSuperAdmin && <span className="font-medium text-amber-600">With Super Admin</span>}
                <span className="ml-auto">{new Date(t.createdAt).toLocaleString()}</span>
              </p>
              <Link to={`/admin/tickets/${t.id}`} className="mt-2 inline-block text-sm font-medium text-primary-600 hover:underline">View Details →</Link>
            </div>
          ))}
        </div>
      )}
    </>
  );
}