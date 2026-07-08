import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api from '../../services/api';
import DetailPageLayout, { SectionCard, StatGrid, StatCard, EmptyState } from '../../components/layout/DetailPageLayout';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Modal from '../../components/common/Modal';
import Badge from '../../components/common/Badge';
import Select from '../../components/common/Select';
import CredentialsRevealModal from '../../components/common/CredentialsRevealModal';
import { confirmDelete } from '../../components/common/RowActions';

export default function DegreeBatchDetail() {
  const { batchId } = useParams();
  const [batch, setBatch] = useState(null);
  const [stats, setStats] = useState(null);
  const [teachers, setTeachers] = useState([]);
  const [tab, setTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [admitOpen, setAdmitOpen] = useState(false);
  const [courseOpen, setCourseOpen] = useState(false);
  const [feeEditOpen, setFeeEditOpen] = useState(false);
  const [selectedSemester, setSelectedSemester] = useState(null);
  const [editingSemester, setEditingSemester] = useState(null);
  const [admitForm, setAdmitForm] = useState({ mode: 'new', installmentEnabled: false, installmentCount: 1 });
  const [courseForm, setCourseForm] = useState({ creditHours: 3 });
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().slice(0, 10));
  const [attendanceCourse, setAttendanceCourse] = useState('');
  const [attendanceSemester, setAttendanceSemester] = useState('');
  const [attendanceRows, setAttendanceRows] = useState([]);
  const [resultsSemester, setResultsSemester] = useState('');
  const [resultsCourse, setResultsCourse] = useState('');
  const [marks, setMarks] = useState({});
  const [portalCreds, setPortalCreds] = useState(null);
  const [batchFeeForm, setBatchFeeForm] = useState({});

  const load = () => {
    setLoading(true);
    Promise.all([
      api.get(`/admin/degrees/batches/${batchId}`),
      api.get(`/admin/degrees/batches/${batchId}/dashboard`),
      api.get('/admin/teachers?limit=200'),
    ]).then(([bRes, dRes, tRes]) => {
      const b = bRes.data.data;
      setBatch(b);
      setStats(dRes.data.data?.stats);
      setTeachers(tRes.data.data || []);
      if (!selectedSemester && b?.semesters?.length) {
        const cur = b.semesters.find((s) => s.number === b.currentSemester);
        setSelectedSemester(cur?.id || b.semesters[0].id);
        setAttendanceSemester(String(cur?.number || b.semesters[0].number));
        setResultsSemester(cur?.id || b.semesters[0].id);
      }
      setBatchFeeForm({ defaultSemesterFee: b?.defaultSemesterFee ?? 0, registrationFee: b?.registrationFee ?? 0 });
    }).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [batchId]);

  const currentSemFee = batch?.semesters?.find((s) => s.number === batch.currentSemester);
  const previewFee = Math.max(0,
    Number(currentSemFee?.effectiveFee ?? batch?.defaultSemesterFee ?? 0)
    - Number(admitForm.discount || 0)
    - Number(admitForm.scholarship || 0),
  );

  const admit = async (e) => {
    e.preventDefault();
    const body = admitForm.mode === 'existing'
      ? {
        studentId: admitForm.studentId,
        discount: admitForm.discount || 0,
        scholarship: admitForm.scholarship || 0,
        installmentEnabled: admitForm.installmentEnabled,
        installmentCount: admitForm.installmentEnabled ? admitForm.installmentCount : null,
      }
      : {
        newStudent: admitForm.newStudent,
        discount: admitForm.discount || 0,
        scholarship: admitForm.scholarship || 0,
        installmentEnabled: admitForm.installmentEnabled,
        installmentCount: admitForm.installmentEnabled ? admitForm.installmentCount : null,
      };
    const res = await api.post(`/admin/degrees/batches/${batchId}/students`, body);
    if (res.data.data?.portalCredentials) setPortalCreds(res.data.data.portalCredentials);
    setAdmitOpen(false);
    setAdmitForm({ mode: 'new', installmentEnabled: false, installmentCount: 1 });
    load();
  };

  const saveBatchFees = async (e) => {
    e.preventDefault();
    await api.put(`/admin/degrees/batches/${batchId}`, batchFeeForm);
    setFeeEditOpen(false);
    load();
  };

  const saveSemesterFee = async (e) => {
    e.preventDefault();
    await api.put(`/admin/degrees/semesters/${editingSemester.id}`, {
      semesterFee: editingSemester.useDefault ? null : editingSemester.semesterFee,
      useDefaultFee: editingSemester.useDefault,
    });
    setEditingSemester(null);
    load();
  };

  const addCourse = async (e) => {
    e.preventDefault();
    await api.post(`/admin/degrees/semesters/${selectedSemester}/courses`, courseForm);
    setCourseOpen(false);
    setCourseForm({ creditHours: 3 });
    load();
  };

  const promote = async () => {
    if (!window.confirm('Promote entire batch to next semester? Fees will be auto-assigned.')) return;
    await api.post(`/admin/degrees/batches/${batchId}/promote`);
    load();
  };

  const deleteBatch = async () => {
    if (!confirmDelete('Delete this batch and ALL related students, fees, attendance, results?')) return;
    await api.delete(`/admin/degrees/batches/${batchId}`);
    window.location.href = `/admin/degrees/${batch.degreeId}`;
  };

  const attendanceSem = batch?.semesters?.find((s) => String(s.number) === attendanceSemester);
  const resultsSem = batch?.semesters?.find((s) => s.id === resultsSemester);
  const attendanceCourses = attendanceSem?.courses || [];
  const resultsCourses = resultsSem?.courses || [];

  const loadAttendance = async () => {
    if (!attendanceCourse || !attendanceSem) return;
    const enrolled = batch.students?.filter((s) => s.status === 'ACTIVE' && s.currentSemesterNumber >= attendanceSem.number) || [];
    const res = await api.get(`/admin/degrees/courses/${attendanceCourse}/attendance`, { params: { date: attendanceDate } });
    const saved = new Map((res.data.data?.records || res.data.data || []).map((r) => [r.studentId, r.status]));
    setAttendanceRows(enrolled.map((ds) => ({
      studentId: ds.student.id,
      name: `${ds.student.firstName} ${ds.student.lastName}`,
      status: saved.get(ds.student.id) || 'PRESENT',
    })));
  };

  const saveAttendance = async () => {
    await api.post(`/admin/degrees/courses/${attendanceCourse}/attendance/mark`, {
      date: attendanceDate,
      records: attendanceRows.map((r) => ({ studentId: r.studentId, status: r.status })),
    });
    alert('Attendance saved');
  };

  const loadResultsMarks = async () => {
    if (!resultsCourse || !resultsSem) return;
    const students = batch.students?.filter((s) => s.status === 'ACTIVE') || [];
    const existing = await Promise.all(students.map((ds) =>
      api.get(`/admin/degrees/students/${ds.id}/results`, { params: { semesterId: resultsSem.id } })
        .then((res) => ({ ds, results: res.data.data?.semesterResults?.[0]?.results || [] }))
        .catch(() => ({ ds, results: [] })),
    ));
    const courseMarks = {};
    for (const { ds, results } of existing) {
      const r = results.find((x) => x.courseId === resultsCourse);
      if (r) {
        courseMarks[ds.id] = {
          theory: r.theoryMarks, practical: r.practicalMarks, internal: r.internalMarks, remarks: r.remarks || '',
        };
      }
    }
    setMarks(courseMarks);
  };

  useEffect(() => { if (resultsCourse) loadResultsMarks(); }, [resultsCourse, resultsSemester]);

  const saveResults = async () => {
    const entries = Object.entries(marks).map(([degreeStudentId, m]) => ({
      degreeStudentId,
      theoryMarks: m.theory,
      practicalMarks: m.practical,
      internalMarks: m.internal,
      remarks: m.remarks,
    }));
    await api.post('/admin/degrees/results/bulk', {
      semesterId: resultsSem.id,
      courseId: resultsCourse,
      entries,
      publish: true,
    });
    alert('Results saved');
  };

  if (loading) return <p className="text-gray-500">Loading...</p>;
  if (!batch) return <p className="text-red-600">Batch not found</p>;

  const allCourses = batch.semesters?.flatMap((s) => s.courses?.map((c) => ({ ...c, semesterName: s.name })) || []) || [];

  return (
    <DetailPageLayout
      breadcrumbs={[
        { label: 'Dashboard', to: '/admin' },
        { label: 'Degree', to: '/admin/degrees' },
        { label: batch.degree?.name, to: `/admin/degrees/${batch.degreeId}` },
        { label: batch.name },
      ]}
      title={batch.name}
      subtitle={`${batch.degree?.name} — Semester ${batch.currentSemester} of ${batch.totalSemesters}`}
      status={batch.status}
      actions={
        <>
          <Button variant="secondary" onClick={promote}>Promote Batch</Button>
          <Button variant="secondary" onClick={() => setFeeEditOpen(true)}>Fee Config</Button>
          <Button onClick={() => setAdmitOpen(true)}>Admit Student</Button>
          <Button variant="danger" onClick={deleteBatch}>Delete Batch</Button>
        </>
      }
      tabs={[
        { id: 'overview', label: 'Overview' },
        { id: 'semesters', label: 'Semesters & Courses' },
        { id: 'students', label: 'Students' },
        { id: 'attendance', label: 'Attendance' },
        { id: 'results', label: 'Results' },
      ]}
      activeTab={tab}
      onTabChange={setTab}
    >
      {tab === 'overview' && (
        <StatGrid cols={4}>
          <StatCard label="Students" value={stats?.students ?? batch.students?.length ?? 0} />
          <StatCard label="Courses" value={stats?.courses ?? allCourses.length} />
          <StatCard label="Default Semester Fee" value={Number(batch.defaultSemesterFee).toLocaleString()} suffix=" PKR" />
          <StatCard label="Results" value={stats?.resultsCount ?? 0} />
        </StatGrid>
      )}

      {tab === 'semesters' && (
        <div className="space-y-4">
          {batch.semesters?.map((sem) => (
            <SectionCard key={sem.id} title={`${sem.name} — Fee: ${Number(sem.effectiveFee ?? sem.semesterFee ?? batch.defaultSemesterFee).toLocaleString()} PKR`}>
              <div className="mb-2 flex gap-2">
                <Button onClick={() => { setSelectedSemester(sem.id); setCourseOpen(true); }}>+ Add Course</Button>
                <Button variant="secondary" onClick={() => setEditingSemester({
                  id: sem.id,
                  semesterFee: sem.semesterFee ?? batch.defaultSemesterFee,
                  useDefault: sem.semesterFee == null,
                })}>Edit Fee</Button>
              </div>
              {sem.courses?.length ? (
                <ul className="divide-y text-sm">
                  {sem.courses.map((c) => (
                    <li key={c.id} className="flex justify-between py-2">
                      <span>{c.name} ({c.code}) — {c.creditHours} cr</span>
                      <span className="text-xs text-gray-500">
                        {c.teachers?.map((t) => `${t.teacher.firstName} ${t.teacher.lastName}`).join(', ') || 'No teacher'}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : <p className="text-sm text-gray-500">No courses in this semester</p>}
            </SectionCard>
          ))}
        </div>
      )}

      {tab === 'students' && (
        <SectionCard title="Batch Students">
          {batch.students?.length ? (
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs uppercase text-gray-500">
                  <th className="py-2">Student</th><th>Roll</th><th>Semester</th><th>Net Fee</th><th>Status</th><th></th>
                </tr>
              </thead>
              <tbody>
                {batch.students.map((ds) => (
                  <tr key={ds.id} className="border-b border-gray-100">
                    <td className="py-2">{ds.student.firstName} {ds.student.lastName}</td>
                    <td>{ds.student.rollNumber}</td>
                    <td>{ds.currentSemesterNumber}</td>
                    <td>{Number(ds.netSemesterFee).toLocaleString()} PKR</td>
                    <td><Badge>{ds.status}</Badge></td>
                    <td><Link to={`/admin/degrees/students/${ds.id}`} className="text-primary-600 text-xs">View</Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : <EmptyState title="No students" action={<Button onClick={() => setAdmitOpen(true)}>Admit first student</Button>} />}
        </SectionCard>
      )}

      {tab === 'attendance' && (
        <SectionCard title="Mark Attendance">
          <div className="mb-4 grid gap-3 sm:grid-cols-4">
            <Select label="Semester" value={attendanceSemester} onChange={(e) => { setAttendanceSemester(e.target.value); setAttendanceCourse(''); setAttendanceRows([]); }}>
              {batch.semesters?.map((s) => <option key={s.id} value={s.number}>{s.name}</option>)}
            </Select>
            <Select label="Course" value={attendanceCourse} onChange={(e) => setAttendanceCourse(e.target.value)}>
              <option value="">Select course</option>
              {attendanceCourses.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </Select>
            <Input label="Date" type="date" value={attendanceDate} onChange={(e) => setAttendanceDate(e.target.value)} />
            <div className="flex items-end"><Button onClick={loadAttendance}>Load</Button></div>
          </div>
          {attendanceRows.length > 0 && (
            <>
              <table className="mb-3 min-w-full text-sm">
                <tbody>
                  {attendanceRows.map((r) => (
                    <tr key={r.studentId} className="border-b">
                      <td className="py-2">{r.name}</td>
                      <td>
                        <Select value={r.status} onChange={(e) => setAttendanceRows((rows) => rows.map((x) => x.studentId === r.studentId ? { ...x, status: e.target.value } : x))}>
                          <option value="PRESENT">Present</option>
                          <option value="ABSENT">Absent</option>
                          <option value="LATE">Late</option>
                          <option value="LEAVE">Leave</option>
                        </Select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <Button onClick={saveAttendance}>Save Attendance</Button>
            </>
          )}
        </SectionCard>
      )}

      {tab === 'results' && (
        <SectionCard title="Marks Entry">
          <div className="mb-4 grid gap-3 sm:grid-cols-2">
            <Select label="Semester" value={resultsSemester} onChange={(e) => { setResultsSemester(e.target.value); setResultsCourse(''); setMarks({}); }}>
              {batch.semesters?.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </Select>
            <Select label="Course" value={resultsCourse} onChange={(e) => setResultsCourse(e.target.value)}>
              <option value="">Select course</option>
              {resultsCourses.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </Select>
          </div>
          {resultsCourse && batch.students?.filter((s) => s.status === 'ACTIVE').map((ds) => (
            <div key={ds.id} className="mb-3 rounded border p-3">
              <p className="mb-2 font-medium">{ds.student.firstName} {ds.student.lastName}</p>
              <div className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-5">
                <Input placeholder="Theory" type="number" value={marks[ds.id]?.theory || ''} onChange={(e) => setMarks({ ...marks, [ds.id]: { ...marks[ds.id], theory: e.target.value } })} />
                <Input placeholder="Practical" type="number" value={marks[ds.id]?.practical || ''} onChange={(e) => setMarks({ ...marks, [ds.id]: { ...marks[ds.id], practical: e.target.value } })} />
                <Input placeholder="Internal" type="number" value={marks[ds.id]?.internal || ''} onChange={(e) => setMarks({ ...marks, [ds.id]: { ...marks[ds.id], internal: e.target.value } })} />
                <Input className="sm:col-span-2" placeholder="Remarks" value={marks[ds.id]?.remarks || ''} onChange={(e) => setMarks({ ...marks, [ds.id]: { ...marks[ds.id], remarks: e.target.value } })} />
              </div>
              {marks[ds.id]?.theory && (
                <p className="mt-1 text-xs text-gray-500">
                  Total: {(Number(marks[ds.id]?.theory || 0) + Number(marks[ds.id]?.practical || 0) + Number(marks[ds.id]?.internal || 0))} / 100
                </p>
              )}
            </div>
          ))}
          {resultsCourse && <Button className="mt-3" onClick={saveResults}>Save & Publish Results</Button>}
        </SectionCard>
      )}

      <Modal open={admitOpen} onClose={() => setAdmitOpen(false)} title="Student Admission" wide>
        <form onSubmit={admit} className="grid gap-3 sm:grid-cols-2">
          <Select className="sm:col-span-2" value={admitForm.mode} onChange={(e) => setAdmitForm({ ...admitForm, mode: e.target.value })}>
            <option value="new">New student</option>
            <option value="existing">Existing student</option>
          </Select>
          {admitForm.mode === 'existing' ? (
            <Input className="sm:col-span-2" label="Student ID" value={admitForm.studentId || ''} onChange={(e) => setAdmitForm({ ...admitForm, studentId: e.target.value })} />
          ) : (
            <>
              <Input label="First Name *" value={admitForm.newStudent?.firstName || ''} onChange={(e) => setAdmitForm({ ...admitForm, newStudent: { ...admitForm.newStudent, firstName: e.target.value } })} required />
              <Input label="Last Name *" value={admitForm.newStudent?.lastName || ''} onChange={(e) => setAdmitForm({ ...admitForm, newStudent: { ...admitForm.newStudent, lastName: e.target.value } })} required />
              <Input className="sm:col-span-2" label="Email * (portal login)" type="email" value={admitForm.newStudent?.email || ''} onChange={(e) => setAdmitForm({ ...admitForm, newStudent: { ...admitForm.newStudent, email: e.target.value } })} required />
              <Input label="Phone" value={admitForm.newStudent?.phone || ''} onChange={(e) => setAdmitForm({ ...admitForm, newStudent: { ...admitForm.newStudent, phone: e.target.value } })} />
              <Input label="Father Name" value={admitForm.newStudent?.fatherName || ''} onChange={(e) => setAdmitForm({ ...admitForm, newStudent: { ...admitForm.newStudent, fatherName: e.target.value } })} />
              <Input label="Guardian Phone" value={admitForm.newStudent?.guardianPhone || ''} onChange={(e) => setAdmitForm({ ...admitForm, newStudent: { ...admitForm.newStudent, guardianPhone: e.target.value } })} />
            </>
          )}
          <div className="sm:col-span-2 rounded bg-blue-50 p-3 text-sm">
            <p>Semester fee is auto-assigned from batch configuration.</p>
            <p>Assigned Fee (Semester {batch.currentSemester}): <strong>{Number(currentSemFee?.effectiveFee ?? batch.defaultSemesterFee ?? 0).toLocaleString()} PKR</strong></p>
          </div>
          <Input label="Discount" type="number" value={admitForm.discount || 0} onChange={(e) => setAdmitForm({ ...admitForm, discount: e.target.value })} />
          <Input label="Scholarship" type="number" value={admitForm.scholarship || 0} onChange={(e) => setAdmitForm({ ...admitForm, scholarship: e.target.value })} />
          <div className="sm:col-span-2 rounded bg-gray-50 p-3 text-sm">
            <p className="font-semibold">Net Payable Fee: {previewFee.toLocaleString()} PKR</p>
          </div>
          <label className="sm:col-span-2 flex items-center gap-2 text-sm">
            <input type="checkbox" checked={admitForm.installmentEnabled} onChange={(e) => setAdmitForm({ ...admitForm, installmentEnabled: e.target.checked })} />
            Enable Installment Plan
          </label>
          {admitForm.installmentEnabled && (
            <Input label="Installments (max 6)" type="number" min={2} max={6} value={admitForm.installmentCount || 2} onChange={(e) => setAdmitForm({ ...admitForm, installmentCount: e.target.value })} />
          )}
          <div className="sm:col-span-2"><Button type="submit">Admit & Assign Fees</Button></div>
        </form>
      </Modal>

      <Modal open={feeEditOpen} onClose={() => setFeeEditOpen(false)} title="Batch Fee Configuration">
        <form onSubmit={saveBatchFees} className="space-y-3">
          <Input label="Default Semester Fee (PKR)" type="number" value={batchFeeForm.defaultSemesterFee} onChange={(e) => setBatchFeeForm({ ...batchFeeForm, defaultSemesterFee: e.target.value })} />
          <Input label="Registration Fee (PKR)" type="number" value={batchFeeForm.registrationFee} onChange={(e) => setBatchFeeForm({ ...batchFeeForm, registrationFee: e.target.value })} />
          <p className="text-xs text-gray-500">Default fee applies to all semesters unless a semester has a custom fee.</p>
          <Button type="submit">Save</Button>
        </form>
      </Modal>

      <Modal open={!!editingSemester} onClose={() => setEditingSemester(null)} title="Semester Fee">
        {editingSemester && (
          <form onSubmit={saveSemesterFee} className="space-y-3">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={editingSemester.useDefault} onChange={(e) => setEditingSemester({ ...editingSemester, useDefault: e.target.checked })} />
              Use batch default fee ({Number(batch.defaultSemesterFee).toLocaleString()} PKR)
            </label>
            {!editingSemester.useDefault && (
              <Input label="Custom Semester Fee" type="number" value={editingSemester.semesterFee} onChange={(e) => setEditingSemester({ ...editingSemester, semesterFee: e.target.value })} />
            )}
            <Button type="submit">Update</Button>
          </form>
        )}
      </Modal>

      <Modal open={courseOpen} onClose={() => setCourseOpen(false)} title="Add Semester Course">
        <form onSubmit={addCourse} className="space-y-3">
          <Input label="Course Name" value={courseForm.name || ''} onChange={(e) => setCourseForm({ ...courseForm, name: e.target.value })} required />
          <Input label="Code" value={courseForm.code || ''} onChange={(e) => setCourseForm({ ...courseForm, code: e.target.value })} required />
          <Input label="Credit Hours" type="number" value={courseForm.creditHours} onChange={(e) => setCourseForm({ ...courseForm, creditHours: e.target.value })} />
          <Select label="Teacher" value={courseForm.teacherId || ''} onChange={(e) => setCourseForm({ ...courseForm, teacherIds: e.target.value ? [e.target.value] : [] })}>
            <option value="">Optional</option>
            {teachers.map((t) => <option key={t.id} value={t.id}>{t.firstName} {t.lastName}</option>)}
          </Select>
          <Button type="submit">Add Course</Button>
        </form>
      </Modal>

      <CredentialsRevealModal
        open={!!portalCreds}
        title="Student portal credentials"
        email={portalCreds?.email || ''}
        password={portalCreds?.password || ''}
        onConfirm={() => setPortalCreds(null)}
      />
    </DetailPageLayout>
  );
}
