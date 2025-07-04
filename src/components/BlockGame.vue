<script>
import GameLeaderboard from "./GameLeaderboard.vue";
export default {
    name: 'BlockGame',
    emits: ['back'],
    components: {
        GameLeaderboard
    },
    props: {
        socket: {
            type: Object,
            required: true
        },
        settings: {
            type: Object,
            required: true
        },
        store: {
            type: Object,
            required: true
        }

    },
    data() {
        return {
            context: {},
            players: {},
            food: null,

            isActive: true,
            playerDead: false,
            kickTimer: null,
            currentDirection: 'none',
            
            CANVAS_WIDTH: 640,
            CANVAS_HEIGHT: 480,
            
        }
    },
    
    computed: {
        leaderboard() {
            // Code that runs automatically whenever 'this.player' changes
            // Make an array that is the values of all the players then chain
            return Object.values(this.players)
            // Make an new array that just has the data the leaderboard needs
                .map(player => ({
                    id: player.socketId,
                    playerName: player.playerName,
                    color: player.color,
                    score: player.segments.length
                }))
            .sort((a, b) => b.score - a.score);
        }
    },
    mounted() {
        window.addEventListener('keydown', this.handleKeydown);
        this.context = this.$refs.game.getContext("2d");

        this.socket.on('kickPlayer', () => {
            this.$emit('back');
        }); 
        

        // The server will send 'updateState' events continuously via the game loop
        this.socket.on("updateState", (gameState) => {
            this.players = gameState.players;
            this.food = gameState.foodPos;
            this.isActive = gameState.active;

            // Clear the canvas for the new frame
            this.context.clearRect(0, 0, this.$refs.game.width, this.$refs.game.height);
            // Canvas Grid
            for (let i = 0; i < this.CANVAS_WIDTH / 20; i++) {
                for (let j = 0; j < this.CANVAS_HEIGHT / 20; j++) {
                    this.context.strokeStyle = '#c2c2c2';
                    this.context.strokeRect(i * 20, j * 20, 20, 20)
                }
            }
            // Draw food
            if (this.food) {
                this.context.fillStyle = 'green';
                this.context.fillRect(this.food.x, this.food.y, 20, 20)
                this.context.strokeRect(this.food.x, this.food.y, 20, 20)
            }

            // Loop through every player (worm) in the game state
            for (const id in this.players) {
                const player = this.players[id];

                for (const segment of player.segments) {
                    // --- Draw the main segment square for ALL parts ---
                    // This code runs for both the head and the body.
                    this.context.fillStyle = player.color;
                    this.context.strokeStyle = 'black';
                    this.context.fillRect(segment.x, segment.y, 20, 20);
                    this.context.strokeRect(segment.x, segment.y, 20, 20);

                    // --- If it's the head, add the eyes ---
                    if (segment === player.segments[0] && player.alive) {
                        this.context.fillStyle = "black";
                        this.context.fillRect(segment.x, segment.y + 8, 4, 4);
                        this.context.fillRect(segment.x + 15, segment.y + 8, 4, 4);
                    }
                    else if (segment === player.segments[0] && !player.alive) {
                        this.context.fillStyle = "black";
                        this.context.fillRect(segment.x, segment.y + 8, 4, 2);
                        this.context.fillRect(segment.x + 15, segment.y + 8, 4, 2);
                    }
                }
            }
            const currPlayer = Object.values(this.players).find(p => p.socketId == this.socket.id);
            if (currPlayer && currPlayer.alive === false) {
                this.playerDead = true;
            }
        });
        // Listen for a reconnect
        this.socket.on('connect', () => {
            if (this.store.playerToken) {
                this.socket.emit('reconnectPlayer', { oldPlayerId: this.store.playerToken });
            }
        });
    },

    // clean up listeners when the component is destroyed
    beforeUnmount() {
        window.removeEventListener('keydown', this.handleKeydown);
        this.socket.off("updateState");
        this.socket.off('kickPlayer');
    },
    methods: {
        handleKeydown(e) {
            let newDirection = this.currentDirection;
            switch (e.key) {
                case "ArrowUp":
                case "w":
                    if(this.currentDirection !== 'down') newDirection ='up';
                    break;
                case "ArrowDown":
                case "s":
                    if(this.currentDirection !== 'up') newDirection ='down';
                    break;
                case "ArrowLeft":
                case "a":
                    if(this.currentDirection !== 'right') newDirection ='left';
                    break;
                case "ArrowRight":
                case "d":
                    if(this.currentDirection !== 'left') newDirection ='right';
                    break;
            }
            if(newDirection !== this.currentDirection) {
                this.currentDirection = newDirection;
                this.socket.emit('changeDirection', newDirection, this.settings);
            }
        },
        handleBack() {
            this.$emit('back');
            this.socket.emit('leaveRoom', {id: this.settings.id});
        }
    }
}
</script>

