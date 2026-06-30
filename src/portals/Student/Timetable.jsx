import { useEffect, useState } from 'react';
import api from '../../services/api';
import PageTitle from '../../components/layout/PageTitle';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function StudentTimetable() {
  const [timetable, setTimetable] = useState([]);

  useEffect(() => {
    api.get('/student/timetable').then((res) => setTimetable(res.data.data || [])).catch(console.error);
  }, []);

  const byDay = {};
  timetable.forEach((t) => {
    if (!byDay[t.dayOfWeek]) byDay[t.dayOfWeek] = [];
    byDay[t.dayOfWeek].push(t);
  });

  return (
    <>
      <PageTitle title="Timetable" />
      {timetable.length === 0 ? (
        <p className="text-gray-500">No timetable assigned yet.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Object.keys(byDay).sort().map((day) => (
            <div key={day} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
              <h3 className="mb-2 font-semibold">{DAYS[Number(day)] || `Day ${day}`}</h3>
              <ul className="space-y-2 text-sm">
                {byDay[day].map((t) => (
                  <li key={t.id} className="rounded bg-gray-50 p-2">
                    <p className="font-medium">{t.subject?.name}</p>
                    <p className="text-xs text-gray-500">{t.startTime} — {t.endTime}</p>
                    {t.teacher && <p className="text-xs text-gray-500">{t.teacher.firstName} {t.teacher.lastName}</p>}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
