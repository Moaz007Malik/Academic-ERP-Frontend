import { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import DetailPageLayout, { StatGrid, StatCard, SectionCard, InfoGrid, EmptyState } from '../../components/layout/DetailPageLayout';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import Badge from '../../components/common/Badge';
import Modal from '../../components/common/Modal';

export default function IndividualCourseDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isNew = id === 'new';
  const [course, setCourse] = useState(null);
  const [teachers, setTeachers] = useState([]);
  const [students, setStudents] = useState([]);
  const [tab, setTab] = useState('overview');
  const [form, setForm] = useState({ status: 'ACTIVE' });
  const [enrollOpen, setEnrollOpen] = useState(false);
  const [enrollForm, setEnrollForm] = useState({ mode: 'existing' });
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().slice(0, 10));
  const [attendanceRows, setAttendanceRows] = useState([]);
  const [teacherPick, setTeacherPick] = useState('');
  const [loading, setLoading] = useState(!isNew);

  useEffect(() => {
    api.get('/admin/teachers?limit=100').then((r) => setTeachers(r.data.data || []));
    api.get('/admin/students?limit=200').then((r) => setStudents(r.data.data || []));
  }, []);

  useEffect(() => {
    if (isNew) return;
    setLoading(true);
    api.get(`/admin/individual-courses/${id}`)
      .then((res) => setCourse(res.data.data))
      .finally(() => setLoading(false));
  }, [id, isNew]);

  const saveCourse = async (e) => {
    e.preventDefault();
    if (isNew) {
      const res = await api.post('/admin/individual-courses', form);
      navigate(`/admin/individual-courses/${res.data.data.id}`);
    } else {
      await api.put(`/admin/individual-courses/${id}`, form);
      const res = await api.get(`/admin/individual-courses/${id}`);
      setCourse(res.data.data);
    }
  };

  const enroll = async (e) => {
    e.preventDefault();
    const body = enrollForm.mode === 'existing'
      ? { studentId: enrollForm.studentId }
      : { newStudent: enrollForm.newStudent };
    await api.post(`/admin/individual-courses/${id}/enroll`, body);
    setEnrollOpen(false);
    const res = await api.get(`/admin/individual-courses/${id}`);
    setCourse(res.data.data);
  };

  if (isNew) {
    return (
      <DetailPageLayout
        breadcrumbs={[{ label: 'Dashboard', to: '/admin' }, { label: 'Individual Courses', to: '/admin/individual-courses' }, { label: 'New Course' }]}
        title="Create Individual Course"
      >
        <form onSubmit={saveCourse} className="grid max-w-2xl gap-3 sm:grid-cols-2">
          <Input label="Course Name *" value={form.name || ''} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <Input label="Course Code *" value={form.code || ''} onChange={(e) => setForm({ ...form, code: e.target.value })} required />
          <Input label="Duration" value={form.duration || ''} onChange={(e) => setForm({ ...form, duration: e.target.value })} />
          <Input label="Capacity" type="number" value={form.capacity || 30} onChange={(e) => setForm({ ...form, capacity: e.target.value })} />
          <Input label="Admission Fee" type="number" value={form.admissionFee || 0} onChange={(e) => setForm({ ...form, admissionFee: e.target.value })} />
          <Input label="Monthly Fee" type="number" value={form.monthlyFee || 0} onChange={(e) => setForm({ ...form, monthlyFee: e.target.value })} />
          <Input label="One-Time Fee" type="number" value={form.oneTimeFee || 0} onChange={(e) => setForm({ ...form, oneTimeFee: e.target.value })} />
          <Input label="Discount" type="number" value={form.discountAmount || 0} onChange={(e) => setForm({ ...form, discountAmount: e.target.value })} />
          <Input label="Scholarship" type="number" value={form.scholarshipAmount || 0} onChange={(e) => setForm({ ...form, scholarshipAmount: e.target.value })} />
          <div className="col-span-2">
            <label className="mb-1 block text-sm font-medium text-gray-700">Assign Teachers</label>
            <select multiple className="w-full rounded border px-3 py-2 text-sm" value={form.teacherIds || []} onChange={(e) => setForm({ ...form, teacherIds: [...e.target.selectedOptions].map((o) => o.value) })}>
              {teachers.map((t) => <option key={t.id} value={t.id}>{t.firstName} {t.lastName}</option>)}
            </select>
          </div>
          <div className="col-span-2"><Input label="Description" value={form.description || ''} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
          <div className="col-span-2"><Button type="submit">Create Course</Button></div>
        </form>
      </DetailPageLayout>
    );
  }

  if (loading) return <p className="text-gray-500">Loading...</p>;
  if (!course) return <p className="text-red-600">Course not found</p>;

  const totalFee = Number(course.admissionFee) + Number(course.oneTimeFee) + Number(course.monthlyFee)
    - Number(course.discountAmount) - Number(course.scholarshipAmount);

  return (
    <DetailPageLayout
      breadcrumbs={[{ label: 'Dashboard', to: '/admin' }, { label: 'Individual Courses', to: '/admin/individual-courses' }, { label: course.name }]}
      title={course.name}
      subtitle={course.code}
      status={course.status}
      actions={
        <>
          <Button onClick={() => setEnrollOpen(true)}>Enroll Student</Button>
          <Link to="/admin/individual-courses"><Button variant="secondary">Back</Button></Link>
        </>
      }
      tabs={[{ id: 'overview', label: 'Overview' }, { id: 'teachers', label: 'Teachers' }, { id: 'enrollments', label: 'Enrollments' }, { id: 'attendance', label: 'Attendance' }, { id: 'fees', label: 'Fees' }]}
      activeTab={tab}
      onTabChange={setTab}
    >
      {tab === 'overview' && (
        <SectionCard title="Course Details">
          <InfoGrid items={[
            { label: 'Duration', value: course.duration },
            { label: 'Capacity', value: course.capacity },
            { label: 'Enrolled', value: course.enrollments?.length },
            { label: 'Start', value: course.startDate ? new Date(course.startDate).toLocaleDateString() : null },
            { label: 'End', value: course.endDate ? new Date(course.endDate).toLocaleDateString() : null },
            { label: 'Teachers', value: course.teachers?.map((t) => `${t.teacher.firstName} ${t.teacher.lastName}`).join(', ') },
          ]} />
          <p className="mt-4 text-sm text-gray-600">{course.description}</p>
        </SectionCard>
      )}

      {tab === 'teachers' && (
        <SectionCard title="Assigned Teachers">
          <div className="mb-3 flex gap-2">
            <Select value={teacherPick} onChange={(e) => setTeacherPick(e.target.value)}>
              <option value="">Select teacher</option>
              {teachers.map((t) => <option key={t.id} value={t.id}>{t.firstName} {t.lastName}</option>)}
            </Select>
            <Button onClick={async () => {
              if (!teacherPick) return;
              await api.post(`/admin/individual-courses/${id}/teachers`, { teacherId: teacherPick });
              setTeacherPick('');
              const res = await api.get(`/admin/individual-courses/${id}`);
              setCourse(res.data.data);
            }}>Assign</Button>
          </div>
          <ul className="divide-y text-sm">
            {course.teachers?.map((t) => (
              <li key={t.id} className="flex justify-between py-2">
                <span>{t.teacher.firstName} {t.teacher.lastName}</span>
                <button type="button" className="text-xs text-red-600" onClick={async () => {
                  await api.delete(`/admin/individual-courses/${id}/teachers/${t.teacher.id}`);
                  const res = await api.get(`/admin/individual-courses/${id}`);
                  setCourse(res.data.data);
                }}>Remove</button>
              </li>
            ))}
          </ul>
        </SectionCard>
      )}

      {tab === 'attendance' && (
        <SectionCard title="Course Attendance">
          <div className="mb-3 flex gap-2">
            <Input label="Date" type="date" value={attendanceDate} onChange={(e) => setAttendanceDate(e.target.value)} />
            <Button className="self-end" onClick={async () => {
              const res = await api.get(`/admin/individual-courses/${id}/attendance`, { params: { date: attendanceDate } });
              const saved = new Map((res.data.data || []).map((r) => [r.studentId, r.status]));
              setAttendanceRows((course.enrollments || []).map((e) => ({
                studentId: e.student.id,
                name: `${e.student.firstName} ${e.student.lastName}`,
                status: saved.get(e.student.id) || 'PRESENT',
              })));
            }}>Load</Button>
          </div>
          {attendanceRows.length > 0 && (
            <>
              <table className="mb-3 min-w-full text-sm"><tbody>
                {attendanceRows.map((r) => (
                  <tr key={r.studentId} className="border-b">
                    <td className="py-2">{r.name}</td>
                    <td>
                      <Select value={r.status} onChange={(e) => setAttendanceRows((rows) => rows.map((x) => x.studentId === r.studentId ? { ...x, status: e.target.value } : x))}>
                        <option value="PRESENT">Present</option><option value="ABSENT">Absent</option><option value="LATE">Late</option><option value="LEAVE">Leave</option>
                      </Select>
                    </td>
                  </tr>
                ))}
              </tbody></table>
              <Button onClick={async () => {
                await api.post(`/admin/individual-courses/${id}/attendance/mark`, { date: attendanceDate, records: attendanceRows.map((r) => ({ studentId: r.studentId, status: r.status })) });
                alert('Attendance saved');
              }}>Save Attendance</Button>
            </>
          )}
        </SectionCard>
      )}

      {tab === 'enrollments' && (
        <SectionCard title="Enrolled Students">
          {course.enrollments?.length ? (
            <table className="min-w-full text-sm">
              <thead><tr className="border-b text-left text-xs uppercase text-gray-500"><th className="py-2">Student</th><th>Roll</th><th>Status</th><th>Fee Due</th><th></th></tr></thead>
              <tbody>
                {course.enrollments.map((e) => (
                  <tr key={e.id} className="border-b border-gray-100">
                    <td className="py-2">{e.student.firstName} {e.student.lastName}</td>
                    <td>{e.student.rollNumber}</td>
                    <td><Badge>{e.status}</Badge></td>
                    <td>{Number(e.feeDue).toLocaleString()} PKR</td>
                    <td><Link to={`/admin/students/${e.student.id}`} className="text-primary-600 text-xs">Profile</Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : <EmptyState title="No enrollments" action={<Button onClick={() => setEnrollOpen(true)}>Enroll first student</Button>} />}
        </SectionCard>
      )}

      {tab === 'fees' && (
        <StatGrid cols={3}>
          <StatCard label="Total course fee" value={totalFee.toLocaleString()} suffix=" PKR" />
          <StatCard label="Admission" value={Number(course.admissionFee).toLocaleString()} suffix=" PKR" />
          <StatCard label="Scholarship" value={Number(course.scholarshipAmount).toLocaleString()} suffix=" PKR" variant="success" />
        </StatGrid>
      )}

      <Modal open={enrollOpen} onClose={() => setEnrollOpen(false)} title="Enroll Student" wide>
        <form onSubmit={enroll} className="space-y-3">
          <Select value={enrollForm.mode} onChange={(e) => setEnrollForm({ mode: e.target.value })}>
            <option value="existing">Existing student</option>
            <option value="new">Create new student</option>
          </Select>
          {enrollForm.mode === 'existing' ? (
            <Select label="Student" value={enrollForm.studentId || ''} onChange={(e) => setEnrollForm({ ...enrollForm, studentId: e.target.value })}>
              <option value="">Select student</option>
              {students.map((s) => <option key={s.id} value={s.id}>{s.firstName} {s.lastName} ({s.rollNumber})</option>)}
            </Select>
          ) : (
            <>
              <Input label="First Name" value={enrollForm.newStudent?.firstName || ''} onChange={(e) => setEnrollForm({ ...enrollForm, newStudent: { ...enrollForm.newStudent, firstName: e.target.value } })} />
              <Input label="Last Name" value={enrollForm.newStudent?.lastName || ''} onChange={(e) => setEnrollForm({ ...enrollForm, newStudent: { ...enrollForm.newStudent, lastName: e.target.value } })} />
              <Input label="Email (portal)" value={enrollForm.newStudent?.email || ''} onChange={(e) => setEnrollForm({ ...enrollForm, newStudent: { ...enrollForm.newStudent, email: e.target.value } })} />
            </>
          )}
          <Button type="submit">Enroll</Button>
        </form>
      </Modal>
    </DetailPageLayout>
  );
}
