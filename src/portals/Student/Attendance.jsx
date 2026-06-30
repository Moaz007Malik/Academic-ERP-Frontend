import { useEffect, useState } from 'react';
import api from '../../services/api';
import PageTitle from '../../components/layout/PageTitle';
import Badge from '../../components/common/Badge';

export default function StudentAttendance() {
  const [data, setData] = useState(null);

  useEffect(() => {
    api.get('/student/attendance').then((res) => setData(res.data.data)).catch(console.error);
  }, []);

  if (!data) return <p className="text-gray-500">Loading...</p>;

  const { summary, records } = data;

  return (
    <>
      <PageTitle title="My Attendance" subtitle={`${summary.percentage}% overall`} />
      <div className="mb-6 grid gap-4 sm:grid-cols-4">
        <MiniStat label="Present" value={summary.present} />
        <MiniStat label="Absent" value={summary.absent} />
        <MiniStat label="Late" value={summary.late} />
        <MiniStat label="Total" value={summary.total} />
      </div>
      <table className="min-w-full rounded-xl border bg-white text-sm shadow-sm">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-2 text-left">Date</th>
            <th className="px-4 py-2 text-left">Subject</th>
            <th className="px-4 py-2 text-left">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {records.map((r) => (
            <tr key={r.id}>
              <td className="px-4 py-2">{new Date(r.date).toLocaleDateString()}</td>
              <td className="px-4 py-2">{r.subject?.name}</td>
              <td className="px-4 py-2">
                <Badge variant={r.status === 'PRESENT' ? 'success' : r.status === 'ABSENT' ? 'danger' : 'warning'}>{r.status}</Badge>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}

function MiniStat({ label, value }) {
  return (
    <div className="rounded-lg border bg-white p-3 text-center">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="text-xl font-bold">{value}</p>
    </div>
  );
}
