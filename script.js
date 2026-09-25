const formulaire = document.getElementById("form-meteo");
const bulletinMeteo = document.getElementById("bulletin-meteo");

const villeInput = document.getElementById("ville");
const paysInput = document.getElementById("pays");

let champsRechercheVides = false;

villeInput.addEventListener("focus", function () {
  if (champsRechercheVides) {
    return;
  }

  villeInput.value = "";
  paysInput.value = "";

  champsRechercheVides = true;
});

formulaire.addEventListener("submit", function (evenement) {
  evenement.preventDefault();

  champsRechercheVides = false;

  rechercherMeteo();
});


async function rechercherMeteo() {
    const villeSaisie = villeInput.value.trim();
    const paysSaisi = paysInput.value.trim();


    if (villeSaisie === "") {
        bulletinMeteo.innerHTML = `
            <p class="message-erreur">
                Veuillez saisir le nom d'une ville.
            </p>
        `;

        villeInput.focus();
        return;
    }


    bulletinMeteo.innerHTML = `
        <p class="message-chargement">
            ⏳ Recherche de la météo en cours...
        </p>
    `;


    try {
        const recherche = paysSaisi
            ? `${villeSaisie}, ${paysSaisi}`
            : villeSaisie;


        const paramsGeocodage = new URLSearchParams({
            name: recherche,
            count: 1,
            language: "fr",
            format: "json"
        });


        const urlGeocodage =
            "https://geocoding-api.open-meteo.com/v1/search?" +
            paramsGeocodage.toString();


        const reponseGPS = await fetch(urlGeocodage);


        if (!reponseGPS.ok) {
            throw new Error("Erreur pendant la recherche de la ville.");
        }


        const donneesGPS = await reponseGPS.json();


        if (!donneesGPS.results || donneesGPS.results.length === 0) {
            bulletinMeteo.innerHTML = `
                <p class="message-erreur">
                    ❌ Ville introuvable. Vérifiez l'orthographe de la ville ou du pays.
                </p>
            `;

            return;
        }


        const lieu = donneesGPS.results[0];

        const latitude = lieu.latitude;
        const longitude = lieu.longitude;
        const ville = lieu.name;
        const pays = lieu.country;
        const fuseauHoraire = lieu.timezone;


        const paramsMeteo = new URLSearchParams({
    latitude: latitude,
    longitude: longitude,
    timezone: "auto",
    forecast_days: 5,

    current: [
        "temperature_2m",
        "apparent_temperature",
        "relative_humidity_2m",
        "wind_speed_10m",
        "rain",
        "snowfall",
        "weather_code"
    ].join(","),

    hourly: "temperature_2m",

    daily: [
        "weather_code",
        "temperature_2m_max",
        "temperature_2m_min",
        "precipitation_sum",
        "wind_speed_10m_max"
    ].join(",")
});

        const urlMeteo =
            "https://api.open-meteo.com/v1/forecast?" +
            paramsMeteo.toString();


        const reponseMeteo = await fetch(urlMeteo);


        if (!reponseMeteo.ok) {
            throw new Error("Erreur pendant la récupération de la météo.");
        }


        const donneesMeteo = await reponseMeteo.json();


        afficherBulletin(
            ville,
            pays,
            latitude,
            longitude,
            fuseauHoraire,
            donneesMeteo
        );

    } catch (erreur) {
        console.error(erreur);

        bulletinMeteo.innerHTML = `
            <p class="message-erreur">
                ❌ Une erreur est survenue. Vérifiez votre connexion Internet puis réessayez.
            </p>
        `;
    }
}


