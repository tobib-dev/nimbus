from flask import Flask, render_template, redirect, request, abort, jsonify
import requests
import sp_auth

app = Flask(__name__)

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
    sp_lib = sp_auth.extract(token_info['access_token'])
    return render_template("sp_board.html", library=sp_lib)

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

    url = f"https://api.music.apple.com/v1/me/library/playlists/{playlist_id}/tracks?offset={offset}"

    response = requests.get(url, headers=headers)
    if response.status_code != 200:
        return jsonify({"error": "Apple Music API request failed"}), response.status_code
    
    return jsonify(response.json())

def get_developer_token():
    with open("apple_token.txt") as f:
        token = f.read().strip()

    return token


if __name__ == "__main__":
    app.run(debug=True)