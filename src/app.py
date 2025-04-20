from flask import Flask, render_template, redirect, request, abort, jsonify, session
import requests
import sp_auth
import os
from dotenv import load_dotenv

app = Flask(__name__)
load_dotenv()
app.secret_key = os.getenv("SECRET_KEY")

@app.route("/")
def home():
    return render_template('home.html')

@app.route("/spotify-login")
def login_spotify():
    # Redirect to Spotify Login
    return redirect(sp_auth.get_auth_url())

@app.route("/callback/spotify")
def callback_spotify():
    # Handle Spotify OAuth callback
    code = request.args.get("code")
    if code == "access_denied":
        abort(404)
    token_info = sp_auth.get_token_info(code)
    access_token = token_info['access_token']
    session['spotify'] = access_token
    sp_lib = sp_auth.extract(access_token)
    return render_template("sp_board.html", library=sp_lib)

@app.route("/sp_transfer", method=["POST"])
def sp_transfer():
    data = request.get_json()
    selected = data.get("selected", [])
    
    access_token = session.get("spotify_token")
    if not access_token:
        return jsonify({"error": "Missing Spotify token"}), 401

    sp_lib = sp_auth.extract(access_token)
    selected_lib = {k: v for k, v in sp_lib.items() is k in selected}

    return jsonify(selected_lib), 200


@app.route("/apple-token")
def get_apple_token():
    token = get_developer_token()

    return jsonify({"token": token})

@app.route("/playlist-tracks")
def get_playlist_tracks():
    playlist_id = request.args.get("playlistId")

    offset = request.args.get("offset", 0)
    developer_token = get_developer_token()
    music_user_token = request.headers.get("Music-User-Token")

    headers = {
        "Authorization": f"Bearer {developer_token}",
        "Music-User-Token": music_user_token
    }

    url = f"https://api.music.apple.com/v1/me/library/playlists/{playlist_id}/tracks?offset={offset}&limit=100"

    response = requests.get(url, headers=headers)
    if response.status_code != 200:
        return jsonify({"error": "Apple Music API request failed"}), response.status_code
    
    return jsonify(response.json())

@app.route('/library-items')
def get_library_items():
    endpoint = request.args.get('endpoint').split('?')[0]
    offset = request.args.get('offset', 0)
    user_token = request.headers.get('Music-User-Token')
    developer_token = get_developer_token()

    print(f"Received request to fetch {endpoint} with offset {offset} and token {user_token}")

    headers = {
        "Authorization": f"Bearer {developer_token}",
        "Music-User-Token": user_token
    }

    url = f"https://api.music.apple.com/{endpoint}?offset={offset}&limit=100"
    print(f"Calling Apple Music API at: {url}")
    response = requests.get(url, headers=headers)
    
    return jsonify(response.json())

def get_developer_token():
    with open("apple_token.txt") as f:
        token = f.read().strip()

    return token

if __name__ == "__main__":
    app.run(debug=True)
    app.secret_ke