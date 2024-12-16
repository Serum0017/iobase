let hasLoadedNewMusic = false;
let lastLoadedLink;
let audioIframe;
let lastPlayTime = 0;

window.stopMusic = async (toAwait=false) => {
    if(toAwait === true){
        let returnBig = false;
        let callTime = Date.now();
        await until(() => {
            if(audioIframe === undefined) return false;
            if(lastPlayTime > callTime){
                returnBig = true;
            }
            return true;
        });
        if(returnBig === true) return; 
    } else if(audioIframe === undefined) {
        return;
    }

    audioIframe.remove();
    audioIframe = undefined;
    lastLoadedLink = undefined;
}

window.playMusic = async (link, startTime=0) => {
    hasLoadedNewMusic = true;

    await until(() => {return navigator.userActivation.hasBeenActive === true});
    if(link === lastLoadedLink) return;

    window.stopMusic();
    lastLoadedLink = link;
    
    audioIframe = document.createElement('iframe');
    audioIframe.frameborder = "0";
    audioIframe.setAttribute("frameBorder", "0");
    audioIframe.width = 0;
    audioIframe.height = 0;
    
    const videoId = link.split('?v=')[1];
    audioIframe.src = `https://www.youtube.com/embed/${videoId}?autoplay=1&loop=1&playlist=${videoId}&enablejsapi=1${startTime === 0 ? '' : "&start=" + startTime}`;
    
    audioIframe.allow = "autoplay";
    audioIframe.security = "restricted";

    audioIframe.style.position = "fixed";
    audioIframe.classList.add('yt');
    audioIframe.id = videoId;

    document.body.appendChild(audioIframe);
    
    lastPlayTime = Date.now();
}