import { createRequire } from "module";
const require = createRequire(import.meta.url);
import http from "http";
import { Server } from "socket.io"
import express from "express";
import { dirname } from 'path';
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();

app.set("view engine", "pug");
app.set("views", __dirname + "/views");

app.use("/public", express.static(__dirname + "/public"));
app.use("/speech", express.static(__dirname + "/speech"));
app.use('/images', express.static(__dirname + '/images'));
app.use('/models', express.static(__dirname + '/models'));
app.use(express.json())
app.use(express.urlencoded({extended: true}))

//질문 제출 시 텍스트파일로 저장
app.post('/submit', (req,res) => {
    //var sentence = req.query.sentence;
    var sentence1 = req.body.sentence;
    var left_eyes = (req.body.left_eyes);
    var right_eyes = (req.body.right_eyes);
    const obj ={sentence : sentence1};
    var sentence = JSON.stringify(obj);
    console.log(sentence);

    const fs = require('fs');
    fs.writeFileSync("test.txt", sentence);
    fs.writeFileSync("left_eyes.txt", left_eyes);
    fs.writeFileSync("right_eyes.txt", right_eyes);

    res.sendFile(__dirname +'/views/test2.html')
})

app.get('/submit2', (req,res) => {
    var sentence = req.query.sentence;
    console.log(sentence);
    const fs = require('fs');
    fs.writeFileSync("test.txt", sentence);
    res.sendFile(__dirname +'/views/test.html')
})
app.get('/getEyearray',(req,res)=>{
    const fs = require('fs');
    var data1 = fs.readFileSync('right_eyes.txt', (err,data) => {});
    var data2 = fs.readFileSync('left_eyes.txt', (err,data) => {});
    var data = { right: JSON.parse(data1), left: JSON.parse(data2)};
    res.send(data);
})
app.get('/eyesresult', (req,res)=>{
    res.render("eyeresult");
})
app.post('/convert', (req,res)=>{
    const fs = require('fs');
    var data = fs.readFileSync('test.txt', (err,data) => {});
    var dataParsed = JSON.parse(data);
    res.writeHead(200, {'Content-Type': 'text/html;charset=UTF-8'});
    var openApiURL = "http://aiopen.etri.re.kr:8000/WiseNLU_spoken";
    var access_key = '725aebde-323a-4964-a231-ccde25bae07e';
    var analysisCode = 'ner';
    var text = '';
    text += dataParsed.sentence;
    var requestJson = {  
        'argument': {
            'text': text,
            'analysis_code': analysisCode
        }
    };
    var request = require('request');
    var options = {
        url: openApiURL,
        body: JSON.stringify(requestJson),
        headers: {'Content-Type':'application/json','Authorization':access_key}
    };
    request.post(options, function (error, response, body) {
        res.write(body);
    });    
})
app.get("/test2", (req, res) => res.sendFile(__dirname +'/views/test2.html'));
app.get("/", (req, res) => res.sendFile(__dirname +'/views/test.html'));
app.use(express.urlencoded({extended: true}));
app.get('/home', (req,res)=>{
    res.render('home')
})
app.get('/interview', (req,res)=>{
    res.sendFile(__dirname +'/views/interview.html')
})
app.get('/join', (req, res) => {
    res.render("join");
})
app.get('/login', (req,res)=>{
    res.sendFile(__dirname +'/views/login.html')
})
app.get('/interview2', (req,res)=>{
    res.sendFile(__dirname +'/views/interview2.html')
})
app.get('/annyang', (req,res)=>{
    res.sendFile(__dirname +'/views/annyang.html')
})
const httpServer = http.createServer(app);
const wsServer = new Server(httpServer);
function openRooms(){
    let roomNum = roomObjArr.length;
    const openrooms = [];
    for(let i=0; i<roomNum; i++){
        const name_count = [];
        name_count.push(roomObjArr[i].roomName);
        name_count.push(roomObjArr[i].currentNum);
        openrooms.push(name_count);
    }
    return openrooms;
}

