const champVille = document.getElementById("ville");
const champPays = document.getElementById("pays");
const bulletinMeteo = document.getElementById("bulletin-meteo");

const formulaire = document.getElementById("form-meteo");

champVille.addEventListener("input", function() {

    bulletinMeteo.innerHTML = "";

});

formulaire.addEventListener("submit", async function(event) {

    event.preventDefault();

    testerGeocodage();

  champVille.value = "";
champPays.value = "";
champVille.focus();

})

async function testerGeocodage() {
  
  const villeSaisie = champVille.value;
  const paysSaisi = champPays.value;
  
  const urlGeocodage =
    "https://geocoding-api.open-meteo.com/v1/search" +
    "?name=" + villeSaisie + ", " + paysSaisi +
    "&count=1" +
    "&language=fr" +
    "&format=json";

    const reponseGPS = await fetch(urlGeocodage);
    const donneesGPS = await reponseGPS.json();

    const latitude = donneesGPS.results[0].latitude;
    const longitude = donneesGPS.results[0].longitude;
    const ville = donneesGPS.results[0].name;
    const pays = donneesGPS.results[0].country;

    const urlMeteo =
    "https://api.open-meteo.com/v1/forecast" +
    "?latitude=" + latitude +
    "&longitude=" + longitude +
    "&current=temperature_2m,wind_speed_10m,rain,snowfall,weather_code" +
    "&hourly=temperature_2m";

    const reponseMeteo = await fetch(urlMeteo);
    const donneesMeteo = await reponseMeteo.json();

    const maintenant = new Date();
    const dateDuJour = maintenant.toISOString().substring(0, 10);

    const heures = donneesMeteo.hourly.time;
    const temperatures = donneesMeteo.hourly.temperature_2m;

    const heureMatin = dateDuJour + "T08:00";
    const heureSoir = dateDuJour + "T20:00";

    const indiceMatin = heures.indexOf(heureMatin);
    const indiceSoir = heures.indexOf(heureSoir);

    const temperatureMatin = temperatures[indiceMatin];
    const temperatureSoir = temperatures[indiceSoir];

const vent = donneesMeteo.current.wind_speed_10m;

const pluie = donneesMeteo.current.rain;
const neige = donneesMeteo.current.snowfall;
const codeMeteo = donneesMeteo.current.weather_code;


  let messageOrage = "";

if (codeMeteo === 95 || codeMeteo === 96 || codeMeteo === 99) {
    messageOrage = "Oui";
} else {
    messageOrage = "Non";
}
  
    bulletinMeteo.innerHTML = `

    <p class="resultat-ville">📍 Ville : ${ville}</p>
    <p>🌍 Pays : ${pays}</p>

    <p>🌐 Latitude : ${latitude}</p>
    <p>🌐 Longitude : ${longitude}</p>

    <p class="resultat-temperature">🌅 Température du matin : ${temperatureMatin} °C</p>
    <p class="resultat-temperature">🌙 Température du soir : ${temperatureSoir} °C</p>

    <p class="resultat-vent">💨 Vent : ${vent} km/h</p>
    <p class="resultat-pluie">🌧️ Pluie : ${pluie} mm</p>
    <p class="resultat-neige">❄️ Neige : ${neige} cm</p>
    <p class="resultat-orage">⛈️ Orage : ${messageOrage}</p>

`;
}
