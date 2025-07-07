const Express = require("express")();
const bcrypt = require('bcrypt');
const Http = require("http").Server(Express);
const { randomUUID } = require("crypto");
const { Socket } = require("socket.io");
const Socketio = require("socket.io")(Http, {
    cors: { origin: "*" }
});
const PORT = process.env.PORT || 3000;

// --- Game Constants ---
const CANVAS_WIDTH = 640;
const CANVAS_HEIGHT = 480;
const SEGMENT_SIZE = 20; // The size of one worm segment/block
const GAME_TICK_RATE = 100; // Game updates every 100ms

const rooms = {}
const disconnectTimers = new Map();

// --- Helper functions ---
function spawnFood(room) {
    room.food = {
        x: Math.floor(Math.random() * (CANVAS_WIDTH / SEGMENT_SIZE)) * SEGMENT_SIZE,
        y: Math.floor(Math.random() * (CANVAS_HEIGHT / SEGMENT_SIZE)) * SEGMENT_SIZE,
    };
}

function hasCollision(head, player, room) {
    for(let a_player of room.players) {
        // If our player is the player we took in the parameter, we start at 1 to avoid checking if the player collides with their own head.
        let start = (a_player === player) ? 1: 0;
        
        for(let j = start; j < a_player.segments.length; j++) {
            // Check if the head has collided with ANY of our body (except our head) or ANY of anyone elses body
            if(head.x === a_player.segments[j].x && head.y === a_player.segments[j].y) {
                return true;
            }
        }
    }
}

function createPlayer(socketId, playerName = '') {
    const playerId = randomUUID()
    
    console.log(`Player created: ${playerId}`);
    return {
        socketId,
        playerId,
        playerName,
        alive: true,
        hasTurned: false,
        direction: 'none',
        color: `hsl(${Math.random() * 360}, 100%, 50%)`,
        segments: [
            {
                x: Math.floor(Math.random() * (CANVAS_WIDTH / SEGMENT_SIZE)) * SEGMENT_SIZE,
                y: Math.floor(Math.random() * (CANVAS_HEIGHT / SEGMENT_SIZE)) * SEGMENT_SIZE,
            }
        ],
    };
}

// --- The Main Game Loop ---
function onTimerTick() {
    // This function runs continuously to update the game state.
    for (const roomId in rooms) {
        const room = rooms[roomId];
        if(!room.active) {
            continue;
        }

        const roomPlayers = room.players;
        const roomFood = room.food;
        

        // If there is no food, spawn some.
        if(!roomFood){
            spawnFood(room);
        }
        // Skip players who haven't started moving yet.
        //Loop through the players only in the current room
        for(const playerId in roomPlayers) {
            const player = roomPlayers[playerId];

            if (player.direction === 'none' || player.alive === false) {
                continue;
            }

            // Calculate the new position for the worm's head.
            const head = { ...player.segments[0] }; // Get a copy of the current head
            switch (player.direction) {
                case "right": head.x += SEGMENT_SIZE; break;
                case "left":  head.x -= SEGMENT_SIZE; break;
                case "up":    head.y -= SEGMENT_SIZE; break;
                case "down":  head.y += SEGMENT_SIZE; break;
            }
            
            // --- Boundary Check ---
            if (head.x < 0 || head.x >= CANVAS_WIDTH || head.y < 0 || head.y >= CANVAS_HEIGHT) {
                player.direction = 'none';
                player.alive = false; 
            }
            if(hasCollision(head, player, room)){
                player.direction = 'none';
                player.alive = false;
            } 
            const everyoneDead = roomPlayers.every(player => player.alive === false);
            if(everyoneDead) {
                Socketio.to(roomId).emit('playAgain');


                setTimeout(() => {
                // Kick them so they dont stay and break the server by making it process undefined data.
                if (room.active === true) return;
                room.active = false;
                Socketio.to(roomId).emit('kickPlayer');
                Socketio.socketsLeave(roomId);
                console.log(`Lobby game deleted ${roomId}`)
                delete rooms[roomId];
                }, 30000); // 30 seconds
                continue;
            }

            //  Add the new head to the front of the segments array.
            player.segments.unshift(head);

            //reset the turn flag
            room.players.forEach(p => p.hasTurned = false);
        
            // Check if the worm's head is in the same spot as the food.
            if (head.x === room.food.x && head.y === room.food.y) {
                // Spawn a new piece of food.
                spawnFood(room);
            } else {
                // The worm didn't eat, so it just moves.
                // Remove the last segment of the tail.
                player.segments.pop();
            }
        }
        // After updating all players, broadcast the new state to the players in the room.
        Socketio.to(roomId).emit("updateState", room );
    } 
}

