import { useEffect, useState } from 'react';
import api from '../../services/api';
import PageTitle from '../../components/layout/PageTitle';
import Badge from '../../components/common/Badge';
import Select from '../../components/common/Select';

export default function StudentAttendance() {
  const [data, setData] = useState(null);
  const [semesterFilter, setSemesterFilter] = useState('');

  const load = (semesterNumber) => {
    api.get('/student/attendance', { params: semesterNumber ? { semesterNumber } : {} })
      .then((res) => setData(res.data.data))
      .catch(console.error);
  };

  useEffect(() => { load(); }, []);

  if (!data) return <p className="text-gray-500">Loading...</p>;

  const { summary, records, bySemester } = data;
  const semesterOptions = Object.keys(bySemester || {}).sort((a, b) => Number(a) - Number(b));

  const displayRecords = semesterFilter && bySemester?.[semesterFilter]
    ? bySemester[semesterFilter].records
    : records;

  return (
    <>
      <PageTitle title="My Attendance" subtitle={`${summary.percentage}% overall`} />
      <div className="mb-4 flex flex-wrap items-end gap-3">
        <Select label="Filter by semester" value={semesterFilter} onChange={(e) => { setSemesterFilter(e.target.value); load(e.target.value || undefined); }}>
          <option value="">All semesters</option>
          {semesterOptions.map((n) => <option key={n} value={n}>Semester {n}</option>)}
        </Select>
      </div>
      <div className="mb-6 grid gap-4 sm:grid-cols-4">
        <MiniStat label="Present" value={summary.present} />
        <MiniStat label="Absent" value={summary.absent} />
        <MiniStat label="Late" value={summary.late} />
        <MiniStat label="Total" value={summary.total} />
      </div>

      {semesterOptions.length > 0 && (
        <div className="mb-6 grid gap-3 sm:grid-cols-3">
          {semesterOptions.map((n) => {
            const s = bySemester[n];
            const pct = s.total ? Math.round((s.present / s.total) * 100) : 0;
            return (
              <div key={n} className="rounded-lg border bg-white p-3 text-sm">
                <p className="font-medium">Semester {n}</p>
                <p className="text-gray-600">{s.present}/{s.total} ({pct}%)</p>
              </div>
            );
          })}
        </div>
      )}

      <table className="min-w-full rounded-xl border bg-white text-sm shadow-sm">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-2 text-left">Date</th>
            <th className="px-4 py-2 text-left">Subject / Course</th>
            <th className="px-4 py-2 text-left">Semester</th>
            <th className="px-4 py-2 text-left">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {displayRecords.map((r) => (
            <tr key={r.id}>
              <td className="px-4 py-2">{new Date(r.date).toLocaleDateString()}</td>
              <td className="px-4 py-2">{r.source === 'DEGREE' ? r.course?.name : r.subject?.name}</td>
              <td className="px-4 py-2">{r.course?.semester?.name || '—'}</td>
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
