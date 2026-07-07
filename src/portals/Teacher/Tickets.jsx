import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import PageTitle from '../../components/layout/PageTitle';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import Input from '../../components/common/Input';

export default function TeacherTickets() {
  const [tickets, setTickets] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ subject: '', description: '', category: 'OTHER' });

  const load = () => api.get('/teacher/tickets').then((res) => setTickets(res.data.data || []));

  useEffect(() => { load(); }, []);

  const submit = async (e) => {
    e.preventDefault();
    await api.post('/teacher/tickets', form);
    setShowForm(false);
    setForm({ subject: '', description: '', category: 'OTHER' });
    load();
  };

  return (
    <>
      <PageTitle title="Support Tickets">
        <Button onClick={() => setShowForm(!showForm)}>New Ticket</Button>
      </PageTitle>
      {showForm && (
        <form onSubmit={submit} className="mb-6 space-y-3 rounded-xl border bg-white p-5">
          <Input label="Subject" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} required />
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Category</label>
            <select className="w-full rounded-lg border px-3 py-2 text-sm" value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}>
              <option value="ACADEMIC">Academic</option>
              <option value="ATTENDANCE">Attendance</option>
              <option value="TECHNICAL">Technical (app/login)</option>
              <option value="OTHER">Other</option>
            </select>
          </div>
          <textarea className="w-full rounded-lg border px-3 py-2 text-sm" rows={3} placeholder="Describe your issue"
            value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required />
          <Button type="submit">Submit to Institute</Button>
        </form>
      )}
      <div className="space-y-3">
        {tickets.map((t) => (
          <div key={t.id} className="rounded-xl border bg-white p-4">
            <div className="flex justify-between"><h3 className="font-medium">{t.subject}</h3><Badge>{t.status}</Badge></div>
            <Link to={`/teacher/tickets/${t.id}`} className="mt-2 inline-block text-sm text-blue-600">View Details →</Link>
          </div>
        ))}
      </div>
    </>
  );
}
