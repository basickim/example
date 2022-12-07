// import { createConnection } from "mysql";

const socket = io();

const myFace = document.getElementById("myFace");
const muteBtn = document.getElementById("mute");
const cameraBtn = document.getElementById("camera");
const cameraSelect = document.getElementById("cameras");
const call = document.getElementById("call");
const msg = call.querySelector("ul");
const msg_value = document.getElementById("a");
const sendBtn = document.getElementById("b");

let myStream;
let muted = false;
let cameraOff = false;
let roomName;
let nickName = "Anon";

let pcObj = {
    // remoteSocketId: pc
};

//실시간 채팅
const room = document.getElementById("myStream");

//메세지 생성 함수
function addMessage(message){
    const ul = room.querySelector("ul");
    const li = document.createElement("li");
    li.innerText = message;
    ul.insertBefore(li, ul.firstChild);
}

//메세지 전달 함수
function handleMessageSubmit(event){
    event.preventDefault();
    const input = room.querySelector("#chatForm input");
    const value = input.value;
    socket.emit("new_message", value, roomName, () => {
        addMessage(`you: ${value}`);
    });
    input.value = "";
}

//닉네임 전달 함수
function handleNicknameSubmit(event){
    event.preventDefault();
    const input = room.querySelector("#nickname input");
    const value = input.value;
    socket.emit("nickname", value);
    nickName = value;
    const h3 = room.querySelector("h4");
    h3.innerText = `NICKNAME: ${nickName}`;
    input.value = "";
}

const msgForm = room.querySelector("#chatForm");
const nickForm = room.querySelector("#nickname");
msgForm.addEventListener("submit", handleMessageSubmit);
nickForm.addEventListener("submit", handleNicknameSubmit);


async function getCameras(){
    try{
        const devices = await navigator.mediaDevices.enumerateDevices();
        const cameras = devices.filter((device) => device.kind ==="videoinput");
        const currentCamera = myStream.getVideoTracks();//[0]; 지워짐
        cameras.forEach((camera) => {
            const option = document.createElement("option");
            option.value = camera.deviceId;
            option.innerText = camera.label;
            
            if(currentCamera.label == camera.label){
                option.selected = true;
            }
            cameraSelect.appendChild(option);
        });
    } catch (e) {
        console.log(e);
    }
}

//화면을 가져오는 함수
async function getMedia(deviceId){
    //초기 화면(default 캠 선택)
    const initialConstraints = {
        audio: true,
        video: { facingMode: "user"}
    };
    //캠이 여러개 일 시 (선택한 캠 선택)
    const cameraConstraints = {
        audio: true,
        video: {deviceId: {exact: deviceId}}
    };
    try {
        myStream = await navigator.mediaDevices.getUserMedia(           
            deviceId ? cameraConstraints: initialConstraints
            );
        myFace.srcObject = myStream;
        if(!deviceId){
            await getCameras();
        }
    } catch(e) {
        console.log(e);
    }
}


function handleMuteClick(){
    myStream.getAudioTracks().forEach((track) => (track.enabled = !track.enabled));
    if(!muted){
        muteBtn.innerText = "Unmute";
        muted = true;
    }else{
        muteBtn.innerText = "Mute";
        muted = false;
    }
}

function handleCameraClick(){
    myStream.getVideoTracks().forEach((track) => (track.enabled = !track.enabled));
    if(!cameraOff){
        cameraBtn.innerText = "Turn Camera On";
        cameraOff = true;
    }else{
        cameraBtn.innerText = "Turn Camera Off";
        cameraOff = false;
    }
}

 async function handleCameraChange(){
    try{
    await getMedia(cameraSelect.value);
    if(peerConnectionObjArr.length > 0){
        const videoTrack = myStream.getVideoTracks()[0];
        peerConnectionObjArr.forEach((peerConnectionObj) => {
            const peerConnection = peerConnectionObj.connection;
            const peerVideoSender = peerConnection.getSenders()
                .find((sender) => sender.track.kind == "video");
            peerVideoSender.replaceTrack(videoTrack);
        });
    }
} catch (e) {
    console.log(e);
}
}

muteBtn.addEventListener("click", handleMuteClick);
cameraBtn.addEventListener("click", handleCameraClick);
cameraSelect.addEventListener("input", handleCameraChange);



// 채팅룸 입장 처리
const welcome = document.getElementById("welcome");
const welcomeForm = welcome.querySelector("form");
const list = welcome.querySelector("ul");

call.hidden = true;

async function initCall(){
    welcome.hidden = true;
    call.hidden = false;
    await getMedia();
    // makeConnection(); 없앴음
}

// 채팅방 이름 입력 후 버튼 클릭시
async function handleWelcomeSubmit(event){
    event.preventDefault();

    if (socket.disconnected) {
        socket.connect();
      }

    const input = welcomeForm.querySelector("input");
    roomName = input.value;
    // await initCall();
    const h3 = room.querySelector("h3");
    h3.innerText = `ROOM: ${roomName}`;
    const h4 = room.querySelector("h4");
    h4.innerText = `NICKNAME: ${nickName}`;
    input.value="";
    socket.emit("join_room", roomName);
}

async function handleWelcomeSubmit2(event){
    event.preventDefault();
    if (socket.disconnected) {
        socket.connect();
      }
    // await initCall();
    const h3 = room.querySelector("h3");
    h3.innerText = `ROOM: ${roomName}`;
    const h4 = room.querySelector("h4");
    h4.innerText = `NICKNAME: ${nickName}`;
    socket.emit("join_room", roomName);
}


welcomeForm.addEventListener("submit", handleWelcomeSubmit);

