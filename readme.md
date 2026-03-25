# Nieuwskaart

Nieuwskaart van Gelderland met recent gepubliceerde artikelen.

De kaart kan gebruikt worden voor redacties om in de gaten te houden of er voldoende evenredige spreiding van nieuwsberichten is.

De kaart is bedoeld voor intern gebruik. Wanneer je de kaart openstelt voor het publiek dan wordt er veel data van OpenStreetMap gebruikt en voldoe je mogelijk niet aan de [voorwaarden](https://operations.osmfoundation.org/policies/tiles/). Kies voor publiek gebruik een andere kaartprovider.

## Gebruik

Zoek een GeoJSON-bestand op voor de regio die je op de kaart wil weergeven ([PDOK bestuurlijke gebieden](https://api.pdok.nl/kadaster/bestuurlijkegebieden/ogc/v1/collections)). Plaats dit in data/provincie.json.

Vervang in webpack.dev.js en webpack.production.js de variabele `API_URL` door een link naar een API uit je nieuws-CMS. Deze API moet dit formaat request kunnen ontvangen:

```typescript
type Request = {
  van: string;
  tot: string;
};
```

- van: Minimale publicatiedatum in ISO 8601-formaat. Artikelen vanaf deze datum worden gegeven. Tijd wordt genegeerd. Leeg betekent geen minimum.
- tot: Maximale publicatiedatum in ISO 8601-formaat. Artikelen tot en met deze datum worden gegeven. Tijd wordt genegeerd. Leeg betekent geen maximum.

De API moet het volgende formaat teruggeven:

```typescript
type Response = {
  nimbus_id: number;
  headline: string;
  location: [number, number];
}[];
```

- nimbus_id: Artikel ID
- headline: Titel van het artikel
- location:
  - 0: Breedtegraad (decimaal)
  - 1: Lengtegraad (decimaal)

Gebruik een recente versie van npm om de source te bundelen. Gebruik eventueel [nvm](https://github.com/nvm-sh/nvm) om een recente versie te installeren.

```shell
export NODE_ENV=development
npm ci
npx eslint src/ts/
npx tsc --noEmit
npx webpack --config "webpack.production.js"
```

Plaats de gegenereerde bestanden in public/ op een webserver.
