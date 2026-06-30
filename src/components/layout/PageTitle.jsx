export default function PageTitle({ title, subtitle, children }) {
  return (
    <header className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 bg-white px-6 py-4 -mx-6 -mt-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
        {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
      </div>
      {children}
    </header>
  );
}
