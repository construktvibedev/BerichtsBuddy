# BerichtsBuddy

Moderne Webanwendung für dein digitales Berichtsheft in der Ausbildung.

## Features

- Wochenansicht von **Montag bis Freitag**
- Beim Öffnen wird immer die **aktuelle Woche** angezeigt
- Einträge als **Stichpunkte mit Markdown-Unterstützung**
- Standardmäßig gerenderte Markdown-Ansicht, Bearbeitung per Klick/Fokus als Plain Text
- Export als strukturierte **.md** für Woche oder Monat
- Speicherung aller Einträge mit Datum im **Browser Local Storage**
- Autosave-Status nach dem Tippen (Speichert/Automatisch gespeichert)
- Navigation zu vorherigen/nächsten Wochen
- Modernes **Liquid-Glass** UI
- Smooth Scrolling

## Lokale Nutzung

Da es sich um eine statische Web-App handelt, kannst du sie direkt öffnen:

1. Repository klonen
2. Datei `/home/runner/work/BerichtsBuddy/BerichtsBuddy/index.html` im Browser öffnen

Alternativ mit einem lokalen Webserver (empfohlen):

```bash
cd ~/BerichtsBuddy
python3 -m http.server 8080
```

Dann im Browser öffnen: `http://localhost:8080`

## Docker

### Build

```bash
cd ~/BerichtsBuddy
docker build -t berichtsbuddy .
```

### Start

```bash
docker run -d --name berichtsbuddy -p 8080:80 berichtsbuddy
```

App im Browser öffnen: `http://localhost:8080`

## Hinweise zur Datenspeicherung

- Die Einträge werden ausschließlich im **Local Storage** deines Browsers gespeichert.
- Bei Browserwechsel oder gelöschtem Browser-Cache sind die Einträge nicht mehr verfügbar.
