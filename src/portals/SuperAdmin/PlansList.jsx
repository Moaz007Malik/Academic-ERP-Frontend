import { useEffect, useState } from 'react';
import api from '../../services/api';
import PageTitle from '../../components/layout/PageTitle';
import Badge from '../../components/common/Badge';

export default function PlansList() {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/sa/plans')
      .then((res) => setPlans(res.data.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <PageTitle title="Subscription Plans" />
      {loading ? (
        <p className="text-gray-500">Loading plans...</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {plans.map((plan) => (
            <div key={plan.id} className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">{plan.name}</h3>
                <Badge variant="info">{plan.billingCycle}</Badge>
              </div>
              <p className="mt-2 text-2xl font-bold text-primary-700">
                PKR {Number(plan.price).toLocaleString()}
              </p>
              <ul className="mt-4 space-y-1 text-sm text-gray-600">
                <li>Storage: {(plan.storageQuotaMB / 1024).toFixed(0)} GB</li>
                <li>Max users: {plan.maxUsers >= 999999 ? 'Unlimited' : plan.maxUsers}</li>
                <li>Modules: {plan.allowedModules?.length || 0}</li>
              </ul>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
