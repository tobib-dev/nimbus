document.addEventListener("DOMContentLoaded", async () => {
    const appleLoginBtn = document.getElementById("apple-login");
    const dashboard = document.getElementById("apple-dashboard");
    const homeScreen = document.getElementById("home-screen");
    const backBtn = document.getElementById("back-home");

    dashboard.style.display = "none";
    appleLoginBtn.addEventListener("click", async () => {
        console.log("Apple music button clicked");

        const music = await getAuthorizedMusicKitInstance();
        if (!music) return;
        if (music) {
            console.log("MusicKit authorized!");

            const developerToken = music.developerToken;
            const userToken = music.musicUserToken;

            homeScreen.style.display = "none";
            dashboard.style.display = "block";
            
            const songs = await fetchAllLibraryItems(
                'v1/me/library/songs',
                userToken
            );
            console.log("Fetched songs:", songs);
            displaySongs(songs);

            const playlists = await fetchAllLibraryItems(
                'v1/me/library/playlists',
                userToken
            );
            console.log("Fetched playlists:", playlists);
            await displayPlaylists(playlists, userToken)
        }
    });

    backBtn.addEventListener("click", () => {
        dashboard.style.display = "none";
        homeScreen.style.display = "block";
    })
});

async function getAuthorizedMusicKitInstance() {
    try {
        const response = await fetch("/apple-token");
        const data = await response.json();
        const token = data.token;

        MusicKit.configure({
            developerToken: token,
            app: {
                name: "Nimbus",
                build: "1.0.0"
            }
        });

        const music = MusicKit.getInstance();
        await music.authorize();
        return music;

    } catch (error) {
        console.error("Apple Music authentication failed:", error);
        return null;
    }
}

async function fetchAllLibraryItems(endpoint, musicUserToken) {
    console.log("fetchAllLibraryItems called with endpoint:", endpoint);

    console.trace();

    if (!/^v1\/me\/library\/(songs|playlists)$/.test(endpoint)) {
        throw new Error("Invalid endpoint: " + endpoint);
    }

    let allItems = [];
    let offset = 0;
    let hasMore = true;

    while  (hasMore) {
        const response = await fetch(`library-items?endpoint=${encodeURIComponent(endpoint)}&offset=${offset}`, {
            headers: {
                'Music-User-Token': musicUserToken
            }
        });

        if (!response.ok) {
            throw new Error(`Application Backend error: ${response.status}`);
        }

        const data = await response.json();
        allItems = allItems.concat(data.data || []);

        if (data.next) {
            offset += 100;
        } else {
            hasMore = false;
        }
    }
    return allItems;
}

async function fetchAllPlaylistTracks(playlistId, musicUserToken) {
    let allTracks = [];
    let offset = 0;
    let hasMore = true;

    while (hasMore) {
        const response = await fetch(`/playlist-tracks?playlistId=${playlistId}&offset=${offset}`, {
            headers: {
                "Music-User-Token": musicUserToken
            }
        });

        if (!response.ok) {
            throw new Error(`Apple Music API error: ${response.status}`);
        } 

        const data = await response.json();
        allTracks.push(...data.data);
        
        if (data.next) {
            offset += 100;
        } else {
            hasMore = false;
        }
    }
    return allTracks
}

function displaySongs(songs) {
    const songsList = document.getElementById("songs-list");
    songsList.innerHTML = "";
    songs.forEach(song=> {
        const li = document.createElement("li");
        li.textContent = `${song.attributes.name} by ${song.attributes.artistName}`;
        songsList.appendChild(li);
    });
}

async function displayPlaylists(playlists, UserToken) {
    const playlistContainer = document.getElementById("playlists-container");
    playlistContainer.innerHTML = "";

    for (const playlist of playlists) {
        const playlistName = playlist.attributes.name;
        const playlistId = playlist.id;
        let tracks = playlist.relationships?.tracks?.data || [];

       if (playlist.relationships?.tracks?.next) {
           tracks = await fetchAllPlaylistTracks(playlistId, UserToken);
       }

       const div = document.createElement("div");
       div.classList.add("playlist");

       const title = document.createElement("h3");
       title.textContent = playlistName;
       div.appendChild(title);

       const ul = document.createElement("ul");
       tracks.forEach(track => {
        const li = document.createElement("li");
        li.textContent = `${track.attributes?.name} by ${track.attributes?.artistName}`;
        ul.appendChild(li);
       });

       div.appendChild(ul);
       playlistContainer.appendChild(div);
    }
}

async function submitSelected() {
    const checkboxes = document.querySelectorAll('input[name="sp_transfer"]:checked');
    const selectedItems = Array.from(checkboxes).map(cb => cb.value);

    if (selectedItems.length === 0) {
        alert("Please select at least one item to transfer.");
        return;
    }

    fetch("/sp_transfer", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({selected: selectedItems})
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`Server error: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        alert(`Transfer started for: ${data.selected.join(", ")}`);
    })
    .catch(error => {
        console.error("Transfer error:", error);
        alert("Something went wrong during the transfer.");
    });
}