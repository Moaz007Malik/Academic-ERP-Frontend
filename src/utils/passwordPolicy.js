/** Keep in sync with backend/src/utils/passwordPolicy.js */

export const PASSWORD_POLICY = {
  minLength: 8,
  minUppercase: 1,
  minLowercase: 1,
  minDigits: 1,
};

export function checkPasswordStrength(password) {
  const p = password || '';
  const uppercase = (p.match(/[A-Z]/g) || []).length;
  const lowercase = (p.match(/[a-z]/g) || []).length;
  const digits = (p.match(/[0-9]/g) || []).length;

  const rules = {
    minLength: p.length >= PASSWORD_POLICY.minLength,
    uppercase: uppercase >= PASSWORD_POLICY.minUppercase,
    lowercase: lowercase >= PASSWORD_POLICY.minLowercase,
    digits: digits >= PASSWORD_POLICY.minDigits,
  };

  return {
    ...rules,
    valid: rules.minLength && rules.uppercase && rules.lowercase && rules.digits,
    counts: { uppercase, lowercase, digits, length: p.length },
  };
}

export function getPasswordRequirementItems() {
  const { minLength, minUppercase, minLowercase, minDigits } = PASSWORD_POLICY;
  return [
    { key: 'minLength', label: `At least ${minLength} characters` },
    { key: 'uppercase', label: `At least ${minUppercase} uppercase letter (A–Z)` },
    { key: 'lowercase', label: `At least ${minLowercase} lowercase letter (a–z)` },
    { key: 'digits', label: `At least ${minDigits} digit (0–9)` },
  ];
}
