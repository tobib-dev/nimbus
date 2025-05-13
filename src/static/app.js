let musicKitInstance;
let transferInProgress = false;

document.addEventListener("DOMContentLoaded", async () => {
    const appleLoginBtn = document.getElementById("apple-login");
    const dashboard = document.getElementById("apple-dashboard");
    const homeScreen = document.getElementById("home-screen");
    const backBtn = document.getElementById("back-home");
    
    if (dashboard) {
        dashboard.style.display = "none";
    }
    
    if (appleLoginBtn) {
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
    }
    const transferToAppleBtn = document.getElementById("transfer-to-apple-btn")
    
    if (transferToAppleBtn) {
        transferToAppleBtn.addEventListener("click", function(event) {
            event.preventDefault();
            transferLibrary();
        });
    }

    if (backBtn) {
        backBtn.addEventListener("click", () => {
            dashboard.style.display = "none";
            homeScreen.style.display = "block";
        })    
    }
});

async function getAuthorizedMusicKitInstance() {
    try {
        const response = await fetch("/apple-token");
        const data = await response.json();
        const token = data.token;

        if (!musicKitInstance) {
            MusicKit.configure({
                developerToken: token,
                app: {
                    name: "Nimbus",
                    build: "1.0.0"
                }
            });

            const music = MusicKit.getInstance();
            await music.authorize();
            musicKitInstance = music;
        }
        return musicKitInstance;

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

async function transferLibrary() {
    if (transferInProgress) return;
    transferInProgress = true;

    try {
        const response = await fetch("/sp_transfer", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            credentials: "include",
            body: JSON.stringify({selected: ["tracks"]})
        });
    
        if (!response.ok) throw new Error(`Transfer from Spotify to Apple Music failed!`);
        
        const data = await response.json();
        console.log("Library returned from spotify:", data.library);
        const music = await authorizeReceiver();
        
        await transferToAppleMusic(music, data.library.tracks);

    } catch (err) {
        console.error("Error transferring to Apple Music:", err);
        alert("Transfer to Apple Music has failed.");
    } finally {
        transferInProgress = false;
    }
}

async function authorizeReceiver() {
    if (musicKitInstance) return musicKitInstance;

    const response = await fetch("/apple-token")
    const data = await response.json();

    MusicKit.configure({
        developerToken: data.token,
        app: {
            name: "Nimbus",
            build: "1.0.0"
        }
    });

    const music = MusicKit.getInstance();
    await music.authorize();
    musicKitInstance = music;

    return music;
}

async function transferToAppleMusic(music, library) {
    if (!music.isAuthorized) {
        await music.authorize;
    }

    const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

    for (const track of library || []) {
        const searchQuery = `${track.title} ${track.artist}`;
        const searchResults = await music.api.search(searchQuery, {
            types: ['songs'],
            limit: 1
        });

        const song = searchResults?.songs?.data?.[0]
        if (song && typeof song.id === "string") {
            console.log(`Adding ${track.title} by ${track.artist}`);

            try {
                await music.api.library.add({
                    songs: [[song.id]],
                });
                await delay(1000);
            } catch (e) {
                console.error("Error from MusicKit while transferring:",  e);
            }
            
        } else {
            console.warn(`No match found for: ${track.title} - ${track.artist}`);
        }
    }

    alert("Transfer to Apple Music is complete!");
}