<script>
    import io from "socket.io-client";
    export default {
        name: 'BlockGame',
        data() {
            return {
                socket: {},
                context: {},
                players: {},
                food: null,
                CANVAS_WIDTH: 640,
                CANVAS_HEIGHT: 480
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

            // The server will send 'updateState' events continuously via the game loop
            this.socket.on("updateState", (gameState) => {
                this.players = gameState.players;
                this.food = gameState.foodPos;

                // Clear the canvas for the new frame
                this.context.clearRect(0, 0, this.$refs.game.width, this.$refs.game.height);
                // Canvas Grid
                for(let i = 0; i < this.CANVAS_WIDTH / 20; i++ ) {
                    for(let j = 0; j < this.CANVAS_HEIGHT / 20; j++) {
                        this.context.strokeStyle = '#c2c2c2';
                        this.context.strokeRect(i * 20, j * 20, 20, 20)
                    }
                }
                // Draw worms
                if(this.food) {
                    this.context.fillStyle = 'green';
                    this.context.strokeStyle = 'black';
                    this.context.fillRect(this.food.x, this.food.y, 20, 20)
                    this.context.strokeRect(this.food.x, this.food.y, 20, 20)
                }

                // Loop through every player (worm) in the game state
                for (const id in this.players) {
                    const player = this.players[id];
                    
                    // Set the color for this specific worm
                    this.context.fillStyle = player.color;
                    
                    // Loop through the worm's body segments and draw each one
                    for (const segment of player.segments) {
                        this.context.fillRect(segment.x, segment.y, 20, 20);
                        this.context.strokeRect(segment.x, segment.y, 20, 20);
                    }
                }
            });
            // Add keyboard controls for a better feel
            window.addEventListener('keydown', this.handleKeydown);
        },

        // clean up listeners when the component is destroyed
        beforeUnmount() {
            window.removeEventListener('keydown', this.handleKeydown);
        },
        methods: {
            move(direction) {
                this.socket.emit("move", direction);
            },
            handleKeydown(e) {
                switch(e.key) {
                    case "ArrowUp":
                    case "w":
                        this.move('up');
                        break;
                    case "ArrowDown":
                    case "s":
                        this.move('down');
                        break;
                    case "ArrowLeft":
                    case "a":
                        this.move('left');
                        break;
                    case "ArrowRight":
                    case "d":
                        this.move('right');
                        break;
                }
            }
        }
    }
</script>

<template>
    <div style="background-color: lightgray; min-height: 100vh; display: flex; flex-direction: column; justify-content: center; align-items: center;">
        <canvas 
        ref="game" 
        :width="CANVAS_WIDTH"
        :height="CANVAS_HEIGHT"
        style="border: 2px solid black;">
        </canvas>
        <p style="text-align: center; font-family: sans-serif;">
            Use Arrow Keys or WASD to move.
        </p>
    </div>
</template>

<style scoped></style>
