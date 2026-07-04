import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api from '../../services/api';
import DetailPageLayout, { StatGrid, StatCard, SectionCard, EmptyState } from '../../components/layout/DetailPageLayout';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';

export default function ExamDetail() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/admin/exams/${id}/analytics`)
      .then((res) => setData(res.data.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <p className="text-gray-500">Loading exam analytics...</p>;
  if (!data?.exam) return <p className="text-red-600">Exam not found</p>;

  const { exam, studentResults, stats } = data;

  return (
    <DetailPageLayout
      breadcrumbs={[
        { label: 'Dashboard', to: '/admin' },
        { label: 'Exams', to: '/admin/exams' },
        { label: exam.name },
      ]}
      title={exam.name}
      subtitle={[exam.section?.batch?.name, exam.section?.name && `Section ${exam.section.name}`, exam.semester?.name].filter(Boolean).join(' · ')}
      status={exam.isPublished ? 'Published' : 'Draft'}
      statusVariant={exam.isPublished ? 'success' : 'warning'}
      actions={<Link to="/admin/exams"><Button variant="secondary">Back</Button></Link>}
    >
      <StatGrid cols={4}>
        <StatCard label="Students" value={stats.totalStudents} />
        <StatCard label="Passed" value={stats.passed} variant="success" />
        <StatCard label="Failed" value={stats.failed} variant="danger" />
        <StatCard label="Class Average" value={stats.average} suffix=" marks" variant="info" />
      </StatGrid>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="Highest" value={stats.highest} />
        <StatCard label="Lowest" value={stats.lowest} />
        <StatCard label="Pass %" value={exam.passPercentage} suffix="%" />
      </div>

      <SectionCard title="Student-wise Results">
        {studentResults?.length ? (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs uppercase text-gray-500">
                  <th className="py-2">Rank</th>
                  <th>Student</th>
                  <th>Total</th>
                  <th>%</th>
                  <th>Result</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {studentResults.map((sr) => (
                  <tr key={sr.student.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-2 font-mono">#{sr.rank}</td>
                    <td>{sr.student.firstName} {sr.student.lastName}</td>
                    <td>{sr.totalObtained} / {sr.totalMax}</td>
                    <td>{sr.percentage}%</td>
                    <td>
                      <Badge variant={sr.percentage >= (exam.passPercentage || 33) ? 'success' : 'danger'}>
                        {sr.percentage >= (exam.passPercentage || 33) ? 'Pass' : 'Fail'}
                      </Badge>
                    </td>
                    <td>
                      <Link to={`/admin/students/${sr.student.id}`} className="text-xs text-primary-600">Profile</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState title="No results entered" message="Enter marks from the Results page first." />
        )}
      </SectionCard>
    </DetailPageLayout>
  );
}
