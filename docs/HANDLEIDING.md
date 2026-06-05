# Handleiding — Privacy First

Privacy First helpt je om privégegevens (PII) uit documenten te verwijderen voordat je ze deelt. De app detecteert automatisch namen, e-mailadressen, telefoonnummers, adressen en meer, en laat je precies instellen wat je wilt redigeren.

---

## Installatie

### macOS
1. Open het `.dmg`-bestand
2. Sleep "Privacy First" naar je Programma's-map
3. Dubbelklik de app — bij de eerste keer: klik rechts → Openen → Toch openen (macOS-beveiliging)

### Windows
1. Voer `Privacy First_x.x.x_x64-setup.exe` uit
2. De installer heeft **geen beheerdersrechten nodig** — het programma wordt in je eigen profiel geïnstalleerd
3. Na installatie staat de app in het Startmenu onder "Privacy First"

---

## Eerste start — model downloaden

Bij de allereerste start vraagt de app om het AI-model te downloaden (~2,6 GB). Dit is het OpenAI Privacy Filter model dat de privégegevens detecteert.

- Klik op **Model downloaden (~2,6 GB)**
- Wacht totdat de download klaar is — dit kan enkele minuten duren
- Daarna start de app normaal op

Het model wordt lokaal opgeslagen en je hebt daarna **geen internetverbinding meer nodig**.

---

## Een document verwerken

### Stap 1 — Bestand openen

Sleep een bestand naar het **uploadgebied** aan de linkerkant, of klik erop om een bestand te kiezen via de bestandsbrowser.

Ondersteunde formaten:
- `.pdf` — PDF-documenten (tekstlaag vereist; gescande PDFs zonder OCR worden niet ondersteund)
- `.docx` — Word-documenten
- `.txt` — Platte tekstbestanden

Na het openen zie je de bestandsnaam en het aantal tekens.

### Stap 2 — Verwerken

Klik op **Verwerken**. De app stuurt de tekst naar het AI-model, dat privégegevens opspoort.

Na het verwerken:
- De **voorvertoning** (middelste kolom) toont de documenttekst met gekleurde markeringen
- Het **overzichtspaneel** (rechterkolom) toont alle gevonden items, gegroepeerd per categorie

### Stap 3 — Aanpassen wat geredigeerd wordt

Standaard wordt **alles** geredigeerd. Je kunt dit per item of per categorie aanpassen:

**Per categorie:**
- Klik op een categoriebadge (bijv. "Datum") om de hele categorie **uit te schakelen**
- Uitgeschakelde categorieën worden grijs weergegeven en worden niet geredigeerd
- Klik nogmaals om ze weer in te schakelen

**Per item:**
- Klik op het **slotje** naast een item om het te bewaren (het slotje opent zich en het item wordt doorgestreept)
- Klik nogmaals op het open slotje om het alsnog te redigeren

**In de voorvertoning:**
- Klik direct op een gemarkeerde tekst om te wisselen tussen redigeren en bewaren
- Klik op de **tekst** van een item in het overzichtspaneel om in de voorvertoning naar dat item te springen (het knippert even op)

### Stap 4 — Opslaan

Klik op **Sla geredigeerde PDF op** (of DOCX / TXT afhankelijk van het bestandstype).

Het geredigeerde bestand wordt opgeslagen in dezelfde map als het originele bestand, met `_redacted` toegevoegd aan de bestandsnaam.

Na het opslaan:
- De bestandsnaam verschijnt ter bevestiging
- Klik op **Open map** om de map direct te openen in de Verkenner / Finder

---

## Uitvoermap wijzigen

Standaard wordt het geredigeerde bestand in **dezelfde map** als het originele bestand opgeslagen. Wil je een andere map kiezen, klik dan op het **uitvoermap-veld** om een map te selecteren.

---

## Donkere modus

Klik op het maan-/zon-icoontje rechtsboven om te wisselen tussen lichte en donkere modus. De instelling wordt bewaard.

---

## Categorie-overzicht

| Categorie | Voorbeelden |
|-----------|-------------|
| Persoon | Joeri Haas, Jan de Vries |
| E-mailadres | joeri@voorbeeld.nl |
| Telefoonnummer | 06-12345678, +31 20 123 4567 |
| Adres | Rijksstraatweg 249, Hellevoetsluis |
| Identificatie | BSN, paspoort- en rijbewijsnummers |
| Website | https://voorbeeld.nl |
| Datum | 26 maart 2026, 2026-03-26 |
| Organisatie | Hackthebox B.V., Belastingdienst |
| Rekeningnummer | IBAN, creditcardnummers |

---

## Veelgestelde vragen

**Wordt mijn document naar internet gestuurd?**
Nee. De verwerking gebeurt volledig lokaal op je computer. Na de eenmalige modeldownload is er geen internetverbinding meer nodig.

**Werkt de app op gescande PDFs?**
Alleen als de PDF een tekstlaag heeft (digitaal aangemaakt of met OCR verwerkt). Puur gescande afbeeldingen zonder tekstlaag worden niet ondersteund.

**Kan de app ook meerdere bestanden tegelijk verwerken?**
Nee, momenteel wordt één bestand per keer verwerkt.

**Het model mist bepaalde privégegevens. Wat kan ik doen?**
Het model is niet perfect. Controleer de voorvertoning altijd voordat je een document deelt. Je kunt eventueel handmatig aanvullende tekst selecteren in de toekomst (geplande functie).

**De geredigeerde PDF ziet er anders uit dan het origineel.**
PDF-redactie vervangt de oorspronkelijke tekst door gekleurde blokken met een label. De paginalayout blijft intact, maar de originele tekst is permanent verwijderd — dit is opzettelijk.

---

## Sneltoetsen

| Actie | Toets |
|-------|-------|
| Bestand openen | Klik op uploadgebied of sleep een bestand |
| Verwerken | Klik Verwerken |
| Opslaan | Klik Sla op |

---

## Privacy en beveiliging

- Het AI-model draait volledig **offline** op je eigen machine
- Bestanden worden **nooit** geüpload naar externe servers
- Het geredigeerde bestand vervangt de originele tekst met onherstelbare redactieblokken
- Controleer het uitvoerbestand altijd voordat je het deelt
