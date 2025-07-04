<script>
export default {
    name: 'HostGame',
    emits: ['joinedLobby', 'back'],
    data() {
        return {
            roomName: '',
            password: '',
            playerName: '',
            msg: ''
        }
    },
    props: {
        socket: {
            type: Object,
            required: true
        }
    },
    mounted() {
        // Wait till we get a success msg from the server, then we tell App.vue to switch views
        this.socket.on('joinSuccess', (roomData) => {
            this.$emit('joinedLobby', roomData);
        });

        this.socket.on('error', msg => {
            this.msg = msg;
        })
    },
    beforeUnmount() {
        // Clean up the listener
        this.socket.off('joinSuccess');
    },
    methods: {
        handleHostGame() {
            // Talk directly to the server
            this.socket.emit('createRoom', {
                roomName: this.roomName,
                password: this.password,
                playerName: this.playerName
            });
        }
    }
}
</script>

<template>
    <div class="menu-container">
        <h2>Host a Game</h2>
        <form @submit.prevent="handleHostGame" class="form-group">
            <input v-model="playerName" type="text" placeholder="Player Name" />
            <input v-model="roomName" type="text" placeholder="Room Name" required />
            <input v-model="password" type="password" placeholder="Password (optional)" />
            <button type="submit">Create Game</button>
            <button type="button" class="back-button" @click="$emit('back')">Back</button>
            <p>{{ msg }}</p>
        </form>
    </div>
</template>

<style scoped>
    .menu-container {
        font-family: 'Press Start 2P', cursive;
        text-align: center;
        background-color: white;
        padding: 2rem 3rem;
        border-radius: 10px;
        box-shadow: 0 10px 25px rgba(0,0,0,0.1);
    }
    .form-group {
        display: flex;
        flex-direction: column;
        gap: 1rem;
        margin-top: 2rem;
    }
    input {
        font-family: 'Press Start 2P', cursive;
        padding: 0.8rem;
        font-size: 1rem;
        border: 1px solid #ccc;
        border-radius: 5px;
    }
    button {
        font-family: 'Press Start 2P', cursive;
        padding: 1rem;
        font-size: 1rem;
        border: none;
        border-radius: 5px;
        cursor: pointer;
        background-color: #42b983;
        color: white;
    }
    .back-button {
        background-color: #777;
    }

    
</style>
