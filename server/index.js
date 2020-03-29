const express = require('express');
const socketio = require('socket.io');
const http = require('http');
const cors = require('cors');

const { addUser, removeUser, getUser, getUserInRoom } =require('./users');

const PORT = process.env.PORT || 5000;

const router = require('./router');

const app = express();
const server = http.createServer(app);
const io = socketio(server);

io.on('connection', (socket) => {
    console.log('We have a use connection!!!');
    console.log('io connect : ', socket.id);

    socket.on('join', ({name, room}, callback) => {
        console.log('socket join : ', socket.id);
        console.log(name, room);
        const {error, user} = addUser({ id: socket.id, name, room})

        if(error) return callback(error);

        socket.emit('message', {user: 'admin', text:`${user.name}, welcome to the room ${user.room}.` });
        socket.broadcast.to(user.room).emit('message', {user: 'admin', text: `${user.name}, has joined!`});

        socket.join(user.room);

        io.to(user.room).emit('roomData', {room: user.room, users: getUserInRoom(user.room)});

        callback();
    });

    socket.on('sendMessage', (message, callback) => {
        console.log('socket sendMessage : ', socket.id);
        const user = getUser(socket.id);

        io.to(user.room).emit('message', {user: user.name, text: message});
        io.to(user.room).emit('roomData', {room: user.room, users: getUserInRoom(user.room)});

        callback();
    });

    socket.on('disconnect', () => {
        console.log('socket disconnect : ', socket.id);
        console.log('User has left!!!');
        const user = removeUser(socket.id);

        if(user) {
            io.to(user.room).emit('message', {user:'admin', text: `${user.name} has left.`});
        }
    })
});

app.use(router);
app.use(cors);

server.listen(PORT, () => console.log(`Server has started on port ${PORT}`));