# TOLLA — europejskie opłaty drogowe

TOLLA to platforma do zakupu i realizacji elektronicznych winiet oraz innych road passes w Europie.

## Model działania

- klient wybiera kraj, rodzaj winiety i dane pojazdu;
- system pokazuje jedną łączną cenę końcową;
- numer rejestracyjny jest podawany i potwierdzany dwukrotnie;
- e-mail jest podawany i potwierdzany dwukrotnie;
- data rozpoczęcia nie może być wcześniejsza niż bieżąca data;
- po opłaceniu zamówienia system kieruje je do realizacji;
- potwierdzenie zakupu jest automatycznie dopasowywane do zamówienia i wysyłane klientowi.

## Czechy — fulfilment

System obsługuje grupowanie opłaconych zamówień CZ, generowanie zestawów do zakupu grupowego, przyjmowanie ZIP-ów z potwierdzeniami oraz automatyczne mapowanie potwierdzenia do konkretnego zamówienia i pojazdu.

## Bezpieczeństwo

Sekrety pozostają poza repozytorium. Do produkcji wykorzystywane są zmienne środowiskowe dla Supabase, Resend i panelu fulfilmentu.

## Uruchomienie

```bash
npm install
npm run dev
```

Projekt jest przygotowany do wdrożenia na Vercel z Supabase jako warstwą danych i Edge Functions.