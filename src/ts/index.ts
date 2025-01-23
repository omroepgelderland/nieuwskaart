// Libraries js
// import * as bootstrap from 'bootstrap';
import L, { Icon, Marker, MarkerClusterGroup } from 'leaflet';
import 'leaflet.markercluster';
import Collapse from 'bootstrap/js/dist/collapse';

// css
import '/src/scss/index.scss';

// afbeeldingen
import marker_icon_png from "leaflet/dist/images/marker-icon.png";

// data
import gelderland_json from "../../data/gelderland.json";

type IDMap = {
  map: HTMLElement
  overlay: HTMLElement
  menuknop: HTMLButtonElement
  menu: HTMLElement
  van: HTMLInputElement
  'van-help': HTMLElement
  tot: HTMLInputElement
  'tot-help': HTMLElement
};

type RequestData = {
  [index:string]: string|number|boolean|null
}|FormData;

interface ServerArtikel {
  nimbus_id: number
  headline: string
  location: [number, number]
}

class ServerError extends Error {}

/**
 * Een artikel op de kaart met metadata en een Leaflet marker.
 */
class KaartArtikel implements ServerArtikel {

  public marker: Marker;
  public e_a: HTMLAnchorElement;

  constructor(
    public nimbus_id: number,
    public headline: string,
    public location: [number, number],
    marker_icon: Icon,
  ) {
    this.e_a = document.createElement('a');
    this.e_a.innerText = headline;
    this.e_a.href = `https://www.gld.nl/nieuws/${nimbus_id}`;
    this.e_a.target = '_blank';
    // @ts-ignore
    this.marker = L.marker(this.location, {icon: marker_icon});
    this.marker.bindPopup(this.e_a);
  }

  /**
   * Past de headline aan als deze veranderd is.
   */
  public set_headline(headline: string): void {
    headline = headline.trim();
    if (this.headline !== headline) {
      this.headline = headline;
      this.e_a.innerText = headline;
    }
  }

  /**
   * Past de locatie aan als deze veranderd is.
   */
  public set_location(location: KaartArtikel['location']): void {
    if (
      this.location[0] !== location[0]
      || this.location[1] !== location[1]
    ) {
      this.location = location;
      this.marker.setLatLng(location);
    }
  }
}

class Main {

  private map: L.Map;
  private marker_icon: L.Icon;
  private e_van: HTMLInputElement;
  private e_tot: HTMLInputElement;
  private menu_collapse;
  private artikelen_markers: {[key: number]: KaartArtikel};
  private clustergroup?: MarkerClusterGroup;
  private interval_id: number|null;

  constructor() {
    this.e_van = getElementById('van');
    this.e_tot = getElementById('tot');
    this.artikelen_markers = {};
    this.menu_collapse = new Collapse(getElementById('menu'), {toggle: false});
    this.interval_id = null;

    this.set_default_filter();
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

    document.querySelector('form')?.addEventListener('submit', this.filter_submit_handler.bind(this));
  }

  /**
   * Toont de kaart en start het proces dat artikelen laad en wijzigingen checkt.
   */
  public async show(): Promise<void> {
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(this.map);
    
    // @ts-ignore
    L.geoJSON(gelderland_json).addTo(this.map);
    await this.restart_sync();
  }

  private async restart_sync(): Promise<void> {
    if (this.interval_id != null) {
      window.clearInterval(this.interval_id);
    }
    await this.sync_artikelen();
    this.interval_id = window.setInterval(this.sync_artikelen.bind(this), 60*10**3);
  }

  /**
   * Voegt nieuwe artikelen toe.
   * @param artikelen 
   */
  private maak_artikelen_markers(artikelen: ServerArtikel[]) {
    const maak_cluster = this.clustergroup == null;
    this.clustergroup ??= L.markerClusterGroup();
    for (const artikel of artikelen) {
      const kaartartikel = new KaartArtikel(
        artikel.nimbus_id,
        artikel.headline,
        artikel.location,
        this.marker_icon
      );
      this.artikelen_markers[artikel.nimbus_id] = kaartartikel;
      this.clustergroup.addLayer(kaartartikel.marker);
    }
    if (maak_cluster) {
      this.map.addLayer(this.clustergroup);
    }
  }

  /**
   * Past metadata en locatie van bestaande artikelen aan.
   * @param artikelen - Lijst met artikelen van de server. Al deze artikelen moeten al bestaan op de kaart.
   */
  private update_markers(artikelen: ServerArtikel[]) {
    for (const artikel of artikelen) {
      const bestaand_artikel = this.artikelen_markers[artikel.nimbus_id];
      if (bestaand_artikel != null) {
        bestaand_artikel.set_headline(artikel.headline);
        bestaand_artikel.set_location(artikel.location);
      }
    }
  }

