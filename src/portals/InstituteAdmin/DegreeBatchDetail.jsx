import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api from '../../services/api';
import DetailPageLayout, { SectionCard, StatGrid, StatCard, EmptyState } from '../../components/layout/DetailPageLayout';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Modal from '../../components/common/Modal';
import Badge from '../../components/common/Badge';
import Select from '../../components/common/Select';
import { confirmDelete } from '../../components/common/RowActions';

const STATUS_OPTIONS = ['ACTIVE', 'INACTIVE', 'DROPOUT', 'SUSPENDED', 'GRADUATED', 'COMPLETED', 'LEFT', 'EXPELLED'];

export default function DegreeBatchDetail() {
  const { batchId } = useParams();
  const [batch, setBatch] = useState(null);
  const [stats, setStats] = useState(null);
  const [teachers, setTeachers] = useState([]);
  const [tab, setTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [admitOpen, setAdmitOpen] = useState(false);
  const [courseOpen, setCourseOpen] = useState(false);
  const [selectedSemester, setSelectedSemester] = useState(null);
  const [admitForm, setAdmitForm] = useState({ mode: 'new', installmentCount: 1 });
  const [courseForm, setCourseForm] = useState({ creditHours: 3 });
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().slice(0, 10));
  const [attendanceCourse, setAttendanceCourse] = useState('');
  const [attendanceRows, setAttendanceRows] = useState([]);
  const [resultsCourse, setResultsCourse] = useState('');
  const [marks, setMarks] = useState({});

  const load = () => {
    setLoading(true);
    Promise.all([
      api.get(`/admin/degrees/batches/${batchId}`),
      api.get(`/admin/degrees/batches/${batchId}/dashboard`),
      api.get('/admin/teachers?limit=200'),
    ]).then(([bRes, dRes, tRes]) => {
      setBatch(bRes.data.data);
      setStats(dRes.data.data?.stats);
      setTeachers(tRes.data.data || []);
      if (!selectedSemester && bRes.data.data?.semesters?.length) {
        const cur = bRes.data.data.semesters.find((s) => s.number === bRes.data.data.currentSemester);
        setSelectedSemester(cur?.id || bRes.data.data.semesters[0].id);
      }
    }).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [batchId]);

  const netFee = Math.max(0, Number(admitForm.semesterFee || 0) - Number(admitForm.discount || 0));

  const admit = async (e) => {
    e.preventDefault();
    const body = admitForm.mode === 'existing'
      ? { studentId: admitForm.studentId, semesterFee: admitForm.semesterFee, discount: admitForm.discount, installmentCount: admitForm.installmentCount }
      : { newStudent: admitForm.newStudent, semesterFee: admitForm.semesterFee, discount: admitForm.discount, installmentCount: admitForm.installmentCount };
    await api.post(`/admin/degrees/batches/${batchId}/students`, body);
    setAdmitOpen(false);
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
    if (!window.confirm('Promote entire batch to next semester?')) return;
    await api.post(`/admin/degrees/batches/${batchId}/promote`);
    load();
  };

  const deleteBatch = async () => {
    if (!confirmDelete('Delete this batch and ALL related students, fees, attendance, results?')) return;
    await api.delete(`/admin/degrees/batches/${batchId}`);
    window.location.href = `/admin/degrees/${batch.degreeId}`;
  };

  const loadAttendance = async () => {
    if (!attendanceCourse) return;
    const enrolled = batch.students?.filter((s) => s.status === 'ACTIVE' && s.currentSemesterNumber === batch.currentSemester) || [];
    const res = await api.get(`/admin/degrees/courses/${attendanceCourse}/attendance`, { params: { date: attendanceDate } });
    const saved = new Map((res.data.data || []).map((r) => [r.studentId, r.status]));
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

  const saveResults = async () => {
    const semester = batch.semesters?.find((s) => s.courses?.some((c) => c.id === resultsCourse));
    const entries = Object.entries(marks).map(([degreeStudentId, m]) => ({
      degreeStudentId,
      theoryMarks: m.theory,
      practicalMarks: m.practical,
      internalMarks: m.internal,
    }));
    await api.post('/admin/degrees/results/bulk', { semesterId: semester.id, courseId: resultsCourse, entries });
    alert('Results saved');
  };

  if (loading) return <p className="text-gray-500">Loading...</p>;
  if (!batch) return <p className="text-red-600">Batch not found</p>;

  const currentSem = batch.semesters?.find((s) => s.number === batch.currentSemester);
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
          <StatCard label="Attendance records" value={stats?.attendanceCount ?? 0} />
          <StatCard label="Results" value={stats?.resultsCount ?? 0} />
        </StatGrid>
      )}

      {tab === 'semesters' && (
        <div className="space-y-4">
          {batch.semesters?.map((sem) => (
            <SectionCard key={sem.id} title={`${sem.name} — Fee: ${Number(sem.semesterFee).toLocaleString()} PKR`}>
              <div className="mb-2 flex gap-2">
                <Button onClick={() => { setSelectedSemester(sem.id); setCourseOpen(true); }}>+ Add Course</Button>
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
                  <th className="py-2">Student</th><th>Roll</th><th>Semester</th><th>Net Fee</th><th>Status</th>
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
                  </tr>
                ))}
              </tbody>
            </table>
          ) : <EmptyState title="No students" action={<Button onClick={() => setAdmitOpen(true)}>Admit first student</Button>} />}
        </SectionCard>
      )}

      {tab === 'attendance' && (
        <SectionCard title="Mark Attendance">
          <div className="mb-4 grid gap-3 sm:grid-cols-3">
            <Select label="Course" value={attendanceCourse} onChange={(e) => setAttendanceCourse(e.target.value)}>
              <option value="">Select course</option>
              {currentSem?.courses?.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
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
          <Select className="mb-4" label="Course" value={resultsCourse} onChange={(e) => setResultsCourse(e.target.value)}>
            <option value="">Select course</option>
            {currentSem?.courses?.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </Select>
          {resultsCourse && batch.students?.filter((s) => s.currentSemesterNumber === batch.currentSemester).map((ds) => (
            <div key={ds.id} className="mb-2 grid grid-cols-4 gap-2 text-sm">
              <span className="col-span-4 font-medium">{ds.student.firstName} {ds.student.lastName}</span>
              <Input placeholder="Theory" type="number" value={marks[ds.id]?.theory || ''} onChange={(e) => setMarks({ ...marks, [ds.id]: { ...marks[ds.id], theory: e.target.value } })} />
              <Input placeholder="Practical" type="number" value={marks[ds.id]?.practical || ''} onChange={(e) => setMarks({ ...marks, [ds.id]: { ...marks[ds.id], practical: e.target.value } })} />
              <Input placeholder="Internal" type="number" value={marks[ds.id]?.internal || ''} onChange={(e) => setMarks({ ...marks, [ds.id]: { ...marks[ds.id], internal: e.target.value } })} />
            </div>
          ))}
          {resultsCourse && <Button className="mt-3" onClick={saveResults}>Save Results</Button>}
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
              <Input label="First Name" value={admitForm.newStudent?.firstName || ''} onChange={(e) => setAdmitForm({ ...admitForm, newStudent: { ...admitForm.newStudent, firstName: e.target.value } })} />
              <Input label="Last Name" value={admitForm.newStudent?.lastName || ''} onChange={(e) => setAdmitForm({ ...admitForm, newStudent: { ...admitForm.newStudent, lastName: e.target.value } })} />
              <Input label="Email" value={admitForm.newStudent?.email || ''} onChange={(e) => setAdmitForm({ ...admitForm, newStudent: { ...admitForm.newStudent, email: e.target.value } })} />
              <Input label="Phone" value={admitForm.newStudent?.phone || ''} onChange={(e) => setAdmitForm({ ...admitForm, newStudent: { ...admitForm.newStudent, phone: e.target.value } })} />
              <Input label="Father Name" value={admitForm.newStudent?.fatherName || ''} onChange={(e) => setAdmitForm({ ...admitForm, newStudent: { ...admitForm.newStudent, fatherName: e.target.value } })} />
              <Input label="Guardian Phone" value={admitForm.newStudent?.guardianPhone || ''} onChange={(e) => setAdmitForm({ ...admitForm, newStudent: { ...admitForm.newStudent, guardianPhone: e.target.value } })} />
            </>
          )}
          <Input label="Semester Fee" type="number" value={admitForm.semesterFee ?? currentSem?.semesterFee ?? ''} onChange={(e) => setAdmitForm({ ...admitForm, semesterFee: e.target.value })} />
          <Input label="Discount" type="number" value={admitForm.discount || 0} onChange={(e) => setAdmitForm({ ...admitForm, discount: e.target.value })} />
          <div className="sm:col-span-2 rounded bg-gray-50 p-3 text-sm">
            <p>Original Fee: {Number(admitForm.semesterFee || 0).toLocaleString()} PKR</p>
            <p>Discount: {Number(admitForm.discount || 0).toLocaleString()} PKR</p>
            <p className="font-semibold">Net Semester Fee: {netFee.toLocaleString()} PKR</p>
          </div>
          <Input label="Installments (max 6)" type="number" min={1} max={6} value={admitForm.installmentCount || 1} onChange={(e) => setAdmitForm({ ...admitForm, installmentCount: e.target.value })} />
          <div className="sm:col-span-2"><Button type="submit">Admit & Assign Fees</Button></div>
        </form>
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
    </DetailPageLayout>
  );
}
