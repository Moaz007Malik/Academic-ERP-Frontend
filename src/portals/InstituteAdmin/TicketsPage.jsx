import { useEffect, useState } from 'react';
import api from '../../services/api';
import PageTitle from '../../components/layout/PageTitle';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import { useAsyncSubmit } from '../../hooks/useAsyncSubmit';

const statusVariant = { OPEN: 'warning', IN_PROGRESS: 'info', RESOLVED: 'success', CLOSED: 'default' };

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
      <PageTitle title="Support Tickets">
        <Button onClick={() => setShowForm(!showForm)}>New Ticket</Button>
      </PageTitle>

      {showForm && (
        <form onSubmit={handleSubmit} className="mb-6 space-y-3 rounded-xl border border-gray-200 bg-white p-5">
          <Input label="Subject" required value={form.subject}
            onChange={(e) => setForm({ ...form, subject: e.target.value })} />
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Category</label>
            <select className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
              <option value="SUBSCRIPTION">Subscription</option>
              <option value="LOGO_UPDATE">Logo Update</option>
              <option value="FEATURE_REQUEST">Feature Request</option>
              <option value="OTHER">Other</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Description</label>
            <textarea className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" rows={3} required
              value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <Button type="submit" disabled={submitting}>{submitting ? 'Submitting...' : 'Submit Ticket'}</Button>
        </form>
      )}

      {loading ? (
        <p className="text-gray-500">Loading tickets...</p>
      ) : tickets.length === 0 ? (
        <p className="text-gray-500">No tickets yet.</p>
      ) : (
        <div className="space-y-3">
          {tickets.map((t) => (
            <div key={t.id} className="rounded-xl border border-gray-200 bg-white p-4">
              <div className="flex items-center justify-between gap-2">
                <h3 className="font-medium">{t.subject}</h3>
                <Badge variant={statusVariant[t.status]}>{t.status}</Badge>
              </div>
              <p className="mt-2 text-sm text-gray-600">{t.description}</p>
              <p className="mt-1 text-xs text-gray-400">{t.category} · {new Date(t.createdAt).toLocaleString()}</p>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