  /**
   * Verwijdert artikelen van de kaart.
   */
  private verwijder_markers(artikelen: KaartArtikel[]) {
    if (this.clustergroup == null) {
      throw new Error();
    }

    // Van de kaart verwijderen
    const markers = artikelen.map(artikel => artikel.marker);
    this.clustergroup.removeLayers(markers);

    // Uit de lijst verwijderen
    for (const artikel of artikelen) {
      delete this.artikelen_markers[artikel.nimbus_id];
    }
  }

  /**
   * Haalt de lijst met artikelen opnieuw van de server en regelt wijzigingen op de kaart.
   */
  private async sync_artikelen() {
    const artikelen = await this.get_artikelen();
    const artikelen_entries = artikelen.map(artikel => [artikel.nimbus_id, artikel]);
    const artikelen_map: {[key: number]: ServerArtikel} = Object.fromEntries(artikelen_entries);

    const bestaande_ids = new Set(Object.keys(this.artikelen_markers).map(k => Number.parseInt(k)));
    const actuele_ids = new Set(Object.keys(artikelen_map).map(k => Number.parseInt(k)));

    const nieuwe_ids = actuele_ids.difference(bestaande_ids);
    const oude_ids = bestaande_ids.difference(actuele_ids);
    const zelfde_ids = actuele_ids.intersection(bestaande_ids);

    const nieuwe_artikelen = Array.from(nieuwe_ids).map(id => artikelen_map[id]);
    const oude_artikelen = Array.from(oude_ids).map(id => this.artikelen_markers[id]);
    const zelfde_artikelen = Array.from(zelfde_ids).map(id => artikelen_map[id]);

    // Nieuwe markers toevoegen
    this.maak_artikelen_markers(nieuwe_artikelen);
    // Oude markers verwijderen
    this.verwijder_markers(oude_artikelen);
    // Veranderde markers aanpassen
    this.update_markers(zelfde_artikelen);
  }

  /**
   * Zet de standaardwaarden in het filterformulier.
   */
  private set_default_filter(): void {
    const van = new Date();
    const tot = new Date();
    van.setDate(van.getDate() - 14);
    const tot_str = tot.toISOString().substring(0, 10);
    this.e_van.value = van.toISOString().substring(0, 10);
    this.e_van.max = tot_str;
    this.e_tot.value = tot_str;
    this.e_tot.max = tot_str;
  }

  /**
   * Haalt de artikelen uit Nimbus.
   */
  private get_artikelen(): Promise<ServerArtikel[]> {
    const request = {
      van: '',
      tot: '',
    };
    if (this.e_van.value.trim() !== '') {
      const van = new Date(this.e_van.value);
      van.setHours(12);
      request.van = van.toISOString();
    }
    if (this.e_tot.value.trim() !== '') {
      const tot = new Date(this.e_tot.value);
      tot.setHours(12);
      request.tot = tot.toISOString();
    }
    return post('get_artikelen', request);
  }

  private async filter_submit_handler(event: Event): Promise<void> {
    event.preventDefault();
    this.menu_collapse.hide();
    await this.restart_sync();
  }
}

function getElementById<I extends keyof IDMap>(elementId: I): IDMap[I] {
  const elem = document.getElementById(elementId);
  if ( elem === null ) {
      throw new Error(`#${elementId} niet gevonden`);
  }
  return elem as IDMap[I];
}

/**
 * Voert een post-request uit aan de server.
 */
function post<T>(functie: string, data: RequestData = {}): Promise<T> {
  return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', API_URL, true);
      xhr.onload = (post_verwerk_respons<T>).bind(undefined, xhr, resolve, reject);
      xhr.onerror = (post_verwerk_respons<T>).bind(undefined, xhr, resolve, reject);

      let send_data: FormData | string;
      if ( data instanceof FormData ) {
          data.append('functie', functie);
          send_data = data;
      } else {
          data.functie = functie;
          send_data = JSON.stringify(data);
          xhr.setRequestHeader('Content-Type', 'application/json');
      }
      xhr.send(send_data);
  });
}

/**
 * Verwerkt een serverrespons.
 * @param resolve - Uit te voeren functie bij een succesvolle uitvoering.
 * @param reject - Uit te voeren functie bij een mislukt request.
 */
function post_verwerk_respons<T>(
  xhr: XMLHttpRequest,
  resolve: (respons: T) => void,
  reject: (error: ServerError) => void,
  event: ProgressEvent
) {
  try {
      const data = JSON.parse(xhr.response);
      if ( data.error !== false ) {
          reject(new ServerError(data.errordata));
      } else {
          resolve(data.data);
      }
  } catch (error) {
      reject(new ServerError(xhr.responseText));
  }
}

const m = new Main();
m.show();
