# Nest & Yard

Katalog produktów premium kierujący klientów do konkretnych ofert Allegro, z panelem operacyjnym dla sprzedaży.

## Funkcje sklepu

- strona główna, kategorie i indywidualne podstrony produktów;
- każdy produkt prowadzi do przypisanego linku Allegro;
- panel produktów z ceną, SKU, numerem oferty Allegro, stanem magazynowym, ceną zakupu i VAT;
- statystyka kliknięć w oferty Allegro;
- brak koszyka i płatności po stronie Nest & Yard — transakcja odbywa się na Allegro.

## Panel administratora

Adres: `/admin`

Hasło demonstracyjne: `nest-demo`

Panel obejmuje:

- pulpit przychodu, opłat Allegro, średniego zamówienia i marży szacunkowej;
- ranking najlepiej sprzedających się produktów na podstawie pozycji zamówień;
- obsługę zamówień, statusów, dostaw i faktur;
- generator faktur z zamówienia Allegro lub ręcznie;
- podgląd faktury oraz drukowanie / zapis do PDF;
- statusy KSeF;
- kontrolę niskich stanów i marży;
- mapowanie produktów Nest & Yard na `offerId` Allegro i SKU;
- eksport danych operacyjnych do JSON.

W trybie demonstracyjnym produkty, zamówienia, faktury i ustawienia zapisują się w `localStorage` przeglądarki.

## Uruchomienie

```bash
npm install
npm run dev
```

Aplikacja otworzy się pod `http://localhost:3000`.

## Integracja z Allegro

1. Zarejestruj aplikację w panelu deweloperskim Allegro.
2. Skopiuj `.env.example` do `.env.local`.
3. Ustaw `ALLEGRO_CLIENT_ID`, `ALLEGRO_CLIENT_SECRET` i `ALLEGRO_REDIRECT_URI`.
4. Dla testów ustaw `ALLEGRO_ENV=sandbox`.
5. W panelu otwórz zakładkę **Allegro** i wybierz **Połącz z Allegro**.

Integracja korzysta z OAuth i zakresów dotyczących ofert, zamówień, przesyłek, opłat i płatności. Sekrety nie są umieszczane w kodzie ani wysyłane do przeglądarki.

## Faktury i KSeF

Wersja demonstracyjna generuje projekt faktury i wizualizację do wydruku. Faktura B2B oznaczona jako `KSEF_PENDING` nie powinna być traktowana jako skutecznie wystawiona faktura ustrukturyzowana, dopóki nie zostanie przesłana do KSeF 2.0 i nie otrzyma numeru KSeF.

Przed uruchomieniem produkcyjnym należy podłączyć:

- osobny Supabase do produktów, zamówień, faktur i bezpiecznej integracji;
- właściwe logowanie administratora;
- magazyn plików dla faktur i zdjęć;
- KSeF 2.0 albo zewnętrzny system fakturowy zgodny z KSeF.

## Publikacja

Projekt jest przygotowany do wdrożenia jako osobny projekt Vercel. Domenę można podłączyć później; wersja testowa działa pod adresem `*.vercel.app`.
