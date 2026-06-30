import { useEffect, useState } from 'react';
import api from '../../services/api';
import PageTitle from '../../components/layout/PageTitle';
import Button from '../../components/common/Button';
import { useAsyncSubmit } from '../../hooks/useAsyncSubmit';
import Select from '../../components/common/Select';
import Badge from '../../components/common/Badge';

export default function ResultsPage() {
  const [exams, setExams] = useState([]);
  const [structure, setStructure] = useState({});
  const [examId, setExamId] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [students, setStudents] = useState([]);
  const [marks, setMarks] = useState({});
  const [saved, setSaved] = useState('');
  const { submitting, run } = useAsyncSubmit();
  const [existing, setExisting] = useState([]);

  const allSubjects = structure.departments?.flatMap((d) =>
    d.courses?.flatMap((c) => c.subjects || []) || []
  ) || [];

  useEffect(() => {
    Promise.all([api.get('/admin/exams'), api.get('/admin/academic/structure')])
      .then(([eRes, aRes]) => {
        setExams(eRes.data.data || []);
        setStructure(aRes.data.data || {});
      });
  }, []);

  useEffect(() => {
    if (!examId) return;
    api.get(`/admin/results/exam/${examId}`).then((res) => setExisting(res.data.data?.results || []));
  }, [examId]);

  useEffect(() => {
    const exam = exams.find((e) => e.id === examId);
    if (!exam?.sectionId) { setStudents([]); return; }
    api.get(`/admin/students?sectionId=${exam.sectionId}&limit=100`)
      .then((res) => {
        const list = res.data.data || [];
        setStudents(list);
        const init = {};
        list.forEach((s) => {
          const prev = existing.find((r) => r.studentId === s.id && r.subjectId === subjectId);
          init[s.id] = {
            theoryMarks: prev?.theoryMarks ?? '',
            practicalMarks: prev?.practicalMarks ?? '',
            internalMarks: prev?.internalMarks ?? '',
          };
        });
        setMarks(init);
      });
  }, [examId, subjectId, exams, existing]);

  const setMark = (studentId, field, value) => {
    setMarks((m) => ({ ...m, [studentId]: { ...m[studentId], [field]: value } }));
  };

  const saveAll = async () => {
    const { skipped } = await run(async () => {
      const entries = students.map((s) => ({
        studentId: s.id,
        theoryMarks: Number(marks[s.id]?.theoryMarks) || 0,
        practicalMarks: Number(marks[s.id]?.practicalMarks) || 0,
        internalMarks: Number(marks[s.id]?.internalMarks) || 0,
      }));
      await api.post('/admin/results/bulk', { examId, subjectId, entries });
      setSaved('Marks saved successfully');
      api.get(`/admin/results/exam/${examId}`).then((res) => setExisting(res.data.data?.results || []));
    });
    if (skipped) setSaved('Please wait, saving...');
  };

  const selectedExam = exams.find((e) => e.id === examId);

  return (
    <>
      <PageTitle title="Results Entry" subtitle="Enter theory, practical & internal marks (Pakistani system)" />
      {saved && <p className="mb-4 text-sm text-green-600">{saved}</p>}

      <div className="mb-6 grid gap-4 sm:grid-cols-2">
        <Select label="Exam" value={examId} onChange={(e) => { setExamId(e.target.value); setSaved(''); }}>
          <option value="">Select exam</option>
          {exams.map((ex) => <option key={ex.id} value={ex.id}>{ex.name} ({ex.examType})</option>)}
        </Select>
        <Select label="Subject" value={subjectId} onChange={(e) => { setSubjectId(e.target.value); setSaved(''); }}>
          <option value="">Select subject</option>
          {allSubjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </Select>
      </div>

      {selectedExam && (
        <p className="mb-4 text-sm text-gray-600">
          Marking scheme: Theory {selectedExam.theoryMax} + Practical {selectedExam.practicalMax} + Internal {selectedExam.internalMax} = 100 · Pass {selectedExam.passPercentage}%
        </p>
      )}

      {examId && subjectId && students.length > 0 && (
        <>
          <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left">Roll</th>
                  <th className="px-3 py-2 text-left">Student</th>
                  <th className="px-3 py-2 text-left">Theory</th>
                  <th className="px-3 py-2 text-left">Practical</th>
                  <th className="px-3 py-2 text-left">Internal</th>
                  <th className="px-3 py-2 text-left">Grade</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {students.map((s) => {
                  const prev = existing.find((r) => r.studentId === s.id && r.subjectId === subjectId);
                  return (
                    <tr key={s.id}>
                      <td className="px-3 py-2 font-mono">{s.rollNumber}</td>
                      <td className="px-3 py-2">{s.firstName} {s.lastName}</td>
                      <td className="px-3 py-2">
                        <input type="number" className="w-16 rounded border px-2 py-1" value={marks[s.id]?.theoryMarks ?? ''} onChange={(e) => setMark(s.id, 'theoryMarks', e.target.value)} />
                      </td>
                      <td className="px-3 py-2">
                        <input type="number" className="w-16 rounded border px-2 py-1" value={marks[s.id]?.practicalMarks ?? ''} onChange={(e) => setMark(s.id, 'practicalMarks', e.target.value)} />
                      </td>
                      <td className="px-3 py-2">
                        <input type="number" className="w-16 rounded border px-2 py-1" value={marks[s.id]?.internalMarks ?? ''} onChange={(e) => setMark(s.id, 'internalMarks', e.target.value)} />
                      </td>
                      <td className="px-3 py-2">
                        {prev?.grade && <Badge variant={prev.isPassed ? 'success' : 'danger'}>{prev.grade} ({prev.totalMarks}/{prev.maxMarks})</Badge>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="mt-4">
            <Button disabled={submitting} onClick={saveAll}>{submitting ? 'Saving...' : 'Save All Marks'}</Button>
          </div>
        </>
      )}
    </>
  );
}
