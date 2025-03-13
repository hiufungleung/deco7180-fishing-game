const videoSource = document.getElementById('videoSource');
const fishModal = document.getElementById('fishModal');
const confirmButton = document.getElementById('confirmButton');
const textContainer = document.getElementById('textContainer');
const okButton= document.getElementById('ok-button')
const CastButton = document.getElementById('cast-button');
const ReelButton = document.getElementById('reel-button');
const message = document.getElementById('message');
const fishStatus = document.getElementById('fishStatus');
const image = document.getElementById('initial-image');
const videos = document.querySelectorAll('video');
const sunnyStart = document.getElementById('sunny-cast-start')
const sunnyVideo = document.getElementById('sunny-cast-loop')
const sunnyreelVideo = document.getElementById('sunny-reel')
const rainyStart = document.getElementById('rainy-cast-start')
const rainyVideo = document.getElementById('rainy-cast-loop')
const rainyreelVideo = document.getElementById('rainy-reel')
let fishList = [];
let weather_info = 'sunny';
let spotname = 'default'
let lastClickTime = 0;
let bite_time = 0;
let isFishing = false;
let totalFish = 0;
let timeout;


let currentAnimation = './assets/gamevideo/rain';

videos.forEach(function(video) {
  video.controls = false;
});

const spotName = 'Waratah Bay';
fetch(`/get_game_env`)
  .then(response => response.json())
  .then(data => {
    fishList = data.fishes;
    weather_info = data.weather;
    spotname = data.spot_name;

    console.log(data);

  })
  .catch(error => {
    console.error('request error：', error);
  });


function hideAllVideos() {
  videos.forEach(video => {
      video.style.display = 'none';
  });
}

function playVideo(videoId) {
  hideAllVideos();
  const video = document.getElementById(videoId);
  if (video) {
    if (video.ended){
      video.style.display = 'block';
      video.play();
    } else{
      video.currentTime = 0;
      video.style.display = 'block';
      video.play();
    }
      
  }
}



function hideImage() {
  image.style.display = 'none';
}

function showImage() {
  image.style.display = 'block'; 
}



function playCastAnimation() {
  if(weather_info === "sunny"){
    hideImage();
    playVideo('sunny-cast-start');
    sunnyStart.addEventListener('ended', function(){
      sunnyVideo.loop = true;
      playVideo('sunny-cast-loop');
    }
    );
  }
  else if(weather_info === "rainy"){
    hideImage();
    playVideo('rainy-cast-start');
    sunnyStart.addEventListener('ended', function(){
      rainyVideo.loop = true;
      playVideo('rainy-cast-loop');
    }
    );
  }
  }



function playCatchAnimation() {
  if (weather_info === "sunny"){
    playVideo('sunny-reel');
  } 
  else if(weather_info === "rainy"){
    playVideo('rainy-reel');
  }
}


function getRandomFish() {
  const randomIndex = Math.floor(Math.random() * fishList.length);
  return fishList[randomIndex];
}    

function fish() {
  const caughtFish = getRandomFish();
  return caughtFish;
}    

function random_time(){
  const time = Math.floor(Math.random() * 10) + 6;
  return time;
}


CastButton.addEventListener('click', function () { 
  $('#guide-container').hide();
  casting();
});
ReelButton.addEventListener('click', function () { 
  $('#guide-container').hide();
  reel();
});


document.addEventListener('keydown', function(event) {
  const guideContainer = $('#guide-container');

  if (guideContainer.is(':visible')) {
    guideContainer.hide();
  } else {
    if (event.key === ' ' || event.keyCode === 32) {
      casting();
    }

    if (event.keyCode === 13) {
      reel();
    }
  }
});


$("#return-button").on("click", function() {
  window.history.back();
});


function casting() {
  if (isFishing) {
    return;
  } else {
    playCastAnimation();
    isFishing = true;
    if(timeout){
      clearTimeout(timeout);
    };
    
    const currentTime = new Date().getTime();
    message.textContent = 'Waiting for a fish to bite...';
    pop(message);
    lastClickTime = currentTime;

    let myTimeout = setTimeout(() => {
      if (isFishing) {
        message.textContent = 'Fish is biting!';
        pop(message);
        const currentTime = new Date().getTime();
        bite_time = currentTime;
      } else {
        console.log('Interrupted');
      }
    }, random_time() * 1000);

    CastButton.addEventListener('click', function() {
      if (!isFishing) {
        clearTimeout(myTimeout);//cancel setTimeout()
        console.log('Interrupted');
      }
    });
  }
}

function reel() {
  if(isFishing === false){
    return;
  }
  const currentTime = new Date().getTime();
  const timePassed = currentTime - lastClickTime;
  const bite_time_pass = currentTime - bite_time;
  let textContent = 'Error';
  if (timePassed < 6000){
    isFishing = !isFishing;
    textContent = 'No fish caught, You reeled in too early.';
    playCatchAnimation();
    timeout = setTimeout(function() {
      fishingStatusMsg(textContent);
      }, 2000);
  }
  else if(bite_time_pass > 3000){
    isFishing = !isFishing;
    textContent = 'Too late, the fish has already escaped.';
    playCatchAnimation();
    timeout = setTimeout(function() {
      fishingStatusMsg(textContent);
      }, 2000);
  }
  else if(bite_time_pass < 3000){
    const caughtFish = fish();
    let imageUrl = `./assets/images/fishes/${caughtFish}.png`;
    const formattedfName = formatFishName(caughtFish);
    isFishing = !isFishing;
    textContent = `You've caught a ${formattedfName}!`;
    playCatchAnimation()
    timeout = setTimeout(function() {
      fishingStatusMsg(textContent);
      catchFish(caughtFish);
      }, 2000);
  }
}

function fishingStatusMsg(content) {
  const fishingMessage = document.getElementById('message');
  fishingMessage.textContent = content;
  pop(fishingMessage);
  showImage();
}

function pop(info) { 
  /* pop the window to tell the result, whcih last for 2 secs. */
  info.style.visibility = "visible";
  setTimeout(function() {
          info.style.visibility = 'hidden';
  }, 2000);
}

okButton.addEventListener('click', function() {
    // guide-container
    var guideContainer = document.getElementById('guide-container');
    guideContainer.style.visibility = 'hidden';
});

function catchFish(fishName) {
  let formData = new FormData();
  formData.append('fish_name', fishName);
  console.log(fishName);

  fetch( `/user_catch_fish`,{
    method: 'POST',
    body: formData
  })
  .then(response => response.json())
  .then(data => {
      if (data.success) {
        totalFish += 1;
        updateTotalFishCount();
      } else {
        console.error('Error catching fish.');
      }
  })
  .catch(error => {
      console.error('There was an error sending the fish catch:', error);
  });
}

function formatFishName(fishName) {
  let formattedName = fishName.replace(/-/g, " ");
  formattedName = formattedName.replace(/\b\w/g, function(char) {
      return char.toUpperCase();
  });

  return formattedName;
}


function updateTotalFishCount() {
  var totalDisplay = document.getElementById('total-fish-count'); 
  totalDisplay.textContent = totalFish + " Fishes Caught!";
}

