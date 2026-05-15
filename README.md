# DUDI AI Generator

Automatische Erstellung von ASYCUDA/DUDI-XML-Dateien aus Zollunterlagen.

**App-Sprache:** Albanisch (Standard) | Englisch (in Einstellungen wählbar)

---

## 1. Installation

```bash
cd dogana-ai
npm install
```

## 2. OpenAI API Key einrichten

Öffne `.env.local` und trage deinen OpenAI API Key ein:

```
OPENAI_API_KEY=sk-dein-api-key-hier
```

API Key: https://platform.openai.com/api-keys

## 3. App starten

```bash
npm run dev
```

Browser: http://localhost:3000

## 4. ASYCUDA Master Template

Das interne Master Template ist bereits eingebaut:

- `templates/asycuda-master-template.xml` — Hauptstruktur mit Platzhaltern
- `templates/asycuda-item-template.xml` — Item-Block (wird für jede Position exakt kopiert)

Aufgebaut aus einer echten ASYCUDA-XML. Alle alten Daten wurden durch Platzhalter ersetzt.

## 5. Dokumente hochladen

1. App öffnen → "Ngarko dokumente"
2. Rechnung, Packing List, CMR, Fotos hochladen (PDF, JPG, PNG, WEBP)
3. Bis zu 10 Dateien (Drag & Drop oder Kamera)
4. KI extrahiert automatisch alle Zolldaten

## 6. Daten prüfen

- **Rot** = Pflichtdaten fehlen
- **Gelb** = Unsicher, bitte prüfen
- **Grün** = OK

Alle Felder manuell korrigierbar. Summen werden automatisch neu berechnet.

## 7. XML erzeugen

1. Schritt 3 öffnen → "Gjenero XML për ASYCUDA"
2. App prüft: Summen, Pflichtfelder, XML-Struktur, alte Template-Daten
3. Status: Gati për eksport / Për kontroll / Draft
4. Bei fehlenden Pflichtfeldern: "Krijo Draft gjithsesi"

## 8. CSV / Excel exportieren

- Shkarko CSV — CSV (UTF-8)
- Shkarko Excel — Excel mit 6 Sheets

## 9. Sprache ändern

Einstellungen → Gjuha → Shqip / English

## 10. Tarifcodes verwalten

Einstellungen → Kode tarifore → neue Regeln hinzufügen

---

## Projektstruktur

```
dogana-ai/
├── templates/
│   ├── asycuda-master-template.xml
│   └── asycuda-item-template.xml
├── src/
│   ├── app/
│   │   ├── page.tsx
│   │   └── api/ (extract, generate-xml, export-csv, export-excel, voice)
│   ├── components/ (UploadZone, HeaderForm, ItemsTable, ExportPanel, Settings, VoiceInput)
│   ├── lib/ (xmlTemplateEngine, aiExtractionService, validationService, tariffMapper, ...)
│   ├── locales/ (sq.json, en.json)
│   └── types/index.ts
└── .env.local
```

## Stack

- Next.js 16, TypeScript, Tailwind CSS
- OpenAI GPT-4o Vision
- xlsx (Excel)
- String-Template-Engine (exakte ASYCUDA-Struktur)

---

**Repository:** https://github.com/Jenditos/dogana-ai
