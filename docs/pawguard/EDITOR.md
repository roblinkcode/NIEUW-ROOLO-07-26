# Bewerkbare PawGuard-secties — 3 november 2026

## Status

Omgezet op branch `codex/pawguard-editable-sections`, gebaseerd op `3547d14`. Niet gepubliceerd. De echte Shopify-editorcontrole is nog niet afgerond: het conceptthema is niet geüpload; browserbediening is op verzoek van de gebruiker gestopt. Lokale tests vervangen deze controle niet.

## Bewerken

In template `hond-achterbank-bescherme` staan nu:

- **PawGuard – Product**: dezelfde native productsectie, met eigen instellingen voor titel, USP-vak en vertrouwensregels. Prijzen, varianten, aantal, gele bestelknop en sticky ATC behouden hun bestaande instellingen en logica. De afmetingen-accordion was al bewerkbaar.
- **PawGuard – Installatie**: boventitel, titel, tekst, afbeelding, opmerking en versleepbare stappen.
- **PawGuard – Voordelen**: boventitel, titel, tekst en versleepbare voordeelblokken met eigen afbeelding en beschrijving.
- **PawGuard – Probleem/opl.**: titel, tekst, afbeelding, versleepbare voordelen, icoontekens en linktekst/bestemming.
- **PawGuard – Afmetingen**: boventitel, titel, beschrijving, afmetingstekst, afbeelding, opmerking en versleepbare voordelen.
- **PawGuard – FAQ**: titel, boventitel en versleepbare vraag/antwoordblokken. Uitvoeringfoto’s en bijschriften zijn binnen het betreffende FAQ-blok aanpasbaar.

Elke inhoudssectie heeft tonen/verbergen, achtergrondkleur, tekstkleur, accentkleuren en boven-/onderruimte voor desktop en mobiel. Stappen, voordelen en vragen kunnen worden toegevoegd, verwijderd, verborgen en verplaatst. De drie USP-regels bovenaan zijn tekstvelden; leegmaken verbergt een regel.

## Afbeeldingen

De bestaande JPG-bestanden blijven exact behouden als beginbeelden. Shopify ondersteunt geen schema-default voor `image_picker`, daarom gebruikt elke afbeelding een afbeeldingskiezer plus de instelling **Bestaand beginbeeld**. Een gekozen afbeelding krijgt voorrang; zonder selectie blijft het oorspronkelijke beeld zichtbaar. Met **Afbeelding tonen** kan het beeld worden verborgen. Er hoeft niets opnieuw te worden ingevuld.

## Techniek en afbakening

Alleen de exclusieve producttemplate verwijst naar de nieuwe secties. De vijf losse inhoudssecties renderen alleen bij de PawGuard-template. De gedeelde `main-product.liquid` is niet aangepast; `pawguard-main-product.liquid` is een kopie met drie extra PawGuard-bloktypes. Bij toekomstige algemene productsectie-updates moet deze kopie worden meegenomen.

De oorspronkelijke `pawguard-content`- en trust-snippets zijn als terugvalmogelijkheid behouden, maar de template gebruikt ze niet meer. Geen oude inhoud verwijderd vóór de Shopify-editorcontrole. Geen prijs-, voorraad-, status-, variant- of afbeeldingswijzigingen. JavaScript voor Klarna en sticky ATC ongewijzigd.

## Back-up

Volledig thema vóór omzetting: `roolo-theme-backup-2026-11-03.zip` in de outputmap van deze chat. Ook Git-commit `3547d14` bewaart het oorspronkelijke thema. Concept-ZIP: `ROOLO-PawGuard-bewerkbaar-concept.zip` in dezelfde outputmap. Importeer uitsluitend als ongepubliceerd conceptthema; publiceer geen volledige oudere themakopie over recentere winkelwijzigingen.

## Uitgevoerde tests

- `tests/pawguard-sections.py` met python-liquid 2.3.6: schema-JSON, veld-ID’s, blokinstellingen, ranges en image-pickerregels.
- Alle vijf secties gerenderd: alle oorspronkelijke teksttokens en afbeeldingsbronnen/alt-teksten gelijk aan de oude snippets.
- Bewerkte titel, verbergen van sectie/blok, blokvolgorde, geselecteerde afbeelding versus beginbeeld, en uitsluiting van andere templates gecontroleerd.
- Native productmarkup en logica buiten de drie extra bloktypes exact vergeleken met `main-product.liquid`.
- `tests/pawguard.test.cjs`: bestaande termijnbedragen, variant-/aantalselectie, kortingen, isolatie en sticky-submitbeveiliging geslaagd.
- `git diff --check` geslaagd.

Nog te controleren in Shopify-concepteditor: alle instellingen openen, titel wijzigen en terugzetten, afbeelding kiezen, stappen/FAQ herschikken, desktop/mobiele weergave vergelijken, variant-/aantal-/Klarna- en stickygedrag. Pas daarna en na toestemming gericht naar main samenvoegen.
