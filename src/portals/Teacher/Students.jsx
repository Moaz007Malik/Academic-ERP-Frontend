import { useEffect, useState } from 'react';
import api from '../../services/api';
import PageTitle from '../../components/layout/PageTitle';

export default function TeacherStudents() {
  const [students, setStudents] = useState([]);

  useEffect(() => {
    api.get('/teacher/students').then((res) => setStudents(res.data.data || [])).catch(console.error);
  }, []);

  return (
    <>
      <PageTitle title="My Students" />
      <table className="min-w-full rounded-xl border border-gray-200 bg-white text-sm shadow-sm">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-left">Roll</th>
            <th className="px-4 py-3 text-left">Name</th>
            <th className="px-4 py-3 text-left">Class</th>
            <th className="px-4 py-3 text-left">Section</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {students.map((s) => (
            <tr key={s.id}>
              <td className="px-4 py-3 font-mono">{s.rollNumber}</td>
              <td className="px-4 py-3">{s.firstName} {s.lastName}</td>
              <td className="px-4 py-3">{s.currentBatch?.name}</td>
              <td className="px-4 py-3">{s.currentSection?.name}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
