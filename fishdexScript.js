function loadThumbnails() {
    const thumbnailContainer = $("#thumbnail-container");

    // Get all fish names
    $.ajax({
        url: '/get_fishes_from_location/all',  
        method: 'GET',
        success: function (response) {
            //  Create thumbnail for each fish
            response.fishes.forEach(function (fishName, index) {
                const thumbnail = $("<div></div>");
                thumbnail.addClass("fishdex-thumbnail");

                thumbnail.css("backgroundImage", `url(/get_fish_image/${fishName})`);
                thumbnail.attr("data-index", index);

                thumbnail.on("click", function () {
                    updateGallery(fishName);  
                });

                thumbnailContainer.append(thumbnail);
            });
        },
        error: function (error) {
            console.log("Error:", error);
        }
    });
}

function updateGallery(fishName) {
    $("#mainImg").attr("src", `/get_fish_image/${fishName}`);
    
    const formattedName = formatFishName(fishName);
    
    $(".description-title").text(formattedName);

    $.ajax({
        url: `/get_fish_description/${fishName}`,  
        method: 'GET',
        success: function(data) {
            $("#fish-description").text(data.fish);
        },
        error: function (error) {
            console.log("Error getting description:", error);
        }
    });

    $.getJSON(`/get_locations_from_fish/${fishName}`, function(data) {
        const spotsList = $(".spots-list");
        spotsList.empty();  
        
        $.each(data, function(locationName, locationData) {
            const lat = locationData.lat;
            const lng = locationData.lng;
            spotsList.append(`<div class="spot" data-lat="${lat}" data-lng="${lng}">${locationName}</div>`);
        });
    });

    $.getJSON(`/get_user_fish_data`, function(data) {
        var fishAmount = $("#count-the-fish");
        let amount = data[fishName];
        if (amount !== undefined) {
            fishAmount.text("You have caught " + amount + " " + formattedName + ".");
        } else {
            fishAmount.text("You haven't caught this Fish yet!");
        }
    });

    $(".gallery-container").removeClass("hidden");


}



function getURLParameter(name) {
    const result = new RegExp('[\\?&]' + name + '=([^&#]*)').exec(window.location.search);
    return result ? decodeURIComponent(result[1]) : null;
}

const selectedFish = getURLParameter("fish");
if (selectedFish) {
    updateGallery(selectedFish);
}

function formatFishName(fishName) {
    let formattedName = fishName.replace(/-/g, " ");
    formattedName = formattedName.replace(/\b\w/g, function(char) {
        return char.toUpperCase();
    });

    return formattedName;
}



$("#return-button").on("click", function() {
    window.history.back();
});

$(".all-spots-btn").on("click", function() {
    $("#fishing-spots-popup").show();
});

$("#fishing-spots-popup, #close-popup").on("click", function() {
    $("#fishing-spots-popup").hide();
});

$(".popup-content").on("click", function(e) {
    e.stopPropagation();
});

$(".spots-list").on("click", ".spot", function() {
    const spotName = $(this).text();
    const lat = $(this).data('lat');
    const lng = $(this).data('lng');
    window.location.href = `/index.html?spotName=${spotName}&lat=${lat}&lng=${lng}`;
});

$(document).ready(function() {
    loadThumbnails();
});


