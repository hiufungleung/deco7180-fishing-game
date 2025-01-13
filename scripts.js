const elementsToStopPropagation = ['search-input', 'search-icon', 'search-bar'];

$.each(elementsToStopPropagation, function(index, elementId) {
    const element = $(`#${elementId}`).get(0);  // Get the actual DOM element
    L.DomEvent.disableClickPropagation(element);
    L.DomEvent.disableScrollPropagation(element);
    L.DomEvent.on(element, 'mousedown touchstart', function(e) {
        if (e.target.id !== 'search-input') {
            L.DomEvent.preventDefault(e);
        }
        L.DomEvent.stopPropagation(e);
    });
});

$(document).ready(function() {
    let map;
    let currentMarker;
    let redIcon = new L.Icon({
        iconUrl: 'images/pin-with-shadow.png',
        iconSize: [55, 55],
    });

    function initializeMap(centerCoords) {
        const zoom = 7;
        map = L.map('map',{zoomControl: false}).setView(centerCoords, zoom);
        
        const tile = L.tileLayer('https://api.mapbox.com/styles/v1/popstar/cjklf93zr6alb2qruedu6ioq4/tiles/256/{z}/{x}/{y}?access_token=pk.eyJ1IjoicG9wc3RhciIsImEiOiJjamcwdDhtNnQxZDk4MndwYzR0bmJyeWx2In0.3RFc0AGJgsh-eI5Gsqf7kQ', {
            minZoom: 7,
            maxZoom: 18,
            attribution: '©OpenStreetMap, ©CartoDB',
            ext: 'png',
        }).addTo(map);

        const southWest = L.latLng(-45.0, 108),
            northEast = L.latLng(-9.0, 160.0);
        const bounds = L.latLngBounds(southWest, northEast);
        map.setMaxBounds(bounds);
    }

    let markers = [];

    function setMarker(markerCoords, spotName) {
    
        const currentMarker = L.marker(markerCoords, { icon: redIcon }).addTo(map);
        markers.push(currentMarker);
        
        currentMarker.on('click', function() {
    
            showSidebar();

            updateSidebarLocationName(spotName);
            
            const spotData = `/get_spot_info/${spotName}`;
            $.getJSON(spotData, function(data) {
                updateSidebarWeatherData(data);
                loadThumbnails(data.fishes);  
                uploadGameData(data);
                if (data.weather === "snowy" || data.weather === "thunderstorm"){
                    $('.play-button').addClass('cannot-play');
                } else {
                    $('.play-button').removeClass('cannot-play');
                };
            });

        });

        function updateSidebarLocationName(name) {
            $('#location h2').text(name);
        }
        
        function updateSidebarWeatherData(data) {
            const formattedWeather = formatWeather(data.weather)
            $('#temperature div').text(data.temperature);
            $('#weather-condition div').text(formattedWeather); 
            const tempImage = document.querySelector('.temperature-image');
            const weatherImage = document.querySelector('.weather-image');
            const weatherIconUrl = getWeatherIconUrl(data.weather);
            tempImage.src = "images/temperature.png";
            weatherImage.src = weatherIconUrl;
        }
    }

    function fitAllMarkers() {
        if (markers.length === 0) return;
    
        const bounds = new L.LatLngBounds();
        markers.forEach(marker => {
            bounds.extend(marker.getLatLng());
        });
    
        map.fitBounds(bounds);
    }

    function uploadGameData(spotData) {
        const weatherInfo = spotData.weather;

        $(".play-button").off("click").on("click", function() {
            if (weatherInfo === "snowy" || weatherInfo === "thunderstorm") {
                dangerousWeather();
                return;
            }
    
            $.ajax({
                type: "POST",
                url: "/upload_game_env",
                data: { spot_name: spotData.spot_name },
                success: function(response) {
                    if(response.success) {
                        window.location.href = "/fishgame.html";
                    } else {
                        console.log("Failed to upload game environment.");
                    }
                },
                error: function(error) {
                    console.error("Error:", error);
                }
            });
        });
    }

    function formatWeather(weather) {
        // Replace dashes with spaces
        let formattedWeather = weather.replace(/-/g, " ");
    
        // Capitalize the first letter of each word
        formattedWeather = formattedWeather.replace(/\b\w/g, function(char) {
            return char.toUpperCase();
        });
    
        return formattedWeather;
    }

    function getWeatherIconUrl(weatherCondition) {
        switch(weatherCondition.toLowerCase()) {
            case 'sunny':
                return 'images/weather/sunny.png';
            case 'rainy':
                return 'images/weather/rainy.png';
            case 'cloudy':
                return 'images/weather/cloudy.png';
            case 'snowy':
                return 'images/weather/snowy.png';
            case 'thunderstorm':
                return 'images/weather/thunderstorm.png';
        }
    }

    function getQueryParams() {
        let queryParams = {};
        window.location.search.substr(1).split('&').forEach(function(item) {
            let s = item.split('=');
            let key = decodeURIComponent(s[0]);
            let value = decodeURIComponent(s[1]);
            queryParams[key] = value;
        });
        return queryParams;
    }

    function clearMarkers() {
        markers.forEach(marker => map.removeLayer(marker)); 
        markers = []; 
    }

    function showSidebar() {
        
        $('#sidebar').css('left', '0%');
    }

    function hideSidebar() {
        $('#sidebar').css('left', '-100%');
    }

    let center = [-36.5201, 144.9646];
    initializeMap(center);

    let params = getQueryParams();

    if (params.spotName && params.lat && params.lng) {
        setMarker([parseFloat(params.lat), parseFloat(params.lng)], params.spotName);
        fitAllMarkers();
    }

    let searchExpanded = false;


    function getNearSpotsAndSetMarkers(lat, lon) {
        $.getJSON(`/get_near_spots/${lat},${lon}`, function(data) {
            const nearestSpots = data;

            for (let spotName in nearestSpots) {
                let coords = [nearestSpots[spotName].lat, nearestSpots[spotName].lng];
                setMarker(coords, spotName);
            }

            fitAllMarkers();
        });
    }

    function dangerousWeather() {
        const forbiddenMsg = document.getElementById("bad-weather");
        pop(forbiddenMsg);
    }

    function noPlaceFound() {
        const forbiddenMsg = document.getElementById("wrong-place");
        pop(forbiddenMsg);
    }

    function pop(info) { 
        /* pop the window to tell the result, whcih last for 2 secs. */
        info.style.visibility = "visible";
        setTimeout(function() {
                info.style.visibility = 'hidden';
            }, 3500);
        
    }
    

    $('#search-input').on('keyup', function(event) {
        if (event.keyCode === 13) {
            $('#search-icon').click();
        }
    });

    $('#search-icon').on('click', function() {
        toggleSearch();
        var inputValue = $("#search-input").val();
    
        var geocodingApiUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${inputValue}`;
        $.getJSON(geocodingApiUrl, function(data) {
            if (data.length > 0) {
                var locationData = data[0];
                console.log(data);
                console.log(locationData);
                victoriaCheck(locationData, function(isInVictoria) {
                    if (!isInVictoria) {
                        noPlaceFound();
                    } else {
                        var lat = locationData.lat;
                        var lon = locationData.lon;
                        clearMarkers();
                        getNearSpotsAndSetMarkers(lat, lon);
                    }
                });
            } else {
                console.log('No results found');
            }
        });
    });

    function victoriaCheck(locationData, callback) {
        var location = `${locationData.lat},${locationData.lon}`;
        $.getJSON(`/is_in_victoria/${location}`, function(data) {
            callback(data.status);  // Directly use data.status to check if it's in Victoria
        }).fail(function() {
            console.log("Error fetching data");
            callback(false); 
        });
    }

    function toggleSearch() {
        const searchInput = document.getElementById("search-input");
        const searchBar = document.getElementById("search-bar");
    
        if (!searchExpanded) {
            searchInput.classList.remove("closed");
            searchBar.classList.remove("closed");
            searchInput.focus();
            searchExpanded = true;
        }
    }

    function loadThumbnails(fishes) {
        const $thumbnailContainer = $("#thumbnail-container");
        $thumbnailContainer.empty();
    
        $.each(fishes, function(index, fishName) {
            const fishImageSrc = `/images/fishes/${fishName}.png`;
            const $fishImage = $("<img>")
                .attr("src", fishImageSrc)
                .attr("alt", fishName)
                .addClass("sidebar-thumbnail")
                .on("click", function() {
                    navigateToFishdex(fishName);
                });
    
            $thumbnailContainer.append($fishImage);
        });
    }
    
    function navigateToFishdex(fishName) {
        window.location.href = `/fishdex.html?fish=${encodeURIComponent(fishName)}`;
    }


    
    map.on('click', function() {
        hideSidebar();
    });

    $('#search-icon').hover(function() {
        $('#search-bar, #search-input').addClass('expanded');
    }, function() {
        // Nothing on hover out
    });

    $('#search-bar').mouseleave(function() {
        $('#search-bar, #search-input').removeClass('expanded');
    });

    $(document).ready(function() {
        const $searchInput = $('#search-input');
        L.DomEvent.disableClickPropagation($searchInput.get(0));
        L.DomEvent.disableScrollPropagation($searchInput.get(0));
        L.DomEvent.on($searchInput.get(0), 'mousedown touchstart', L.DomEvent.stopPropagation);
    });
});
