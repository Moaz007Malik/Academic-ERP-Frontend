import { Link } from 'react-router-dom';

export default function Breadcrumbs({ items = [] }) {
  if (!items.length) return null;
  return (
    <nav className="mb-4 flex flex-wrap items-center gap-1 text-sm text-gray-500" aria-label="Breadcrumb">
      {items.map((item, i) => (
        <span key={item.label} className="flex items-center gap-1">
          {i > 0 && <span className="text-gray-300">/</span>}
          {item.to && i < items.length - 1 ? (
            <Link to={item.to} className="hover:text-primary-600">{item.label}</Link>
          ) : (
            <span className={i === items.length - 1 ? 'font-medium text-gray-900' : ''}>{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}
