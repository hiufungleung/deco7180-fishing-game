import fish_descriptions from "./fish_descriptions.js";
import spot_geo from "./spot_geo.js";
import spots_fishes from "./spots_fishes.js";
import { getWeather } from "./weather.js";

let searchExpanded = false;

function toggleSearch() {
    const searchInput = document.getElementById("search-input");
    const searchBar = document.getElementById("search-bar");

    if (!searchExpanded) {
        searchInput.classList.remove("closed");
        searchBar.classList.remove("closed");
        searchInput.focus();
        searchExpanded = true;
    } else {
        searchInput.classList.add("closed");
        searchBar.classList.add("closed");
        searchExpanded = false;
    }
}

window.toggleSearch = toggleSearch; // Expose toggleSearch to global scope

const elementsToStopPropagation = ["search-input", "search-icon", "search-bar"];

elementsToStopPropagation.forEach((elementId) => {
    const element = document.getElementById(elementId);
    if (element) {
        L.DomEvent.disableClickPropagation(element);
        L.DomEvent.disableScrollPropagation(element);
        L.DomEvent.on(element, "mousedown touchstart", (e) => {
            if (e.target.id !== "search-input") {
                L.DomEvent.preventDefault(e);
            }
            L.DomEvent.stopPropagation(e);
        });
    }
});

let map;
let markers = [];
const redIcon = new L.Icon({
    iconUrl: './assets/images/icons/pin-with-shadow.png',
    iconSize: [55, 55],
});

function initializeMap(centerCoords) {
    map = L.map('map', { zoomControl: false }).setView(centerCoords, 7);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        minZoom: 7,
        maxZoom: 18,
        attribution: '©OpenStreetMap contributors',
    }).addTo(map);

    const bounds = L.latLngBounds(L.latLng(-45.0, 108), L.latLng(-9.0, 160.0));
    map.setMaxBounds(bounds);

    map.on('click', hideSidebar);
}

async function setMarker(coords, spotName, map, markers, redIcon) {
    const marker = L.marker(coords, { icon: redIcon }).addTo(map);
    markers.push(marker);

    marker.on("click", async () => {
        showSidebar();
        updateSidebarLocationName(spotName);

        try {
            const { weather, temperature } = await getWeather(spotName, spot_geo);
            const fishes = spots_fishes[spotName] || [];

            updateSidebarWeatherData({ weather, temperature });
            loadThumbnails(fishes);
            togglePlayButton(weather);

            const gameData = {
                spot_name: spotName,
                weather: weather.toLowerCase(),
                fishes: fishes
            };
            localStorage.setItem("game_env", JSON.stringify(gameData));
            console.log("Game environment stored:", gameData);
        } catch (error) {
            console.error("Error fetching spot info:", error);
        }
    });
}


function fitAllMarkers() {
    if (markers.length === 0) return;
    const bounds = new L.LatLngBounds(markers.map((marker) => marker.getLatLng()));
    map.fitBounds(bounds);
}

function clearMarkers() {
    markers.forEach((marker) => map.removeLayer(marker));
    markers = [];
}

function showSidebar() {
    document.getElementById('sidebar').style.left = '0%';
}

function hideSidebar() {
    document.getElementById('sidebar').style.left = '-100%';
}

function updateSidebarLocationName(name) {
    document.querySelector('#location h2').textContent = name;
}

function updateSidebarWeatherData(data) {
    document.querySelector('#temperature div').textContent = data.temperature;
    document.querySelector('#weather-condition div').textContent = formatWeather(data.weather);
    document.querySelector('.temperature-image').src = './assets/images/icons/temperature.png';
    document.querySelector('.weather-image').src = getWeatherIconUrl(data.weather);
}

function togglePlayButton(weather) {
    const playButton = document.querySelector('.play-button');
    if (['snowy', 'thunderstorm'].includes(weather)) {
        playButton.classList.add('cannot-play');
    } else {
        playButton.classList.remove('cannot-play');
    }
}

