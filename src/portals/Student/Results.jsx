import { useEffect, useState } from 'react';
import api from '../../services/api';
import PageTitle from '../../components/layout/PageTitle';
import Badge from '../../components/common/Badge';

export default function StudentResults() {
  const [data, setData] = useState(null);

  useEffect(() => {
    api.get('/student/results').then((res) => setData(res.data.data)).catch(console.error);
  }, []);

  if (!data) return <p className="text-gray-500">Loading...</p>;

  return (
    <>
      <PageTitle title="My Results" subtitle={`CGPA: ${data.cgpa?.cgpa || 0}`} />
      {data.byExam?.length === 0 ? (
        <p className="text-gray-500">No published results yet.</p>
      ) : (
        <div className="space-y-6">
          {data.byExam.map((group) => (
            <div key={group.exam.id} className="rounded-xl border border-gray-200 bg-white shadow-sm">
              <div className="border-b border-gray-100 px-4 py-3">
                <h3 className="font-semibold">{group.exam.name}</h3>
                <p className="text-xs text-gray-500">{group.exam.examType} · Total: {group.totalObtained}/{group.totalMax}</p>
              </div>
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left">Subject</th>
                    <th className="px-4 py-2 text-left">Theory</th>
                    <th className="px-4 py-2 text-left">Practical</th>
                    <th className="px-4 py-2 text-left">Internal</th>
                    <th className="px-4 py-2 text-left">Total</th>
                    <th className="px-4 py-2 text-left">Grade</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {group.subjects.map((r) => (
                    <tr key={r.id}>
                      <td className="px-4 py-2">{r.subject?.name}</td>
                      <td className="px-4 py-2">{r.theoryMarks}</td>
                      <td className="px-4 py-2">{r.practicalMarks}</td>
                      <td className="px-4 py-2">{r.internalMarks}</td>
                      <td className="px-4 py-2">{r.totalMarks}/{r.maxMarks}</td>
                      <td className="px-4 py-2"><Badge variant={r.isPassed ? 'success' : 'danger'}>{r.grade}</Badge></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
