<script>
export default {
  name: 'GameLeaderboard',

props: {
    scores: { 
        type: Array,
        required: true
        },
    isActive: {
        type: Boolean,
        required: true
    }
    }
}
</script>


<template>
  <div class="leaderboard-containter">
    <h2>Leaderboard</h2>
    <ol class ="leaderboard-list">
        <!-- loop through the 'scores' array and display each item  -->
        <li v-for="(player, index) in scores" :key="player.id" :class="{ 'top-player': index === 0 && !isActive }">

            <span class="rank">{{ index + 1 }}</span>        

            <span class = "name">
            <span class="color-swatch" :style="{ backgroundColor: player.color }"></span>
            {{ player.playerName }} 
            </span>

            <span class="name">{{ player.score -1 }}</span>
        </li>
    </ol>
  </div>
</template>
  
<style scoped>
    @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');

    .leaderboard-container {
        font-family: 'Press Start 2P', cursive;
        background-color: #ffffff;
        padding: 1.5rem;
        border-radius: 10px;
        box-shadow: 0 10px 25px rgba(0,0,0,0.1);
        width: 300px;
    }

    h2 {
        font-family: 'Press Start 2P', cursive;
        text-align: center;
        margin-top: 0;
        margin-bottom: 1.5rem;
        color: #333;
    }

    .leaderboard-list {
        list-style: none;
        padding: 0;
        margin: 0;
    }

    li {
        position: relative;
        font-family: 'Press Start 2P', cursive;
        display: flex;
        align-items: center;
        padding: 0.75rem 0;
        border-bottom: 1px solid #eee;
    }

    li:last-child {
        border-bottom: none;
    }

    .rank {
        font-weight: 600;
        color: #434b44;
        min-width: 30px;
    }

    .name {
        font-size: 20px;
        display: flex;
        align-items: center;
        font-weight: 600;
        color: #444;
        left: 10px;
        flex-grow: 1;
    }

    .color-swatch {
        width: 20px;
        height: 20px;
        border-radius: 50%;
        margin-right: 15px; 
        border: 1px solid #ccc;
        display: inline-block;
        vertical-align: middle; 
        }
        
    .score {
        font-weight: 600;
        margin-left: 10px;
    }

    .top-player {
    background-color: #c4ebcd; 
    border-radius: 5px;
    padding-left: 5px; 
    padding-right: 5px; 
    }

    .top-player .rank {
    color: #434b44;
    }

    .top-player .name {
    color: #222;
    }

</style>