function formatWeather(weather) {
    return weather.replace(/-/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
}

function getWeatherIconUrl(weatherCondition) {
    const icons = {
        sunny: './assets/images/weather/sunny.png',
        rainy: './assets/images/weather/rainy.png',
        cloudy: './assets/images/weather/cloudy.png',
        snowy: './assets/images/weather/snowy.png',
        thunderstorm: './assets/images/weather/thunderstorm.png',
    };
    return icons[weatherCondition.toLowerCase()] || '';
}

function getQueryParams() {
    return Object.fromEntries(new URLSearchParams(window.location.search));
}

function getNearSpotsAndSetMarkers(lat, lon) {
    const distances = Object.entries(spot_geo).map(([spotName, coords]) => ({
        spotName,
        distance: haversineDistance(lat, lon, coords.lat, coords.lng),
        coords,
    }));
    distances.sort((a, b) => a.distance - b.distance);
    const nearestSpots = distances.slice(0, 10);

    clearMarkers();
    nearestSpots.forEach(({ spotName, coords }) => setMarker([coords.lat, coords.lng], spotName));
    fitAllMarkers();
}

function haversineDistance(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * (Math.PI / 180)) *
        Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

async function victoriaCheck(locationData, callback) {
    const location = `${locationData.lat},${locationData.lon}`;
    try {
        const response = await fetch(`https://geocode.maps.co/reverse?lat=${locationData.lat}&lon=${locationData.lon}`);
        if (response.ok) {
            const data = await response.json();
            const isInVictoria = data.address?.country === "Australia" && data.address?.state === "Victoria";
            callback(isInVictoria);
        }
    } catch (error) {
        console.error("Error fetching data", error);
        callback(false);
    }
}


function showPopup(elementId) {
    const popup = document.getElementById(elementId);
    if (popup) {
        popup.style.visibility = 'visible';
        setTimeout(() => (popup.style.visibility = 'hidden'), 3500);
    }
}

document.getElementById('search-input').addEventListener('keyup', (event) => {
    if (event.key === 'Enter') {
        document.getElementById('search-icon').click();
    }
});

document.getElementById('search-icon').addEventListener('click', async () => {
    toggleSearch();
    const inputValue = document.getElementById("search-input").value;

    const geocodingApiUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${inputValue}`;
    try {
        const response = await fetch(geocodingApiUrl);
        const data = await response.json();

        if (data.length > 0) {
            const locationData = data[0];
            console.log(data);
            console.log(locationData);

            const isInVictoria = await victoriaCheck(locationData);
            if (!isInVictoria) {
                showPopup('wrong-place');
            } else {
                const { lat, lon } = locationData;
                clearMarkers();
                getNearSpotsAndSetMarkers(lat, lon);
            }
        } else {
            console.error('No results found');
        }
    } catch (error) {
        console.error('Error fetching geolocation:', error);
    }
});

document.getElementById('search-icon').addEventListener('mouseover', () => {
    document.getElementById('search-bar').classList.add('expanded');
    document.getElementById('search-input').classList.add('expanded');
});

document.getElementById('search-bar').addEventListener('mouseleave', () => {
    document.getElementById('search-bar').classList.remove('expanded');
    document.getElementById('search-input').classList.remove('expanded');
});

function loadThumbnails(fishes) {
    const thumbnailContainer = document.getElementById('thumbnail-container');
    thumbnailContainer.innerHTML = '';

    fishes.forEach((fishName) => {
        const fishImage = document.createElement('img');
        fishImage.src = `./assets/images/fishes/${fishName}.png`;
        fishImage.alt = fishName;
        fishImage.className = 'sidebar-thumbnail';
        fishImage.addEventListener('click', () => navigateToFishdex(fishName));

        thumbnailContainer.appendChild(fishImage);
    });
}

function navigateToFishdex(fishName) {
    window.location.href = `./fishdex.html?fish=${encodeURIComponent(fishName)}`;
}

const center = [-36.5201, 144.9646];
initializeMap(center);

const params = getQueryParams();
if (params.spotName) {
    const spotInfo = spot_geo[params.spotName]; // 從 spot_geo 取得座標
    if (spotInfo) {
        const { lat, lng } = spotInfo; // 取得緯度與經度
        (async () => {
            await setMarker([lat, lng], params.spotName, map, markers, redIcon);
            fitAllMarkers();
        })();
    } else {
        console.error(`No location found for ${params.spotName}`);
    }
}

document.querySelector('.play-button').addEventListener('click', () => {
    const storedData = localStorage.getItem("game_env");
    if (storedData) {
        window.location.href = "./fishgame.html";
    } else {
        console.error("No game data available.");
    }
});