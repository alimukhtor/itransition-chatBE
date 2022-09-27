import express from "express";
import { Server } from "socket.io";
import { createServer } from "http";
import cors from "cors";
import mongoose from "mongoose";
import MsgModel from './db/schema.js'
import listEndpoints from 'express-list-endpoints'

const port = process.env | 3030
const {MONGO_URL} = process.env
const whiteList = [process.env.FE_LOCAL_URL, process.env.FE_REMOTE_URL];

const corsOptions = {
    origin: function (origin, next) {
        console.log(origin);
        if (!origin || whiteList.indexOf(origin) !== -1) {
            next(null, true);
        } else {
            next(new Error("Not allowed by CORS"));
        }
    },
};


let onlineUsers = []
const app = express();
app.use(cors());
app.use(express.json());

app.get('/online-users', (req, res) => {
    res.send({ onlineUsers })
})
const httpServer = createServer(app);
const io = new Server(httpServer,  {
    transports:['polling'],
    cors:{
      cors: {
        origin: "http://localhost:3000"
      }
    }});

io.on("connection", (socket) => {
    console.log(socket.id)
    socket.on("setUsername", ({ username, room }) => {
        onlineUsers.push({ username, id: socket.id, room })
        socket.join(room)
        console.log("socket room",socket.rooms)
        socket.emit("loggedin")
        // Emits to the other end of *every other* channel
        socket.broadcast.emit("newConnection")

        // Emits to every connected socket
        // io.sockets.emit() 
    })

    MsgModel.find().then(result => {
        socket.emit('output-messages', result)
    })

    socket.on("sendmessage", async({ message, room }) => {
        const newMessage = new MsgModel({ 
            text:message.text,
            sender: message.sender,
            socketId:message.socketId
        });
        newMessage.save().then(() => {
            socket.to(room).emit('message', message)
        })
        console.log("Message",newMessage);
        // Emits only to people inside of the defined "room"
    })

    socket.on("disconnect", () => {
        onlineUsers = onlineUsers.filter(user => user.id !== socket.id)
        socket.broadcast.emit("disconnectedUser")
    })

});
// CAUTION: we do not app.listen() 
// but rather httpServer.listen()
// httpServer.listen(3030, () => {
//     console.log("Server is listening on port 3030");
// });

// // *********************** DB CONNECTION ****************
mongoose.connect(MONGO_URL);
mongoose.connection.on("connected", () => {
  console.log("Connected to MongoDB!");
  httpServer.listen(port, () => {
    console.table(listEndpoints(httpServer));
    console.log(`Server running on port ${port}`);
  });
});