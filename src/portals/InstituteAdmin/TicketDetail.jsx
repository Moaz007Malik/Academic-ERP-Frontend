import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api from '../../services/api';
import PageTitle from '../../components/layout/PageTitle';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import { useAsyncSubmit } from '../../hooks/useAsyncSubmit';

const statusVariant = { OPEN: 'warning', IN_PROGRESS: 'info', RESOLVED: 'success', CLOSED: 'default' };

const roleLabel = { STUDENT: 'Student', TEACHER: 'Teacher', INSTITUTE_ADMIN: 'Admin' };

export default function TicketDetail() {
  const { id } = useParams();
  const [ticket, setTicket] = useState(null);
  const [reply, setReply] = useState('');
  const [escalateNote, setEscalateNote] = useState('');
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

  const resolveTicket = async () => {
    if (!window.confirm('Mark this ticket as resolved?')) return;
    await run(async () => {
      await api.patch(`/admin/tickets/${id}/status`, { status: 'RESOLVED' });
      load();
    });
  };

  const escalateTicket = async () => {
    if (!window.confirm('Forward this technical issue to Super Admin?')) return;
    await run(async () => {
      await api.post(`/admin/tickets/${id}/escalate`, { message: escalateNote });
      setEscalateNote('');
      load();
    });
  };

  if (!ticket) return <p className="text-sm text-gray-500">Loading ticket...</p>;

  const fromPortal = ['STUDENT', 'TEACHER'].includes(ticket.createdBy?.role);
  const canResolve = !ticket.escalatedToSuperAdmin && ticket.status !== 'CLOSED' && ticket.status !== 'RESOLVED';
  const canEscalate = fromPortal && !ticket.escalatedToSuperAdmin && ticket.status !== 'CLOSED' && ticket.status !== 'RESOLVED';

  const timeline = [
    { type: 'created', at: ticket.createdAt, message: ticket.description, author: ticket.createdBy },
    ...(ticket.replies || []).map((r) => ({ type: 'reply', at: r.createdAt, message: r.message, author: r.repliedBy })),
  ].sort((a, b) => new Date(a.at) - new Date(b.at));

  return (
    <>
      <PageTitle title={ticket.subject}>
        <Link to="/admin/tickets"><Button variant="secondary">Back</Button></Link>
      </PageTitle>

      <div className="mb-5 flex flex-wrap items-center gap-2">
        <Badge variant={statusVariant[ticket.status]}>{ticket.status.replace('_', ' ')}</Badge>
        <Badge variant="default">{ticket.priority}</Badge>
        <span className="rounded bg-gray-100 px-2 py-1 text-xs text-gray-600">{ticket.category}</span>
        {ticket.createdBy?.role && (
          <Badge variant="info">From {roleLabel[ticket.createdBy.role] || ticket.createdBy.role}</Badge>
        )}
        {ticket.escalatedToSuperAdmin && <Badge variant="warning">With Super Admin</Badge>}
      </div>

      {canResolve && (
        <div className="mb-4 flex flex-wrap gap-2">
          <Button variant="secondary" onClick={resolveTicket} disabled={submitting}>Resolve (Institute)</Button>
        </div>
      )}

      {canEscalate && (
        <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <p className="mb-2 text-sm text-amber-900">Technical / platform issue? Forward to Super Admin. Otherwise resolve it here.</p>
          <textarea className="mb-2 w-full rounded-lg border border-amber-200 bg-white px-3 py-2 text-sm transition focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400" rows={2} placeholder="Note for Super Admin (optional)"
            value={escalateNote} onChange={(e) => setEscalateNote(e.target.value)} />
          <Button variant="danger" onClick={escalateTicket} disabled={submitting}>Forward to Super Admin</Button>
        </div>
      )}

      <div className="mb-6 space-y-3">
        {timeline.map((item, i) => (
          <div key={i} className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
            <div className="mb-1.5 flex items-center justify-between text-xs text-gray-500">
              <span className="font-medium text-gray-700">{item.author?.firstName} {item.author?.lastName} {item.author?.role ? <span className="font-normal text-gray-400">({item.author.role})</span> : ''}</span>
              <span>{new Date(item.at).toLocaleString()}</span>
            </div>
            <p className="whitespace-pre-wrap text-sm text-gray-800">{item.message}</p>
          </div>
        ))}
      </div>

      {ticket.status !== 'CLOSED' && (
        <form onSubmit={sendReply} className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <label className="mb-1.5 block text-sm font-medium text-gray-700">Reply</label>
          <textarea className="mb-3 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm transition focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500" rows={3}
            value={reply} onChange={(e) => setReply(e.target.value)} required />
          <Button type="submit" disabled={submitting}>{submitting ? 'Sending...' : 'Send Reply'}</Button>
        </form>
      )}
    </>
  );
}