import { useEffect, useState } from 'react';
import api from '../../services/api';
import PageTitle from '../../components/layout/PageTitle';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import Badge from '../../components/common/Badge';

export default function TeacherSalary() {
  const [salaries, setSalaries] = useState([]);

  useEffect(() => {
    api.get('/teacher/salary').then((res) => setSalaries(res.data.data || []));
  }, []);

  return (
    <>
      <PageTitle title="Salary Information" subtitle="Monthly salary slips and deductions" />
      <div className="overflow-x-auto rounded-xl border bg-white shadow-sm">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left">Month</th>
              <th className="px-4 py-2 text-left">Gross</th>
              <th className="px-4 py-2 text-left">Deductions</th>
              <th className="px-4 py-2 text-left">Net</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {salaries.map((s) => (
              <tr key={s.id}>
                <td className="px-4 py-2">{s.month}/{s.year}</td>
                <td className="px-4 py-2">Rs. {Number(s.amount).toLocaleString()}</td>
                <td className="px-4 py-2">Rs. {Number(s.deductions).toLocaleString()}</td>
                <td className="px-4 py-2 font-medium">Rs. {Number(s.netAmount).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
