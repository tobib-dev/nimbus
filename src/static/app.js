document.addEventListener("DOMContentLoaded", async () => {
    const appleLoginBtn = document.getElementById("apple-login");

    appleLoginBtn.addEventListener("click", async () => {
        console.log("Apple music button clicked");
        
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
        } catch (error) {
            console.error("Apple Music authentication failed:", error);
        }
    })
});