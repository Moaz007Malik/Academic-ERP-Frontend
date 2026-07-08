import { useEffect, useState } from 'react';
import api from '../../services/api';
import PageTitle from '../../components/layout/PageTitle';
import Badge from '../../components/common/Badge';

export default function StudentDashboard() {
  const [data, setData] = useState(null);

  useEffect(() => {
    api.get('/student/dashboard').then((res) => setData(res.data.data)).catch(console.error);
  }, []);

  if (!data) return <p className="text-gray-500">Loading...</p>;

  const { student, stats, recentResults } = data;

  return (
    <>
      <PageTitle title={`Welcome, ${student.firstName}`} subtitle={
        data.degreeEnrollment
          ? `${data.degreeEnrollment.batch?.degree?.name || ''} — ${data.degreeEnrollment.batch?.name || ''} · Semester ${data.degreeEnrollment.currentSemesterNumber}`
          : `${student.currentBatch?.name || ''} ${student.currentSection?.name ? `— Section ${student.currentSection.name}` : ''}`
      } />
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="Attendance" value={`${stats.attendancePct}%`} />
        <StatCard label="Pending Fees" value={stats.pendingFees} />
        <StatCard label="Recent Results" value={stats.recentResultsCount} />
      </div>
      <h3 className="mb-2 font-semibold">Recent Results</h3>
      {recentResults?.length === 0 && !data.recentDegreeResults?.length ? (
        <p className="text-sm text-gray-500">No published results yet</p>
      ) : (
        <div className="space-y-2">
          {recentResults?.map((r) => (
            <div key={r.id} className="flex items-center justify-between rounded-lg border bg-white p-3 text-sm">
              <span>{r.subject?.name} — {r.exam?.name}</span>
              <Badge variant={r.isPassed ? 'success' : 'danger'}>{r.grade} ({r.totalMarks}/{r.maxMarks})</Badge>
            </div>
          ))}
        </div>
      )}
      {data.recentDegreeResults?.length > 0 && (
        <>
          <h3 className="mb-2 mt-6 font-semibold">Degree Results</h3>
          <div className="space-y-2">
            {data.recentDegreeResults.map((r) => (
              <div key={r.id} className="flex items-center justify-between rounded-lg border bg-white p-3 text-sm">
                <span>{r.course?.name} — {r.semester?.name}</span>
                <Badge variant={r.isPassed ? 'success' : 'danger'}>{r.grade} ({r.totalMarks}/{r.maxMarks})</Badge>
              </div>
            ))}
          </div>
        </>
      )}
    </>
  );
}

function StatCard({ label, value }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <p className="text-sm text-gray-500">{label}</p>
      <p className="text-2xl font-bold text-primary-700">{value}</p>
    </div>
  );
}
