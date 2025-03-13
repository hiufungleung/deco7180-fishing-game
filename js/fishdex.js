import fish_descriptions from "./fish_descriptions.js";
import fish_spots from "./fish_spots.js";

function loadThumbnails() {
    const thumbnailContainer = document.getElementById("thumbnail-container");

    Object.keys(fish_spots).forEach((fishName, index) => {
        const thumbnail = document.createElement("div");
        thumbnail.classList.add("fishdex-thumbnail");
        thumbnail.style.backgroundImage = `url(./assets/images/fishes/${fishName}.png)`;
        thumbnail.dataset.index = index;

        thumbnail.addEventListener("click", () => updateGallery(fishName));

        thumbnailContainer.appendChild(thumbnail);
    });
}

function updateGallery(fishName) {
    document.getElementById("mainImg").src = `./assets/images/fishes/${fishName}.png`;
    const formattedName = formatFishName(fishName);
    document.querySelector(".description-title").textContent = formattedName;

    document.getElementById("fish-description").textContent = fish_descriptions[fishName] || "No description available.";

    const spotsList = document.querySelector(".spots-list");
    spotsList.innerHTML = "";

    (fish_spots[fishName] || []).forEach(locationName => {
        const spotDiv = document.createElement("div");
        spotDiv.classList.add("spot");
        spotDiv.textContent = locationName;
        spotsList.appendChild(spotDiv);
    });

    const userFishData = JSON.parse(localStorage.getItem("caught_fishes")) || {};
    const fishAmount = document.getElementById("count-the-fish");
    const amount = userFishData[fishName];
    fishAmount.textContent = amount !== undefined ? `You have caught ${amount} ${formattedName}.` : "You haven't caught this Fish yet!";

    document.querySelector(".gallery-container").classList.remove("hidden");
}

function getURLParameter(name) {
    const result = new URLSearchParams(window.location.search).get(name);
    return result ? decodeURIComponent(result) : null;
}

const selectedFish = getURLParameter("fish");
if (selectedFish) {
    updateGallery(selectedFish);
}

function formatFishName(fishName) {
    return fishName.replace(/-/g, " ").replace(/\b\w/g, char => char.toUpperCase());
}

document.getElementById("return-button").addEventListener("click", () => {
    window.history.back();
});

document.querySelector(".all-spots-btn").addEventListener("click", () => {
    document.getElementById("fishing-spots-popup").style.display = "block";
});

document.getElementById("fishing-spots-popup").addEventListener("click", () => {
    document.getElementById("fishing-spots-popup").style.display = "none";
});

document.getElementById("close-popup").addEventListener("click", () => {
    document.getElementById("fishing-spots-popup").style.display = "none";
});

document.querySelector(".popup-content").addEventListener("click", e => {
    e.stopPropagation();
});

document.querySelector(".spots-list").addEventListener("click", e => {
    if (e.target.classList.contains("spot")) {
        const spotName = e.target.textContent;
        window.location.href = `./index.html?spotName=${encodeURIComponent(spotName)}`;
    }
});

document.addEventListener("DOMContentLoaded", loadThumbnails);
