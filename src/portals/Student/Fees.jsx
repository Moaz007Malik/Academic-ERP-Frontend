import { useEffect, useState } from 'react';
import api from '../../services/api';
import PageTitle from '../../components/layout/PageTitle';
import Badge from '../../components/common/Badge';

export default function StudentFees() {
  const [fees, setFees] = useState([]);

  useEffect(() => {
    api.get('/student/fees').then((res) => setFees(res.data.data || [])).catch(console.error);
  }, []);

  return (
    <>
      <PageTitle title="My Fees" />
      <table className="min-w-full rounded-xl border border-gray-200 bg-white text-sm shadow-sm">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-left">Fee Type</th>
            <th className="px-4 py-3 text-left">Amount</th>
            <th className="px-4 py-3 text-left">Due Date</th>
            <th className="px-4 py-3 text-left">Status</th>
            <th className="px-4 py-3 text-left">Receipt</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {fees.length === 0 ? (
            <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-500">No fee records</td></tr>
          ) : fees.map((f) => (
            <tr key={f.id}>
              <td className="px-4 py-3">{f.feeStructure?.name}</td>
              <td className="px-4 py-3">Rs. {Number(f.amount).toLocaleString()}</td>
              <td className="px-4 py-3">{f.dueDate ? new Date(f.dueDate).toLocaleDateString() : '—'}</td>
              <td className="px-4 py-3"><Badge variant={f.status === 'PAID' ? 'success' : 'warning'}>{f.status}</Badge></td>
              <td className="px-4 py-3 font-mono text-xs">{f.receiptNumber || '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
