import { useEffect, useState } from 'react';
import Button from './Button';

export default function CredentialsRevealModal({
  open,
  title = 'Admin credentials',
  subtitle,
  email,
  password,
  onConfirm,
}) {
  const [countdown, setCountdown] = useState(5);
  const [copyFeedback, setCopyFeedback] = useState('');

  useEffect(() => {
    if (!open) return undefined;
    setCountdown(5);
    setCopyFeedback('');
    const interval = setInterval(() => {
      setCountdown((c) => (c <= 1 ? 0 : c - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [open]);

  if (!open) return null;

  const credentialsText = `Email: ${email}\nPassword: ${password}`;

  const copy = async (text, label) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopyFeedback(label);
      setTimeout(() => setCopyFeedback(''), 2000);
    } catch {
      setCopyFeedback('Copy failed');
    }
  };

  const okEnabled = countdown === 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-xl bg-white shadow-xl" role="dialog" aria-modal="true">
        <div className="border-b border-gray-200 px-6 py-4">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          {subtitle && <p className="mt-1 text-sm text-gray-500">{subtitle}</p>}
        </div>

        <div className="space-y-4 p-6">
          <p className="text-sm text-amber-800 bg-amber-50 rounded-lg px-3 py-2">
            Save these credentials. You can also view them later under Portal Logins.
          </p>

          <CredentialRow
            label="Admin email"
            value={email}
            onCopy={() => copy(email, 'Email copied')}
          />
          <CredentialRow
            label="Temporary password"
            value={password}
            onCopy={() => copy(password, 'Password copied')}
          />

          <Button
            type="button"
            variant="secondary"
            className="w-full"
            onClick={() => copy(credentialsText, 'All credentials copied')}
          >
            Copy all credentials
          </Button>

          {copyFeedback && (
            <p className="text-center text-sm text-green-600">{copyFeedback}</p>
          )}
        </div>

        <div className="flex justify-end border-t border-gray-200 px-6 py-4">
          <Button type="button" disabled={!okEnabled} onClick={onConfirm}>
            {okEnabled ? 'OK' : `OK (${countdown})`}
          </Button>
        </div>
      </div>
    </div>
  );
}

function CredentialRow({ label, value, onCopy }) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-gray-500">{label}</label>
      <div className="flex gap-2">
        <input
          type="text"
          readOnly
          value={value}
          className="min-w-0 flex-1 rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 font-mono text-sm"
        />
        <Button type="button" variant="secondary" className="shrink-0 px-3" onClick={onCopy}>
          Copy
        </Button>
      </div>
    </div>
  );
}