//room 목록 addevemtlistener
list.addEventListener("click", (e) =>{
    if(e.target.tagName === "LI") {
        let text = e.target.innerText;
        let textarr = text.split(' ');
        roomName = textarr[0]

        handleWelcomeSubmit2(e);
    }
});

// Socket Code 소켓통신부분


socket.on("welcome", async (userObjArr) => {
    // myDataChannel = myPeerConnection.createDataChannel("chat");
    // myDataChannel.addEventListener("message", (event) => {
    //     console.log(event.data);
    // });
    // console.log("made data channel");

    await initCall();

    const length = userObjArr.length;
    console.log("length 길이:"+length);
    if (length === 1) {
        return;
    }

    for (let i = 0; i<length -1 ; ++i) {
        try{
            console.log(userObjArr[i].socketId);
            console.log("여기");
            const newPC = createConnection(userObjArr[i].socketId);
            const offer = await newPC.createOffer();
            await newPC.setLocalDescription(offer);
            socket.emit("offer", offer, userObjArr[i].socketId);
            console.log("sent the offer");
        } catch (e) {
            console.error(e);
        }
    }
});

socket.on("offer", async (offer, remoteSocketId) => {
    try{
    // myPeerConnection.addEventListener("datachannel", (event) => {
    //     myDataChannel = event.channel;
    //     myDataChannel.addEventListener("message", (event) => {
    //         console.log(event.data);
    //     });
    // });
    console.log("received the offer");
    const newPC = createConnection(remoteSocketId);
    await newPC.setRemoteDescription(offer);
    const answer = await newPC.createAnswer();
    await newPC.setLocalDescription(answer);
    socket.emit("answer", answer, remoteSocketId);
    console.log("sent the answer");
    } catch (e) {
        console.error(e);
    }
});

socket.on("answer", async (answer, remoteSocketId) => {
    console.log("received the answer");
    await pcObj[remoteSocketId].setRemoteDescription(answer);
});

socket.on("ice", async (ice, remoteSocketId) => {
    console.log("received candidate");
    await pcObj[remoteSocketId].addIceCandidate(ice);
});

socket.on("new_message", (msg) => {
    addMessage(msg);
});

socket.on("room_change", (rooms) => {
    const roomList = welcome.querySelector("ul");
    if(rooms.length === 0){
        return;
    }
    while(roomList.hasChildNodes())
    {
        roomList.removeChild(roomList.firstChild);
    }
    rooms.forEach((room) => {
        const li = document.createElement("li");
        li.innerText = room[0] + " ("+ room[1]+"/4)";
        roomList.append(li);
    });
});
socket.on("room_change2", () => {
    const roomList = welcome.querySelector("ul");
    roomList.removeChild(roomList.firstChild);
});

function remove(roomlist){
    roomlist.remove(roomlist.firstChild);
}

socket.on("leave_room", (leanedSocketId) => {
    removeVideo(leanedSocketId);
    
});

socket.on("reject_join", () => {
    alert("Sorry, The room is already full.");
    leaveRoom();
    const input = welcomeForm.querySelector("input");
    input.innerText = "";
    roomName = "";
  });

// Leave Room

const leaveBtn = document.querySelector("#leave");

function leaveRoom() {

socket.disconnect();
 socket.connect();
  call.hidden = true;
  welcome.hidden = false;

  peerConnectionObjArr = [];

  myStream.getTracks().forEach((track) => track.stop());

  myFace.srcObject = null;
  clearAllVideos();
  clearAllChat();
}

function removeVideo(leavedSocketId) {
  const streams = document.querySelector("#streams");
  const streamArr = streams.querySelectorAll("video");
  streamArr.forEach((streamElement) => {
    if (streamElement.id === leavedSocketId) {
      streams.removeChild(streamElement);
    }
  });
}

function clearAllVideos() {
  const streams = document.querySelector("#streams");
  const streamArr = streams.querySelectorAll("video");
  streamArr.forEach((streamElement) => {
    if (streamElement.id != "myFace") {
      streams.removeChild(streamElement);
    }
  });
}

const chatBox = document.querySelector("#chats")

function clearAllChat() {
  const chatArr = chatBox.querySelectorAll("li");
  chatArr.forEach((chat) => chatBox.removeChild(chat));
}

leaveBtn.addEventListener("click", leaveRoom);




// RTC Code
function createConnection(remoteSocketId){
   const myPeerConnection = new RTCPeerConnection({
        iceServers: [
            {
                urls: [
                    "stun:stun.l.google.com:19302",
                    "stun:stun1.l.google.com:19302",
                    "stun:stun2.1.google.com:19302",
                    "stun:stun3.1.google.com:19302",
                    "stun:stun4.1.google.com:19302",
                ]
            }
        ]
    });
    myPeerConnection.addEventListener("icecandidate", (event) => {
        handleIce(event, remoteSocketId)
    });
    myPeerConnection.addEventListener("addstream", (event) => {
        handleAddStream(event, remoteSocketId);
    });
    
     myStream.getTracks()
    .forEach(track => myPeerConnection.addTrack(track, myStream));

    pcObj[remoteSocketId] = myPeerConnection;


 
    return myPeerConnection;
}

function handleIce(event, remoteSocketId){
    if(event.candidate){
    console.log("sent candidate");
    socket.emit("ice", event.candidate, remoteSocketId);
    }
}

function handleAddStream(event, remoteSocketId){
    console.log("addStream");
    const peerStream = event.stream;
    paintPeerFace(peerStream, remoteSocketId);
}

function paintPeerFace(peerStream, id){
    const streams = document.querySelector("#streams");
    const video = document.createElement("video");
    video.id = id;
    video.autoplay = true;
    video.width = "400";
    video.height = "400";
    video.srcObject = peerStream;
    streams.appendChild(video);
}

