<script>
import MainMenu from './components/MainMenu.vue';
import HostGame from './components/HostGame.vue';
import JoinGame from './components/JoinGame.vue';
import BlockGame from './components/BlockGame.vue';
import GameLobby from './components/GameLobby.vue';
import io from "socket.io-client";
import { store } from '@/store'
export default {
  name: 'App',
  components: {
    MainMenu,
    HostGame,
    JoinGame,
    BlockGame,
    GameLobby
  },

  data() {
    return {
      // The initial view when the app loads is 'main-menu'
      socket: null, // our single socket connection, to be shared between components
      currentView: 'main-menu', 
      lobbyInfo: {}, // To store room/password info later
      store: store
    };
  },

  created(){
    // Render URL: https://multiplayer-worms.onrender.com
    // Create the socket connection once when the app starts
    this.socket = io("https://multiplayer-worms.onrender.com");

  
    this.socket.on('setToken', id => {
      store.playerToken = id;
      localStorage.setItem('playerToken', id);
    });

    this.socket.on('invalidToken', () => {
    console.error("Server rejected our token. It was invalid or expired.");
    
    // Clear the bad token from storage and the store
    localStorage.removeItem('playerToken');
    store.playerToken = null;
    });

  },
  
  methods: {
    // These methods will be triggered by events from child components
    showHostMenu() {
      this.currentView = 'host-game';
    },
    showJoinMenu() {
      this.currentView = 'join-game';
    },
    // This will be called when a user finalizes hosting or joining
    startGame(settings) {
      console.log('Starting game with settings:', settings);
      this.lobbyInfo = settings;
      this.currentView = 'in-game';
    },
    // This will return the user to the main menu
    returnToMenu() {
        this.currentView = 'main-menu';
    },
    enterLobby(data) {
      this.lobbyInfo = data;
      this.currentView = 'game-lobby';
    }
  }
}
</script>

<template>
  <div id="app">
    <!-- --- Conditionally render the component based on currentView --- -->
    <MainMenu 
      v-if="currentView === 'main-menu'"
      :socket="socket"
      @host="showHostMenu" 
      @join="showJoinMenu"
    />

    <HostGame 
      v-else-if="currentView === 'host-game'" 
      :socket="socket"
      @joinedLobby="enterLobby"
      @back="returnToMenu"
    />

    <JoinGame 
      v-else-if="currentView === 'join-game'"
      :socket="socket"
      @joinedLobby="enterLobby"
      @back="returnToMenu"
    />


    <BlockGame 
      v-else-if="currentView === 'in-game'"
      :socket="socket"
      :settings="lobbyInfo"
      :store="store"
      @back="returnToMenu"
    />

    <GameLobby
      v-else-if="currentView === 'game-lobby'"
      :store="store"
      :socket="socket"
      :settings="lobbyInfo"
      @start="startGame"
      @back="returnToMenu"
    />
  </div>
</template>

<style>
  /* Global styles for the entire app */
  body {
    margin: 0;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 100vh;
    background-color: #e0e0e0;
  }
  #app {
    color: #2c3e50;
  }
  
</style>
