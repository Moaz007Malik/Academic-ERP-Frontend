import { useEffect, useState } from 'react';
import api from '../../services/api';
import PageTitle from '../../components/layout/PageTitle';

export default function StudentProfile() {
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    api.get('/student/profile').then((res) => setProfile(res.data.data)).catch(console.error);
  }, []);

  if (!profile) return <p className="text-gray-500">Loading...</p>;

  const fields = [
    ['Roll Number', profile.rollNumber],
    ['Name', `${profile.firstName} ${profile.lastName}`],
    ['Class', profile.currentBatch?.name],
    ['Section', profile.currentSection?.name],
    ['Gender', profile.gender],
    ['Phone', profile.phone],
    ['Guardian', profile.guardianName],
    ['Guardian Phone', profile.guardianPhone],
    ['Institute', profile.institute?.name],
    ['Status', profile.status],
  ];

  return (
    <>
      <PageTitle title="My Profile" />
      <div className="max-w-lg rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <dl className="space-y-3 text-sm">
          {fields.map(([label, value]) => (
            <div key={label} className="flex justify-between border-b border-gray-50 pb-2">
              <dt className="text-gray-500">{label}</dt>
              <dd className="font-medium">{value || '—'}</dd>
            </div>
          ))}
        </dl>
      </div>
    </>
  );
}
