import http from "http";
import SocketIO from "socket.io"
import express from "express";

const mysql = require('mysql');
const dbconfig = require('./config/db.js');
const connection =  mysql.createConnection(dbconfig);

const app = express();

app.set("view engine", "pug");
app.set("views", __dirname + "/views");

app.use("/public", express.static(__dirname + "/public"));
app.use("/speech", express.static(__dirname + "/speech"));
app.use('/images', express.static(__dirname + '/images'));
app.use('/models', express.static(__dirname + '/models'));
//app.get("/", (req, res) => res.sendFile(__dirname +'/views/index.html'));
app.get("/", (req, res) => res.sendFile(__dirname +'/views/test.html'));
app.use(express.urlencoded({extended: true}));
//app.get("/*", (req, res) => res.redirect("/"));   11.06 통합과정 주석처리

//추가
app.get('/home', (req,res)=>{
    res.render('home')
})
app.get('/interview', (req,res)=>{
    res.sendFile(__dirname +'/views/interview.html')
})

//11.9 회원가입
app.get('/join', (req, res) => {
    res.render("join");
})


app.get('/login', (req,res)=>{
    res.sendFile(__dirname +'/views/login.html')
})
app.get('/interview2', (req,res)=>{
    res.sendFile(__dirname +'/views/interview2.html')
})

const httpServer = http.createServer(app);
const wsServer = SocketIO(httpServer);

//현재 열린 방목록 전달함수
function publicRooms(){
    const {
        sockets: {
            adapter: {sids, rooms},
        },
    } = wsServer;
    
    const publicRooms = [];
    let s=0;
    rooms.forEach((_, key) => {
        if(sids.get(key) === undefined){
            
            for(let i=0; i<publicRooms.length; i++)
            {
                if(key == publicRooms[i])
                s=1;
            }
            if(s==0)
            {
                publicRooms.push(key)
            }
            s=0;
        }
    })
    return publicRooms;
}

function countRoom(roomName){
    return wsServer.sockets.adapter.rooms.get(roomName)?.size;
}

wsServer.on("connection", (socket) => {
    socket["nickname"] = "Anon";
    wsServer.sockets.emit("room_change", publicRooms());
    socket.on("join_room", (roomName) => {
        socket.join(roomName);
        socket.to(roomName).emit("welcome");
        wsServer.sockets.emit("room_change", publicRooms());
        
    });
    socket.on("offer", (offer, roomName) => {
        socket.to(roomName).emit("offer", offer);
    });
    socket.on("answer", (answer, roomName) => {
        socket.to(roomName).emit("answer", answer);
    });
    socket.on("ice", (ice, roomName) => {
        socket.to(roomName).emit("ice", ice);
    });
    socket.on("new_message", (msg, room, done) => {
        socket.to(room).emit("new_message", `${socket.nickname}: ${msg}`);
        done();
    });
    socket.on("nickname", (nickname) => (socket["nickname"] = nickname));
    socket.on("disconnecting", () => {
        socket.rooms.forEach((room) => socket.to(room).emit("bye"));
    });
    socket.on("disconnect", () => {
        wsServer.sockets.emit("room_change", publicRooms());
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
    //mysql 삽입;
    var sql = `INSERT INTO User (userid, userpw, username, useremail) VALUES ('${name}','${userid}','${userpw}','${useremail}')`;
    connection.query(sql, function (err, result) {
        if (err) throw err;
        console.log("1 record inserted");
        });
    res.sendFile(__dirname + "/views/login.html")
})
connection.query("select * from User", (error, rows, fields) => {
    if (error) throw error;
    console.log('User info is:', rows);
});
//connection.end();