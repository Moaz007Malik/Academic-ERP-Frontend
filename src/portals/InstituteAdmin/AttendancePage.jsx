import { useEffect, useState } from 'react';
import api from '../../services/api';
import PageTitle from '../../components/layout/PageTitle';
import Button from '../../components/common/Button';
import { useAsyncSubmit } from '../../hooks/useAsyncSubmit';
import Select from '../../components/common/Select';

const STATUSES = ['PRESENT', 'ABSENT', 'LATE', 'LEAVE'];

export default function AttendancePage() {
  const [structure, setStructure] = useState({});
  const [sectionId, setSectionId] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [students, setStudents] = useState([]);
  const [records, setRecords] = useState({});
  const [msg, setMsg] = useState('');
  const { submitting, run } = useAsyncSubmit();

  const allSubjects = structure.departments?.flatMap((d) =>
    d.courses?.flatMap((c) => c.subjects || []) || []
  ) || [];

  useEffect(() => {
    api.get('/admin/academic/structure').then((res) => setStructure(res.data.data || {}));
  }, []);

  useEffect(() => {
    if (!sectionId) return;
    api.get(`/admin/students?sectionId=${sectionId}&limit=100`)
      .then((res) => {
        const list = res.data.data || [];
        setStudents(list);
        const init = {};
        list.forEach((s) => { init[s.id] = 'PRESENT'; });
        setRecords(init);
      });
  }, [sectionId]);

  const save = async () => {
    const { skipped } = await run(async () => {
      const payload = students.map((s) => ({ studentId: s.id, status: records[s.id] || 'PRESENT' }));
      await api.post('/admin/attendance/mark', { date, subjectId, sectionId, records: payload });
      setMsg('Attendance saved');
    });
    if (skipped) setMsg('Please wait, saving...');
  };

  return (
    <>
      <PageTitle title="Attendance" />
      {msg && <p className="mb-4 text-sm text-green-600">{msg}</p>}

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

      {sectionId && subjectId && students.length > 0 && (
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
    </>
  );
}
