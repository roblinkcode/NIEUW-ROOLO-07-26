# ROOLO PawGuard — gerichte verbeteringen

## Scope en reservekopieën

Alleen `product.hond-achterbank-bescherme` en eigen PawGuard-bestanden zijn aangepast. Deze template is in Shopify aan één product toegewezen: `15758370472260`, handle `pawguard-waterdichte-achterbankbeschermer-voor-honden`. Geen wijzigingen aan prijzen, voorraad, productstatus, variant-ID’s, media of gedeelde themaonderdelen.

Oorspronkelijke template: commit `71f17d9`. Eerste PawGuard-uitwerking en reservekopie voor deze vervolgronde: `63ba4c4`. De eerste uitwerking is ook op remote `main` aangetroffen; dit is aan de gebruiker gemeld. De vervolgaanpassingen worden alleen op `codex/pawguard-productpagina` opgeslagen. `main` voedt het actieve Shopify-thema; verdere publicatie of terugdraaien wacht op de keuze van de gebruiker.

## Wijzigingen in deze ronde

- `templates/product.hond-achterbank-bescherme.json`: oorspronkelijke knop- en sticky-instellingen teruggezet; native aantalselector zichtbaar gemaakt; positieve tekst in afmetingen-accordion.
- `assets/pawguard.css`: oorspronkelijke gele knopkleur #FEBE01 en zwarte tekst, met native afmetingen, hoeken en hovergedrag. Andere oranje accenten behouden. Compacte vertrouwensregels met beige iconen.
- `snippets/pawguard-content.liquid`: waterdichtheidsteksten, positieve compatibiliteitssectie en consistente FAQ. Bestaande afbeeldingen ongewijzigd.
- `snippets/pawguard-trust.liquid`: verzending, retourtermijn en voorwaardelijke Klarna-regel met actuele Shopify-variantprijzen.
- `assets/pawguard.js`: dynamische termijnberekening en herstel van de bestaande sticky-formulierkoppeling, uitsluitend binnen PawGuard.
- `tests/pawguard.test.cjs`: berekeningen, events, isolatie en sticky-submitgedrag.

De bestaande sticky-knop bleef behouden. De gedeelde legacy-handler verwijst naar een niet aanwezige `handleSubmit`-methode. Alleen voor PawGuard wordt de bestaande native productform via `requestSubmit` ingediend, met controle op uitverkocht/disabled. Geen tweede sticky-element of gedeelde JavaScript-wijziging.

## Klarna

Zichtbaar bij Nederlandse markt, EUR en Klarna in `shop.enabled_payment_types`. Dit bewijst de winkelbetaalmethode; individuele toelating en definitieve termijnverdeling worden pas bij Klarna vastgesteld. Daarom staat de toelichting bij de indicatieve bedragen.

De berekening gebruikt actuele variantprijs × geselecteerd aantal, native Shopify-prijsstaffels en berekenbare bestaande theme-bundel-/quantity-breakkortingen. Checkout-only kortingscodes en kortingen die niet op de productpagina beschikbaar zijn, kunnen niet vooraf worden meegenomen. Actueel zijn geen bundelkortingen ingesteld.

Bij €59,95: 1 stuk → circa €19,98; 2 → circa €39,97; 3 → €59,95. Bedragen wijzigen zonder herladen en worden Nederlands geformatteerd. Onbekende of ongeldige selecties verbergen de termijnregel.

## Gecontroleerde bronnen op 29 oktober 2026

- [Verzendbeleid](https://roolo.nl/policies/shipping-policy): gratis verzending boven €20; de bestaande winkelbalk gebruikt “vanaf €20”, conform de gevraagde regel.
- [Retourbeleid](https://roolo.nl/policies/refund-policy): 30 dagen; voorwaarden blijven via de regel bereikbaar.
- [Leveranciersproduct](https://aliexpress.us/item/3256808863266048.html): titel en beschrijving noemen waterproof. Oxford-stof is daarnaast expliciet door de gebruiker bevestigd. De aangeleverde afbeeldingen zijn niet bewerkt, ook waar daarin nog waterafstotend staat.
- [Shopify Klarna-documentatie](https://help.shopify.com/en/manual/payments/shopify-payments/local-payment-methods/klarna): Nederlandse ondersteuning en renteloos betalen in drie termijnen, afhankelijk van beschikbaarheid bij afrekenen.

## Werkelijk uitgevoerde controles

- Node-tests: aantallen 1/2/3, variantwijziging, inputupdates, staffels, procentuele en vaste bundelkorting, ongeldige gegevens, isolatie van andere producten, event cleanup, native sticky-submit en uitverkochtbeveiliging.
- Alle acht Liquid-onderdelen gerenderd met testgegevens; Klarna alleen zichtbaar voor NL/EUR/ingeschakelde betaalmethode.
- Lokale browserfixture op desktop en 390px mobiel: compacte vertrouwensregels, geel, geen horizontale overflow, aantallen en variantselectie. Bestaand sticky-element gaf variant en aantal aan dezelfde testform door.
- JSON/schema-validatie en `git diff --check`.

De lokale browserfixture gebruikt de echte PawGuard-snippets, CSS en JavaScript, maar vereenvoudigde thema-opmaak. Dit is geen volledige Shopify-runtime of checkouttest. In Shopify waren alle drie varianten €59,95 en voorraad 0, met productstatus Concept. Een succesvolle echte winkelwagentoevoeging is niet getest; voorraad en status zijn niet aangepast. Controleer de volledige conceptthemapreview en bestaande variantfotowissels vóór publicatie.

## Publicatie

Gebruik de conceptbranch in een Shopify-conceptthema voor de laatste controle. Alleen na toestemming de gerichte wijziging naar `main` samenvoegen; controleer eerst op tussentijdse Shopify-editorwijzigingen. Publiceer geen volledig ouder conceptthema over nieuwere winkelwijzigingen.
