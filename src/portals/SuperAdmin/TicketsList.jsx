import { useEffect, useState } from 'react';
import api from '../../services/api';
import PageTitle from '../../components/layout/PageTitle';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';

const statusVariant = {
  OPEN: 'warning',
  IN_PROGRESS: 'info',
  RESOLVED: 'success',
  CLOSED: 'default',
};

const priorityVariant = {
  LOW: 'default',
  MEDIUM: 'info',
  HIGH: 'warning',
  URGENT: 'danger',
};

export default function TicketsList() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(null);

  const load = () => {
    setLoading(true);
    api.get('/sa/tickets')
      .then((res) => setTickets(res.data.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const closeTicket = async (id) => {
    setActing(id);
    try {
      await api.put(`/sa/tickets/${id}/close`);
      load();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed');
    } finally {
      setActing(null);
    }
  };

  return (
    <>
      <PageTitle title="Support Tickets" />
      <div className="space-y-4">
        {loading ? (
          <p className="text-gray-500">Loading tickets...</p>
        ) : tickets.length === 0 ? (
          <p className="text-gray-500">No support tickets.</p>
        ) : (
          tickets.map((ticket) => (
            <div key={ticket.id} className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="font-semibold text-gray-900">{ticket.subject}</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    {ticket.institute?.name} ({ticket.institute?.instituteCode})
                    {' · '}
                    {ticket.createdBy?.firstName} {ticket.createdBy?.lastName}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Badge variant={statusVariant[ticket.status]}>{ticket.status}</Badge>
                  <Badge variant={priorityVariant[ticket.priority]}>{ticket.priority}</Badge>
                </div>
              </div>
              <p className="mt-3 text-sm text-gray-700">{ticket.description}</p>
              <div className="mt-3 flex items-center justify-between">
                <span className="text-xs text-gray-400">
                  {ticket.category} · {new Date(ticket.createdAt).toLocaleString()}
                </span>
                {ticket.status === 'OPEN' && (
                  <Button variant="ghost" className="!px-2 !py-1 text-xs" disabled={acting === ticket.id}
                    onClick={() => closeTicket(ticket.id)}>Resolve</Button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </>
  );
}