function afficherBulletin(
    ville,
    pays,
    latitude,
    longitude,
    fuseauHoraire,
    donneesMeteo
) {
    const actuel = donneesMeteo.current;
const quotidien = donneesMeteo.daily;
const heures = donneesMeteo.hourly.time;
const temperatures = donneesMeteo.hourly.temperature_2m;

const dateDuJour = quotidien.time[0];

const heureMatin = dateDuJour + "T08:00";
const heureMidi = dateDuJour + "T12:00";
const heureSoir = dateDuJour + "T20:00";

const indiceMatin = heures.indexOf(heureMatin);
const indiceMidi = heures.indexOf(heureMidi);
const indiceSoir = heures.indexOf(heureSoir);

const temperatureMatin = temperatures[indiceMatin];
const temperatureMidi = temperatures[indiceMidi];
const temperatureSoir = temperatures[indiceSoir];

const condition = obtenirConditionMeteo(actuel.weather_code);
const previsionsHTML = creerPrevisions(quotidien);
    

    bulletinMeteo.innerHTML = `
        <div class="carte-actuelle">

            <p class="resultat-ville">
                📍 ${ville}, ${pays}
            </p>

            <p class="condition-meteo">
                ${condition.icone} ${condition.texte}
            </p>

            <p class="temperature-actuelle">
                ${Math.round(actuel.temperature_2m)} °C
            </p>

            <p>
                Ressenti : <strong>${Math.round(actuel.apparent_temperature)} °C</strong>
            </p>

            <div class="temperatures-journee">

    <h3>Températures de la journée</h3>

    <div class="liste-temperatures">

        <article class="carte-temperature">
            <p class="moment-journee">🌅 Matin</p>
            <p class="heure-journee">8 h</p>
            <p class="valeur-temperature">
                ${Math.round(temperatureMatin)} °C
            </p>
        </article>

        <article class="carte-temperature">
            <p class="moment-journee">☀️ Midi</p>
            <p class="heure-journee">12 h</p>
            <p class="valeur-temperature">
                ${Math.round(temperatureMidi)} °C
            </p>
        </article>

        <article class="carte-temperature">
            <p class="moment-journee">🌙 Soir</p>
            <p class="heure-journee">20 h</p>
            <p class="valeur-temperature">
                ${Math.round(temperatureSoir)} °C
            </p>
        </article>

        </div>

        </div>

            <p>
                💧 Humidité : <strong>${actuel.relative_humidity_2m} %</strong>
            </p>

            <p class="resultat-vent">
                💨 Vent : ${actuel.wind_speed_10m} km/h
            </p>

            <p class="resultat-pluie">
                🌧️ Pluie actuelle : ${actuel.rain} mm
            </p>

            <p class="resultat-neige">
                ❄️ Neige actuelle : ${actuel.snowfall} cm
            </p>

            <p class="infos-lieu">
                Fuseau horaire : ${fuseauHoraire}
            </p>

        </div>

        <div class="resume-jour">

            <h3>Résumé du jour</h3>

            <p>
                🌡️ Minimale : <strong>${Math.round(quotidien.temperature_2m_min[0])} °C</strong>
            </p>

            <p>
                ☀️ Maximale : <strong>${Math.round(quotidien.temperature_2m_max[0])} °C</strong>
            </p>

            <p>
                🌧️ Précipitations prévues :
                <strong>${quotidien.precipitation_sum[0]} mm</strong>
            </p>

            <p>
                💨 Vent maximal :
                <strong>${Math.round(quotidien.wind_speed_10m_max[0])} km/h</strong>
            </p>

        </div>

        <div class="zone-previsions">

            <h3>Prévisions sur 5 jours</h3>

            <div class="liste-previsions">
                ${previsionsHTML}
            </div>

        </div>
    `;
}


function obtenirConditionMeteo(code) {
    const conditions = {
        0: { texte: "Ciel dégagé", icone: "☀️" },
        1: { texte: "Principalement dégagé", icone: "🌤️" },
        2: { texte: "Partiellement nuageux", icone: "⛅" },
        3: { texte: "Ciel couvert", icone: "☁️" },
        45: { texte: "Brouillard", icone: "🌫️" },
        48: { texte: "Brouillard givrant", icone: "🌫️" },
        51: { texte: "Bruine légère", icone: "🌦️" },
        53: { texte: "Bruine modérée", icone: "🌦️" },
        55: { texte: "Bruine dense", icone: "🌧️" },
        56: { texte: "Bruine verglaçante légère", icone: "🌧️" },
        57: { texte: "Bruine verglaçante dense", icone: "🌧️" },
        61: { texte: "Pluie faible", icone: "🌦️" },
        63: { texte: "Pluie modérée", icone: "🌧️" },
        65: { texte: "Forte pluie", icone: "🌧️" },
        66: { texte: "Pluie verglaçante légère", icone: "🌧️" },
        67: { texte: "Pluie verglaçante forte", icone: "🌧️" },
        71: { texte: "Neige faible", icone: "🌨️" },
        73: { texte: "Neige modérée", icone: "🌨️" },
        75: { texte: "Forte neige", icone: "❄️" },
        77: { texte: "Grains de neige", icone: "❄️" },
        80: { texte: "Averses faibles", icone: "🌦️" },
        81: { texte: "Averses modérées", icone: "🌧️" },
        82: { texte: "Averses fortes", icone: "🌧️" },
        85: { texte: "Averses de neige faibles", icone: "🌨️" },
        86: { texte: "Averses de neige fortes", icone: "❄️" },
        95: { texte: "Orage", icone: "⛈️" },
        96: { texte: "Orage avec grêle légère", icone: "⛈️" },
        99: { texte: "Orage avec forte grêle", icone: "⛈️" }
    };


    return conditions[code] || {
        texte: "Condition météo inconnue",
        icone: "❔"
    };
}


function creerPrevisions(quotidien) {
    let contenu = "";


    for (let index = 0; index < quotidien.time.length; index++) {
        const date = new Date(quotidien.time[index] + "T12:00:00");

        const dateFormatee = date.toLocaleDateString("fr-FR", {
            weekday: "long",
            day: "numeric",
            month: "long"
        });

        const condition = obtenirConditionMeteo(
            quotidien.weather_code[index]
        );

        const minimum = Math.round(
            quotidien.temperature_2m_min[index]
        );

        const maximum = Math.round(
            quotidien.temperature_2m_max[index]
        );


        contenu += `
            <article class="carte-prevision">

                <h4>${dateFormatee}</h4>

                <p class="icone-prevision">
                    ${condition.icone}
                </p>

                <p>${condition.texte}</p>

                <p>
                    <strong>${minimum} °C</strong>
                    /
                    <strong>${maximum} °C</strong>
                </p>

            </article>
        `;
    }


    return contenu;
}
