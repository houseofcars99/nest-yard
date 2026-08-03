# Stan projektu Nest & Yard

## Zrealizowane

- responsywny katalog produktów w stylu premium;
- kategorie i indywidualne podstrony produktów;
- bezpośrednie linkowanie do konkretnych ofert Allegro;
- panel administratora produktów;
- pola SKU, numer oferty Allegro, cena zakupu, VAT i stan magazynowy;
- pulpit sprzedażowy;
- ranking najlepiej sprzedających się produktów z zamówień;
- przychód brutto, prowizje Allegro, średnie zamówienie i marża szacunkowa;
- obsługa zamówień oraz ręczna zmiana statusów;
- generator faktur z zamówienia i faktur ręcznych;
- wizualizacja faktury, drukowanie i zapis do PDF przez okno drukowania;
- statusy KSeF i ostrzeżenie dla projektów B2B;
- alerty niskiego stanu, kontrola marży i mapowanie ofert;
- eksport pełnej kopii danych do JSON;
- serwerowe trasy OAuth Allegro i pobieranie zamówień oraz operacji billingowych;
- konfiguracja produkcji i Sandbox przez zmienne środowiskowe;
- blokada indeksowania wersji testowej.

## Tryb demonstracyjny

Dane są zapisane w `localStorage`. Moduł Allegro pokazuje dane demonstracyjne, dopóki aplikacja nie otrzyma danych OAuth. Hasło panelu: `nest-demo`.

## Przed uruchomieniem produkcyjnym

1. Utworzyć osobny projekt Supabase.
2. Przenieść produkty, zamówienia, faktury i ustawienia z `localStorage` do bazy.
3. Wdrożyć serwerowe logowanie administratora.
4. Skonfigurować aplikację Allegro i wykonać autoryzację OAuth.
5. Podłączyć KSeF 2.0 albo system fakturowy zapewniający obsługę KSeF.
6. Dodać magazyn plików i faktyczne wysyłanie PDF faktur do zamówień Allegro.
