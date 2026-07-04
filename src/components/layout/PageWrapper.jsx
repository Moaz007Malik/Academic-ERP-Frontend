import Sidebar from '../layout/Sidebar';

export default function PageWrapper({ title, children, sidebar }) {
  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <div className="shrink-0">{sidebar}</div>
      <main className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        {title && (
          <header className="shrink-0 border-b border-gray-200 bg-white px-6 py-4">
            <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
          </header>
        )}
        <div className="flex-1 overflow-y-auto p-6">{children}</div>
      </main>
    </div>
  );
}

export { Sidebar };
