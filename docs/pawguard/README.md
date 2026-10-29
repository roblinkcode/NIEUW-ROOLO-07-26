# ROOLO PawGuard — concept via GitHub

## Afbakening en reservekopie

Op 29 oktober 2026 in Shopify gecontroleerd:
- Product-ID: `15758370472260`; verkoper Roolo; status **Concept**.
- Handle: `pawguard-waterdichte-achterbankbeschermer-voor-honden`.
- Volledige template: `hond-achterbank-bescherme`; editor meldt **toegewezen aan 1 product**.
- Actief thema: `189755916612`, gekoppeld aan `roblinkcode/NIEUW-ROOLO-07-26`, branch `main`.
- Alle drie varianten: €59,95; beschikbare voorraad 0. Vergelijkingsprijs in preview €100,00.
- Nederland en België staan bij het product; de Nederlandse preview toont EUR.
- De oorspronkelijke template blijft herstelbaar in Git-commit `71f17d9` en op `main`. Deze implementatie staat op `codex/pawguard-productpagina`.

Er zijn geen gedeelde secties, snippets, algemene thema-instellingen of andere producttemplates gewijzigd. Nieuwe bestanden hebben het prefix `pawguard`. Niets naar `main` pushen of samenvoegen zonder goedkeuring: die branch voedt het actieve thema.

## Implementatie

- Bestaande main-product-sectie met galerij links, informatie rechts, native variantkeuze, prijzen, voorraadgedrag, koopknop, betaallogo's en sticky add-to-cart behouden.
- PawGuard USP-vak, installatie, vier productvoordelen, vergelijking, afmetingen en FAQ.
- Aangeleverde beelden als geoptimaliseerde JPEG-bestanden; bronafbeeldingen ongewijzigd.
- Zwart #171717, oranje #F58220, warm wit #F8F7F5, lichtgrijs #EAE6E1 en wit. Donkere tekst op oranje knoppen. Donkerder oranje voor leesbare kleine accenttekst.
- Afmetingen-accordion: circa 137 × 147 cm, afkomstig van de aangeleverde maatafbeelding; geen zelfstandige fysieke meting.
- HIPIPET-social-proof en testimonials verwijderd, Judge.me-blokken verborgen zolang geen echte productreviews zijn gecontroleerd. Bestaande videosectie behouden maar verborgen. Oude ongebruikte blokken van andere producten verwijderd uit uitsluitend deze template.
- Onbevestigde morgen-verzendbelofte, retourtermijn, gratis-verzendclaim en vaste 50%-kortingsbadge verwijderd. Drie compacte vertrouwensregels verwijzen naar de actuele winkelvoorwaarden en betaalmogelijkheden.
- De algemene aankondigingsbalk is niet gewijzigd: die valt buiten de producttemplate en toont nog de bestaande winkelbrede verzendclaim.

## Productgegevens die niet via thema-Git worden gewijzigd

Een GitHub-themakoppeling wijzigt geen Shopify-productrecords. De zichtbare titel is daarom template-specifiek **ROOLO PawGuard – Waterafstotende Achterbankbeschermer voor Honden**. De oorspronkelijke administratieve titel en SEO-metadata blijven staan. “Waterdichte” is niet overgenomen in de nieuwe verkooptekst omdat de aangeleverde productinformatie slechts waterafstotend onderbouwt. Werk de administratieve titel en SEO-titel ook bij zodra de claim is vastgesteld.

De variantknoppen krijgen weergavenamen zonder option-values of IDs te wijzigen:

| Bestaande naam | Weergavenaam | Variant-ID | Verwachte bestaande foto |
| --- | --- | --- | --- |
| Zwart | Volledig Zwart | 57610795450692 | Quilted zwarte autostoelbeschermer in SUV.png |
| Zwart / Oranje rand | Zwart / Oranje Rand | 57610829529412 | Roolo_PawGuard_Oranje_Afwerking.png |
| Zwart / Oranje clips | Zwart / Oranje Bevestigingen | 57610829562180 | Roolo_PawGuard_Oranje_Bevestigingspunten.png |

