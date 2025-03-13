const videoSource = document.getElementById('videoSource');
const fishModal = document.getElementById('fishModal');
const confirmButton = document.getElementById('confirmButton');
const textContainer = document.getElementById('textContainer');
const okButton = document.getElementById('ok-button');
const castButton = document.getElementById('cast-button');
const reelButton = document.getElementById('reel-button');
const message = document.getElementById('message');
const fishStatus = document.getElementById('fishStatus');
const image = document.getElementById('initial-image');
const videos = document.querySelectorAll('video');
const sunnyStart = document.getElementById('sunny-cast-start');
const sunnyVideo = document.getElementById('sunny-cast-loop');
const sunnyReelVideo = document.getElementById('sunny-reel');
const rainyStart = document.getElementById('rainy-cast-start');
const rainyVideo = document.getElementById('rainy-cast-loop');
const rainyReelVideo = document.getElementById('rainy-reel');

let fishList = [];
let weatherInfo = 'sunny';
let spotName = 'default';
let lastClickTime = 0;
let biteTime = 0;
let isFishing = false;
let totalFish = 0;
let timeout;

videos.forEach(video => video.controls = false);

const gameEnv = JSON.parse(localStorage.getItem("game_env"));
if (gameEnv) {
  fishList = gameEnv.fishes;
  weatherInfo = gameEnv.weather;
  spotName = gameEnv.spot_name;
  console.log(gameEnv);
}

function hideAllVideos() {
  videos.forEach(video => video.style.display = 'none');
}

function playVideo(videoId) {
  hideAllVideos();
  const video = document.getElementById(videoId);
  if (video) {
    video.currentTime = 0;
    video.style.display = 'block';
    video.play();
  }
}

function hideImage() {
  image.style.display = 'none';
}

function showImage() {
  image.style.display = 'block';
}

function playCastAnimation() {
  hideImage();
  if (weatherInfo === "sunny") {
    playVideo('sunny-cast-start');
    sunnyStart.addEventListener('ended', () => {
      sunnyVideo.loop = true;
      playVideo('sunny-cast-loop');
    });
  } else {
    playVideo('rainy-cast-start');
    rainyStart.addEventListener('ended', () => {
      rainyVideo.loop = true;
      playVideo('rainy-cast-loop');
    });
  }
}

function playCatchAnimation() {
  playVideo(weatherInfo === "sunny" ? 'sunny-reel' : 'rainy-reel');
}

function getRandomFish() {
  return fishList[Math.floor(Math.random() * fishList.length)];
}

function randomTime() {
  return Math.floor(Math.random() * 10) + 6;
}

castButton.addEventListener('click', () => {
  document.getElementById('guide-container').style.display = 'none';
  casting();
});

reelButton.addEventListener('click', () => {
  document.getElementById('guide-container').style.display = 'none';
  reel();
});

document.addEventListener('keydown', event => {
  const guideContainer = document.getElementById('guide-container');
  if (guideContainer.style.display !== 'none') {
    guideContainer.style.display = 'none';
  } else {
    if (event.key === ' ') casting();
    if (event.key === 'Enter') reel();
  }
});

document.getElementById("return-button").addEventListener("click", () => {
  window.history.back();
});

function casting() {
  if (isFishing) return;
  playCastAnimation();
  isFishing = true;
  clearTimeout(timeout);

  message.textContent = 'Waiting for a fish to bite...';
  pop(message);
  lastClickTime = Date.now();

  timeout = setTimeout(() => {
    if (isFishing) {
      message.textContent = 'Fish is biting!';
      pop(message);
      biteTime = Date.now();
    }
  }, randomTime() * 1000);
}

function reel() {
  if (!isFishing) return;
  const currentTime = Date.now();
  const timePassed = currentTime - lastClickTime;
  const biteTimePassed = currentTime - biteTime;
  let textContent;

  if (timePassed < 6000) {
    textContent = 'No fish caught, You reeled in too early.';
  } else if (biteTimePassed > 3000) {
    textContent = 'Too late, the fish has already escaped.';
  } else {
    const caughtFish = getRandomFish();
    textContent = `You've caught a ${formatFishName(caughtFish)}!`;
    catchFish(caughtFish);
  }

  playCatchAnimation();
  timeout = setTimeout(() => fishingStatusMsg(textContent), 2000);
  isFishing = false;
}

function fishingStatusMsg(content) {
  message.textContent = content;
  pop(message);
  showImage();
}

function pop(info) {
  info.style.visibility = "visible";
  setTimeout(() => info.style.visibility = 'hidden', 2000);
}

okButton.addEventListener('click', () => {
  document.getElementById('guide-container').style.visibility = 'hidden';
});

function catchFish(fishName) {
  const userFishData = JSON.parse(localStorage.getItem("caught_fishes")) || {};
  userFishData[fishName] = (userFishData[fishName] || 0) + 1;
  localStorage.setItem("caught_fishes", JSON.stringify(userFishData));
  totalFish += 1;
  updateTotalFishCount();
}

function formatFishName(fishName) {
  return fishName.replace(/-/g, " ").replace(/\b\w/g, char => char.toUpperCase());
}

function updateTotalFishCount() {
  document.getElementById('total-fish-count').textContent = `${totalFish} Fishes Caught!`;
}
