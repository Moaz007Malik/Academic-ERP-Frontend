import Sidebar from '../layout/Sidebar';

export default function PageWrapper({ title, children, sidebar }) {
  return (
    <div className="flex min-h-screen bg-gray-50">
      {sidebar}
      <main className="flex-1 overflow-auto">
        {title && (
          <header className="border-b border-gray-200 bg-white px-6 py-4">
            <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
          </header>
        )}
        <div className="p-6">{children}</div>
      </main>
    </div>
  );
}

export { Sidebar };
