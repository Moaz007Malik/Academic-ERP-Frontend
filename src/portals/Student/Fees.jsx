import { useEffect, useState } from 'react';
import api from '../../services/api';
import PageTitle from '../../components/layout/PageTitle';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Select from '../../components/common/Select';

export default function StudentFees() {
  const [data, setData] = useState({ fees: [], pending: [], paid: [] });
  const [requests, setRequests] = useState([]);
  const [tab, setTab] = useState('pending');
  const [form, setForm] = useState({ requestType: 'INSTALLMENT', reason: '' });

  const load = () => {
    api.get('/student/fees').then((res) => setData(res.data.data));
    api.get('/student/fees/requests').then((res) => setRequests(res.data.data || []));
  };

  useEffect(() => { load(); }, []);

  const submitRequest = async (e) => {
    e.preventDefault();
    await api.post('/student/fees/requests', form);
    setForm({ requestType: 'INSTALLMENT', reason: '' });
    load();
  };

  const list = tab === 'pending' ? data.pending : tab === 'history' ? data.paid : data.fees;

  return (
    <>
      <PageTitle title="Fee Details" subtitle="Pending fees, history, and installment requests" />

      <div className="mb-4 flex gap-2 border-b">
        {['pending', 'history', 'all', 'requests'].map((t) => (
          <button key={t} type="button" onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm capitalize ${tab === t ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500'}`}>
            {t === 'history' ? 'Fee History' : t}
          </button>
        ))}
      </div>

      {tab === 'requests' ? (
        <div className="grid gap-6 lg:grid-cols-2">
          <form onSubmit={submitRequest} className="space-y-3 rounded-xl border bg-white p-5">
            <h3 className="font-medium">Submit Fee Request</h3>
            <Select label="Request Type" value={form.requestType} onChange={(e) => setForm({ ...form, requestType: e.target.value })}>
              <option value="INSTALLMENT">Request Installments</option>
              <option value="DUE_DATE_EXTENSION">Extend Due Date</option>
              <option value="PARTIAL_PAYMENT">Partial Payment</option>
              <option value="CONCESSION">Fee Concession</option>
            </Select>
            <Select label="Related Fee (optional)" value={form.feeId || ''} onChange={(e) => setForm({ ...form, feeId: e.target.value })}>
              <option value="">General request</option>
              {data.pending?.map((f) => <option key={f.id} value={f.id}>{f.feeStructure?.name} — Rs.{f.amount}</option>)}
            </Select>
            <textarea className="w-full rounded border px-3 py-2 text-sm" rows={3} placeholder="Explain your request..."
              value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} required />
            <Button type="submit">Submit Request</Button>
          </form>
          <div className="space-y-2">
            {requests.map((r) => (
              <div key={r.id} className="rounded-lg border bg-white p-3 text-sm">
                <div className="flex justify-between"><span>{r.requestType}</span><Badge>{r.status}</Badge></div>
                <p className="text-gray-600">{r.reason}</p>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <table className="min-w-full rounded-xl border bg-white text-sm shadow-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left">Fee Type</th>
              <th className="px-4 py-3 text-left">Amount</th>
              <th className="px-4 py-3 text-left">Due Date</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-left">Installments</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {list?.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-500">No records</td></tr>
            ) : list?.map((f) => (
              <tr key={f.id}>
                <td className="px-4 py-3">{f.feeStructure?.name}{f.installmentNo ? ` (#${f.installmentNo})` : ''}</td>
                <td className="px-4 py-3">Rs. {Number(f.amount).toLocaleString()}</td>
                <td className="px-4 py-3">{f.dueDate ? new Date(f.dueDate).toLocaleDateString() : '—'}</td>
                <td className="px-4 py-3"><Badge variant={f.status === 'PAID' ? 'success' : 'warning'}>{f.status}</Badge></td>
                <td className="px-4 py-3 text-xs">{f.installments?.length ? `${f.installments.length} installments` : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  );
}
