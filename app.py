from flask import *
import requests
import urllib.request
app = Flask(__name__, static_folder='.', static_url_path='')


@app.route('/')
def index():
    return send_from_directory(app.static_folder, 'index.html')


@app.route('/handle_input', methods=['POST'])
def handle_input():
    input_content = request.form.get('input_content')  # 获取输入内容
    print(f"input_content: {input_content}")
    # 下面是从 get_latlng() 移动过来的逻辑
                    # api_key = 'AIzaSyD4td3LVcSMx8A1WE8O9Mlf8LsjW5-WNHw'
    # url = f"https://maps.googleapis.com/maps/api/geocode/json?address={input_content}&key={api_key}"

    # response = requests.get(url)
    # data = response.json()
    # print(f"data: {data}")

    # if data['status'] == 'OK':
    #     location = data['results'][0]['geometry']['location']
    #     return jsonify(location)
    # else:
    #     return jsonify({"error": "Unable to get location", "message": "Received input!"}), 400

    '''presentation only'''
    return jsonify({"lat": -27.4969667, "lng": 153.0402354})


@app.route('/getFishFromLocation/<location>', methods=['GET'])
def get_fish(location):
    # API 查询
    url = f"https://data.gov.au/data/api/3/action/datastore_search_sql?sql=SELECT * from \"d950b44e-1f02-46f0-9e59-ca14dd052770\" WHERE \"Location\"='{location}'"
    print(url)
    response = requests.get(url)

    # 检查响应是否正常
    if response.status_code != 200:
        return jsonify({"error": "Failed to retrieve data from API"}), 500

    data = response.json()
    # 提取 Fish 字段
    fish = data['result']['records'][0]['Fish']
    print(fish)

    return jsonify({"fish": fish})



if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5500, debug=True)
