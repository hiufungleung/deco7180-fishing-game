import os
from flask import *
from flask import Flask
import json
from json import JSONDecodeError
import requests
import urllib.request
import haversine as hs
from haversine import Unit
from app_helper import *
from constant import *


def create_app():
    app = Flask(__name__, static_folder=".", static_url_path="")
    app.secret_key = "dev"

    # preprocess FULL_DATA
    for i in range(len(FULL_DATA["result"]["records"])):
        location = FULL_DATA["result"]["records"][i]["Location"]
        processed_location = "".join([_ for _ in location if _ != "/"])
        processed_location = processed_location.strip()
        FULL_DATA["result"]["records"][i]["Location"] = processed_location

    if not os.path.exists("./cache"):
        os.makedirs("./cache")

    SESSION_DATA = load_data("./cache/session_data.json")
    if SESSION_DATA is not None:
        session = SESSION_DATA

    return app


app = create_app()


@app.route("/")
def index():
    return send_from_directory(app.static_folder, "index.html")


@app.route("/get_spot_info/<spot_name>", methods=["GET"])
def get_spot_info(spot_name: str):
    weather, temperature = get_weather_helper(spot_name)
    geo_info = get_geo_info_helper(spot_name)
    lat = float(geo_info["lat"])
    lng = float(geo_info["lng"])
    fishes = get_fish_name_helper(spot_name)
    return jsonify(
        {
            "spot_name": spot_name,
            "lat": lat,
            "lng": lng,
            "fishes": fishes,
            "weather": weather,
            "temperature": f"{temperature}",
        }
    )


@app.route("/get_all_location_geo_info", methods=["GET"])
def get_all_locations_geo_info():
    return get_all_locations_geo_info_helper()


@app.route("/get_all_weather_infos", methods=["GET"])
def get_all_weathers_info():
    return get_all_weather_helper()


@app.route("/get_geo_info/<spot_name>", methods=["GET"])
def get_geo_info(spot_name: str):
    return get_geo_info_helper(spot_name)


@app.route("/get_fish_image/<fish_name>", methods=["GET"])
def get_fish_image(fish_name: str):

    image_folder = "./images/fishes"
    fish_name = fish_name.lower()
    fish_name = get_fish_real_name(fish_name)
    return send_file(f"{image_folder}/{fish_name}.png", mimetype="image/png")


@app.route("/get_fish_description/<fish_name>", methods=["GET"])
def get_fish_description(fish_name):
    fish_name = fish_name.lower()
    fish_name = "-".join(fish_name.split(" "))
    url = f"{FISH_API}/get_fish_description/{fish_name}"
    response = requests.get(url)
    data = response.json()
    return data


@app.route("/get_fishes_from_location/<spot_name>", methods=["GET"])
def get_fishes_from_location(spot_name="all"):
    fishes = get_fish_name_helper(spot_name)
    return jsonify({"fishes": fishes})


@app.route("/get_locations_from_fish/<fish_name>", methods=["GET"])
def get_locations_from_fish(fish_name: str):
    fish_name = fish_name.lower()
    fish_name = "-".join(fish_name.split(" "))
    locations = []
    locations_lng_lat = {}

    locations_of_fishes = load_data("./cache/locations_of_fishes.json")
    if locations_of_fishes is not None:
        if fish_name in locations_of_fishes:
            locations = locations_of_fishes[fish_name]
            return locations
    else:
        locations_of_fishes = {}

    for i in range(len(FULL_DATA["result"]["records"])):
        location = FULL_DATA["result"]["records"][i]["Location"]
        fishes = get_fish_name_helper(location)
        # print(fishes)
        if fish_name in fishes:
            locations.append(location)

    locations.sort()

    for location in locations:
        lng_lat = get_geo_info_helper(location)
        if lng_lat is not None:
            locations_lng_lat[location] = lng_lat

    locations_of_fishes[fish_name] = locations_lng_lat
    save_data(locations_of_fishes, "./cache/locations_of_fishes.json")

    return jsonify(locations_lng_lat)


@app.route("/get_near_spots/<geo_info>", methods=["GET"])
def get_near_spots(geo_info: str):
    """get the 10 nearest fishing spots with the given geo_info ([lat],[lng])"""
    lat, lng = tuple(geo_info.split(","))
    lat, lng = float(lat), float(lng)
    spots_geo_info = get_all_locations_geo_info_helper()
    distances = {}
    for spot_name, geo_info in spots_geo_info.items():
        spot_location = (geo_info["lat"], geo_info["lng"])
        distances[spot_name] = hs.haversine((lat, lng), spot_location)

    sorted_spots = sorted(distances.keys(), key=lambda x: distances[x])
    nearest_spots = sorted_spots[:10] if len(sorted_spots) > 10 else sorted_spots

    nearest_spots_geo_info = {}
    for spot_name in nearest_spots:
        nearest_spots_geo_info[spot_name] = spots_geo_info[spot_name]
    return jsonify(nearest_spots_geo_info)


@app.route("/is_in_victoria/<geo_info>", methods=["GET"])
def is_in_victoria(geo_info: str):
    lat, lng = geo_info.split(",")
    reverse_geocode = "https://geocode.maps.co/reverse?"
    response = requests.get(f"{reverse_geocode}lat={lat}&lon={lng}")
    if response.status_code == 200:
        data = response.json()
        return jsonify(
            {
                "status": data["address"]["country"] == "Australia"
                and data["address"]["state"] == "Victoria"
            }
        )


@app.route("/upload_game_env", methods=["POST"])
def upload_game_env():
    """when clicking the start play button, send the env to server"""
    spot_name = request.form.get("spot_name")
    session["current_game_env"] = spot_name
    save_data(session, "./cache/session_data.json")
    return jsonify(success=True)


@app.route("/fishgame")
def fishgame():
    """redirect to fishgame.html"""
    return send_from_directory(app.static_folder, "fishgame.html")


@app.route("/get_game_env", methods=["GET"])
def get_game_env():
    """used to load the game encounter"""
    spot_name = session.get("current_game_env", "")
    return get_spot_info(spot_name)


@app.route("/get_user_fish_data", methods=["GET"])
def get_user_fish_data():
    """
    get user's data
    """
    fishes = session.get("caught_fishes", {})
    return jsonify(fishes)


@app.route("/user_catch_fish", methods=["POST"])
def user_catch_fish():
    """
    update user's data when users successfully catch a fish
    """
    fish_name = request.form.get("fish_name")

    if "caught_fishes" not in session:
        session["caught_fishes"] = {}

    if fish_name not in session["caught_fishes"]:
        session["caught_fishes"][fish_name] = 1
    else:
        session["caught_fishes"][fish_name] += 1

    session.modified = True
    save_data(session, "./cache/session_data.json")
    return jsonify(success=True, caught_fishes=session["caught_fishes"])


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5555, debug=True)
