from flask import Flask, render_template, redirect, request
import sp_auth

app = Flask(__name__)

@app.route("/")
def home():
    return render_template('home.html')

@app.route("/spotify-login")
def login_spotify():
    # Redirect to Spotify Login
    return redirect(sp_auth.get_auth_url())

@app.route("/api/callback/spotify")
def callback_spotify():
    # Handle Spotify OAuth callback
    code = request.args.get("code")
    token_info = sp_auth.get_token_info(code)

    sp_lib = sp_auth.extract(token_info)
    return render_template("dashboard.html", library=sp_lib)

if __name__ == "__main__":
    app.run(debug=True)