import { checkPasswordStrength, getPasswordRequirementItems } from '../../utils/passwordPolicy';

function RuleIcon({ met }) {
  if (met) {
    return (
      <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-green-100 text-green-700 text-xs" aria-hidden>
        ✓
      </span>
    );
  }
  return (
    <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-400 text-xs" aria-hidden>
      ○
    </span>
  );
}

export default function PasswordRequirements({ password, className = '' }) {
  const strength = checkPasswordStrength(password);
  const items = getPasswordRequirementItems();

  return (
    <div className={`rounded-lg border border-gray-200 bg-gray-50 p-3 ${className}`}>
      <p className="mb-2 text-xs font-medium text-gray-700">Password must include:</p>
      <ul className="space-y-1.5">
        {items.map((item) => {
          const met = strength[item.key];
          return (
            <li key={item.key} className="flex items-start gap-2 text-xs">
              <RuleIcon met={met} />
              <span className={met ? 'text-green-700' : 'text-gray-600'}>{item.label}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
