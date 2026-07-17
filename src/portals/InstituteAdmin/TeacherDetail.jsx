import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api from '../../services/api';
import DetailPageLayout, { StatGrid, StatCard, InfoGrid, SectionCard, EmptyState } from '../../components/layout/DetailPageLayout';
import Button from '../../components/common/Button';
import DocumentManager from '../../components/documents/DocumentManager';

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'assignments', label: 'Classes & Subjects' },
  { id: 'salary', label: 'Salary' },
  { id: 'leave', label: 'Leave' },
  { id: 'documents', label: 'Documents' },
  { id: 'timeline', label: 'Timeline' },
];

export default function TeacherDetail() {
  const { id } = useParams();
  const [profile, setProfile] = useState(null);
  const [tab, setTab] = useState('overview');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/admin/teachers/${id}/profile`)
      .then((res) => setProfile(res.data.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <p className="text-gray-500">Loading...</p>;
  if (!profile?.teacher) return <p className="text-red-600">Teacher not found.</p>;

  const t = profile.teacher;

  return (
    <DetailPageLayout
      breadcrumbs={[
        { label: 'Dashboard', to: '/admin' },
        { label: 'Teachers', to: '/admin/teachers' },
        { label: `${t.firstName} ${t.lastName}` },
      ]}
      title={`${t.firstName} ${t.lastName}`}
      subtitle={[t.employeeCode, t.designation, t.department?.name].filter(Boolean).join(' · ')}
      status={t.status}
      statusVariant="success"
      actions={<Link to="/admin/teachers"><Button variant="secondary">Back</Button></Link>}
      tabs={TABS}
      activeTab={tab}
      onTabChange={setTab}
    >
      {tab === 'overview' && (
        <div className="space-y-6">
          <StatGrid cols={3}>
            <StatCard label="Monthly salary" value={Number(t.salary || 0).toLocaleString()} suffix=" PKR" />
            <StatCard label="Assignments" value={t.assignments?.length || 0} variant="info" />
            <StatCard label="Individual courses" value={t.individualCourses?.length || 0} />
          </StatGrid>
          <SectionCard title="Personal & Employment">
            <InfoGrid items={[
              { label: 'Employee Code', value: t.employeeCode },
              { label: 'Email', value: t.user?.email },
              { label: 'Phone', value: t.phone },
              { label: 'Qualification', value: t.qualification },
              { label: 'Specialization', value: t.specialization },
              { label: 'Department', value: t.department?.name },
              { label: 'Designation', value: t.designation },
              { label: 'Employment Type', value: t.employmentType },
              { label: 'Experience', value: t.experienceYears != null ? `${t.experienceYears} years` : null },
              { label: 'Joining Date', value: t.joiningDate ? new Date(t.joiningDate).toLocaleDateString() : null },
              { label: 'Payment Method', value: t.paymentMethod },
              { label: 'Allowances', value: t.allowances != null ? `${Number(t.allowances).toLocaleString()} PKR` : null },
              { label: 'Deductions', value: t.deductions != null ? `${Number(t.deductions).toLocaleString()} PKR` : null },
            ]} />
          </SectionCard>
        </div>
      )}

      {tab === 'assignments' && (
        <SectionCard title="Assigned Classes & Subjects">
          {t.assignments?.length ? (
            <div className="grid gap-2 sm:grid-cols-2">
              {t.assignments.map((a) => (
                <div key={a.id} className="rounded-xl border border-gray-200 bg-gray-50/60 px-3 py-2.5 text-sm">
                  <span className="font-medium text-gray-800">{a.section?.batch?.name} — Section {a.section?.name}</span>
                  <span className="text-gray-500"> · {a.subject?.name}</span>
                </div>
              ))}
            </div>
          ) : <EmptyState title="No assignments" />}
          {t.individualCourses?.length > 0 && (
            <div className="mt-5 border-t border-gray-100 pt-4">
              <h4 className="mb-2 text-sm font-semibold text-gray-700">Individual Courses</h4>
              <div className="flex flex-wrap gap-2">
                {t.individualCourses.map((c) => (
                  <span key={c.id} className="rounded-full bg-primary-50 px-3 py-1 text-xs text-primary-800">{c.course?.name} ({c.course?.code})</span>
                ))}
              </div>
            </div>
          )}
        </SectionCard>
      )}

      {tab === 'salary' && (
        <SectionCard title="Salary History">
          {t.salaries?.length ? (
            <div className="overflow-x-auto rounded-lg border border-gray-100">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50">
                  <tr className="text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    <th className="px-3 py-2.5">Period</th><th className="px-3 py-2.5">Gross</th><th className="px-3 py-2.5">Net</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {t.salaries.map((sal) => (
                    <tr key={sal.id} className="transition hover:bg-gray-50/70">
                      <td className="px-3 py-2.5">{sal.month}/{sal.year}</td>
                      <td className="px-3 py-2.5">{Number(sal.amount).toLocaleString()} PKR</td>
                      <td className="px-3 py-2.5 font-medium">{Number(sal.netAmount).toLocaleString()} PKR</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : <EmptyState title="No salary records" />}
        </SectionCard>
      )}

      {tab === 'leave' && (
        <SectionCard title="Leave History">
          {t.leaveRequests?.length ? (
            <div className="space-y-1">
              {t.leaveRequests.map((l) => (
                <div key={l.id} className="flex items-center justify-between rounded-lg px-3 py-2 text-sm transition hover:bg-gray-50">
                  <span className="text-gray-700">{l.leaveType || 'Leave'}</span>
                  <span className="text-xs text-gray-400">{l.status} · {new Date(l.createdAt).toLocaleDateString()}</span>
                </div>
              ))}
            </div>
          ) : <EmptyState title="No leave requests" />}
        </SectionCard>
      )}

      {tab === 'documents' && (
        <SectionCard title="Documents">
          <DocumentManager personType="teacher" personId={t.id} mode="admin" />
        </SectionCard>
      )}

      {tab === 'timeline' && (
        <SectionCard title="Timeline">
          {profile.timeline?.length ? (
            <ul className="space-y-3 border-l-2 border-gray-100 pl-4">
              {profile.timeline.map((ev, i) => (
                <li key={i} className="relative text-sm">
                  <span className="absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full bg-primary-400" />
                  <span className="mr-2 text-gray-400">{new Date(ev.date).toLocaleDateString()}</span>
                  <span className="text-gray-700">{ev.text}</span>
                </li>
              ))}
            </ul>
          ) : <EmptyState title="No activity" />}
        </SectionCard>
      )}
    </DetailPageLayout>
  );
}