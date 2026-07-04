import { useEffect, useState } from 'react';
import api from '../../services/api';
import PageTitle from '../../components/layout/PageTitle';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Badge from '../../components/common/Badge';

export default function TeacherLeave() {
  const [leaves, setLeaves] = useState([]);
  const [form, setForm] = useState({});
  const [showForm, setShowForm] = useState(false);

  const load = () => api.get('/teacher/leave').then((res) => setLeaves(res.data.data || []));

  useEffect(() => { load(); }, []);

  const submit = async (e) => {
    e.preventDefault();
    await api.post('/teacher/leave', form);
    setShowForm(false);
    setForm({});
    load();
  };

  return (
    <>
      <PageTitle title="Leave Requests"><Button onClick={() => setShowForm(!showForm)}>Apply Leave</Button></PageTitle>
      {showForm && (
        <form onSubmit={submit} className="mb-6 space-y-3 rounded-xl border bg-white p-5">
          <Input label="Leave Type" value={form.leaveType || ''} onChange={(e) => setForm({ ...form, leaveType: e.target.value })} required />
          <Input label="Start Date" type="date" value={form.startDate || ''} onChange={(e) => setForm({ ...form, startDate: e.target.value })} required />
          <Input label="End Date" type="date" value={form.endDate || ''} onChange={(e) => setForm({ ...form, endDate: e.target.value })} required />
          <textarea className="w-full rounded border px-3 py-2 text-sm" placeholder="Reason" value={form.reason || ''} onChange={(e) => setForm({ ...form, reason: e.target.value })} />
          <Button type="submit">Submit Request</Button>
        </form>
      )}
      <div className="space-y-2">
        {leaves.map((l) => (
          <div key={l.id} className="flex justify-between rounded-lg border bg-white p-4 text-sm">
            <span>{l.leaveType} · {new Date(l.startDate).toLocaleDateString()} – {new Date(l.endDate).toLocaleDateString()}</span>
            <Badge variant={l.status === 'APPROVED' ? 'success' : l.status === 'PENDING' ? 'warning' : 'danger'}>{l.status}</Badge>
          </div>
        ))}
      </div>
    </>
  );
}