<template>
    <div class="game-container">

        <!-- Game Over Message -->
        <div v-if="playerDead" class="overlay">
            <div id="loser-overlay-content">
                <h2>Game Over</h2>
                <div class="leaderboard-wrapper">
                    <GameLeaderboard :scores="leaderboard" :isActive="isActive" />
                    <span v-if="!isActive" id="winner">{{ leaderboard[0].playerName }} wins! </span> 
                </div>
                
                <button class="play-again-button" @click="handleBack" >Main menu</button>
            </div>
        </div>

        <!-- The main canvas -->
            <GameLeaderboard :scores="leaderboard" :isActive="isActive"/>
            <canvas ref="game" :width="CANVAS_WIDTH" :height="CANVAS_HEIGHT"></canvas>
        <!-- Instructions, hidden when game is over -->
        <p v-if="!playerDead" class="instructions">
            Use Arrow Keys or WASD to move.
        </p>
    </div>
</template>


<style scoped>
    @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');

    .game-container {
        position: relative; 
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        background-color: #f0f0f0;
        padding: 12rem;
        border-radius: 10px;
        box-shadow: 0 10px 5px rgba(0,0,0,0.4);
    }
    
    canvas {
        background-color: #fafafa;
        border: 2px solid #333;
        border-radius: 8px;
    }

    .instructions {
        margin-top: 1rem;
        font-family: 'Press Start 2P', cursive;
        color: #555;
        font-size: 0.8rem;
    }

    .overlay {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(104, 67, 67, 0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 10px;
        z-index: 10;
    }

    #loser-overlay-content {
        top: 200;
        text-align: center;
        color: white;
        font-family: 'Press Start 2P', cursive;
        padding: 2rem;
        background: rgba(20, 20, 20, 0.8);
        border-radius: 10px;
    }

    .play-again-button { 
        font-family: 'Press Start 2P', cursive;
        margin-top: 1.5rem;
        padding: 1rem 2rem;
        font-size: 1rem;
        color: white;
        background-color: #2f9e44;
        border: none;
        border-radius: 5px;
        cursor: pointer;
        transition: background-color 0.2s;
    }

    .play-again-button:hover {
        background-color: #37b24d;
    }

    .play-again-button:active {
        background-color: #266e34;
    }

    .leaderboard-wrapper :deep(h2) {
    color: #42b983;
    }

    .leaderboard-wrapper :deep(.name) {
    color: #e8e1e1;
    }

    .leaderboard-wrapper :deep(.rank) {
    color: #e7e7e7;
    }

    .leaderboard-wrapper :deep(.score) {
    color: #f6f6f6;
    }

    .leaderboard-wrapper :deep(li) {
    border-bottom: none;
    }

    .leaderboard-wrapper :deep(.top-player) {
    padding-left: 0px; 
    padding-right: 0px; 
    background-color: #629564;
    }

    #winner {
    display: inline-block;
    padding-top: 20px;
    font-size: 30px;
    align-items: center;
    font-weight: 600;
    color: #66c55d;
    flex-grow: 1;
    }

    
</style>
