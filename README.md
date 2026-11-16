# Northwind Claims

A deliberately busy demo app, with a different industry application for each prospect, used to show how Novus builds its overview on first scan.
Front end only, mock data, no backend. Published on GitHub Pages: https://darrenhuggins.github.io/northwind/

## Industries

The first screen is an industry picker. Choosing one opens a full app for that vertical, then a persona sign-in.
Insurance (Northwind Claims), Banking, Healthcare, Retail, Telecom, Manufacturing, Travel & Hospitality, Public Sector and HR & Workforce.
Each non-insurance vertical is defined as data in `src/verticals/defs.ts` (entities, fields, dashboard, wizard, rules, integrations, agents) and rendered by shared pages in `src/pages/generic.tsx`: about 16 pages and 2 AI agents each. To add a vertical, add one entry to `VERTICALS`.
Deep link straight to one with `#/?v=banking`.

## Northwind Claims (insurance)

- About 26 routes (HashRouter): dashboard, claims list and detail, a four-step loss report, assignments, reserves, fraud, subrogation, payments, batch payments, policies, customers, adjusters, vendors, documents, reports, report builder, audit log, notifications, settings (profile, roles, rules, integrations) and help.
- Stable `data-testid` attributes on key controls, so tagging and guides have reliable targets.
- Sign in as any of five personas (adjuster, manager, SIU analyst, finance, administrator). The choice is kept in `localStorage`.

## Demo cycle: bare, instrument, roll back

`main` ships with **no** Novus or Pendo code. That is the "before".

1. Connect the app in Novus (new app, copy the install snippet / key).
2. Add the instrumentation on a branch `instrument-novus` and open a PR into `main`. Merging deploys it.
3. Walk through the Novus overview that appears after the first scan.
4. To reset, run `scripts/rollback.sh`. It opens a revert PR for the instrumentation merge. Merging it redeploys the bare app.

Everything about the cycle is plain Git, so it can be repeated as often as needed.

## Develop

```bash
npm install
npm run dev
npm run build
```
