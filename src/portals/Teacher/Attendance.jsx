import { useEffect, useState } from 'react';
import api from '../../services/api';
import PageTitle from '../../components/layout/PageTitle';
import Button from '../../components/common/Button';
import Select from '../../components/common/Select';
import { useAsyncSubmit } from '../../hooks/useAsyncSubmit';

const STATUSES = ['PRESENT', 'ABSENT', 'LATE', 'LEAVE'];

export default function TeacherAttendance() {
  const [dashboard, setDashboard] = useState(null);
  const [sectionId, setSectionId] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [students, setStudents] = useState([]);
  const [records, setRecords] = useState({});
  const [msg, setMsg] = useState('');
  const { submitting, run } = useAsyncSubmit();

  useEffect(() => {
    api.get('/teacher/dashboard').then((res) => setDashboard(res.data.data));
  }, []);

  const assignments = dashboard?.assignments || [];
  const individualCourses = dashboard?.individualCourses || [];
  const degreeCourses = dashboard?.degreeCourses || [];
  const [icCourseId, setIcCourseId] = useState('');
  const [degreeCourseId, setDegreeCourseId] = useState('');
  const [icStudents, setIcStudents] = useState([]);
  const [icRecords, setIcRecords] = useState({});
  const sections = [...new Map(assignments.map((a) => [a.sectionId, a.section])).values()];
  const subjectsForSection = assignments.filter((a) => a.sectionId === sectionId);

  useEffect(() => {
    if (!sectionId) return;
    api.get('/teacher/students').then((res) => {
      const list = (res.data.data || []).filter((s) => s.currentSectionId === sectionId);
      setStudents(list);
      const init = {};
      list.forEach((s) => { init[s.id] = 'PRESENT'; });
      setRecords(init);
    });
  }, [sectionId]);

  useEffect(() => {
    if (!icCourseId) return;
    const course = individualCourses.find((c) => c.id === icCourseId);
    const list = course?.enrollments?.map((e) => e.student) || [];
    setIcStudents(list);
    const init = {};
    list.forEach((s) => { init[s.id] = 'PRESENT'; });
    setIcRecords(init);
  }, [icCourseId, individualCourses]);

  const save = async () => {
    const { skipped } = await run(async () => {
      const payload = students.map((s) => ({ studentId: s.id, status: records[s.id] || 'PRESENT' }));
      await api.post('/teacher/attendance/mark', { date, subjectId, sectionId, records: payload });
      setMsg('Attendance saved');
    });
    if (skipped) setMsg('Please wait...');
  };

  return (
    <>
      <PageTitle title="Mark Attendance" />
      {msg && <p className="mb-4 text-sm text-green-600">{msg}</p>}
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <Select label="Section" value={sectionId} onChange={(e) => { setSectionId(e.target.value); setSubjectId(''); }}>
          <option value="">Select</option>
          {sections.map((s) => <option key={s.id} value={s.id}>{s.batch?.name} — {s.name}</option>)}
        </Select>
        <Select label="Subject" value={subjectId} onChange={(e) => setSubjectId(e.target.value)}>
          <option value="">Select</option>
          {subjectsForSection.map((a) => <option key={a.subjectId} value={a.subjectId}>{a.subject?.name}</option>)}
        </Select>
        <div>
          <label className="block text-sm font-medium text-gray-700">Date</label>
          <input type="date" className="mt-1 w-full rounded-lg border px-3 py-2 text-sm" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
      </div>
      {sectionId && subjectId && students.length > 0 && (
        <>
          <table className="min-w-full rounded-xl border text-sm">
            <thead className="bg-gray-50"><tr><th className="px-4 py-2 text-left">Roll</th><th className="px-4 py-2 text-left">Name</th><th className="px-4 py-2 text-left">Status</th></tr></thead>
            <tbody>
              {students.map((s) => (
                <tr key={s.id} className="border-t">
                  <td className="px-4 py-2">{s.rollNumber}</td>
                  <td className="px-4 py-2">{s.firstName} {s.lastName}</td>
                  <td className="px-4 py-2">
                    <select className="rounded border px-2 py-1" value={records[s.id]} onChange={(e) => setRecords({ ...records, [s.id]: e.target.value })}>
                      {STATUSES.map((st) => <option key={st} value={st}>{st}</option>)}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <Button className="mt-4" disabled={submitting} onClick={save}>{submitting ? 'Saving...' : 'Save'}</Button>
        </>
      )}

      {individualCourses.length > 0 && (
        <div className="mt-10">
          <PageTitle title="Individual Course Attendance" />
          <div className="mb-4 grid gap-4 sm:grid-cols-2">
            <Select label="Individual Course" value={icCourseId} onChange={(e) => setIcCourseId(e.target.value)}>
              <option value="">Select course</option>
              {individualCourses.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </Select>
          </div>
          {icCourseId && icStudents.length > 0 && (
            <>
              <table className="min-w-full rounded-xl border text-sm">
                <thead className="bg-gray-50"><tr><th className="px-4 py-2 text-left">Roll</th><th className="px-4 py-2 text-left">Name</th><th className="px-4 py-2 text-left">Status</th></tr></thead>
                <tbody>
                  {icStudents.map((s) => (
                    <tr key={s.id} className="border-t">
                      <td className="px-4 py-2">{s.rollNumber}</td>
                      <td className="px-4 py-2">{s.firstName} {s.lastName}</td>
                      <td className="px-4 py-2">
                        <select className="rounded border px-2 py-1" value={icRecords[s.id]} onChange={(e) => setIcRecords({ ...icRecords, [s.id]: e.target.value })}>
                          {STATUSES.map((st) => <option key={st} value={st}>{st}</option>)}
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <Button className="mt-4" disabled={submitting} onClick={async () => {
                await api.post(`/teacher/individual-courses/${icCourseId}/attendance/mark`, {
                  date,
                  records: icStudents.map((s) => ({ studentId: s.id, status: icRecords[s.id] || 'PRESENT' })),
                });
                setMsg('Individual course attendance saved');
              }}>Save Individual Course Attendance</Button>
            </>
          )}
        </div>
      )}

      {degreeCourses.length > 0 && (
        <div className="mt-10">
          <PageTitle title="Degree Course Attendance" />
          <Select label="Degree Course" value={degreeCourseId} onChange={(e) => setDegreeCourseId(e.target.value)}>
            <option value="">Select course</option>
            {degreeCourses.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </Select>
          {degreeCourseId && (
            <Button className="mt-4" onClick={async () => {
              const res = await api.get(`/teacher/degree-courses/${degreeCourseId}/students`);
              const records = (res.data.data || []).map((s) => ({ studentId: s.student.id, status: 'PRESENT' }));
              await api.post(`/teacher/degree-courses/${degreeCourseId}/attendance/mark`, { date, records });
              setMsg('Degree course attendance saved');
            }}>Mark All Present (Degree)</Button>
          )}
        </div>
      )}
    </>
  );
}
