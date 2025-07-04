<script>
export default {
    name: 'GameLobby',
    emits: ['start', 'back'],
    // --- Receive socket and settings from App.vue ---
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
            players: [],
            roomInfo: {},
            color: '' 
        };
    },
    computed: {
        // --- Check if the current player is the host ---
        isHost() {
            // The host is the player whose socket ID matches the hostId from the server
            return this.store.playerToken === this.roomInfo.hostId;
        }
    },
    mounted() {
        // Listen for lobby updates from the server
        this.socket.on('lobbyUpdate', (data) => {
            this.players = data.players;
            this.roomInfo = data;
        });

        this.socket.on('start', () => {
          this.$emit('start', this.roomInfo);
        });

        // When this component is first shown, we set its initial state
        // from the data passed by the parent
        this.roomInfo = this.settings;
        this.players = this.settings.players;
    },
    beforeUnmount() {
        // ---  Clean up listeners ---
        this.socket.off('lobbyUpdate');
    },
    methods: {
      handleBack() {
        this.socket.emit('leaveRoom', {id: this.roomInfo.id});
        this.$emit('back');
      },
      handleStart() {
        this.socket.emit('startGame', this.roomInfo)
      },
      handleColorChange(newColor) {
      console.log('Color picker event fired! New color object:', newColor);
      this.socket.emit('playerChangeColor', newColor.hex);
    },
      
      
      
      
    }
}
</script>

<template>
  <div class="menu-container">
    <h1>Lobby: {{ settings.roomName }}</h1>
    
    <ol class="player-list">
      <li v-for="player in players" :key="player.playerId">
      {{ player.playerName }} 

        <span v-if="player.playerId === roomInfo.hostId" class="host-tag">(Host)</span>
      </li>
    </ol>

    <div class="button-group">
      <button type="button" @click="handleBack">Back</button>
      <button v-if="isHost" type="button" @click="handleStart"> Start Game </button>
    </div>
  </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');
.menu-container {
    font-family: 'Press Start 2P', cursive;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    height: 500px;
    width: 600px;
    text-align: center;
    background-color: white;
    padding: 2rem;
    border-radius: 10px;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
}
.player-list {
    font-family: 'Press Start 2P', cursive;
    text-align: left;
    font-size: 1.2rem;
    list-style-position: inside;
}
.host-tag {
    font-weight: bold;
    color: #42b983;
}
button {
  font-family: 'Press Start 2P', cursive;
  padding: 1rem 2rem;
  font-size: 1rem;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  background-color: #42b983;
  color: white;
}
.button-group {
  margin-top: auto;
  display: flex;
  justify-content: center;
  gap: 20px;
}


</style>
