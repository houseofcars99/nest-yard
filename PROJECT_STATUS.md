# Stan projektu TOLLA

## Zrealizowane

- rebranding z VignetteGO na TOLLA;
- formularz zakupu winiet CZ / AT / CH;
- jedna łączna cena prezentowana klientowi;
- podwójne potwierdzenie numeru rejestracyjnego;
- podwójne potwierdzenie adresu e-mail;
- blokada dat wstecznych;
- zamówienia i checkout;
- Supabase i migracje fulfilmentu;
- czeski workflow zakupów grupowych;
- parser i matching potwierdzeń ZIP;
- automatyzacja wysyłki e-mail przez Resend;
- deployment przez GitHub Actions.

## Po rebrandingu

Nazwa użytkowa, teksty interfejsu, checkout, e-maile i dokumentacja używają marki TOLLA. Klucze i zmienne środowiskowe pozostają bez zmian technicznych, aby niepotrzebnie nie psuć konfiguracji deploymentu.

## Przed startem produkcyjnym

1. Ustawić sekrety produkcyjne Vercel/Supabase.
2. Zweryfikować domenę nadawcy w Resend.
3. Przetestować pełny przepływ zamówienie → płatność → fulfilment → e-mail.
4. Wykonać test na rzeczywistym potwierdzeniu czeskiej winiety.