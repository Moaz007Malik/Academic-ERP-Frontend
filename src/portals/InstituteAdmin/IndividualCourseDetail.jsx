import { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import DetailPageLayout, { StatGrid, StatCard, SectionCard, InfoGrid, EmptyState } from '../../components/layout/DetailPageLayout';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import Badge from '../../components/common/Badge';
import Modal from '../../components/common/Modal';

const emptyNewStudent = {
  firstName: '', lastName: '', email: '', password: '', phone: '',
  dateOfBirth: '', gender: '', cnic: '', address: '',
  fatherName: '', motherName: '', guardianName: '', guardianPhone: '',
  guardianRelation: '', guardianEmail: '', bloodGroup: '',
  admissionNumber: '', registrationNumber: '', notes: '', photo: '',
};

export default function IndividualCourseDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isNew = id === 'new';
  const [course, setCourse] = useState(null);
  const [teachers, setTeachers] = useState([]);
  const [students, setStudents] = useState([]);
  const [tab, setTab] = useState('overview');
  const [form, setForm] = useState({ status: 'ACTIVE', paymentType: 'ONE_TIME' });
  const [enrollOpen, setEnrollOpen] = useState(false);
  const [enrollForm, setEnrollForm] = useState({ mode: 'existing', newStudent: { ...emptyNewStudent } });
  const [enrollError, setEnrollError] = useState('');
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().slice(0, 10));
  const [attendanceRows, setAttendanceRows] = useState([]);
  const [teacherPick, setTeacherPick] = useState('');
  const [loading, setLoading] = useState(!isNew);

  useEffect(() => {
    api.get('/admin/teachers?limit=100').then((r) => setTeachers(r.data.data || []));
    api.get('/admin/students?limit=200&forPicker=1').then((r) => setStudents(r.data.data || []));
  }, []);

  useEffect(() => {
    if (isNew) return;
    setLoading(true);
    api.get(`/admin/individual-courses/${id}`)
      .then((res) => setCourse(res.data.data))
      .finally(() => setLoading(false));
  }, [id, isNew]);

  const setNewStudent = (field, value) => {
    setEnrollForm((prev) => ({
      ...prev,
      newStudent: { ...prev.newStudent, [field]: value },
    }));
  };

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
    setEnrollError('');
    try {
      const body = enrollForm.mode === 'existing'
        ? { studentId: enrollForm.studentId }
        : { newStudent: enrollForm.newStudent };
      await api.post(`/admin/individual-courses/${id}/enroll`, body);
      setEnrollOpen(false);
      setEnrollForm({ mode: 'existing', newStudent: { ...emptyNewStudent } });
      const res = await api.get(`/admin/individual-courses/${id}`);
      setCourse(res.data.data);
    } catch (err) {
      setEnrollError(err.response?.data?.message || 'Enrollment failed');
    }
  };

  const paymentType = form.paymentType || 'ONE_TIME';

  if (isNew) {
    return (
      <DetailPageLayout
        breadcrumbs={[{ label: 'Dashboard', to: '/admin' }, { label: 'Individual Courses', to: '/admin/individual-courses' }, { label: 'New Course' }]}
        title="Create Individual Course"
      >
        <form onSubmit={saveCourse} className="grid max-w-2xl gap-3 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:grid-cols-2">
          <Input label="Course Name *" value={form.name || ''} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <Input label="Course Code *" value={form.code || ''} onChange={(e) => setForm({ ...form, code: e.target.value })} required />
          <Input label="Duration" value={form.duration || ''} onChange={(e) => setForm({ ...form, duration: e.target.value })} />
          <Input label="Capacity" type="number" value={form.capacity ?? 30} onChange={(e) => setForm({ ...form, capacity: e.target.value === '' ? '' : Number(e.target.value) })} />
          <Select label="Payment Type *" value={paymentType} onChange={(e) => setForm({ ...form, paymentType: e.target.value })}>
            <option value="ONE_TIME">One-Time</option>
            <option value="MONTHLY">Monthly</option>
          </Select>
          <Input label="Admission Fee" type="number" value={form.admissionFee ?? 0} onChange={(e) => setForm({ ...form, admissionFee: e.target.value === '' ? 0 : Number(e.target.value) })} />
          {paymentType === 'MONTHLY' ? (
            <Input label="Monthly Fee *" type="number" value={form.monthlyFee ?? 0} onChange={(e) => setForm({ ...form, monthlyFee: e.target.value === '' ? 0 : Number(e.target.value) })} />
          ) : (
            <Input label="One-Time Fee *" type="number" value={form.oneTimeFee ?? 0} onChange={(e) => setForm({ ...form, oneTimeFee: e.target.value === '' ? 0 : Number(e.target.value) })} />
          )}
          <Input label="Start Date" type="date" value={form.startDate || ''} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
          <Input label="End Date" type="date" value={form.endDate || ''} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
          <Input label="Discount" type="number" value={form.discountAmount ?? 0} onChange={(e) => setForm({ ...form, discountAmount: e.target.value === '' ? 0 : Number(e.target.value) })} />
          <Input label="Scholarship" type="number" value={form.scholarshipAmount ?? 0} onChange={(e) => setForm({ ...form, scholarshipAmount: e.target.value === '' ? 0 : Number(e.target.value) })} />
          <div className="col-span-2">
            <label className="mb-1 block text-sm font-medium text-gray-700">Assign Teachers</label>
            <select multiple className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm transition focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500" value={form.teacherIds || []} onChange={(e) => setForm({ ...form, teacherIds: [...e.target.selectedOptions].map((o) => o.value) })}>
              {teachers.map((t) => <option key={t.id} value={t.id}>{t.firstName} {t.lastName}</option>)}
            </select>
          </div>
          <div className="col-span-2"><Input label="Description" value={form.description || ''} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
          <p className="col-span-2 rounded-lg bg-blue-50 px-3 py-2 text-xs text-blue-700">
            {paymentType === 'MONTHLY'
              ? 'Enrolled students will receive admission fee (if any) plus monthly fee records based on course duration.'
              : 'Enrolled students will receive admission fee (if any) plus a single one-time fee — no monthly dues.'}
          </p>
          <div className="col-span-2"><Button type="submit" className="w-full sm:w-auto">Create Course</Button></div>
        </form>
      </DetailPageLayout>
    );
  }

  if (loading) return <p className="text-gray-500">Loading...</p>;
  if (!course) return <p className="text-red-600">Course not found</p>;

  const isMonthly = course.paymentType === 'MONTHLY';
  const totalFee = isMonthly
    ? Number(course.admissionFee) + Number(course.monthlyFee) - Number(course.discountAmount) - Number(course.scholarshipAmount)
    : Number(course.admissionFee) + Number(course.oneTimeFee || course.monthlyFee) - Number(course.discountAmount) - Number(course.scholarshipAmount);

  return (
    <DetailPageLayout
      breadcrumbs={[{ label: 'Dashboard', to: '/admin' }, { label: 'Individual Courses', to: '/admin/individual-courses' }, { label: course.name }]}
      title={course.name}
      subtitle={course.code}
      status={course.status}
      actions={
        <>
          <Button onClick={() => { setEnrollError(''); setEnrollOpen(true); }}>Enroll Student</Button>
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
            { label: 'Payment Type', value: isMonthly ? 'Monthly' : 'One-Time' },
            { label: 'Start', value: course.startDate ? new Date(course.startDate).toLocaleDateString() : null },
            { label: 'End', value: course.endDate ? new Date(course.endDate).toLocaleDateString() : null },
            { label: 'Teachers', value: course.teachers?.map((t) => `${t.teacher.firstName} ${t.teacher.lastName}`).join(', ') },
          ]} />
          {course.description && <p className="mt-4 rounded-lg bg-gray-50 p-3 text-sm text-gray-600">{course.description}</p>}
        </SectionCard>
      )}

      {tab === 'teachers' && (
        <SectionCard title="Assigned Teachers">
          <div className="mb-4 flex gap-2">
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
          {!course.teachers?.length && <EmptyState title="No teachers assigned" />}
          <ul className="divide-y divide-gray-100 text-sm">
            {course.teachers?.map((t) => (
              <li key={t.id} className="flex items-center justify-between py-3">
                <span className="font-medium text-gray-800">{t.teacher.firstName} {t.teacher.lastName}</span>
                <button type="button" className="text-xs font-medium text-red-600 hover:underline" onClick={async () => {
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
          <div className="mb-4 flex flex-wrap gap-2">
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
              <div className="mb-4 overflow-hidden rounded-lg border border-gray-100">
                <table className="min-w-full text-sm"><tbody className="divide-y divide-gray-100">
                  {attendanceRows.map((r) => (
                    <tr key={r.studentId} className="transition hover:bg-gray-50/70">
                      <td className="px-3 py-2.5">{r.name}</td>
                      <td className="px-3 py-2.5">
                        <Select value={r.status} onChange={(e) => setAttendanceRows((rows) => rows.map((x) => x.studentId === r.studentId ? { ...x, status: e.target.value } : x))}>
                          <option value="PRESENT">Present</option><option value="ABSENT">Absent</option><option value="LATE">Late</option><option value="LEAVE">Leave</option>
                        </Select>
                      </td>
                    </tr>
                  ))}
                </tbody></table>
              </div>
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
            <div className="overflow-x-auto rounded-lg border border-gray-100">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50">
                  <tr className="text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    <th className="px-3 py-2.5">Student</th><th className="px-3 py-2.5">Roll</th><th className="px-3 py-2.5">Status</th><th className="px-3 py-2.5">Fee Due</th><th className="px-3 py-2.5"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {course.enrollments.map((e) => (
                    <tr key={e.id} className="transition hover:bg-gray-50/70">
                      <td className="px-3 py-2.5 font-medium">{e.student.firstName} {e.student.lastName}</td>
                      <td className="px-3 py-2.5 font-mono text-xs">{e.student.rollNumber}</td>
                      <td className="px-3 py-2.5"><Badge>{e.status}</Badge></td>
                      <td className="px-3 py-2.5">{Number(e.feeDue).toLocaleString()} PKR</td>
                      <td className="px-3 py-2.5"><Link to={`/admin/students/${e.student.id}`} className="text-xs font-medium text-primary-600 hover:underline">Profile</Link></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : <EmptyState title="No enrollments" action={<Button onClick={() => setEnrollOpen(true)}>Enroll first student</Button>} />}
        </SectionCard>
      )}

      {tab === 'fees' && (
        <StatGrid cols={4}>
          <StatCard label="Payment type" value={isMonthly ? 'Monthly' : 'One-Time'} />
          <StatCard label="Est. course fee" value={totalFee.toLocaleString()} suffix=" PKR" />
          <StatCard label="Admission" value={Number(course.admissionFee).toLocaleString()} suffix=" PKR" />
          <StatCard label={isMonthly ? 'Monthly' : 'One-Time'} value={Number(isMonthly ? course.monthlyFee : (course.oneTimeFee || course.monthlyFee)).toLocaleString()} suffix=" PKR" />
        </StatGrid>
      )}

      <Modal open={enrollOpen} onClose={() => setEnrollOpen(false)} title="Enroll Student" wide>
        <form onSubmit={enroll} className="space-y-4">
          {enrollError && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{enrollError}</p>}
          <Select value={enrollForm.mode} onChange={(e) => setEnrollForm({ ...enrollForm, mode: e.target.value })}>
            <option value="existing">Existing student</option>
            <option value="new">Create new student</option>
          </Select>
          {enrollForm.mode === 'existing' ? (
            <Select label="Student" value={enrollForm.studentId || ''} onChange={(e) => setEnrollForm({ ...enrollForm, studentId: e.target.value })} required>
              <option value="">Select student</option>
              {students.map((s) => <option key={s.id} value={s.id}>{s.firstName} {s.lastName} ({s.rollNumber})</option>)}
            </Select>
          ) : (
            <div className="max-h-[60vh] space-y-5 overflow-y-auto pr-1">
              <div>
                <p className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-800">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary-500" /> Personal Information
                </p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Input label="First Name *" value={enrollForm.newStudent.firstName} onChange={(e) => setNewStudent('firstName', e.target.value)} required />
                  <Input label="Last Name *" value={enrollForm.newStudent.lastName} onChange={(e) => setNewStudent('lastName', e.target.value)} required />
                  <Input label="Date of Birth" type="date" value={enrollForm.newStudent.dateOfBirth} onChange={(e) => setNewStudent('dateOfBirth', e.target.value)} />
                  <Select label="Gender" value={enrollForm.newStudent.gender} onChange={(e) => setNewStudent('gender', e.target.value)}>
                    <option value="">—</option>
                    <option value="MALE">Male</option>
                    <option value="FEMALE">Female</option>
                  </Select>
                  <Input label="CNIC / B-Form" value={enrollForm.newStudent.cnic} onChange={(e) => setNewStudent('cnic', e.target.value)} />
                  <Input label="Blood Group" value={enrollForm.newStudent.bloodGroup} onChange={(e) => setNewStudent('bloodGroup', e.target.value)} />
                  <Input label="Photo URL" value={enrollForm.newStudent.photo} onChange={(e) => setNewStudent('photo', e.target.value)} className="sm:col-span-2" />
                </div>
              </div>
              <div>
                <p className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-800">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary-500" /> Student / Admission Details
                </p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Input label="Admission Number" value={enrollForm.newStudent.admissionNumber} onChange={(e) => setNewStudent('admissionNumber', e.target.value)} />
                  <Input label="Registration Number" value={enrollForm.newStudent.registrationNumber} onChange={(e) => setNewStudent('registrationNumber', e.target.value)} />
                </div>
              </div>
              <div>
                <p className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-800">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary-500" /> Guardian / Father Information
                </p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Input label="Father Name" value={enrollForm.newStudent.fatherName} onChange={(e) => setNewStudent('fatherName', e.target.value)} />
                  <Input label="Mother Name" value={enrollForm.newStudent.motherName} onChange={(e) => setNewStudent('motherName', e.target.value)} />
                  <Input label="Guardian Name" value={enrollForm.newStudent.guardianName} onChange={(e) => setNewStudent('guardianName', e.target.value)} />
                  <Input label="Guardian Relation" value={enrollForm.newStudent.guardianRelation} onChange={(e) => setNewStudent('guardianRelation', e.target.value)} />
                  <Input label="Guardian Phone" value={enrollForm.newStudent.guardianPhone} onChange={(e) => setNewStudent('guardianPhone', e.target.value)} />
                  <Input label="Guardian Email" type="email" value={enrollForm.newStudent.guardianEmail} onChange={(e) => setNewStudent('guardianEmail', e.target.value)} />
                </div>
              </div>
              <div>
                <p className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-800">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary-500" /> Contact & Address
                </p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Input label="Phone" value={enrollForm.newStudent.phone} onChange={(e) => setNewStudent('phone', e.target.value)} />
                  <Input label="Address" value={enrollForm.newStudent.address} onChange={(e) => setNewStudent('address', e.target.value)} className="sm:col-span-2" />
                </div>
              </div>
              <div>
                <p className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-800">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary-500" /> Portal Access
                </p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Input label="Portal Email" type="email" value={enrollForm.newStudent.email} onChange={(e) => setNewStudent('email', e.target.value)} />
                  <Input label="Portal Password" type="text" value={enrollForm.newStudent.password} onChange={(e) => setNewStudent('password', e.target.value)} placeholder="Default if blank" />
                </div>
              </div>
              <Input label="Notes" value={enrollForm.newStudent.notes} onChange={(e) => setNewStudent('notes', e.target.value)} />
              <p className="rounded-lg bg-blue-50 px-3 py-2 text-xs text-blue-700">
                Fees will be assigned automatically based on this course&apos;s {isMonthly ? 'monthly' : 'one-time'} payment type.
              </p>
            </div>
          )}
          <Button type="submit" className="w-full sm:w-auto">Enroll</Button>
        </form>
      </Modal>
    </DetailPageLayout>
  );
}