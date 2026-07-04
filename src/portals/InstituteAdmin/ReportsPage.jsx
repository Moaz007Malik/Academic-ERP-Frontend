import PageTitle from '../../components/layout/PageTitle';

export default function ReportsPage() {
  return (
    <>
      <PageTitle title="Reports" subtitle="Institute analytics and reports" />
      <div className="rounded-xl border border-gray-200 bg-white p-8 text-center shadow-sm">
        <p className="text-gray-600">Reports dashboard — enrollment, attendance, fees, and exam summaries.</p>
        <p className="mt-2 text-sm text-gray-400">Use dashboard KPIs and module-specific pages for detailed data exports.</p>
      </div>
    </>
  );
}
