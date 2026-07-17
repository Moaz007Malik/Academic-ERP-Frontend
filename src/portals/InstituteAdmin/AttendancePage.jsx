import { useEffect, useMemo, useState } from 'react';
import api from '../../services/api';
import PageTitle from '../../components/layout/PageTitle';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import Select from '../../components/common/Select';
import { SectionCard, StatGrid, StatCard, EmptyState } from '../../components/layout/DetailPageLayout';
import { useAsyncSubmit } from '../../hooks/useAsyncSubmit';

const STATUSES = ['PRESENT', 'ABSENT', 'LATE', 'LEAVE'];

const STATUS_STYLE = {
  PRESENT: 'success',
  ABSENT: 'danger',
  LATE: 'warning',
  LEAVE: 'info',
};

const STATUS_BTN = {
  PRESENT: 'border-green-300 bg-green-50 text-green-800',
  ABSENT: 'border-red-300 bg-red-50 text-red-800',
  LATE: 'border-amber-300 bg-amber-50 text-amber-800',
  LEAVE: 'border-blue-300 bg-blue-50 text-blue-800',
};

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

  const allSubjects = structure.classes?.flatMap((c) =>
    (c.subjects || []).map((s) => ({ ...s, className: c.name, deptName: c.department?.name }))
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

  const markSummary = useMemo(() => {
    const acc = { total: students.length, PRESENT: 0, ABSENT: 0, LATE: 0, LEAVE: 0 };
    students.forEach((s) => {
      const st = records[s.id] || 'PRESENT';
      acc[st] = (acc[st] || 0) + 1;
    });
    return acc;
  }, [students, records]);

  const viewSummary = savedRecords.reduce(
    (acc, r) => {
      acc.total += 1;
      acc[r.status] = (acc[r.status] || 0) + 1;
      return acc;
    },
    { total: 0, PRESENT: 0, ABSENT: 0, LATE: 0, LEAVE: 0 },
  );

  const setAll = (status) => {
    const next = {};
    students.forEach((s) => { next[s.id] = status; });
    setRecords(next);
  };

  return (
    <>
      <PageTitle title="Attendance" subtitle="Mark and review daily class attendance" />
      {msg && (
        <div className="mb-4 rounded-lg border border-green-200 bg-green-50 px-4 py-2 text-sm text-green-800">{msg}</div>
      )}

      <div className="mb-4 flex gap-1 rounded-xl border border-gray-200 bg-white p-1">
        {['mark', 'view'].map((t) => (
          <button
            key={t}
            type="button"
            className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium transition ${tab === t ? 'bg-primary-600 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-50'}`}
            onClick={() => setTab(t)}
          >
            {t === 'mark' ? 'Mark Attendance' : 'View Saved'}
          </button>
        ))}
      </div>

      <SectionCard title="Filters">
        <div className="grid gap-4 sm:grid-cols-3">
          <Select label="Section" value={sectionId} onChange={(e) => setSectionId(e.target.value)}>
            <option value="">Select section</option>
            {structure.sections?.map((s) => (
              <option key={s.id} value={s.id}>{s.batch?.name} — Section {s.name}</option>
            ))}
          </Select>
          <Select label="Subject" value={subjectId} onChange={(e) => setSubjectId(e.target.value)}>
            <option value="">Select subject</option>
            {allSubjects.map((s) => <option key={s.id} value={s.id}>{s.name}{s.className ? ` (${s.className})` : ''}</option>)}
          </Select>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Date</label>
            <input type="date" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
        </div>
      </SectionCard>

      {tab === 'mark' && sectionId && subjectId && students.length > 0 && (
        <div className="mt-4 space-y-4">
          <StatGrid cols={4}>
            <StatCard label="Present" value={markSummary.PRESENT} variant="success" />
            <StatCard label="Absent" value={markSummary.ABSENT} variant="danger" />
            <StatCard label="Late" value={markSummary.LATE} variant="warning" />
            <StatCard label="Leave" value={markSummary.LEAVE} variant="info" />
          </StatGrid>

          <div className="flex flex-wrap gap-2">
            {STATUSES.map((st) => (
              <button key={st} type="button" onClick={() => setAll(st)} className={`rounded-lg border px-3 py-1.5 text-xs font-medium ${STATUS_BTN[st]}`}>
                Mark all {st.toLowerCase()}
              </button>
            ))}
          </div>

          <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Roll</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Student</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {students.map((s) => (
                  <tr key={s.id} className="hover:bg-gray-50/80">
                    <td className="px-4 py-3 font-mono text-xs text-gray-600">{s.rollNumber}</td>
                    <td className="px-4 py-3 font-medium text-gray-900">{s.firstName} {s.lastName}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1.5">
                        {STATUSES.map((st) => (
                          <button
                            key={st}
                            type="button"
                            onClick={() => setRecords({ ...records, [s.id]: st })}
                            className={`rounded-md border px-2.5 py-1 text-xs font-medium transition ${(records[s.id] || 'PRESENT') === st ? STATUS_BTN[st] : 'border-gray-200 bg-white text-gray-500 hover:bg-gray-50'}`}
                          >
                            {st.charAt(0) + st.slice(1).toLowerCase()}
                          </button>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Button disabled={submitting} onClick={save}>{submitting ? 'Saving...' : 'Save Attendance'}</Button>
        </div>
      )}

      {tab === 'mark' && sectionId && subjectId && students.length === 0 && (
        <div className="mt-4"><EmptyState title="No students in this section" /></div>
      )}

      {tab === 'view' && sectionId && subjectId && (
        <div className="mt-4 space-y-4">
          {savedRecords.length > 0 && (
            <StatGrid cols={4}>
              <StatCard label="Present" value={viewSummary.PRESENT} variant="success" />
              <StatCard label="Absent" value={viewSummary.ABSENT} variant="danger" />
              <StatCard label="Late" value={viewSummary.LATE} variant="warning" />
              <StatCard label="Leave" value={viewSummary.LEAVE} variant="info" />
            </StatGrid>
          )}
          <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Roll</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Name</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Status</th>
                </tr>
              </thead>
              <tbody>
                {savedRecords.length === 0 ? (
                  <tr><td colSpan={3} className="px-4 py-10 text-center text-gray-500">No attendance marked for this date yet</td></tr>
                ) : savedRecords.map((r) => (
                  <tr key={r.id} className="border-b border-gray-100">
                    <td className="px-4 py-3 font-mono text-xs">{r.student?.rollNumber}</td>
                    <td className="px-4 py-3 font-medium">{r.student?.firstName} {r.student?.lastName}</td>
                    <td className="px-4 py-3"><Badge variant={STATUS_STYLE[r.status] || 'default'}>{r.status}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {(!sectionId || !subjectId) && (
        <div className="mt-4"><EmptyState title="Select section and subject" message="Choose filters above to mark or view attendance." /></div>
      )}
    </>
  );
}
