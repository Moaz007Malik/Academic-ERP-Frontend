import { useEffect, useState } from 'react';
import api from '../../services/api';
import PageTitle from '../../components/layout/PageTitle';

export default function TeacherDashboard() {
  const [data, setData] = useState(null);

  useEffect(() => {
    api.get('/teacher/dashboard').then((res) => setData(res.data.data)).catch(console.error);
  }, []);

  if (!data) return <p className="text-gray-500">Loading...</p>;

  return (
    <>
      <PageTitle title={`Welcome, ${data.teacher.firstName}`} subtitle={data.teacher.employeeCode} />
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="Classes" value={data.stats.classesCount} />
        <StatCard label="Subjects" value={data.stats.subjectsCount} />
        <StatCard label="Students" value={data.stats.studentCount} />
      </div>
      <h3 className="mb-2 font-semibold">My Assignments</h3>
      <div className="space-y-2">
        {data.assignments?.map((a) => (
          <div key={a.id} className="rounded-lg border border-gray-200 bg-white p-3 text-sm">
            {a.section?.batch?.name} — Section {a.section?.name} · <strong>{a.subject?.name}</strong>
          </div>
        ))}
      </div>
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