// Start the one and only game loop when the server starts.
setInterval(onTimerTick, GAME_TICK_RATE);

Socketio.on("connection", socket => {
    let playerId = null;
    let room = null;

    socket.on('reconnectPlayer', ({ oldPlayerId  }) => {
        console.log(`Attempting to reconnect player: ${oldPlayerId}`);
        if (disconnectTimers.has(oldPlayerId)) {
          clearTimeout(disconnectTimers.get(oldPlayerId ));
          disconnectTimers.delete(oldPlayerId );

          playerId = oldPlayerId;
          players[playerId].socketId = socket.id;
          console.log(`Player reconnected: ${oldPlayerId}`);
        } else {
          // Optional: tell client their token was invalid or expired
          socket.emit('invalidToken');
        }
      });


    socket.on("changeDirection", (newDirection, room) => {
        const player = rooms[room.id].players.find(p => p.socketId === socket.id);
        if (!player || player.hasTurned) return;
        // We have to double check the direction again and see if the player has turned. If this is not here
        // it would be possible to do a 180 degree turn if the player inputs fast enough.

        // i.e if the player is going UP and then quickly presses LEFT and then DOWN
        // The LEFT would pass and then immediately overwritten by the DOWN, making the player kill themselves. 
        const opposite = { up: "down", down: "up", left: "right", right: "left" };
        if (newDirection === opposite[player.direction]) return;

        player.direction = newDirection;
        player.hasTurned = true;
    });

   // --- Host creates a new room ---
   socket.on('createRoom', async (data) => {
    // Check if room already exists 
    if (Object.values(rooms).some(r => r.roomName === data.roomName)) {
        socket.emit('error', { message: 'A room with that name already exists.' });
        return;
    }
    // Make the host player
    const player = createPlayer(socket.id, data.playerName);
    playerId = player.playerId;
    socket.emit("setToken", playerId);

    // Make a room 
    const roomId = randomUUID(); 
    rooms[roomId] = {
        id: roomId,
        roomName: data.roomName,
        password: data.password, 
        hostId: playerId,
        players: [player],
        gameState: null,
        food: null,
        active: false
    };
    
    socket.join(roomId);
    console.log(`Room "${data.roomName}" created by ${player.playerId.substring(0, 4)}`);
    socket.emit('joinSuccess', rooms[roomId]);
    });

    // --- Player joins an existing room ---
    socket.on('joinRoom', (data) => {
        console.log(`Looking for room named ${data.roomName}`);
        const room = Object.values(rooms).find(r => r.roomName === data.roomName);
        
        if (!room) {
            socket.emit('error', { message: 'Room not found.' });
            return;
        }

        if (room.password && room.password !== data.password) {
            socket.emit('error', { message: 'Incorrect password.' });
            return;
        }
        // --- Make a new player ---
        const player = createPlayer(socket.id, data.playerName);
        playerId = player.playerId;
        socket.emit("setToken", playerId);

         // --- Add player to the room ---
        room.players.push(player);
        socket.join(room.id);
        console.log(`${socket.id} joined room "${data.roomName}"`);

        // Send an update to everyone else in the room
        Socketio.to(room.id).emit('lobbyUpdate', room);

        // If game has already started, start game for new player
        if(rooms[room.id].active) {
            socket.emit('start', room);
        }
    });
   
    // -- Player leaves a room --
    socket.on('leaveRoom', data => {
        const room = rooms[data.id];
        if (!room) return; 

    // Find the index of the player using their socket.id
    const index = room.players.findIndex(p => p.socketId === socket.id);

    if (index !== -1) {
        const player = room.players[index];
        const playerId = player.playerId;

        console.log(`Player ${playerId} is leaving room ${room.roomName}`);
        socket.leave(room.id);
        room.players.splice(index, 1);

        // Check if the room is now empty.
        if (room.players.length === 0) {
            delete rooms[room.id];
            console.log(`Room ${room.roomName} is empty and has been deleted.`);
        } else {
            // If the room is NOT empty, update remaining players and check for new host.
            socket.to(room.id).emit('lobbyUpdate', room);

            // Check if the person who left was the host.
            if (room.hostId === playerId) {
                // Make the first person in the array the new host.
                room.hostId = room.players[0].playerId;
                console.log(`Host left. New host is now ${room.hostId}`);
                // Broadcast another update to inform clients about the new host.
                Socketio.to(room.id).emit('lobbyUpdate', room);
            }
        }
    }
});
    // --- Start Game ---
    socket.on('startGame', data => {
        const roomId = data.id;
        Socketio.to(roomId).emit('start');
        rooms[roomId].active = true;
        console.log(`Lobby started game: ${roomId}`)
    })

    // --- Play Again ---
    socket.on('playAgain', data => {
        const room = rooms[data.id];
        if(!room) return;

        room.active = true;
        spawnFood(room);

    // Reset every player in the room
    for (const player of room.players) {
        player.alive = true;
        player.direction = 'none'; // Reset direction to stop them from moving instantly
        player.segments = [ // 2. Assign an ARRAY with the new single segment
            {
                x: Math.floor(Math.random() * (CANVAS_WIDTH / SEGMENT_SIZE)) * SEGMENT_SIZE,
                y: Math.floor(Math.random() * (CANVAS_HEIGHT / SEGMENT_SIZE)) * SEGMENT_SIZE,
            }
        ];
    }
    console.log(`Room ${room.id} has been reset for Play Again.`);

    Socketio.to(room.id).emit("updateState", room);
    });
    

    socket.on("disconnect", () => {
        if (!playerId) {
            console.log(`A socket (${socket.id}) disconnected without a player token.`);
            return;
        }
    
        console.log(`Grace period started for player: ${playerId}`);
    
        disconnectTimers.set(playerId,
            setTimeout(() => {
                console.log(`Grace period ended for ${playerId}. Cleaning up...`);
    
                let roomIdOfPlayer = null;
    
                // Find which room the disconnected player was in
                for (const currentRoomId in rooms) {
                    const room = rooms[currentRoomId];
                    // Check if the player's ID exists as a key in this room's players object
                    if (room.players && room.players.some(p => p.playerId === playerId)) {
                        roomIdOfPlayer = currentRoomId;
                        break; // Found the room
                    }
                }
    
                // If we found the player in a room, clean them up
                if (roomIdOfPlayer) {
                    const room = rooms[roomIdOfPlayer];
                    const index = room.players.findIndex(p => p.playerId === playerId) // Get the player index

                    if(index === -1) return;

                    const playerToRemove = room.players[index];
                    console.log(`Removing player ${playerId} from room ${room.roomName}`);
    
                    room.players.splice(index, 1);
    
                    // Check if the room is now empty
                    if (room.players.length === 0) {
                        delete rooms[roomIdOfPlayer];
                        console.log(`Room ${room.roomName} is empty and has been deleted.`);
                    } else {
                        //  Handle host reassignment
                        if (room.hostId === playerToRemove.playerId) {
                            // Get the ID of the first remaining player and make them the new host
                            const newHostId = room.players[0].playerId;
                            room.hostId = newHostId;
                            console.log(`Host disconnected. New host is ${newHostId}`);
                        }
                        
                        //  Notify remaining players
                        Socketio.to(roomIdOfPlayer).emit('lobbyUpdate', room);
                    }
                }
    
                disconnectTimers.delete(playerId);
    
            }, 5000)
        );
    });

});

Http.listen(PORT, () => {
    console.log(`Listening at :${PORT}...`);
  });