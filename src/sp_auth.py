import os
import spotipy
from spotipy.oauth2 import SpotifyOAuth
from dotenv import load_dotenv

load_dotenv()
CLIENT_ID = os.getenv("SPOTIFY_CLIENT_ID")
CLIENT_SECRET = os.getenv("SPOTIFY_CLIENT_SECRET")
REDIRECT_URI = os.getenv("SPOTIFY_REDIRECT_URI")
SCOPE= os.getenv("SPOTIFY_SCOPE")


sp_oauth = SpotifyOAuth(
    client_id=CLIENT_ID, client_secret=CLIENT_SECRET,
    redirect_uri=REDIRECT_URI, scope=SCOPE
)

# Note the extract function actually took token as an input
def extract(token):
    sp = spotipy.Spotify(auth=token)
    saved_tracks = sp.current_user_saved_tracks()

    library = {}
    track_list = []

    for item in saved_tracks["items"]:
        track = item["track"]
        title = track["name"]
        artist_names = ", ".join(artist["name"] for artist in track["artists"])

        track_list.append({
            "title": title,
            "artist": artist_names
        })
    
    library["tracks"] = track_list

    return library

def get_token_info(auth_code):
    return sp_oauth.get_access_token(auth_code)

def get_auth_url():
    return sp_oauth.get_authorize_url()