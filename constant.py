import requests
import os

CURRENT_GAME_ENV = None
WEATHER_DICT = {
    0: "sunny",
    4: "cloudy",
    5: "rainy",
    6: "rainy",
    7: "snowy",
    8: "snowy",
    9: "thunderstorm",
}

WEATHER_API = "https://api.open-meteo.com/v1/forecast?"
FISH_API = "http://127.0.0.1:5556"
DATASET_API = "https://data.gov.au/data/api/3/action/datastore_search_sql?sql="
dataset_name = '"d950b44e-1f02-46f0-9e59-ca14dd052770"'
sql_statement = f"SELECT * from {dataset_name}"
dataset_url = DATASET_API + sql_statement
FULL_DATA = requests.get(dataset_url).json()
