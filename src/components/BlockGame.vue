<script>
    import io from "socket.io-client";
    export default {
        name: 'BlockGame',
        data() {
            return {
                socket: {},
                context: {},
                players: {}
            }
        },
        created() {
            // 1. Check browser's local storage for an existing player token.
            const playerToken = localStorage.getItem('playerToken');

            // 2. Connect to the server, sending our token if we have one.
            this.socket = io("http://localhost:3000", {
                auth: {
                    token: playerToken
                }
            });

            // 3. Listen for the server assigning us a new token (for first-time connections)
            this.socket.on("setToken", (token) => {
                console.log("Received a new token from server:", token);
                // Save the token in local storage for future visits.
                localStorage.setItem('playerToken', token);
            });
        },
        mounted() {
            this.context = this.$refs.game.getContext("2d");

            this.socket.on("updatePlayers", playersData => {
                this.players = playersData;
                this.context.clearRect(0, 0, this.$refs.game.width, this.$refs.game.height);

                for (const id in this.players) {
                    const player = this.players[id];
                    this.context.fillStyle = player.color;
                    this.context.fillRect(player.x, player.y, 20, 20);
                }
            });

            //Set up the listener for key presses
            console.log('Component mounted. Adding global key listener.');
            window.addEventListener('keydown', this.KeyPress);
        },
        methods: {
            KeyPress(event) {
                console.log(`Key pressed: ${event.key}`);
                
                switch (event.key) {
                    case 'w': 
                    case 'W':
                    case 'ArrowUp':
                        this.socket.emit("move", "up");
                        break;
                    case 's':
                    case 'S':
                    case 'ArrowDown':
                        this.socket.emit("move", "down");
                        break;
                    case 'a':
                    case 'A':
                    case 'ArrowLeft':
                        this.socket.emit("move", "left");
                        break;
                    case 'd':
                    case 'D':
                    case 'ArrowRight':
                        this.socket.emit("move", "right");
                        break;
                }
            }
        }
    }
</script>

<template>
    <div>
        <canvas 
        ref="game" 
        width="640" 
        height="480"
        style="border: 2px solid black;">
        </canvas>
    </div>
</template>

<style scoped></style>
