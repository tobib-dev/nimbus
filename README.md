# Nimbus

## Description
Nimbus allows easy transfer of songs, playlists, and albums between streaming platforms. Currently Nimbus supports Apple Music and Spotify but integrating other platforms is in plan for

## Tech Stack
Nimbus is using Flask and Javascript on the client side. The spotify side is handled with Python and Spotipy libraries while the app UI is built on Flask. The Apple Music side is built Javascript

## How to Run It Locally
Nimbus is currently still in development, therefore, it you can access the webapp through a browser. While there are plans to deploy the app so anyone can use it via a browser, you can currently run the app locally by the instructions below:
- Install pip
- Install Flask
- Install Spotipy
- Generate Developer Token - Note: While the Spotify WebAPI is free, Apple Music API isn't. You will need an apple developer account to generate a token. See the link attached to generate developer token [https://developer.apple.com/documentation/applemusicapi/generating-developer-tokens]. An ES256 Algorithm is required to authenticate your tokens.

Once tokens are generated run the app with the command `flask --app app run`

## Future Plans
I am always considering add more features and I welcome suggestions. Please reach out to me if you have any suggestions. At the moment the main plan is deploying the app so its accessible from a browser once development is complete.