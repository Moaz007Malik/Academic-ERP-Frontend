import { useEffect, useState } from 'react';
import api from '../../services/api';
import PageTitle from '../../components/layout/PageTitle';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import Select from '../../components/common/Select';
import { useAsyncSubmit } from '../../hooks/useAsyncSubmit';

const STATUSES = ['PRESENT', 'ABSENT', 'LATE', 'LEAVE'];

export default function AttendancePage() {
  const [structure, setStructure] = useState({});
  const [sectionId, setSectionId] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [students, setStudents] = useState([]);
  const [records, setRecords] = useState({});
  const [savedRecords, setSavedRecords] = useState([]);
  const [msg, setMsg] = useState('');
  const [tab, setTab] = useState('mark');
  const { submitting, run } = useAsyncSubmit();

  const allSubjects = structure.departments?.flatMap((d) =>
    d.courses?.flatMap((c) => c.subjects || []) || []
  ) || [];

  useEffect(() => {
    api.get('/admin/academic/structure').then((res) => setStructure(res.data.data || {}));
  }, []);

  useEffect(() => {
    if (!sectionId) {
      setStudents([]);
      return;
    }
    api.get(`/admin/students?sectionId=${sectionId}&limit=100`)
      .then((res) => {
        const list = res.data.data || [];
        setStudents(list);
        const init = {};
        list.forEach((s) => { init[s.id] = 'PRESENT'; });
        setRecords(init);
      })
      .catch(console.error);
  }, [sectionId]);

  useEffect(() => {
    if (!sectionId || !subjectId || !date) return;
    api.get(`/admin/attendance?date=${date}&sectionId=${sectionId}&subjectId=${subjectId}`)
      .then((res) => {
        const list = res.data.data || [];
        setSavedRecords(list);
        if (list.length && students.length) {
          const merged = { ...records };
          list.forEach((r) => { merged[r.studentId] = r.status; });
          setRecords(merged);
        }
      })
      .catch(console.error);
  }, [sectionId, subjectId, date, students.length]);

  const save = async () => {
    setMsg('');
    const { skipped } = await run(async () => {
      const payload = students.map((s) => ({ studentId: s.id, status: records[s.id] || 'PRESENT' }));
      await api.post('/admin/attendance/mark', { date, subjectId, sectionId, records: payload });
      setMsg('Attendance saved successfully');
      const res = await api.get(`/admin/attendance?date=${date}&sectionId=${sectionId}&subjectId=${subjectId}`);
      setSavedRecords(res.data.data || []);
    });
    if (skipped) setMsg('Please wait, saving...');
  };

  const summary = savedRecords.reduce(
    (acc, r) => {
      acc.total += 1;
      acc[r.status] = (acc[r.status] || 0) + 1;
      return acc;
    },
    { total: 0, PRESENT: 0, ABSENT: 0, LATE: 0, LEAVE: 0 },
  );

  return (
    <>
      <PageTitle title="Attendance" />
      {msg && <p className="mb-4 text-sm text-green-600">{msg}</p>}

      <div className="mb-4 flex gap-2 border-b border-gray-200">
        <button type="button" className={`px-4 py-2 text-sm font-medium ${tab === 'mark' ? 'border-b-2 border-primary-600 text-primary-700' : 'text-gray-500'}`} onClick={() => setTab('mark')}>Mark Attendance</button>
        <button type="button" className={`px-4 py-2 text-sm font-medium ${tab === 'view' ? 'border-b-2 border-primary-600 text-primary-700' : 'text-gray-500'}`} onClick={() => setTab('view')}>View Saved</button>
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <Select label="Section" value={sectionId} onChange={(e) => setSectionId(e.target.value)}>
          <option value="">Select section</option>
          {structure.sections?.map((s) => (
            <option key={s.id} value={s.id}>{s.batch?.name} — Section {s.name}</option>
          ))}
        </Select>
        <Select label="Subject" value={subjectId} onChange={(e) => setSubjectId(e.target.value)}>
          <option value="">Select subject</option>
          {allSubjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </Select>
        <div>
          <label className="block text-sm font-medium text-gray-700">Date</label>
          <input type="date" className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
      </div>

      {tab === 'mark' && sectionId && subjectId && students.length > 0 && (
        <>
          <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left">Roll</th>
                  <th className="px-4 py-2 text-left">Name</th>
                  <th className="px-4 py-2 text-left">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {students.map((s) => (
                  <tr key={s.id}>
                    <td className="px-4 py-2 font-mono">{s.rollNumber}</td>
                    <td className="px-4 py-2">{s.firstName} {s.lastName}</td>
                    <td className="px-4 py-2">
                      <select className="rounded border px-2 py-1" value={records[s.id] || 'PRESENT'} onChange={(e) => setRecords({ ...records, [s.id]: e.target.value })}>
                        {STATUSES.map((st) => <option key={st} value={st}>{st}</option>)}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Button className="mt-4" disabled={submitting} onClick={save}>{submitting ? 'Saving...' : 'Save Attendance'}</Button>
        </>
      )}

      {tab === 'mark' && sectionId && subjectId && students.length === 0 && (
        <p className="text-sm text-gray-500">No students in this section.</p>
      )}

      {tab === 'view' && sectionId && subjectId && (
        <>
          {savedRecords.length > 0 && (
            <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm">Present: <strong>{summary.PRESENT}</strong></div>
              <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm">Absent: <strong>{summary.ABSENT}</strong></div>
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm">Late: <strong>{summary.LATE}</strong></div>
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm">Leave: <strong>{summary.LEAVE}</strong></div>
            </div>
          )}
          <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left">Roll</th>
                  <th className="px-4 py-2 text-left">Name</th>
                  <th className="px-4 py-2 text-left">Status</th>
                </tr>
              </thead>
              <tbody>
                {savedRecords.length === 0 ? (
                  <tr><td colSpan={3} className="px-4 py-8 text-center text-gray-500">No attendance marked for this date yet</td></tr>
                ) : savedRecords.map((r) => (
                  <tr key={r.id} className="border-b border-gray-100">
                    <td className="px-4 py-2 font-mono">{r.student?.rollNumber}</td>
                    <td className="px-4 py-2">{r.student?.firstName} {r.student?.lastName}</td>
                    <td className="px-4 py-2"><Badge variant={r.status === 'PRESENT' ? 'success' : r.status === 'ABSENT' ? 'danger' : 'default'}>{r.status}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </>
  );
}
