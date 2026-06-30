import { useEffect, useState } from 'react';
import api from '../../services/api';
import PageTitle from '../../components/layout/PageTitle';

export default function TeacherClasses() {
  const [classes, setClasses] = useState([]);

  useEffect(() => {
    api.get('/teacher/classes').then((res) => setClasses(res.data.data || [])).catch(console.error);
  }, []);

  return (
    <>
      <PageTitle title="My Classes" />
      <div className="grid gap-4 sm:grid-cols-2">
        {classes.map((c, i) => (
          <div key={i} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <h3 className="font-semibold">{c.section?.batch?.name} — Section {c.section?.name}</h3>
            <p className="mt-2 text-sm text-gray-600">Students: {c.section?.students?.length || 0}</p>
            <div className="mt-3 flex flex-wrap gap-1">
              {c.subjects?.map((s) => (
                <span key={s.id} className="rounded-full bg-primary-50 px-2 py-0.5 text-xs text-primary-800">{s.name}</span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
