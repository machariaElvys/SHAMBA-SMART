# Shamba-Smart

Shamba-Smart is a local-first crop journal concept for keeping crop records, field notes and farm tasks together. It is a frontend demonstration built with React, Vite and plain CSS; it does not require a Flask server, account or database.

## Features

- Add any crop by name, select its growth stage, change the selected crop, and remove or undo removal.
- Search crop entries and review their verification state and limitations.
- Search Wikipedia for crop-specific summaries by agricultural topic and optional county, including crops outside the local index.
- Save an inspected search result to an existing crop or add a crop with the reference; saved references retain their source, URL, summary, retrieval date and unverified status.
- Add crops without a guide and continue managing them without entering technical values.
- Record dated field observations, plan tasks and log watering.
- Review Open-Meteo weather and a regional soil-moisture model estimate.
- Optionally store farmer-entered comparison ranges. The dashboard does not compare the regional model estimate to those ranges or make watering decisions from it.

## Run locally

Install Node.js, then run these commands from the project folder:

```bash
npm ci
npm run dev
```

Vite prints the local address to open in your browser. The app works without starting the backend.

To check the production bundle and lint:

```bash
npm run build
npm run lint
```

## Crop guidance and data limits

The bundled crop index contains names and aliases, but no verified agricultural recommendations. Missing sensor or temperature targets stay unavailable. Wikipedia search provides general encyclopedia information, not farm-specific thresholds or expert-reviewed advice.

When existing local records load, old generic or unverified demo ranges are not used for recommendations. Previously customized ranges are retained as optional farmer-entered values. Crop names, stages, current selection, notes, tasks and watering logs remain in the browser.

The crop-guidance search uses Wikipedia's public search and page-summary APIs. It searches with crop, agricultural-topic and optional location terms, then screens returned summaries for crop and topic relevance. It imports only a short encyclopedia summary and original link, does not import the complete article, and does not mark results as expert-reviewed. Online search needs an internet connection. Saved references are kept with crop records in this browser's local storage.

Previously saved guide snapshots from retired sources are replaced with the current unverified crop entry. Saved recommendations that name those sources are cleared; farmer-entered comparison ranges are retained.

Weather is requested from Open-Meteo for the location shown in the dashboard. Soil moisture is a regional model estimate, not a reading from a sensor installed in a field. The app does not operate irrigation equipment. All crop and journal records stay in this browser's local storage and are not synced to a server.

The existing crop key `shambaSmart.crops.v1` and current-selection key `shambaSmart.currentCropId.v1` are retained.

## Project structure

- `src/pages` contains the home, dashboard, crop register, crop library, learning guide and about pages.
- `src/services/cropStorage.js` and `src/services/journalStorage.js` handle local records.
- `src/data/cropGuides.js` contains crop names, aliases and source-status metadata.
- `src/styles` contains the shared design system and page styles.
- `src/backend` retains the existing Flask backend files; the frontend does not call them.
