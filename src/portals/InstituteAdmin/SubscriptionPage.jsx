import { useEffect, useState } from 'react';
import api from '../../services/api';
import PageTitle from '../../components/layout/PageTitle';
import Badge from '../../components/common/Badge';

export default function SubscriptionPage() {
  const [sub, setSub] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/subscription')
      .then((res) => setSub(res.data.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const isExpired = sub?.status === 'EXPIRED';

  return (
    <>
      <PageTitle title="Subscription" />
      {loading ? (
        <p className="text-gray-500">Loading...</p>
      ) : (
        <div className={`rounded-xl border p-6 ${isExpired ? 'border-red-200 bg-red-50' : 'border-gray-200 bg-white'}`}>
          <div className="flex flex-wrap items-center gap-3">
            <h3 className="text-lg font-semibold">{sub?.name}</h3>
            <Badge variant={isExpired ? 'danger' : 'success'}>{sub?.status}</Badge>
          </div>
          <dl className="mt-4 grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
            <div><dt className="text-gray-500">Institute Code</dt><dd className="font-medium">{sub?.code}</dd></div>
            <div><dt className="text-gray-500">Plan</dt><dd className="font-medium">{sub?.plan || '—'}</dd></div>
            <div><dt className="text-gray-500">Expiry Date</dt><dd className="font-medium">{sub?.expiryDate ? new Date(sub.expiryDate).toLocaleDateString() : '—'}</dd></div>
            <div><dt className="text-gray-500">Days Remaining</dt><dd className="font-medium">{sub?.daysRemaining ?? '—'}</dd></div>
            <div><dt className="text-gray-500">Storage</dt><dd className="font-medium">{((sub?.storageUsedMB || 0) / 1024).toFixed(1)} / {(sub?.storageQuotaMB / 1024).toFixed(0)} GB</dd></div>
            <div><dt className="text-gray-500">Active Modules</dt><dd className="font-medium">{sub?.activeModules?.length || 0}</dd></div>
          </dl>
          {isExpired && (
            <p className="mt-4 text-sm text-red-700">
              Your subscription has expired. Contact the Super Administrator to renew.
            </p>
          )}
        </div>
      )}
    </>
  );
}