Alle varianten hebben volgens Shopify al een afbeelding toegewezen. De precieze koppeling moet in de conceptpreview visueel worden gecontroleerd. Deze branch verandert geen productmedia-koppelingen. De nieuwe uitvoeringfoto's staan ook in de FAQ. Winkelwagen en checkout gebruiken de oorspronkelijke administratieve variantnamen; hernoem de bestaande varianten in Shopify als dezelfde namen daar gewenst zijn, zonder ze te verwijderen of opnieuw aan te maken. Let op gekoppelde kleurmetavelden die ook andere producten kunnen gebruiken.

## Klarna

Een Klarna-logo bewijst niet dat betalen in 3 termijnen voor dit product beschikbaar is. Het aanvullende termijnbedrag blijft daarom standaard verborgen. De bestaande betaalbadges blijven intact.

Na controle van daadwerkelijke beschikbaarheid: maak een boolean productmetaveld `custom.pawguard_klarna_pay_in_3_verified` en zet het uitsluitend op dit product op waar. Het onderdeel verschijnt dan alleen bij Nederland, EUR en Klarna in `shop.enabled_payment_types`. Bedragen worden per variant met Shopify `money` geformatteerd en via het bestaande variantChange-event bijgewerkt. Bij €59,95 verschijnt “circa €19,98”; door afronding kan het definitieve betaalplan verschillen. Geen betaalinstellingen veranderen om de tekst zichtbaar te maken.

## Plaatsing en controle

1. Importeer de GitHub-branch `codex/pawguard-productpagina` als **conceptthema** via Webshop → Thema's → Thema's importeren → Verbinden via GitHub. Publiceer het conceptthema niet.
2. Open de PawGuard-productpreview in dat conceptthema; het product gebruikt reeds `hond-achterbank-bescherme`.
3. Controleer desktop en mobiel: alle afbeeldingen, de drie variantkeuzes en fotowissels, prijs, disabled Uitverkocht-knop, sticky balk, betaalbadges, FAQ en maatinformatie. De voorraad is 0, dus een geslaagde winkelwagentoevoeging kan niet worden getest zonder voorraad aan te passen; dat is niet toegestaan in deze taak.
4. Controleer de Nederlandse markt expliciet, verzending, retourbeleid, echte reviews en Klarna voordat specifieke beloften worden ingeschakeld.
5. Na expliciete toestemming alleen deze wijziging samenvoegen naar `main`. Controleer vooraf opnieuw op Shopify-editorwijzigingen in `main`. Publiceer niet het volledige conceptthema: dat kan inmiddels verouderde gegevens van andere pagina's bevatten.

Handmatige plaatsing als alternatief: zet `assets/pawguard*`, `snippets/pawguard-content.liquid`, `snippets/pawguard-image.liquid` en `templates/product.hond-achterbank-bescherme.json` op exact dezelfde paden in een kopie van het bestaande thema. Geen wijziging aan `layout/theme.liquid` of `config/settings_data.json` nodig.

## Validatie

- JSON gelezen en sectie-/blokverwijzingen gecontroleerd.
- Instellingen gecontroleerd tegen de lokale Shopify-sectieschema's.
- Alle nieuwe Liquid-inhoudsonderdelen met een Liquid-parser gerenderd met testgegevens.
- Klarna getoetst op expliciete verificatie, NL/EUR, betaalmethode en berekening voor verschillende prijzen.
- JavaScript syntaxcontrole en `git diff --check`.
- Geen actieve HIPIPET-/DogJacket-content, verzonnen reviews of vaste kortingsclaim in deze template.
- Shopify-checkout, echte variantfotokoppelingen en volledige desktop-/mobiele rendering blijven afhankelijk van de Shopify-conceptpreview; statische controles bewijzen deze niet.