let roomObjArr = [
  ];
  const MAXIMUM = 4;


wsServer.on("connection", (socket) => {
    let myRoomName = null;

    socket["nickname"] = "Anon";
    socket.emit("room_change", openRooms());
    socket.on("join_room", (roomName) => {
        myRoomName = roomName;

        let isRoomExist = false;
        let targetRoomObj = null;
        
        for(let i = 0; i<roomObjArr.length; ++i) {
            if (roomObjArr[i].roomName === roomName) {
                if(roomObjArr[i].currentNum >= MAXIMUM) {
                    socket.emit("reject_join");
                    ++roomObjArr[i].currentNum;
                    return;
                }

                isRoomExist = true;
                targetRoomObj = roomObjArr[i];
                break;
            }
        }
        if (!isRoomExist) {
            targetRoomObj = {
                roomName,
                currentNum: 0,
                users: [],
            };
            roomObjArr.push(targetRoomObj);
        }

        targetRoomObj.users.push({
            socketId: socket.id,
        });
        ++targetRoomObj.currentNum;

        socket.join(roomName);
        wsServer.sockets.emit("room_change", openRooms());
        socket.emit("welcome", targetRoomObj.users);
    
    });
    socket.on("offer", (offer, remoteSocketId) => {
        socket.to(remoteSocketId).emit("offer", offer, socket.id);
    });
    socket.on("answer", (answer, remoteSocketId) => {
        socket.to(remoteSocketId).emit("answer", answer, socket.id);
    });
    socket.on("ice", (ice, remoteSocketId) => {
        socket.to(remoteSocketId).emit("ice", ice, socket.id);
    });
    socket.on("new_message", (msg, room, done) => {
        socket.to(room).emit("new_message", `${socket.nickname}: ${msg}`);
        done();
    });
    socket.on("nickname", (nickname) => (socket["nickname"] = nickname));
    socket.on("disconnecting", () => {
        socket.to(myRoomName).emit("leave_room", socket.id);

        let isRoomEmpty = false;
        for(let i = 0; i< roomObjArr.length; i++){
            if(roomObjArr[i].roomName === myRoomName){
            const newUsers = roomObjArr[i].users.filter(
                (user) => user.socketId != socket.id
            );
            roomObjArr[i].users = newUsers;
            --roomObjArr[i].currentNum;

                if (roomObjArr[i].currentNum == 0) {
                    isRoomEmpty = true;
                }
            }
        }
        if (isRoomEmpty) {
            const newRoomObjArr = roomObjArr.filter(
                (roomObj) => roomObj.currentNum != 0
            );
            roomObjArr = newRoomObjArr;
        }
    });
    socket.on("disconnect", () => {
        if(roomObjArr.length == 0){
            wsServer.sockets.emit("room_change2");
        }
        else{
        wsServer.sockets.emit("room_change", openRooms());
    }
    });
});

const handleListen = () => console.log("Listening on http://localhost:3000");
httpServer.listen(3000, handleListen);

app.post('/login', (req,res)=>{
    const {userid,userpw} = req.body;
    connection.query(`SELECT * FROM User WHERE userid="${userid}"`, (error, result) => {
        if (error) return console.log(error);
    
        if (result.length) {
          console.log(result);
          if (result[0].userpw === userpw) {
            console.log('login 성공');
          } else {
            console.log('login 실패');
          }
          res.redirect('/');
        } else {
          console.log('login 실패');
          res.redirect('/');
        }
      });
    res.sendFile(__dirname +'/views/login.html')
})

app.post('/join', (req, res) => {
    const {name,userid,userpw,useremail,} = req.body;
    var sql = `INSERT INTO User (userid, userpw, username, useremail) VALUES ('${name}','${userid}','${userpw}','${useremail}')`;
    connection.query(sql, function (err, result) {
        if (err) throw err;
        console.log("1 record inserted");
        });
    res.sendFile(__dirname + "/views/login.html")
    });