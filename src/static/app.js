document.addEventListener("DOMContentLoaded", async () => {
    const appleLoginBtn = document.getElementById("apple-login");

    appleLoginBtn.addEventListener("click", async () => {
        console.log("Apple music button clicked");

        const music = await getAuthorizedMusicKitInstance(); 
        if (music) {
            console.log("MusicKit authorized!");

            const developerToken = music.developerToken;
            const UserToken = music.musicUserToken;
            
            const songs = await fetchAllLibraryItems(
                'v1/me/library/songs',
                developerToken,
                UserToken
            );
            
            songs.forEach(song => {
                const songName = song.attributes.name;
                const artistName = song.attributes.artistName;
                //console.log(`Song: ${songName} by ${artistName}`);
            });

            const playlists = await fetchAllLibraryItems(
                'v1/me/library/playlists?include=tracks',
                developerToken,
                UserToken
            );
            playlists.forEach(async playlist => {
                const playlistName = playlist.attributes.name;
                const playlistId = playlist.id;
                let tracks = playlist.relationships?.tracks?.data || [];

                if (tracks.length === 100) {
                    tracks = await fetchAllPlaylistTracks(playlistId, UserToken);
                }

                console.log(`Playlist: ${playlistName}`);
                tracks.forEach(track => {
                    console.log(`- ${track.attributes?.name} by ${track.attributes?.artistName}`);
                });
            });
        }
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

async function fetchAllLibraryItems(endpoint, developerToken, musicUserToken) {
    const baseUrl = `https://api.music.apple.com/${endpoint}`;
    let url = baseUrl;
    let allItems = [];

    while (url) {
        const response = await fetch(url, {
            headers: {
                Authorization: `Bearer ${developerToken}`,
                'Music-User-Token': musicUserToken
            }
        });

        if (!response.ok) {
            throw new Error(`Apple Music API error: ${response.status}`);
        }

        const data = await response.json();
        allItems = allItems.concat(data.data || []);

        url = data.next ? `https://api.music.apple.com${data.next}` : null;
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