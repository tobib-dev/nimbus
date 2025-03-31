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

def extract(token):
    sp = spotipy.Spotify(auth_manager=token)
    saved_albums = sp.current_user_saved_albums()
    saved_tracks = sp.current_user_saved_tracks()
    playlists = sp.current_user_playlists()

    return saved_albums, saved_tracks, playlists

def get_auth_url():
    return sp_oauth.get_authorize_url()
