let APP_ID = "6b20af0e82164e369d14f6cbc3a6618d";
let token = null;

let uid = String(Math.floor(Math.random() * 1000000));

let client;
let channel; // two users join here

const constraints = {
    video: {
        width: { min: 640, ideal: 1920, max: 1920 },
        height: { min: 480, ideal: 1080, max: 1080 },
    },
    audio: true
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

const urlParams = new URLSearchParams(window.location.search);
let roomId = urlParams.get('room');

if (!roomId) {
    window.location.href = 'lobby.html';
}

let init = async () => {

    client = await AgoraRTM.createInstance(APP_ID);
    await client.login({ uid, token });

    channel = client.createChannel(roomId); // finds by name or creates new channel
    await channel.join();

    channel.on('MemberJoined', handleUserJoined);
    channel.on('MemberLeft', handleUserLeft);

    client.on('MessageFromPeer', handleMessageFromPeer);

    localStream = await navigator.mediaDevices.getUserMedia(constraints);
    document.getElementById('local').srcObject = localStream;
}

let handleMessageFromPeer = async (message, memberId) => {
    message = JSON.parse(message.text);

    if (message.type === 'offer') {
        createAnswer(memberId, message.offer);
    }

    if (message.type === 'answer') {
        addAnswer(message.answer);
    }

    if (message.type === 'candidate') {
        if (peerConnection) {
            peerConnection.addIceCandidate(message.candidate);
        }
    }
}

let handleUserJoined = async (memberId) => {
    createOffer(memberId);
}

let handleUserLeft = async (memberId) => {
    document.getElementById('remote').style.display = 'none';
    document.getElementById('local').classList.add('smallFrame');
}

let createPeerConnection = async (memberId) => {
    peerConnection = new RTCPeerConnection(servers);

    remoteStream = new MediaStream();
    document.getElementById('remote').srcObject = remoteStream;

    document.getElementById('remote').style.display = 'block';
    document.getElementById('local').classList.add('smallFrame');

    if (!localStream) {
        localStream = await navigator.mediaDevices.getUserMedia(constraints);
        document.getElementById('local').srcObject = localStream;
    }

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
        if (event.candidate) {
            client.sendMessageToPeer({ text: JSON.stringify({ 'type': 'candidate', 'candidate': event.candidate }) }, memberId);
        }
    }
}

let addAnswer = async (answer) => {
    if (!peerConnection.currentRemoteDescription) {
        peerConnection.setRemoteDescription(answer);
    }
}

let createOffer = async (memberId) => {
    await createPeerConnection(memberId);

    let offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);

    client.sendMessageToPeer({ text: JSON.stringify({ 'type': 'offer', 'offer': offer }) }, memberId) // send to peer with this memberId
}

let createAnswer = async (memberId, offer) => {
    await createPeerConnection(memberId);

    await peerConnection.setRemoteDescription(offer);

    let answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);

    client.sendMessageToPeer({ text: JSON.stringify({ 'type': 'answer', 'answer': answer }) }, memberId);
}

let leaveChannel = async () => {
    await channel.leave();
    await client.logout();
}

let toggleCamera = async () => {
    localStream.getVideoTracks().forEach((videoTrack) => {
        if(videoTrack.enabled) {
            document.getElementById('camera-btn').style.backgroundColor = 'rgb(255, 80, 80)';

        } else {
            document.getElementById('camera-btn').style.backgroundColor = 'rgb(179, 102, 249, .9)';
        }
        videoTrack.enabled = !videoTrack.enabled;
    });
}

let toggleMic =  async () => {
    localStream.getAudioTracks().forEach((audioTrack) => {
        if(audioTrack.enabled) {
            document.getElementById('mic-btn').style.backgroundColor = 'rgb(255, 80, 80)';

        } else {
            document.getElementById('mic-btn').style.backgroundColor = 'rgb(179, 102, 249, .9)';
        }
        audioTrack.enabled = !audioTrack.enabled;
    });
}

// before website actually closes
window.onbeforeunload = (e) => {
    leaveChannel();
}

document.getElementById('camera-btn').addEventListener('click', toggleCamera);
document.getElementById('mic-btn').addEventListener('click', toggleMic);
  

init();