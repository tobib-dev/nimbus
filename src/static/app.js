document.addEventListener("DOMContentLoaded", async () => {
    const appleLoginBtn = document.getElementById("apple-login");

    appleLoginBtn.addEventListener("click", async () => {
        console.log("Apple music button clicked");

        const music = await getAuthorizedMusicKitInstance(); 
        if (music) {
            console.log("MusicKit authorized!");

            const developerToken = music.developerToken;
            const UserToken = music.musicUserToken;
            
            const albums = await fetchAllLibraryItems(
                'v1/me/library/albums',
                developerToken,
                UserToken
            );
            console.log("Albums:", albums);
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