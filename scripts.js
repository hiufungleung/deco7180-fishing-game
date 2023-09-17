$(document).ready(function () {
    let map;
    let currentMarker;
    let redIcon = new L.Icon({
        iconUrl: '/images/locationPin.png',
        // shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
        iconSize: [60, 60],
        // iconAnchor: [100, 41],
        // popupAnchor: [1, -34],
        // shadowSize: [41, 41]
    });

    // 初始化地图的函数
    function initializeMap(centerCoords) {
        const zoom = 5;
        map = L.map('map').setView(centerCoords, zoom);
        
        const tile = L.tileLayer('https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}.png', {
            minZoom: 4,
            maxZoom: 18,
            attribution: '©OpenStreetMap, ©CartoDB',
            ext: 'png',
            zoomControl: true,
        }).addTo(map);

        const southWest = L.latLng(-45.0, 108),
            northEast = L.latLng(-9.0, 160.0);
        const bounds = L.latLngBounds(southWest, northEast);
        map.setMaxBounds(bounds);

        const searchBar = L.Control.geocoder({ position: 'topleft' }).addTo(map);
    }

    // 设置标记的函数
    function setMarker(markerCoords) {
        if (currentMarker) {
            map.removeLayer(currentMarker);
        }
        currentMarker = L.marker(markerCoords, { icon: redIcon }).addTo(map);
        map.setView(markerCoords, 10);
    }

    // 在页面加载时初始化地图
    let center = [-25.36364,134.21173];
    initializeMap(center);

    // 在需要设置标记的地方调用 setMarker 函数
    // 例如，在AJAX成功响应后：
    // setMarker([response.lat, response.lng]);

    $("#main_search").on('keyup', function (event) {
        if (event.keyCode === 13) {  // 13 是 Enter 键的键码
            var inputValue = $(this).val();  // 获取输入框的值

            $.ajax({
                url: '/handle_input',  // Flask 路由地址
                method: 'POST',
                data: {
                    'input_content': inputValue  // 发送输入内容到 Flask
                },
                success: function (response) {
                    console.log(response);  // 输出 Flask 返回的响应
                    $('#response_message').text("Latitude: " + response.lat + ", Longitude: " + response.lng);
                    let markerLocation = [response.lat, response.lng];
                    let center = [response.lat, response.lng];
                    console.log(markerLocation);
                    console.log(center);
                    setMarker([response.lat, response.lng]);
                    
                },
                error: function (error) {
                    console.log("Error:", error);
                }
            });
        }
    });
    // function goToOtherPage() {
    //     window.location.href = "another_page.html";
    // }

    // fetch('https://data.gov.au/data/api/1/action/datastore_search?resource_id=d950b44e-1f02-46f0-9e59-ca14dd052770&limit=5')
    //     .then(response => response.json())
    //     .then(data => {
    //         const records = data.result.records;
    //         let pendingRequests = [];

    //         records.forEach(record => {
    //             const placeName = record.location;  // 替換為您的數據中的地點名稱字段

    //             const request = fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${placeName}`)
    //                 .then(res => res.json())
    //                 .then(locationData => {
    //                     if (locationData.length > 0) {
    //                         const lat = parseFloat(locationData[0].lat);
    //                         const lon = parseFloat(locationData[0].lon);

    //                         // 在地圖上添加標記
    //                         L.marker([lat, lon]).bindPopup(placeName).addTo(map);

    //                         locationsData.push({
    //                             name: placeName,
    //                             latitude: lat,
    //                             longitude: lon
    //                         });
    //                     }
    //                 });

    //             pendingRequests.push(request);
    //         });

    //         return Promise.all(pendingRequests);
    //     })
    //     .then(() => {
    //         console.log(locationsData);  // 這裡您可以看到所有的地點名稱和它們對應的緯度和經度
    //     });


    // function addSearchControl(map, markersLayer) {
    //     const searchControl = new L.Control.Search({
    //         position: 'topleft',
    //         layer: markersLayer,
    //         initial: false,
    //         zoom: 12,
    //         marker: false
    //     });

    //     map.addControl(searchControl);
    // }
    





    //let center = [-25.36364,134.21173];

    //initMap(center);



    // main_search

    
});
