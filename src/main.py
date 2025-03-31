from flask import Flask, render_template, redirect
import sp_auth

app = Flask(__name__)

@app.route("/")
def home():
    return render_template('home.html')

@app.route("/login-spotify")
def spotify():
    return redirect(sp_auth.get_auth_url())

if __name__ == "__main__":
    app.run(debug=True)