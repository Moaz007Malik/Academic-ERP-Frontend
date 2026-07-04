import { useEffect, useState } from 'react';
import api from '../../services/api';
import PageTitle from '../../components/layout/PageTitle';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import ModuleViewer from '../../components/modules/ModuleViewer';

export default function SubscriptionPage() {
  const [sub, setSub] = useState(null);
  const [loading, setLoading] = useState(true);
  const [modulesOpen, setModulesOpen] = useState(false);

  useEffect(() => {
    api.get('/admin/subscription')
      .then((res) => setSub(res.data.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const isExpired = sub?.status === 'EXPIRED';
  const summary = sub?.moduleSummary;

  return (
    <>
      <PageTitle title="Subscription & Institute" />

      {loading ? (
        <p className="text-gray-500">Loading...</p>
      ) : (
        <>
          <div className={`mb-6 rounded-xl border p-6 ${isExpired ? 'border-red-200 bg-red-50' : 'border-gray-200 bg-white shadow-sm'}`}>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-3">
                {sub?.logo && (
                  <img src={sub.logo} alt="" className="h-12 w-12 rounded-lg border object-contain bg-white" />
                )}
                <div>
                  <h3 className="text-lg font-semibold">{sub?.name}</h3>
                  <p className="text-sm text-gray-500 font-mono">{sub?.code}</p>
                </div>
                <Badge variant={isExpired ? 'danger' : 'success'}>{sub?.status}</Badge>
              </div>
              <Button variant="secondary" onClick={() => setModulesOpen(true)}>
                View modules
              </Button>
            </div>

            <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2 lg:grid-cols-3">
              <div><dt className="text-gray-500">Plan</dt><dd className="font-medium">{sub?.plan || '—'}</dd></div>
              <div><dt className="text-gray-500">Expiry Date</dt><dd className="font-medium">{sub?.expiryDate ? new Date(sub.expiryDate).toLocaleDateString() : '—'}</dd></div>
              <div><dt className="text-gray-500">Days Remaining</dt><dd className="font-medium">{sub?.daysRemaining ?? '—'}</dd></div>
              <div><dt className="text-gray-500">Storage</dt><dd className="font-medium">{((sub?.storageUsedMB || 0) / 1024).toFixed(1)} / {(sub?.storageQuotaMB / 1024).toFixed(0)} GB</dd></div>
              <div><dt className="text-gray-500">Contact Email</dt><dd className="font-medium">{sub?.email || '—'}</dd></div>
              <div><dt className="text-gray-500">Phone</dt><dd className="font-medium">{sub?.phone || '—'}</dd></div>
              <div><dt className="text-gray-500">Active Modules</dt><dd className="font-medium">{sub?.activeModules?.length || 0} enabled</dd></div>
              {sub?.address && (
                <div className="sm:col-span-2"><dt className="text-gray-500">Address</dt><dd className="font-medium">{sub.address}</dd></div>
              )}
            </dl>

            {summary && (
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <div className="rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm">
                  <span className="font-semibold text-green-700">{summary.activeCount}</span> active
                </div>
                <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm">
                  <span className="font-semibold text-amber-700">{summary.disabledCount}</span> disabled
                </div>
                <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm">
                  <span className="font-semibold text-gray-700">{summary.totalCount}</span> total available
                </div>
              </div>
            )}

            {isExpired && (
              <p className="mt-4 text-sm text-red-700">
                Your subscription has expired. Contact the Super Administrator to renew.
              </p>
            )}
          </div>

          <p className="text-xs text-gray-500">
            Module access is managed by the Super Administrator. Use &quot;View modules&quot; to see which features are enabled for your institute.
          </p>
        </>
      )}

      <Modal open={modulesOpen} onClose={() => setModulesOpen(false)} title="Your active modules" wide>
        <ModuleViewer activeModules={sub?.activeModules || []} />
        <div className="mt-4 flex justify-end">
          <Button variant="secondary" onClick={() => setModulesOpen(false)}>Close</Button>
        </div>
      </Modal>
    </>
  );
}
