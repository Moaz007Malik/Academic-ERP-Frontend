import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api from '../../services/api';
import PageTitle from '../../components/layout/PageTitle';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import { useAsyncSubmit } from '../../hooks/useAsyncSubmit';

const statusVariant = { OPEN: 'warning', IN_PROGRESS: 'info', RESOLVED: 'success', CLOSED: 'default' };

export default function TicketDetail() {
  const { id } = useParams();
  const [ticket, setTicket] = useState(null);
  const [reply, setReply] = useState('');
  const { submitting, run } = useAsyncSubmit();

  const load = () => {
    api.get(`/admin/tickets/${id}`).then((res) => setTicket(res.data.data)).catch(console.error);
  };

  useEffect(() => { load(); }, [id]);

  const sendReply = async (e) => {
    e.preventDefault();
    if (!reply.trim()) return;
    await run(async () => {
      await api.post(`/admin/tickets/${id}/reply`, { message: reply });
      setReply('');
      load();
    });
  };

  if (!ticket) return <p className="text-sm text-gray-500">Loading ticket...</p>;

  const timeline = [
    { type: 'created', at: ticket.createdAt, message: ticket.description, author: ticket.createdBy },
    ...(ticket.replies || []).map((r) => ({ type: 'reply', at: r.createdAt, message: r.message, author: r.repliedBy })),
  ].sort((a, b) => new Date(a.at) - new Date(b.at));

  return (
    <>
      <PageTitle title={ticket.subject}>
        <Link to="/admin/tickets"><Button variant="secondary">Back</Button></Link>
      </PageTitle>

      <div className="mb-4 flex flex-wrap gap-2">
        <Badge variant={statusVariant[ticket.status]}>{ticket.status}</Badge>
        <Badge variant="default">{ticket.priority}</Badge>
        <span className="text-sm text-gray-500">{ticket.category}</span>
      </div>

      <div className="mb-6 space-y-4">
        {timeline.map((item, i) => (
          <div key={i} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <div className="mb-1 flex items-center justify-between text-xs text-gray-500">
              <span>{item.author?.firstName} {item.author?.lastName} {item.author?.role ? `(${item.author.role})` : ''}</span>
              <span>{new Date(item.at).toLocaleString()}</span>
            </div>
            <p className="text-sm text-gray-800 whitespace-pre-wrap">{item.message}</p>
          </div>
        ))}
      </div>

      {ticket.status !== 'CLOSED' && (
        <form onSubmit={sendReply} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <label className="mb-1 block text-sm font-medium">Reply</label>
          <textarea className="mb-3 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" rows={3}
            value={reply} onChange={(e) => setReply(e.target.value)} required />
          <Button type="submit" disabled={submitting}>{submitting ? 'Sending...' : 'Send Reply'}</Button>
        </form>
      )}
    </>
  );
}
