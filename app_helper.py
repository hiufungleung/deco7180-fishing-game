import os
from flask import *
import json
from json import JSONDecodeError
import requests
import urllib.request
import haversine as hs
from haversine import Unit
from constant import *




# load cache
def load_data(filename):
    try:
        with open(filename, 'r', encoding='utf-8') as f:
            try:
                data = json.load(f)
            except JSONDecodeError:
                # If error, return an empty dict
                data = {}
            return data
    except FileNotFoundError:
        return None

# save cache


def save_data(data, filename):
    with open(filename, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=4)


def get_fish_real_name(fish_name: str) -> str:
    '''get the fish name to cancel data noise
    '''
    response = requests.get(f"{FISH_API}/get_fish_name/{fish_name}")
    if response.status_code == 200:
        data = response.json()
        return data[fish_name]


def get_fish_name_helper(spot_name: str) -> list[str]:
    '''
    get all the fishes in one location (not jsonified)
    return split list of fishes with the given location
    '''
    fishes_in_location = load_data('./cache/fishes_in_location.json')
    if fishes_in_location is None:
        fishes_in_location = {}
    if spot_name in fishes_in_location:
        return fishes_in_location[spot_name]

    fish_set = set()
    real_fish_set = set()

    for i in range(len(FULL_DATA['result']['records'])):
        # if all, then get all, else, then get specified spot' fishes
        if spot_name != "all":
            if FULL_DATA['result']['records'][i]['Location'] != spot_name:
                continue
        # sentence to every single fish
        fishes = FULL_DATA['result']['records'][i]['Fish'].lower(
        ).strip().split(", ")
        for fish in fishes:
            new_fish = ""
            for char in fish:
                if char == " " or 'a' <= char <= 'z' or char == '-':
                    new_fish += char
            fish = new_fish
            fish_set.add(fish)

    fish_real_name = requests.get(f"{FISH_API}/get_all_fish_name").json()
    if spot_name == 'all':
        return fish_real_name["fishes"]
    # map to real name
    for fish in fish_set:
        fish = get_fish_real_name(fish)
        if fish is None:
            continue
        real_fish_set.add(fish)

    fishes_list = sorted(list(real_fish_set))
    fishes_in_location[spot_name] = fishes_list
    save_data(fishes_in_location, './cache/fishes_in_location.json')
    return fishes_list


def get_geo_info_helper(spot_name: str):
    ''' return the spot's geo info (jsonified)
    '''
    spot_name = spot_name.strip()

    location_data = load_data('./cache/location_data.json')
    if location_data is None:
        location_data = get_all_locations_geo_info_helper()
    if spot_name in location_data:
        return location_data[spot_name]

    url = f"{FISH_API}/get_location/{spot_name}"
    response = requests.get(url)
    if response.status_code == 200:
        new_data = response.json()
        if new_data['lng'] is None:
            return None
        location_data[spot_name] = new_data
        save_data(location_data, './cache/location_data.json')
        return new_data
    else:
        return None


def get_weather_helper(spot_name: str):
    '''return a tuple (weather, temperature) with the given spot_name'''
    spot_name = spot_name.strip()
    geo_info = get_geo_info_helper(spot_name)
    lat = geo_info['lat']
    lng = geo_info['lng']
    api = f"{WEATHER_API}latitude={lat}&longitude={lng}&current=temperature_2m,weathercode"
    response = requests.get(api)
    if response.status_code == 200:
        weather_data = response.json()
        weather_code = weather_data['current']['weathercode']
        temperature = weather_data['current']['temperature_2m']
        weather = WEATHER_DICT[weather_code // 10]
        return weather, temperature

def get_all_weather_helper():
    geo_infos = get_all_locations_geo_info_helper()
    spots_weather = {}
    spots_name, lats, lngs = [], [], []
    for spot_name, geo_info in geo_infos.items():
        spots_name.append(spot_name)
        lats.append(str(geo_info['lat']))
        lngs.append(str(geo_info['lng']))

    lats = ','.join(lats)
    lngs = ','.join(lngs)
    api = f"{WEATHER_API}latitude={lats}&longitude={lngs}&current=temperature_2m,weathercode"
    response = requests.get(api)
    if response.status_code == 200:
        weather_datas = response.json()
        for i, weather_data in enumerate(weather_datas):
            weather_code = weather_data['current']['weathercode']
            temperature = weather_data['current']['temperature_2m']
            weather = WEATHER_DICT[weather_code // 10]
            spots_weather[spots_name[i]] = {'weather': weather, 'temperature': temperature}
        return jsonify(spots_weather)


def get_all_locations_geo_info_helper():
    response = requests.get(f'{FISH_API}/get_all_locations_geo_info')

    if response.status_code == 200:
        locations_geo_info = response.json()
        return locations_geo_info
    else:
        return jsonify({'error': response.status_code})
    

def get_all_spots_name_helper():
    response = requests.get(f'{FISH_API}/get_all_locations_geo_info')

    if response.status_code == 200:
        locations_geo_info = response.json()
        spots_name = []
        for spot_name in locations_geo_info.keys():
            spots_name.append(spot_name)
        return spots_name
    else:
        return jsonify({'error': response.status_code})
