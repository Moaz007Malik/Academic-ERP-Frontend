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

  const hasAcademic = data.byExam?.length > 0;
  const hasDegree = data.bySemester?.length > 0;

  return (
    <>
      <PageTitle title="My Results" subtitle={[
        data.cgpa?.cgpa ? `Academic CGPA: ${data.cgpa.cgpa}` : null,
        data.degreeCgpa?.cgpa ? `Degree CGPA: ${data.degreeCgpa.cgpa}` : null,
      ].filter(Boolean).join(' · ') || 'Academic record'} />

      {!hasAcademic && !hasDegree && <p className="text-gray-500">No published results yet.</p>}

      {hasAcademic && (
        <div className="mb-8 space-y-6">
          <h2 className="text-lg font-semibold">Academic Results</h2>
          {data.byExam.map((group) => (
            <div key={group.exam.id} className="rounded-xl border border-gray-200 bg-white shadow-sm">
              <div className="border-b border-gray-100 px-4 py-3">
                <h3 className="font-semibold">{group.exam.name}</h3>
                <p className="text-xs text-gray-500">
                  {group.exam.examType} · Total: {group.totalObtained}/{group.totalMax}
                </p>
              </div>
              <ResultTable rows={group.subjects} type="academic" />
            </div>
          ))}
        </div>
      )}

      {hasDegree && (
        <div className="space-y-6">
          <h2 className="text-lg font-semibold">Degree Program — Semester-wise Results</h2>
          {data.bySemester.map((group) => (
            <div key={group.semester.id} className="rounded-xl border border-gray-200 bg-white shadow-sm">
              <div className="border-b border-gray-100 px-4 py-3">
                <h3 className="font-semibold">{group.semester.name}</h3>
                <p className="text-xs text-gray-500">
                  {group.degree?.name} · {group.batch?.name} · GPA: {group.gpa}
                </p>
              </div>
              <ResultTable rows={group.subjects} type="degree" />
            </div>
          ))}
        </div>
      )}
    </>
  );
}

function ResultTable({ rows, type }) {
  return (
    <table className="min-w-full text-sm">
      <thead className="bg-gray-50">
        <tr>
          <th className="px-4 py-2 text-left">{type === 'degree' ? 'Course' : 'Subject'}</th>
          <th className="px-4 py-2 text-left">Theory</th>
          <th className="px-4 py-2 text-left">Practical</th>
          <th className="px-4 py-2 text-left">Internal</th>
          <th className="px-4 py-2 text-left">Total</th>
          <th className="px-4 py-2 text-left">%</th>
          <th className="px-4 py-2 text-left">Grade</th>
          <th className="px-4 py-2 text-left">Remarks</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-50">
        {rows.map((r) => (
          <tr key={r.id}>
            <td className="px-4 py-2">{type === 'degree' ? r.course?.name : r.subject?.name}</td>
            <td className="px-4 py-2">{r.theoryMarks ?? '—'}</td>
            <td className="px-4 py-2">{r.practicalMarks ?? '—'}</td>
            <td className="px-4 py-2">{r.internalMarks ?? '—'}</td>
            <td className="px-4 py-2">{r.totalMarks}/{r.maxMarks}</td>
            <td className="px-4 py-2">{r.percentage ?? (r.maxMarks ? Math.round((Number(r.totalMarks) / Number(r.maxMarks)) * 10000) / 100 : '—')}%</td>
            <td className="px-4 py-2"><Badge variant={r.isPassed ? 'success' : 'danger'}>{r.grade}</Badge></td>
            <td className="px-4 py-2 text-xs text-gray-500">{r.remarks || '—'}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
