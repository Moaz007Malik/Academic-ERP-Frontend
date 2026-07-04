import { MODULE_CATALOG } from '../../utils/constants';

/** Read-only module list — active modules highlighted */
export default function ModuleViewer({ activeModules = [], showDisabled = true }) {
  const active = new Set(activeModules);
  const categories = MODULE_CATALOG.reduce((map, m) => {
    if (!map.has(m.category)) map.set(m.category, []);
    map.get(m.category).push(m);
    return map;
  }, new Map());

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-500">
        {activeModules.length} of {MODULE_CATALOG.length} modules enabled
      </p>
      {[...categories.entries()].map(([category, modules]) => {
        const visible = showDisabled ? modules : modules.filter((m) => active.has(m.key));
        if (!visible.length) return null;
        return (
          <div key={category} className="rounded-xl border border-gray-200 bg-white p-4">
            <h3 className="mb-3 text-sm font-semibold text-gray-700">{category}</h3>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {visible.map((m) => {
                const on = active.has(m.key);
                return (
                  <div
                    key={m.key}
                    className={`rounded-lg border px-3 py-2 text-sm ${
                      on ? 'border-green-300 bg-green-50 text-green-900' : 'border-gray-200 bg-gray-50 text-gray-400'
                    }`}
                  >
                    <span className="mr-2">{on ? '✓' : '—'}</span>
                    {m.label}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
