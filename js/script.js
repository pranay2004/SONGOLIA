let currentSong = new Audio();
let songsUL;
let songs;
let currFolder;

function secondsToMinutesSeconds(seconds) {
    if (isNaN(seconds) || seconds < 0) {
        return "00:00";

    }

    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);

    const formattedMinuets = String(minutes).padStart(2, "0");
    const formattedSeconds = String(remainingSeconds).padStart(2, "0");

    return `${formattedMinuets}:${formattedSeconds}`;
}

async function getSongs(folder) {
    currFolder = folder;

    let a = await fetch(`http://127.0.0.1:5501/${folder}/`);
    let response = await a.text();
    console.log(response);

    let div = document.createElement("div")
    div.innerHTML = response;

    let as = div.getElementsByTagName("a")
    songs = []
    for (let index = 0; index < as.length; index++) {
        const element = as[index];
        if (element.href.endsWith(".mp3")) {
            songs.push(element.href.split(`/${folder}/`)[1])
        }
    }

    let songUL = document.querySelector(".songList").getElementsByTagName("ul")[0]
    songUL.innerHTML = "";
    for (const song of songs) {
        let formattedSong = song.replaceAll("%20", " ");
        songUL.innerHTML = songUL.innerHTML + `<li><img class="invert" src="./img/music.svg" alt="music-icon" width="25px">
                            <div class="info">
                                <div>${formattedSong}</div>
                            </div>
                            <div class="playnow">
                                <span>Play now</span>
                                <img class="invert" src="./img/play-btn.svg" alt="">
                                
                            </div></li>`;
    }

    Array.from(document.querySelector(".songList").getElementsByTagName("li")).forEach(e => {
        e.addEventListener("click", element => {
            console.log(e.querySelector(".info").firstElementChild.innerHTML)
            playMusic(e.querySelector(".info").firstElementChild.innerHTML.trim());
        })
    })

    return songs
}

const playMusic = (track, pause = false) => {
    currentSong.src = `/${currFolder}/` + track;
    if (!pause) {
        currentSong.play();
        play.src = "./img/pause-btn.svg";
    }
    document.querySelector(".songinfo").innerHTML = decodeURI(track);
    document.querySelector(".songtime").innerHTML = "00:00 / 00:00";


}

async function displayAlbums() {
    try {
        // Fetch the playlists.json file to get the list of available playlists
        let playlistsResponse = await fetch('http://127.0.0.1:5501/playlists.json');
        if (!playlistsResponse.ok) {
            throw new Error('Failed to load playlists.json');
        }
        let playlistsData = await playlistsResponse.json();
        let playlists = playlistsData.playlists || [];
        
        let cardContainer = document.querySelector(".cardContainer");
        cardContainer.innerHTML = ""; // Clear existing cards
        
        // Process each playlist folder
        for (let folderName of playlists) {
            // Try to fetch the folder's info.json
            try {
                let infoResponse = await fetch(`http://127.0.0.1:5501/songs/${folderName}/info.json`);
                if (!infoResponse.ok) {
                    console.log(`No info.json found for ${folderName}`);
                    continue;
                }
                let info = await infoResponse.json();
                
                // Create card HTML
                let card = `
                    <div data-folder="${folderName}" class="card">
                        <div class="play">
                            <img src="./img/play.svg" alt="play-btn-card">
                        </div>
                        <img src="${info.image || "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQqQXw7x-qOKxczKPNvJMGvJ-5w15DU-wqLKA&s"}"
                            alt="play-img">
                        <h2>${info.title}</h2>
                        <p>${info.description}</p>
                    </div>
                `;
                cardContainer.innerHTML += card;
            } catch (error) {
                console.error(`Error loading info for ${folderName}:`, error);
            }
        }
        
        // Add click event listeners to the newly created cards
        Array.from(document.getElementsByClassName("card")).forEach(e => {
            e.addEventListener("click", async item => {
                songs = await getSongs(`songs/${item.currentTarget.dataset.folder}`);
                playMusic(songs[0])
            });
        });
    } catch (error) {
        console.error("Error displaying albums:", error);
    }
}


async function main() {

    await getSongs("songs/ncs");
    playMusic(songs[0], true);

    displayAlbums()

    play.addEventListener("click", () => {
        if (currentSong.paused) {
            currentSong.play();
            play.src = "./img/pause-btn.svg";
        }
        else {
            currentSong.pause();
            play.src = "./img/play-btn.svg";
        }
    })

    currentSong.addEventListener("timeupdate", () => {
        console.log(currentSong.currentTime, currentSong.duration);
        document.querySelector(".songtime").innerHTML = `${secondsToMinutesSeconds(currentSong.currentTime)} / ${secondsToMinutesSeconds(currentSong.duration)}`;
        document.querySelector(".circle").style.left = (currentSong.currentTime / currentSong.duration) * 100 + "%";
    })

    document.querySelector(".seekbar").addEventListener("click", e => {
        let percent = (e.offsetX / e.target.getBoundingClientRect().width) * 100;
        document.querySelector(".circle").style.left = percent + "%";
        currentSong.currentTime = currentSong.duration * (percent / 100);
    })

    document.querySelector(".hamburger").addEventListener("click", () => {
        document.querySelector(".left").style.left = "0";
    })

    document.querySelector(".close").addEventListener("click", () => {
        document.querySelector(".left").style.left = "-120%";
    })

    previous.addEventListener("click", () => {
        let index = songs.indexOf(currentSong.src.split("/").slice(-1)[0]);
        if ((index - 1) >= 0) {
            playMusic(songs[index - 1]);
        }
    })

    next.addEventListener("click", () => {
        currentSong.pause;
        let index = songs.indexOf(currentSong.src.split("/").slice(-1)[0]);
        if ((index + 1) < songs.length) {
            playMusic(songs[index + 1]);
        }
    })

    document.querySelector(".range").getElementsByTagName("input")[0].addEventListener("change", e => {
        currentSong.volume = parseInt(e.target.value) / 100;
    })

    Array.from(document.getElementsByClassName("card")).forEach(e => {
        e.addEventListener("click", async item => {
            songs = await getSongs(`songs/${item.currentTarget.dataset.folder}`);
        })
    })

    document.querySelector(".volume>img").addEventListener("click", e=>{
        if(e.target.src.includes("volume.svg")){
            e.target.src = e.target.src.replace("volume.svg","mute.svg");
            currentSong.volume = 0;
            document.querySelector(".range").getElementsByTagName("input")[0].value = 0;
        }
        else{
            e.target.src = e.target.src.replace("mute.svg","volume.svg");
            currentSong.volume = .10;
            document.querySelector(".range").getElementsByTagName("input")[0].value = 10;
        }
    })

}

main()
