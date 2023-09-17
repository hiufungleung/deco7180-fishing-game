from flask import *
import requests
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

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5500, debug=True)
