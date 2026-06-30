import { useEffect, useState } from 'react';
import api from '../../services/api';
import PageTitle from '../../components/layout/PageTitle';
import Button from '../../components/common/Button';
import Select from '../../components/common/Select';
import { useAsyncSubmit } from '../../hooks/useAsyncSubmit';

export default function TeacherMarks() {
  const [dashboard, setDashboard] = useState(null);
  const [exams, setExams] = useState([]);
  const [examId, setExamId] = useState('');
  const [sectionId, setSectionId] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [students, setStudents] = useState([]);
  const [marks, setMarks] = useState({});
  const [msg, setMsg] = useState('');
  const { submitting, run } = useAsyncSubmit();

  useEffect(() => {
    Promise.all([api.get('/teacher/dashboard'), api.get('/teacher/exams')])
      .then(([dRes, eRes]) => {
        setDashboard(dRes.data.data);
        setExams(eRes.data.data || []);
      });
  }, []);

  const assignments = dashboard?.assignments || [];
  const sections = [...new Map(assignments.map((a) => [a.sectionId, a.section])).values()];

  useEffect(() => {
    if (!sectionId) return;
    api.get('/teacher/students').then((res) => {
      setStudents((res.data.data || []).filter((s) => s.currentSectionId === sectionId));
    });
  }, [sectionId]);

  const save = async () => {
    const { skipped } = await run(async () => {
      const entries = students.map((s) => ({
        studentId: s.id,
        theoryMarks: Number(marks[s.id]?.theory) || 0,
        practicalMarks: Number(marks[s.id]?.practical) || 0,
        internalMarks: Number(marks[s.id]?.internal) || 0,
      }));
      await api.post('/teacher/marks', { examId, subjectId, sectionId, entries });
      setMsg('Marks saved');
    });
    if (skipped) setMsg('Please wait...');
  };

  const exam = exams.find((e) => e.id === examId);

  return (
    <>
      <PageTitle title="Enter Marks" subtitle="Theory + Practical + Internal (Pakistani system)" />
      {msg && <p className="mb-4 text-sm text-green-600">{msg}</p>}
      <div className="mb-6 grid gap-4 sm:grid-cols-2">
        <Select label="Exam" value={examId} onChange={(e) => setExamId(e.target.value)}>
          <option value="">Select exam</option>
          {exams.map((ex) => <option key={ex.id} value={ex.id}>{ex.name}</option>)}
        </Select>
        <Select label="Section" value={sectionId} onChange={(e) => setSectionId(e.target.value)}>
          <option value="">Select</option>
          {sections.map((s) => <option key={s.id} value={s.id}>{s.batch?.name} — {s.name}</option>)}
        </Select>
        <Select label="Subject" value={subjectId} onChange={(e) => setSubjectId(e.target.value)}>
          <option value="">Select</option>
          {assignments.filter((a) => a.sectionId === sectionId).map((a) => (
            <option key={a.subjectId} value={a.subjectId}>{a.subject?.name}</option>
          ))}
        </Select>
      </div>
      {exam && <p className="mb-4 text-sm text-gray-600">Max: {exam.theoryMax}+{exam.practicalMax}+{exam.internalMax}</p>}
      {examId && sectionId && subjectId && students.length > 0 && (
        <>
          <table className="min-w-full rounded-xl border text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 text-left">Roll</th>
                <th className="px-3 py-2 text-left">Name</th>
                <th className="px-3 py-2">Theory</th>
                <th className="px-3 py-2">Practical</th>
                <th className="px-3 py-2">Internal</th>
              </tr>
            </thead>
            <tbody>
              {students.map((s) => (
                <tr key={s.id} className="border-t">
                  <td className="px-3 py-2">{s.rollNumber}</td>
                  <td className="px-3 py-2">{s.firstName} {s.lastName}</td>
                  {['theory', 'practical', 'internal'].map((f) => (
                    <td key={f} className="px-3 py-2 text-center">
                      <input type="number" className="w-16 rounded border px-1 py-0.5" value={marks[s.id]?.[f] ?? ''} onChange={(e) => setMarks({ ...marks, [s.id]: { ...marks[s.id], [f]: e.target.value } })} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          <Button className="mt-4" disabled={submitting} onClick={save}>{submitting ? 'Saving...' : 'Save Marks'}</Button>
        </>
      )}
    </>
  );
}
