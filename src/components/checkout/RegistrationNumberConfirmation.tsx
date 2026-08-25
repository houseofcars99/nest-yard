import { useMemo, useState } from 'react';
import { validateRegistrationNumber } from '../../lib/validation/registration-number';

type Props = {
  value?: string;
  confirmationValue?: string;
  onChange: (value: string, confirmationValue: string, valid: boolean) => void;
};

export default function RegistrationNumberConfirmation({ value = '', confirmationValue = '', onChange }: Props) {
  const [touched, setTouched] = useState(false);
  const validation = useMemo(
    () => validateRegistrationNumber(value, confirmationValue),
    [value, confirmationValue],
  );

  const valid = validation.valid && validation.matchesConfirmation;

  const update = (nextValue: string, nextConfirmation: string) => {
    const next = validateRegistrationNumber(nextValue, nextConfirmation);
    onChange(nextValue, nextConfirmation, next.valid && next.matchesConfirmation);
  };

  return (
    <fieldset className="space-y-3">
      <legend className="text-sm font-medium">Numer rejestracyjny</legend>
      <input
        name="registrationNumber"
        value={value}
        autoComplete="off"
        required
        onBlur={() => setTouched(true)}
        onChange={(event) => update(event.target.value, confirmationValue)}
        placeholder="np. DW12345"
        className="w-full rounded-lg border px-3 py-2"
      />
      <input
        name="registrationNumberConfirmation"
        value={confirmationValue}
        autoComplete="off"
        required
        onBlur={() => setTouched(true)}
        onChange={(event) => update(value, event.target.value)}
        placeholder="Powtórz numer rejestracyjny"
        className="w-full rounded-lg border px-3 py-2"
        aria-invalid={touched && !valid}
      />
      {touched && !validation.matchesConfirmation && (
        <p className="text-sm text-red-600">Numery rejestracyjne nie są identyczne.</p>
      )}
      {touched && !validation.valid && (
        <p className="text-sm text-red-600">Podaj prawidłowy numer rejestracyjny.</p>
      )}
      <p className="text-xs text-gray-500">Wpisz numer dwukrotnie, aby ograniczyć ryzyko pomyłki przy zakupie winiety.</p>
    </fieldset>
  );
}
