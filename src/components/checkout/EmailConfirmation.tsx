import { useMemo, useState } from 'react';
import { validateEmailConfirmation } from '../../lib/validation/email';

type Props = {
  value?: string;
  confirmationValue?: string;
  onChange: (value: string, confirmationValue: string, valid: boolean) => void;
};

export default function EmailConfirmation({ value = '', confirmationValue = '', onChange }: Props) {
  const [touched, setTouched] = useState(false);
  const validation = useMemo(
    () => validateEmailConfirmation(value, confirmationValue),
    [value, confirmationValue],
  );
  const valid = validation.valid && validation.matchesConfirmation;

  const update = (nextValue: string, nextConfirmation: string) => {
    const next = validateEmailConfirmation(nextValue, nextConfirmation);
    onChange(nextValue, nextConfirmation, next.valid && next.matchesConfirmation);
  };

  return (
    <fieldset className="space-y-3">
      <legend className="text-sm font-medium">Adres e-mail</legend>
      <input
        type="email"
        name="email"
        value={value}
        autoComplete="email"
        required
        onBlur={() => setTouched(true)}
        onChange={(event) => update(event.target.value, confirmationValue)}
        placeholder="twoj@email.pl"
        className="w-full rounded-lg border px-3 py-2"
      />
      <input
        type="email"
        name="emailConfirmation"
        value={confirmationValue}
        autoComplete="off"
        required
        onBlur={() => setTouched(true)}
        onChange={(event) => update(value, event.target.value)}
        placeholder="Powtórz adres e-mail"
        className="w-full rounded-lg border px-3 py-2"
        aria-invalid={touched && !valid}
      />
      {touched && !validation.valid && (
        <p className="text-sm text-red-600">Podaj prawidłowy adres e-mail.</p>
      )}
      {touched && validation.valid && !validation.matchesConfirmation && (
        <p className="text-sm text-red-600">Adresy e-mail nie są identyczne.</p>
      )}
      <p className="text-xs text-gray-500">Wpisz adres dwukrotnie, ponieważ na ten adres wyślemy potwierdzenie i dokument winiety.</p>
    </fieldset>
  );
}
