import { useEffect, useState } from 'react';
import api from '../../services/api';
import PageTitle from '../../components/layout/PageTitle';
import Badge from '../../components/common/Badge';

export default function StudentNotifications() {
  const [items, setItems] = useState([]);

  useEffect(() => {
    api.get('/student/notifications').then((res) => setItems(res.data.data || []));
  }, []);

  return (
    <>
      <PageTitle title="Notifications" />
      {items.length === 0 ? <p className="text-gray-500">No announcements yet.</p> : (
        <div className="space-y-3">
          {items.map((n) => (
            <div key={n.id} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
              <h3 className="font-medium">{n.title}</h3>
              <p className="mt-1 text-sm text-gray-600">{n.content}</p>
              <p className="mt-2 text-xs text-gray-400">{new Date(n.publishedAt).toLocaleString()}</p>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
