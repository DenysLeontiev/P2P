const constraints = {
    video: true,
    audio: false
}

const servers = {
    iceServers: [
        {
            urls: ['stun:stun1.l.google.com:19302', 'stun:stun2.l.google.com:19302']
        }
    ]
}

let localStream;
let remoteStream;
let peerConnection;

let init = async () => {
    localStream = await navigator.mediaDevices.getUserMedia(constraints);
    document.getElementById('local').srcObject = localStream;

    createOffer();
}

let createOffer = async () => {
    peerConnection = new RTCPeerConnection(servers);

    remoteStream = new MediaStream();
    document.getElementById('remote').srcObject = remoteStream;

    localStream.getTracks().forEach((track) => {
        peerConnection.addTrack(track, localStream);
    });

    // remote peer adds their tracks
    peerConnection.ontrack = (event) => {
        event.streams[0].getTracks().forEach((track) => {
            // peerConnection.addTrack(track, remoteStream);
            remoteStream.addTrack(track);
        });
    }

    // called when setLocalDescription() is called
    peerConnection.onicecandidate = async (event) => {
        if(event.candidate) {
            console.log(event.candidate);
        }
    }

    let offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);
}

init();