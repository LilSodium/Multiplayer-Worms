// src/store.js
import { reactive } from 'vue';

export const store = reactive({
  playerToken: localStorage.getItem('playerToken') || null
});
