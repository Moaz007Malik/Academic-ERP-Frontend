import { useEffect, useState } from 'react';
import api from '../../services/api';
import PageTitle from '../../components/layout/PageTitle';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function TeacherTimetable() {
  const [items, setItems] = useState([]);

  useEffect(() => {
    api.get('/teacher/timetable').then((res) => setItems(res.data.data || []));
  }, []);

  return (
    <>
      <PageTitle title="My Timetable" />
      <div className="overflow-x-auto rounded-xl border bg-white shadow-sm">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left">Day</th>
              <th className="px-4 py-2 text-left">Time</th>
              <th className="px-4 py-2 text-left">Subject</th>
              <th className="px-4 py-2 text-left">Class</th>
              <th className="px-4 py-2 text-left">Room</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {items.map((t) => (
              <tr key={t.id}>
                <td className="px-4 py-2">{DAYS[t.dayOfWeek] || t.dayOfWeek}</td>
                <td className="px-4 py-2">{t.startTime} – {t.endTime}</td>
                <td className="px-4 py-2">{t.subject?.name}</td>
                <td className="px-4 py-2">{t.section?.batch?.name} / {t.section?.name}</td>
                <td className="px-4 py-2">{t.room || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
