// Libraries js
// import * as bootstrap from 'bootstrap';
import 'bootstrap/js/dist/collapse';
import L from 'leaflet';
import 'leaflet.markercluster';

// css
import '/src/scss/index.scss';

// afbeeldingen
import marker_icon_png from "leaflet/dist/images/marker-icon.png";

// data
import gelderland_json from "../../data/gelderland.json";
import artikelen from "../../data/artikelen.json";

class Main {

  private map: L.Map;
  private marker_icon: L.Icon;

  constructor() {
    this.map = L.map(
      'map', {
        maxBounds: [
          [52.62202502028203, 4.89385467421249],
          [51.633580706998154, 6.932801619154944],
        ],
      }
    ).setView(
      [
        52.083333,
        5.916667
      ],
      10
    );
    this.marker_icon = L.icon({
      iconUrl: marker_icon_png
    });
  }

  public show(): void {
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(this.map);
    
    // @ts-ignore
    L.geoJSON(gelderland_json).addTo(this.map);

    this.artikelen_markers();
  }

  private artikelen_markers() {
    const markers = L.markerClusterGroup();
    for (const artikel of artikelen) {
      const url = `https://www.gld.nl/nieuws/${artikel.nimbus_id}`;
      const e_a = document.createElement('a');
      e_a.innerText = artikel.headline;
      e_a.href = url;
      e_a.target = '_blank';
      // @ts-ignore
      const marker = L.marker(artikel.location, {icon: this.marker_icon});
      marker.bindPopup(e_a);
      markers.addLayer(marker);
    }
    this.map.addLayer(markers);
  }
}

function get_extremen() {
  const coords = gelderland_json['geometry']['coordinates'][0][0]
  console.log(coords.length);
  let north, south, east, west;
  for (const [lng, lat] of coords) {
    north ??= lat;
    south ??= lat;
    east ??= lng;
    west ??= lng;
    north = Math.max(north, lat);
    south = Math.min(south, lat);
    east = Math.max(east, lng);
    west = Math.min(west, lng);
  }
  console.log({
    'north': north,
    'south': south,
    'east': east,
    'west': west,
  })

  for (const [lng, lat] of coords) {
    if (lat === north) {
      console.log(`Noord: ${lat} ${lng}`);
    }
    if (lat === south) {
      console.log(`Zuid: ${lat} ${lng}`);
    }
    if (lng === east) {
      console.log(`Oost: ${lat} ${lng}`);
    }
    if (lng === west) {
      console.log(`West: ${lat} ${lng}`);
    }
  }
}

const m = new Main();
m.show();
