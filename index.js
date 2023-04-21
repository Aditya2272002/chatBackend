const express = require("express");
const app = express();
const http = require("http");
const cors = require("cors");


// Import PrismaClient from the Prisma package
const {PrismaClient}  = require('@prisma/client');

// Create an instance of PrismaClient
const prisma = new PrismaClient()

const { Server } = require("socket.io");
app.use(cors());

const server = http.createServer(app);

let doctorRoomId = ""
let convoData = ""
let numberofUsers = 0;

const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    // origin: "https://edf3-103-162-196-227.ngrok-free.app/",
    methods: ["GET", "POST"],
  },
});

io.on("connection", (socket) => {

  
  
  // console.log("Room Population ===> ",io.sockets.adapter.rooms["12"]);

  console.log(`User Connected: ${socket.id}`);
  // console.log("Initial USERS ==> ",numberofUsers);

  socket.on("join_room", async(data) => {
    socket.join(data);
    doctorRoomId=data;
    //  await getData(doctorRoomId);
    numberofUsers += 1;
    // console.log("JOINED CHAT ==> ",numberofUsers);
    console.log(`User with ID: ${socket.id} joined room: ${data}`);

    
    
    socket.emit('roomInfo',doctorRoomId);

  });

  socket.on("send_message", async(data) => {
    
      socket.to(data.room).emit("receive_message", data);
      // console.log("Data Msg ==> ", data);
      // console.log("USER MESSAGE ==> ",numberofUsers);
      //{ room: '21', author: 'Adi', message: 'hii', time: '10:40' }
      
      let msgData = `${data.author}#${data.message}@`
      convoData+=msgData
      msgData="";
    
  });


  socket.on("disconnect", async() => {
    // console.log("Disconnecting ===> ",socket.id);
    // socket.broadcast.emit("disconnectedEmit","User Disconnected !")
    const d = {author:"", message:"User Left the chat", time: `${new Date(Date.now()).getHours() +":" +new Date(Date.now()).getMinutes()}`} 
    socket.to(doctorRoomId).emit("receive_message",d);


      // TODO:- DB insertion
    // if(doctorRoomId != "" && convoData != ""){
    //       await prisma.chats.create({
    //         data:{
    //           roomId: doctorRoomId,
    //           message: convoData
    //         }
    //       })
    //   convoData=""
    // }

    if(numberofUsers>0){
      numberofUsers = numberofUsers-1
    }else{
      numberofUsers = 0
    }
    // console.log("Diconnected USER ==> ",numberofUsers);
    console.log("User Disconnected", socket.id);
  });
});

const getData = async(roomId)=>{
  const data = await prisma.chats.findMany({
    where: {
      roomId : roomId
    },
    select: {
      message: true
    }
  })
  // console.log(data[0].message);
  const msg = data[0].message;
  const msgARR = msg.split("@");
  // console.log("msgARR ==> ",msgARR);

  const completeMsgData = [];

  msgARR.forEach((mg) => {
    const arr = mg.split("#");
    const data = {
      sender: arr[0]==null || arr[0]==undefined ? "" : arr[0] ,
      message : arr[1]==null || arr[1]==undefined ? "" : arr[1] 
    }
    completeMsgData.push(data);
  });

  console.log(completeMsgData);
}

server.listen(3001, () => {
  console.log("SERVER RUNNING");
});
