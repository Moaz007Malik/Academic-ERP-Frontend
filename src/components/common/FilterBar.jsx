import Button from '../common/Button';
import Input from '../common/Input';
import Select from '../common/Select';

export default function FilterBar({
  filters = [],
  values = {},
  onChange,
  onApply,
  onReset,
  searchPlaceholder = 'Search...',
  showSearch = true,
}) {
  const set = (key, val) => onChange?.({ ...values, [key]: val });

  return (
    <div className="mb-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
        {showSearch && (
          <Input
            placeholder={searchPlaceholder}
            value={values.search || ''}
            onChange={(e) => set('search', e.target.value)}
          />
        )}
        {filters.map((f) => (
          f.type === 'select' ? (
            <Select
              key={f.key}
              label={f.label}
              value={values[f.key] || ''}
              onChange={(e) => set(f.key, e.target.value)}
            >
              <option value="">{f.placeholder || `All ${f.label}`}</option>
              {(f.options || []).map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </Select>
          ) : (
            <Input
              key={f.key}
              label={f.label}
              type={f.type || 'text'}
              value={values[f.key] || ''}
              onChange={(e) => set(f.key, e.target.value)}
            />
          )
        ))}
      </div>
      <div className="mt-3 flex gap-2">
        <Button type="button" onClick={onApply}>Apply filters</Button>
        <Button type="button" variant="secondary" onClick={onReset}>Reset</Button>
      </div>
    </div>
  );
}
