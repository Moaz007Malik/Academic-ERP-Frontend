import Button from './Button';

export function RowActions({ onEdit, onDelete, deleteLabel = 'Delete' }) {
  return (
    <div className="flex shrink-0 gap-1">
      {onEdit && (
        <Button type="button" variant="ghost" className="px-2 py-1 text-xs" onClick={onEdit}>
          Edit
        </Button>
      )}
      {onDelete && (
        <Button type="button" variant="ghost" className="px-2 py-1 text-xs text-red-600 hover:bg-red-50" onClick={onDelete}>
          {deleteLabel}
        </Button>
      )}
    </div>
  );
}

export function confirmDelete(message) {
  return window.confirm(message || 'Delete this item? This cannot be undone.');
}
