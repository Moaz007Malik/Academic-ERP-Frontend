import { useEffect, useState } from 'react';
import api from '../../services/api';
import PageTitle from '../../components/layout/PageTitle';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';

const statusVariant = { PENDING: 'warning', PAID: 'success', CANCELLED: 'danger' };

export default function InvoicesList() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(null);

  const load = () => {
    setLoading(true);
    api.get('/sa/invoices')
      .then((res) => setInvoices(res.data.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const markPaid = async (id) => {
    const ref = prompt('Payment reference (optional):', `BANK-${Date.now()}`);
    setActing(id);
    try {
      await api.put(`/sa/invoices/${id}/mark-paid`, { paymentRef: ref });
      load();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed');
    } finally {
      setActing(null);
    }
  };

  return (
    <>
      <PageTitle title="Subscription Invoices" />
      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Invoice #</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Institute</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Plan</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Amount</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Status</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Due</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {loading ? (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-500">Loading...</td></tr>
            ) : invoices.length === 0 ? (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-500">No invoices</td></tr>
            ) : (
              invoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-mono">{inv.invoiceNumber}</td>
                  <td className="px-4 py-3 text-sm">{inv.institute?.name}</td>
                  <td className="px-4 py-3 text-sm">{inv.plan?.name}</td>
                  <td className="px-4 py-3 text-sm">PKR {Number(inv.amount).toLocaleString()}</td>
                  <td className="px-4 py-3"><Badge variant={statusVariant[inv.status]}>{inv.status}</Badge></td>
                  <td className="px-4 py-3 text-sm">{inv.dueDate ? new Date(inv.dueDate).toLocaleDateString() : '—'}</td>
                  <td className="px-4 py-3">
                    {inv.status === 'PENDING' && (
                      <Button variant="ghost" className="!px-2 !py-1 text-xs" disabled={acting === inv.id}
                        onClick={() => markPaid(inv.id)}>Mark Paid</Button>
                    )}
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
