import { useEffect, useMemo, useState } from 'react';
import api from '../../services/api';
import PageTitle from '../../components/layout/PageTitle';
import Badge from '../../components/common/Badge';
import { SectionCard, StatGrid, StatCard, EmptyState } from '../../components/layout/DetailPageLayout';

function gradeVariant(grade, isPassed) {
  if (isPassed === false) return 'danger';
  if (['A+', 'A'].includes(grade)) return 'success';
  if (['B+', 'B'].includes(grade)) return 'info';
  if (['C+', 'C', 'D'].includes(grade)) return 'warning';
  return 'default';
}

export default function StudentResults() {
  const [data, setData] = useState(null);

  useEffect(() => {
    api.get('/student/results').then((res) => setData(res.data.data)).catch(console.error);
  }, []);

  const summary = useMemo(() => {
    if (!data) return null;
    return {
      academicCgpa: data.cgpa?.cgpa,
      degreeCgpa: data.degreeCgpa?.cgpa,
      examCount: data.byExam?.length || 0,
      semesterCount: data.bySemester?.length || 0,
    };
  }, [data]);

  if (!data) return <p className="text-gray-500">Loading...</p>;

  const hasAcademic = data.byExam?.length > 0;
  const hasDegree = data.bySemester?.length > 0;

  return (
    <>
      <PageTitle title="My Results" subtitle="Published academic and degree results" />

      {(summary.academicCgpa || summary.degreeCgpa || summary.examCount || summary.semesterCount) && (
        <div className="mb-6">
          <StatGrid cols={4}>
            {summary.academicCgpa != null && <StatCard label="Academic CGPA" value={summary.academicCgpa} variant="info" />}
            {summary.degreeCgpa != null && <StatCard label="Degree CGPA" value={summary.degreeCgpa} variant="success" />}
            <StatCard label="Exams" value={summary.examCount} />
            <StatCard label="Semesters" value={summary.semesterCount} />
          </StatGrid>
        </div>
      )}

      {!hasAcademic && !hasDegree && (
        <EmptyState title="No published results yet" message="Results will appear here once your institute publishes them." />
      )}

      {hasAcademic && (
        <div className="mb-8 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Academic Results</h2>
          {data.byExam.map((group) => {
            const pct = group.totalMax
              ? Math.round((Number(group.totalObtained) / Number(group.totalMax)) * 1000) / 10
              : null;
            return (
              <SectionCard
                key={group.exam.id}
                title={group.exam.name}
                action={<Badge variant="info">{group.exam.examType}</Badge>}
              >
                <div className="mb-4 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-lg bg-gray-50 px-3 py-2 text-sm">
                    <p className="text-xs text-gray-500">Total Marks</p>
                    <p className="font-semibold">{group.totalObtained}/{group.totalMax}</p>
                  </div>
                  <div className="rounded-lg bg-gray-50 px-3 py-2 text-sm">
                    <p className="text-xs text-gray-500">Percentage</p>
                    <p className="font-semibold">{pct != null ? `${pct}%` : '—'}</p>
                  </div>
                  <div className="rounded-lg bg-gray-50 px-3 py-2 text-sm">
                    <p className="text-xs text-gray-500">Subjects</p>
                    <p className="font-semibold">{group.subjects?.length || 0}</p>
                  </div>
                </div>
                <ResultTable rows={group.subjects} type="academic" />
              </SectionCard>
            );
          })}
        </div>
      )}

      {hasDegree && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Degree Program — Semester Results</h2>
          {data.bySemester.map((group) => (
            <SectionCard
              key={group.semester.id}
              title={group.semester.name}
              action={<Badge variant="success">GPA {group.gpa}</Badge>}
            >
              <p className="mb-3 text-sm text-gray-500">{group.degree?.name} · {group.batch?.name}</p>
              <ResultTable rows={group.subjects} type="degree" />
            </SectionCard>
          ))}
        </div>
      )}
    </>
  );
}

function ResultTable({ rows, type }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-gray-100">
      <table className="min-w-full text-sm">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">{type === 'degree' ? 'Course' : 'Subject'}</th>
            <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Theory</th>
            <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Practical</th>
            <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Internal</th>
            <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Total</th>
            <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">%</th>
            <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Grade</th>
            <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Remarks</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {rows.map((r) => {
            const pct = r.percentage ?? (r.maxMarks ? Math.round((Number(r.totalMarks) / Number(r.maxMarks)) * 10000) / 100 : null);
            return (
              <tr key={r.id} className="hover:bg-gray-50/60">
                <td className="px-4 py-2.5 font-medium">{type === 'degree' ? r.course?.name : r.subject?.name}</td>
                <td className="px-4 py-2.5">{r.theoryMarks ?? '—'}</td>
                <td className="px-4 py-2.5">{r.practicalMarks ?? '—'}</td>
                <td className="px-4 py-2.5">{r.internalMarks ?? '—'}</td>
                <td className="px-4 py-2.5 font-medium">{r.totalMarks}/{r.maxMarks}</td>
                <td className="px-4 py-2.5">{pct != null ? `${pct}%` : '—'}</td>
                <td className="px-4 py-2.5"><Badge variant={gradeVariant(r.grade, r.isPassed)}>{r.grade}</Badge></td>
                <td className="px-4 py-2.5 text-xs text-gray-500">{r.remarks || '—'}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
