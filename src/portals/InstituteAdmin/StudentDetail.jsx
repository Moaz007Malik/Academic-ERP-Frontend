import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api from '../../services/api';
import DetailPageLayout, { StatGrid, StatCard, InfoGrid, SectionCard, EmptyState } from '../../components/layout/DetailPageLayout';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import DocumentManager from '../../components/documents/DocumentManager';

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'fees', label: 'Fees' },
  { id: 'attendance', label: 'Attendance' },
  { id: 'exams', label: 'Exams' },
  { id: 'documents', label: 'Documents' },
  { id: 'timeline', label: 'Timeline' },
];

export default function StudentDetail() {
  const { id } = useParams();
  const [profile, setProfile] = useState(null);
  const [tab, setTab] = useState('overview');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.get(`/admin/students/${id}/profile`)
      .then((res) => setProfile(res.data.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <p className="text-gray-500">Loading student profile...</p>;
  if (!profile?.student) return <p className="text-red-600">Student not found.</p>;

  const s = profile.student;
  const batch = s.currentBatch;
  const section = s.currentSection;

  return (
    <DetailPageLayout
      breadcrumbs={[
        { label: 'Dashboard', to: '/admin' },
        { label: 'Students', to: '/admin/students' },
        { label: `${s.firstName} ${s.lastName}` },
      ]}
      title={`${s.firstName} ${s.lastName}`}
      subtitle={[s.rollNumber, batch?.name, section?.name && `Section ${section.name}`].filter(Boolean).join(' · ')}
      status={s.status}
      statusVariant="success"
      actions={<Link to="/admin/students"><Button variant="secondary">Back to list</Button></Link>}
      tabs={TABS}
      activeTab={tab}
      onTabChange={setTab}
    >
      {tab === 'overview' && (
        <div className="space-y-6">
          <StatGrid cols={4}>
            <StatCard label="Fee remaining" value={profile.feeSummary.remaining?.toLocaleString()} suffix=" PKR" variant={profile.feeSummary.remaining > 0 ? 'warning' : 'success'} />
            <StatCard label="Attendance" value={`${profile.attendanceSummary.percentage}%`} variant="info" />
            <StatCard label="Exams" value={profile.examSummary?.length || 0} />
            <StatCard label="Course enrollments" value={s.courseEnrollments?.length || 0} />
          </StatGrid>

          <SectionCard title="Personal Information">
            <InfoGrid items={[
              { label: 'Roll Number', value: s.rollNumber },
              { label: 'Registration #', value: s.registrationNumber },
              { label: 'Admission #', value: s.admissionNumber },
              { label: 'CNIC / B-Form', value: s.cnic },
              { label: 'Date of Birth', value: s.dateOfBirth ? new Date(s.dateOfBirth).toLocaleDateString() : null },
              { label: 'Gender', value: s.gender },
              { label: 'Blood Group', value: s.bloodGroup },
              { label: 'Phone', value: s.phone },
              { label: 'Email', value: s.user?.email },
              { label: 'Address', value: s.address },
            ]} />
          </SectionCard>

          <SectionCard title="Guardian Information">
            <InfoGrid items={[
              { label: 'Father', value: s.fatherName },
              { label: 'Mother', value: s.motherName },
              { label: 'Guardian', value: s.guardianName },
              { label: 'Relation', value: s.guardianRelation },
              { label: 'Guardian Phone', value: s.guardianPhone },
              { label: 'Guardian Email', value: s.guardianEmail },
            ]} />
          </SectionCard>

          <SectionCard title="Academic Information">
            <InfoGrid items={[
              { label: 'Session', value: batch?.session?.name },
              { label: 'Class / Batch', value: batch?.name },
              { label: 'Section', value: section?.name },
              { label: 'Admission Date', value: s.enrollmentDate ? new Date(s.enrollmentDate).toLocaleDateString() : null },
            ]} />
            {s.promotions?.length > 0 && (
              <ul className="mt-4 space-y-2 text-sm">
                {s.promotions.map((p) => (
                  <li key={p.id} className="rounded-lg bg-gray-50 px-3 py-2">
                    Promoted {p.sessionName ? `(${p.sessionName})` : ''} — {new Date(p.promotedAt).toLocaleDateString()}
                  </li>
                ))}
              </ul>
            )}
          </SectionCard>
        </div>
      )}

      {tab === 'fees' && (
        <SectionCard title="Fee Summary">
          <StatGrid cols={3}>
            <StatCard label="Total" value={profile.feeSummary.total?.toLocaleString()} suffix=" PKR" />
            <StatCard label="Paid" value={profile.feeSummary.paid?.toLocaleString()} suffix=" PKR" variant="success" />
            <StatCard label="Remaining" value={profile.feeSummary.remaining?.toLocaleString()} suffix=" PKR" variant="warning" />
          </StatGrid>
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead><tr className="border-b text-left text-xs uppercase text-gray-500"><th className="py-2">Structure</th><th>Amount</th><th>Due</th><th>Status</th><th>Receipt</th></tr></thead>
              <tbody>
                {profile.fees?.map((f) => (
                  <tr key={f.id} className="border-b border-gray-100">
                    <td className="py-2">{f.feeStructure?.name || '—'}</td>
                    <td>{Number(f.amount).toLocaleString()} PKR</td>
                    <td>{f.dueDate ? new Date(f.dueDate).toLocaleDateString() : '—'}</td>
                    <td><Badge>{f.status}</Badge></td>
                    <td className="font-mono text-xs">{f.receiptNumber || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!profile.fees?.length && <EmptyState title="No fee records" />}
          </div>
        </SectionCard>
      )}

      {tab === 'attendance' && (
        <SectionCard title="Attendance">
          <StatGrid cols={4}>
            <StatCard label="Present" value={profile.attendanceSummary.PRESENT} variant="success" />
            <StatCard label="Absent" value={profile.attendanceSummary.ABSENT} variant="danger" />
            <StatCard label="Leave" value={profile.attendanceSummary.LEAVE} />
            <StatCard label="Percentage" value={`${profile.attendanceSummary.percentage}%`} variant="info" />
          </StatGrid>
          <div className="mt-4 max-h-80 overflow-y-auto">
            {profile.attendanceHistory?.slice(0, 50).map((a) => (
              <div key={a.id} className="flex justify-between border-b border-gray-100 py-2 text-sm">
                <span>{new Date(a.date).toLocaleDateString()} · {a.subject?.name || '—'}</span>
                <Badge variant={a.status === 'PRESENT' ? 'success' : a.status === 'ABSENT' ? 'danger' : 'default'}>{a.status}</Badge>
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      {tab === 'exams' && (
        <div className="space-y-4">
          {profile.examSummary?.length ? profile.examSummary.map((ex) => (
            <SectionCard key={ex.examId} title={ex.examName || 'Exam'}>
              <p className="mb-2 text-sm text-gray-600">Total: {ex.obtainedMarks} / {ex.totalMarks}</p>
              <div className="grid gap-2 sm:grid-cols-2">
                {ex.subjects.map((sub, i) => (
                  <div key={i} className="rounded-lg bg-gray-50 px-3 py-2 text-sm">
                    {sub.subject}: {sub.marks} {sub.grade && `(${sub.grade})`}
                  </div>
                ))}
              </div>
            </SectionCard>
          )) : <EmptyState title="No exam results" />}
        </div>
      )}

      {tab === 'documents' && (
        <SectionCard title="Documents">
          <DocumentManager personType="student" personId={s.id} mode="admin" />
        </SectionCard>
      )}

      {tab === 'timeline' && (
        <SectionCard title="Activity Timeline">
          {profile.timeline?.length ? (
            <ul className="space-y-3">
              {profile.timeline.map((ev, i) => (
                <li key={i} className="flex gap-3 text-sm">
                  <span className="shrink-0 text-gray-400">{new Date(ev.date).toLocaleDateString()}</span>
                  <span>{ev.text}</span>
                </li>
              ))}
            </ul>
          ) : <EmptyState title="No activity yet" />}
        </SectionCard>
      )}
    </DetailPageLayout>
  );
}
