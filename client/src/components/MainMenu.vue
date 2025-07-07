<script>
    export default {
        name: 'MainMenu',
        emits: ['host', 'join'],
        props: {
            socket: {
                type: Object,
                required: true
            }
        }
    }

</script>
    
    <template>
        <div class="menu-container">
            <h1>Multiplayer Worms</h1>
            <div class="button-group">
                <button @click="$emit('host')">Host Game</button>
                <button @click="$emit('join')">Join Game</button>
            </div>
        </div>
    </template>
    
    <style scoped>
        @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap'); 
        .menu-container {
            font-family: 'Press Start 2P', cursive;
            text-align: center;
            background-color: white;
            padding: 3rem 4rem;
            border-radius: 10px;
            height: 4%;
            box-shadow: 0 10px 25px rgba(0,0,0,0.1);
        }
        h1 {
            margin-bottom: 2rem;
        }
        .button-group {
            margin-top: 4rem;
            display: flex;
            flex-direction: column;
            gap: 2rem;
        }
        button {
            font-family: 'Press Start 2P', cursive;
            padding: 1rem 2rem;
            font-size: 1.2rem;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            background-color: #42b983;
            color: white;
            transition: background-color 0.2s;
        }
        button:hover {
            background-color: #4ac690;
        }

        button:active {
            background-color: #33946a;
        }
    </style>
    