import { useEffect, useMemo, useState } from 'react';
import api from '../../services/api';
import PageTitle from '../../components/layout/PageTitle';
import Button from '../../components/common/Button';
import { useAsyncSubmit } from '../../hooks/useAsyncSubmit';
import Select from '../../components/common/Select';
import Badge from '../../components/common/Badge';
import { SectionCard, StatGrid, StatCard, EmptyState } from '../../components/layout/DetailPageLayout';

function gradeVariant(grade, isPassed) {
  if (isPassed === false) return 'danger';
  if (['A+', 'A'].includes(grade)) return 'success';
  if (['B+', 'B'].includes(grade)) return 'info';
  if (['C+', 'C', 'D'].includes(grade)) return 'warning';
  return 'default';
}

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

  const allSubjects = structure.classes?.flatMap((c) =>
    (c.subjects || []).map((s) => ({ ...s, className: c.name, deptName: c.department?.name }))
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

  const subjectResults = useMemo(
    () => existing.filter((r) => r.subjectId === subjectId),
    [existing, subjectId],
  );

  const summary = useMemo(() => {
    if (!subjectResults.length) return null;
    const passed = subjectResults.filter((r) => r.isPassed).length;
    const avg = subjectResults.reduce((s, r) => s + Number(r.totalMarks || 0), 0) / subjectResults.length;
    const max = Number(selectedExam?.theoryMax || 0) + Number(selectedExam?.practicalMax || 0) + Number(selectedExam?.internalMax || 0);
    const pct = max ? Math.round((avg / max) * 1000) / 10 : 0;
    return { entered: subjectResults.length, passed, failed: subjectResults.length - passed, avgPct: pct };
  }, [subjectResults, selectedExam]);

  return (
    <>
      <PageTitle title="Results Entry" subtitle="Enter theory, practical & internal marks" />
      {saved && (
        <div className="mb-4 rounded-lg border border-green-200 bg-green-50 px-4 py-2 text-sm text-green-800">{saved}</div>
      )}

      <SectionCard title="Select Exam & Subject">
        <div className="grid gap-4 sm:grid-cols-2">
          <Select label="Exam" value={examId} onChange={(e) => { setExamId(e.target.value); setSaved(''); }}>
            <option value="">Select exam</option>
            {exams.map((ex) => <option key={ex.id} value={ex.id}>{ex.name} ({ex.examType})</option>)}
          </Select>
          <Select label="Subject" value={subjectId} onChange={(e) => { setSubjectId(e.target.value); setSaved(''); }}>
            <option value="">Select subject</option>
            {allSubjects.map((s) => <option key={s.id} value={s.id}>{s.name}{s.className ? ` (${s.className})` : ''}</option>)}
          </Select>
        </div>
        {selectedExam && (
          <p className="mt-3 rounded-lg bg-gray-50 px-3 py-2 text-sm text-gray-600">
            Marking scheme: Theory {selectedExam.theoryMax} + Practical {selectedExam.practicalMax} + Internal {selectedExam.internalMax}
            {' = '}{Number(selectedExam.theoryMax) + Number(selectedExam.practicalMax) + Number(selectedExam.internalMax)}
            · Pass {selectedExam.passPercentage}%
            {selectedExam.section && ` · ${selectedExam.section.batch?.name} — ${selectedExam.section.name}`}
          </p>
        )}
      </SectionCard>

      {summary && (
        <div className="mt-4">
          <StatGrid cols={4}>
            <StatCard label="Entered" value={summary.entered} />
            <StatCard label="Passed" value={summary.passed} variant="success" />
            <StatCard label="Failed" value={summary.failed} variant="danger" />
            <StatCard label="Class Avg %" value={summary.avgPct} variant="info" />
          </StatGrid>
        </div>
      )}

      {examId && subjectId && students.length > 0 && (
        <div className="mt-4 space-y-4">
          <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Roll</th>
                  <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Student</th>
                  <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Theory</th>
                  <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Practical</th>
                  <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Internal</th>
                  <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Total</th>
                  <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Grade</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {students.map((s) => {
                  const prev = existing.find((r) => r.studentId === s.id && r.subjectId === subjectId);
                  const t = Number(marks[s.id]?.theoryMarks) || 0;
                  const p = Number(marks[s.id]?.practicalMarks) || 0;
                  const i = Number(marks[s.id]?.internalMarks) || 0;
                  const liveTotal = t + p + i;
                  return (
                    <tr key={s.id} className="hover:bg-gray-50/70">
                      <td className="px-3 py-2.5 font-mono text-xs text-gray-600">{s.rollNumber}</td>
                      <td className="px-3 py-2.5 font-medium">{s.firstName} {s.lastName}</td>
                      <td className="px-3 py-2.5">
                        <input type="number" className="w-16 rounded-md border border-gray-300 px-2 py-1.5 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500" value={marks[s.id]?.theoryMarks ?? ''} onChange={(e) => setMark(s.id, 'theoryMarks', e.target.value)} />
                      </td>
                      <td className="px-3 py-2.5">
                        <input type="number" className="w-16 rounded-md border border-gray-300 px-2 py-1.5 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500" value={marks[s.id]?.practicalMarks ?? ''} onChange={(e) => setMark(s.id, 'practicalMarks', e.target.value)} />
                      </td>
                      <td className="px-3 py-2.5">
                        <input type="number" className="w-16 rounded-md border border-gray-300 px-2 py-1.5 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500" value={marks[s.id]?.internalMarks ?? ''} onChange={(e) => setMark(s.id, 'internalMarks', e.target.value)} />
                      </td>
                      <td className="px-3 py-2.5 font-medium text-gray-800">{prev ? `${prev.totalMarks}/${prev.maxMarks}` : liveTotal || '—'}</td>
                      <td className="px-3 py-2.5">
                        {prev?.grade
                          ? <Badge variant={gradeVariant(prev.grade, prev.isPassed)}>{prev.grade}</Badge>
                          : <span className="text-xs text-gray-400">—</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <Button disabled={submitting} onClick={saveAll}>{submitting ? 'Saving...' : 'Save All Marks'}</Button>
        </div>
      )}

      {examId && subjectId && students.length === 0 && (
        <div className="mt-4"><EmptyState title="No students found" message="This exam section has no enrolled students." /></div>
      )}

      {(!examId || !subjectId) && (
        <div className="mt-4"><EmptyState title="Select exam and subject" message="Choose an exam and subject to enter marks." /></div>
      )}
    </>
  );
}
