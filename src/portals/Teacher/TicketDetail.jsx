import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api from '../../services/api';
import PageTitle from '../../components/layout/PageTitle';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';

export default function TeacherTicketDetail() {
  const { id } = useParams();
  const [ticket, setTicket] = useState(null);
  const [reply, setReply] = useState('');

  const load = () => api.get(`/teacher/tickets/${id}`).then((res) => setTicket(res.data.data));

  useEffect(() => { load(); }, [id]);

  const send = async (e) => {
    e.preventDefault();
    await api.post(`/teacher/tickets/${id}/reply`, { message: reply });
    setReply('');
    load();
  };

  if (!ticket) return <p className="text-gray-500">Loading...</p>;

  return (
    <>
      <PageTitle title={ticket.subject}><Link to="/teacher/tickets"><Button variant="secondary">Back</Button></Link></PageTitle>
      <Badge className="mb-4">{ticket.status}</Badge>
      <p className="mb-4 text-sm text-gray-600">{ticket.description}</p>
      {(ticket.replies || []).map((r) => (
        <div key={r.id} className="mb-3 rounded-lg border bg-white p-3 text-sm">
          <p className="text-xs text-gray-500">{r.repliedBy?.firstName} · {new Date(r.createdAt).toLocaleString()}</p>
          <p>{r.message}</p>
        </div>
      ))}
      <form onSubmit={send} className="mt-4">
        <textarea className="mb-2 w-full rounded border px-3 py-2 text-sm" rows={2} value={reply} onChange={(e) => setReply(e.target.value)} />
        <Button type="submit">Reply</Button>
      </form>
    </>
  );
}
