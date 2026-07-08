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
  { id: 'results', label: 'Results' },
  { id: 'documents', label: 'Documents' },
];

export default function DegreeStudentDetail() {
  const { degreeStudentId } = useParams();
  const [profile, setProfile] = useState(null);
  const [tab, setTab] = useState('overview');
  const [semesterFilter, setSemesterFilter] = useState('');
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    api.get(`/admin/degrees/students/${degreeStudentId}/profile`)
      .then((res) => setProfile(res.data.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [degreeStudentId]);

  if (loading) return <p className="text-gray-500">Loading student profile...</p>;
  if (!profile?.degreeStudent) return <p className="text-red-600">Degree student not found.</p>;

  const ds = profile.degreeStudent;
  const s = ds.student;
  const batch = ds.batch;
  const degree = batch?.degree;
  const semesters = batch?.semesters || [];
  const filteredSemesterResults = semesterFilter
    ? profile.semesterResults?.filter((sr) => String(sr.semester.number) === semesterFilter)
    : profile.semesterResults;

  return (
    <DetailPageLayout
      breadcrumbs={[
        { label: 'Dashboard', to: '/admin' },
        { label: 'Degree', to: '/admin/degrees' },
        { label: degree?.name, to: `/admin/degrees/${degree?.id}` },
        { label: batch?.name, to: `/admin/degrees/batches/${batch?.id}` },
        { label: `${s.firstName} ${s.lastName}` },
      ]}
      title={`${s.firstName} ${s.lastName}`}
      subtitle={[s.rollNumber, degree?.name, batch?.name, `Semester ${ds.currentSemesterNumber}`].filter(Boolean).join(' · ')}
      status={ds.status}
      actions={<Link to={`/admin/degrees/batches/${batch?.id}`}><Button variant="secondary">Back to batch</Button></Link>}
      tabs={TABS}
      activeTab={tab}
      onTabChange={setTab}
    >
      {tab === 'overview' && (
        <div className="space-y-6">
          <StatGrid cols={4}>
            <StatCard label="Fee remaining" value={profile.feeSummary.remaining?.toLocaleString()} suffix=" PKR" variant={profile.feeSummary.remaining > 0 ? 'warning' : 'success'} />
            <StatCard label="Attendance" value={`${profile.attendanceSummary.percentage}%`} variant="info" />
            <StatCard label="Semesters" value={profile.semesterResults?.length || 0} />
            <StatCard label="Net Semester Fee" value={Number(ds.netSemesterFee).toLocaleString()} suffix=" PKR" />
          </StatGrid>

          <SectionCard title="Personal Information">
            <InfoGrid items={[
              { label: 'Roll Number', value: s.rollNumber },
              { label: 'CNIC / B-Form', value: s.cnic },
              { label: 'Date of Birth', value: s.dateOfBirth ? new Date(s.dateOfBirth).toLocaleDateString() : null },
              { label: 'Gender', value: s.gender },
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
              { label: 'Guardian Phone', value: s.guardianPhone },
            ]} />
          </SectionCard>

          <SectionCard title="Admission Information">
            <InfoGrid items={[
              { label: 'Degree', value: degree?.name },
              { label: 'Batch', value: batch?.name },
              { label: 'Current Semester', value: ds.currentSemesterNumber },
              { label: 'Admitted', value: ds.admittedAt ? new Date(ds.admittedAt).toLocaleDateString() : null },
              { label: 'Registration Fee', value: `${Number(ds.registrationFee).toLocaleString()} PKR` },
              { label: 'Semester Fee', value: `${Number(ds.semesterFee).toLocaleString()} PKR` },
              { label: 'Discount', value: `${Number(ds.discount).toLocaleString()} PKR` },
              { label: 'Scholarship', value: `${Number(ds.scholarship || 0).toLocaleString()} PKR` },
              { label: 'Installments', value: ds.installmentEnabled ? `${ds.installmentCount} installments` : 'No' },
            ]} />
          </SectionCard>
        </div>
      )}

      {tab === 'fees' && (
        <div className="space-y-6">
          <SectionCard title="Fee Summary">
            <StatGrid cols={3}>
              <StatCard label="Total" value={profile.feeSummary.total?.toLocaleString()} suffix=" PKR" />
              <StatCard label="Paid" value={profile.feeSummary.paid?.toLocaleString()} suffix=" PKR" variant="success" />
              <StatCard label="Remaining" value={profile.feeSummary.remaining?.toLocaleString()} suffix=" PKR" variant="warning" />
            </StatGrid>
          </SectionCard>

          {profile.installmentPlans?.length > 0 && (
            <SectionCard title="Installment Plans">
              {profile.installmentPlans.map((f) => (
                <div key={f.id} className="mb-4 rounded-lg border p-4">
                  <p className="font-medium">{f.feeStructure?.name || f.notes}</p>
                  <table className="mt-2 min-w-full text-sm">
                    <thead><tr className="text-left text-xs uppercase text-gray-500"><th className="py-1">#</th><th>Amount</th><th>Due</th><th>Status</th></tr></thead>
                    <tbody>
                      {f.installments?.map((inst) => (
                        <tr key={inst.id} className="border-t border-gray-100">
                          <td className="py-1">{inst.installmentNo}</td>
                          <td>{Number(inst.amount).toLocaleString()} PKR</td>
                          <td>{inst.dueDate ? new Date(inst.dueDate).toLocaleDateString() : '—'}</td>
                          <td><Badge variant={inst.status === 'PAID' ? 'success' : 'warning'}>{inst.status}</Badge></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))}
            </SectionCard>
          )}

          <SectionCard title="Payment History">
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead><tr className="border-b text-left text-xs uppercase text-gray-500"><th className="py-2">Fee</th><th>Amount</th><th>Due</th><th>Status</th><th>Receipt</th></tr></thead>
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
        </div>
      )}

      {tab === 'attendance' && (
        <SectionCard title="Attendance by Semester">
          <div className="mb-4 flex flex-wrap gap-2">
            <button type="button" onClick={() => setSemesterFilter('')}
              className={`rounded-lg px-3 py-1 text-sm ${!semesterFilter ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}>All</button>
            {semesters.map((sem) => (
              <button key={sem.id} type="button" onClick={() => setSemesterFilter(String(sem.number))}
                className={`rounded-lg px-3 py-1 text-sm ${semesterFilter === String(sem.number) ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}>
                {sem.name}
              </button>
            ))}
          </div>
          <StatGrid cols={2}>
            <StatCard label="Overall %" value={`${profile.attendanceSummary.percentage}%`} variant="info" />
            <StatCard label="Total records" value={profile.attendanceSummary.total} />
          </StatGrid>
          <div className="mt-4 max-h-96 overflow-y-auto">
            {Object.entries(profile.attendanceBySemester || {})
              .filter(([n]) => !semesterFilter || n === semesterFilter)
              .map(([n, data]) => (
                <div key={n} className="mb-4">
                  <h4 className="mb-2 font-medium">Semester {n} — {data.present}/{data.total} ({data.total ? Math.round((data.present / data.total) * 100) : 0}%)</h4>
                  {data.records?.slice(0, 30).map((a) => (
                    <div key={a.id} className="flex justify-between border-b border-gray-100 py-2 text-sm">
                      <span>{new Date(a.date).toLocaleDateString()} · {a.course?.name}</span>
                      <Badge variant={a.status === 'PRESENT' ? 'success' : a.status === 'ABSENT' ? 'danger' : 'default'}>{a.status}</Badge>
                    </div>
                  ))}
                </div>
              ))}
            {!Object.keys(profile.attendanceBySemester || {}).length && <EmptyState title="No attendance records" />}
          </div>
        </SectionCard>
      )}

      {tab === 'results' && (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => setSemesterFilter('')}
              className={`rounded-lg px-3 py-1 text-sm ${!semesterFilter ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}>All Semesters</button>
            {semesters.map((sem) => (
              <button key={sem.id} type="button" onClick={() => setSemesterFilter(String(sem.number))}
                className={`rounded-lg px-3 py-1 text-sm ${semesterFilter === String(sem.number) ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}>
                {sem.name}
              </button>
            ))}
          </div>
          {filteredSemesterResults?.length ? filteredSemesterResults.map((sr) => (
            <SectionCard key={sr.semester.id} title={`${sr.semester.name} — GPA: ${sr.gpa}`}>
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-xs uppercase text-gray-500">
                    <th className="py-2">Course</th><th>Total</th><th>%</th><th>Grade</th><th>GPA</th><th>Remarks</th>
                  </tr>
                </thead>
                <tbody>
                  {sr.results.map((r) => (
                    <tr key={r.id} className="border-b border-gray-100">
                      <td className="py-2">{r.course.name}</td>
                      <td>{r.totalMarks}/{r.maxMarks}</td>
                      <td>{r.percentage ?? '—'}%</td>
                      <td><Badge variant={r.isPassed ? 'success' : 'danger'}>{r.grade}</Badge></td>
                      <td>{r.gradePoints}</td>
                      <td className="text-xs text-gray-500">{r.remarks || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </SectionCard>
          )) : <EmptyState title="No results recorded" />}
        </div>
      )}

      {tab === 'documents' && (
        <SectionCard title="Documents">
          <DocumentManager personType="student" personId={s.id} mode="admin" />
        </SectionCard>
      )}
    </DetailPageLayout>
  );
}
