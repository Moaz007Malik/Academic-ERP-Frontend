import { useMemo, useState } from 'react';
import { MODULE_CATALOG } from '../../utils/constants';

export default function ModulePicker({ value = [], onChange, disabled = false }) {
  const [filter, setFilter] = useState('');
  const categories = useMemo(() => {
    const map = new Map();
    for (const m of MODULE_CATALOG) {
      if (!map.has(m.category)) map.set(m.category, []);
      map.get(m.category).push(m);
    }
    return [...map.entries()];
  }, []);

  const toggle = (key) => {
    if (disabled) return;
    const set = new Set(value);
    if (set.has(key)) set.delete(key);
    else set.add(key);
    onChange([...set]);
  };

  const selectAll = () => onChange(MODULE_CATALOG.map((m) => m.key));
  const clearAll = () => onChange([]);

  const q = filter.trim().toLowerCase();

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <input
          type="search"
          placeholder="Search modules..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
        />
        <button type="button" onClick={selectAll} className="text-sm text-blue-600 hover:underline" disabled={disabled}>
          Enable all
        </button>
        <button type="button" onClick={clearAll} className="text-sm text-gray-500 hover:underline" disabled={disabled}>
          Disable all
        </button>
        <span className="ml-auto text-sm text-gray-500">{value.length} / {MODULE_CATALOG.length} enabled</span>
      </div>

      {categories.map(([category, modules]) => {
        const filtered = modules.filter((m) =>
          !q || m.label.toLowerCase().includes(q) || m.key.toLowerCase().includes(q)
        );
        if (!filtered.length) return null;
        return (
          <div key={category} className="rounded-xl border border-gray-200 bg-white p-4">
            <h3 className="mb-3 text-sm font-semibold text-gray-700">{category}</h3>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((m) => (
                <label
                  key={m.key}
                  className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm ${
                    value.includes(m.key) ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:bg-gray-50'
                  } ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}
                >
                  <input
                    type="checkbox"
                    checked={value.includes(m.key)}
                    onChange={() => toggle(m.key)}
                    disabled={disabled}
                    className="rounded border-gray-300"
                  />
                  <span>{m.label}</span>
                </label>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
