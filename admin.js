// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, set, onValue, get } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";
import { getFirestore, collection, doc, setDoc, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyDlhOu0RANZMd4LViEgKEXA4MDy4OQnMkw",
    authDomain: "studio-6675617369-e0d3f.firebaseapp.com",
    databaseURL: "https://studio-6675617369-e0d3f-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "studio-6675617369-e0d3f",
    storageBucket: "studio-6675617369-e0d3f.firebasestorage.app",
    messagingSenderId: "194010478063",
    appId: "1:194010478063:web:bdb62eeb929ae48b74321a"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
console.log('Firebase initialized successfully');
console.log('Database URL:', firebaseConfig.databaseURL);

// Initialize Firebase Realtime Database
const realtimeDB = getDatabase(app);
const realtimeGameRef = ref(realtimeDB, 'currentGame');
console.log('Realtime Database reference created for path: /currentGame');

// Initialize Firestore
const db = getFirestore(app);
const gameRef = doc(db, 'games', 'currentGame');

// --- LIVE REALTIME DATABASE SYNC HELPERS ---
let isLocalRealtimeSync = false; // prevents echo loops

function subscribeToRealtimeGame() {
    console.log('Connecting to Firebase Realtime Database at /currentGame...');
    
    onValue(realtimeGameRef, (snapshot) => {
        console.log('Received update from Firebase Realtime Database');
        
        if (!snapshot.exists()) {
            console.log('No game data found in database');
            return;
        }
        
        if (isLocalRealtimeSync) {
            console.log('Ignoring local sync update');
            return; // ignore updates caused by our own writes
        }

        const remoteState = snapshot.val();
        if (!remoteState) {
            console.log('Remote state is empty');
            return;
        }

        console.log('Updating game state from database:', remoteState);
        gameState = remoteState;

        // Volleyball-only: no timer handling

        // Ensure game panel visibility reflects state
        if (gameState.isActive) {
            document.getElementById('game-panel').classList.remove('hidden');
        } else {
            document.getElementById('game-panel').classList.add('hidden');
        }

        updateGameDisplay();
    }, (error) => {
        console.error('Error connecting to Firebase Realtime Database:', error);
        alert('Error connecting to database. Please check your connection and try again.');
    });
    
    // Check connection status
    const connectedRef = ref(realtimeDB, '.info/connected');
    onValue(connectedRef, (snapshot) => {
        if (snapshot.val() === true) {
            console.log('✓ Connected to Firebase Realtime Database');
        } else {
            console.log('✗ Disconnected from Firebase Realtime Database');
        }
    });
}

// --- Game State Management ---
let gameState = {
    isActive: false,
    sport: 'volleyball',
    teams: {
        team1: { id: '', score: 0 },
        team2: { id: '', score: 0 }
    },
    setNumber: 1,
    maxSets: 3,
    stats: {
        team1: {},
        team2: {}
    },
    players: {
        team1: {},
        team2: {}
    }
};

// --- Firebase Synchronization ---
function syncToFirebase() {
    isLocalRealtimeSync = true;
    Promise.all([
        setDoc(gameRef, gameState),
        set(realtimeGameRef, gameState)
    ])
    .then(() => {
        console.log('✓ Synced to Firestore and Realtime DB at /currentGame');
        console.log('Game state:', gameState);
    })
    .catch(error => {
        console.error('✗ Firebase sync error:', error);
        alert('Error syncing to database: ' + error.message);
    })
    .finally(() => { 
        isLocalRealtimeSync = false; 
    });
}

// --- UI Initialization and Update Functions ---

function startGame() {
    const team1Identifier = document.getElementById('team1-identifier').value;
    const team2Identifier = document.getElementById('team2-identifier').value;

    if (!team1Identifier || !team2Identifier) {
        alert('Please select both teams to start the match.');
        return;
    }

    if (team1Identifier === team2Identifier) {
        alert('Teams cannot be the same. Please select two different teams.');
        return;
    }

    gameState.teams.team1 = { id: team1Identifier, score: 0 };
    gameState.teams.team2 = { id: team2Identifier, score: 0 };
    gameState.sport = 'volleyball';
    gameState.isActive = true;
    gameState.setNumber = 1;
    gameState.maxSets = 3;

    // Initialize players from setup textareas
    const t1PlayersRaw = document.getElementById('team1-players').value || '';
    const t2PlayersRaw = document.getElementById('team2-players').value || '';
    gameState.players.team1 = {};
    gameState.players.team2 = {};
    t1PlayersRaw.split(',').map(p => p.trim()).filter(Boolean).forEach(name => {
        gameState.players.team1[name] = { serves: 0, aces: 0, blocks: 0, spikes: 0, points: 0 };
    });
    t2PlayersRaw.split(',').map(p => p.trim()).filter(Boolean).forEach(name => {
        gameState.players.team2[name] = { serves: 0, aces: 0, blocks: 0, spikes: 0, points: 0 };
    });

    initializeStats();
    updateGameDisplay();
    createScoringButtons();
    document.getElementById('game-panel').classList.remove('hidden');
    populatePlayerSelects();
    syncToFirebase();
}

function initializeStats() {
    // Volleyball-only stats
    gameState.stats.team1 = { serves: 0, aces: 0, blocks: 0, spikes: 0 };
    gameState.stats.team2 = { serves: 0, aces: 0, blocks: 0, spikes: 0 };
}

function updateGameDisplay() {
    const team1Label = gameState.teams.team1.id;
    const team2Label = gameState.teams.team2.id;

    document.getElementById('display-team1').textContent = team1Label;
    document.getElementById('display-team2').textContent = team2Label;
    document.getElementById('score1').textContent = gameState.teams.team1.score;
    document.getElementById('score2').textContent = gameState.teams.team2.score;
    document.getElementById('team1-control-title').textContent = team1Label;
    document.getElementById('team2-control-title').textContent = team2Label;

    document.getElementById('period-display').textContent = `Set ${gameState.setNumber} of ${gameState.maxSets}`;

    updateStatsDisplay();
    populatePlayerSelects();
}

function createScoringButtons() {
    const team1Buttons = document.getElementById('team1-buttons');
    const team2Buttons = document.getElementById('team2-buttons');

    team1Buttons.innerHTML = '';
    team2Buttons.innerHTML = '';

    // Helper to create a button with specific class for plus/minus
    function createScoreButton(text, team, points, isPlus = true) {
        const button = document.createElement('button');
        button.textContent = text;
        button.className = `score-btn ${isPlus ? 'score-btn-plus' : 'score-btn-minus'}`;
        button.addEventListener('click', () => { // Changed to addEventListener
            const selectedPlayer = getSelectedPlayer(team);
            addScore(team, points, selectedPlayer);
        });
        return button;
    }

    // Volleyball-only buttons
    const getSelectedPlayer = (team) => {
        const select = document.getElementById(`${team}-player-select`);
        return select && select.value ? select.value : null;
    };

    // Team 1 buttons
    team1Buttons.appendChild(createScoreButton('+1 Pt', 'team1', 1));
    team1Buttons.appendChild(createScoreButton('-1 Pt', 'team1', -1, false));
    const t1Serve = document.createElement('button'); t1Serve.textContent = 'Serve'; t1Serve.className = 'score-btn score-btn-stat'; t1Serve.addEventListener('click', () => { const p = getSelectedPlayer('team1'); if (p) addPlayerStat('team1', p, 'serve'); else alert('Select a player first'); });
    const t1Ace = document.createElement('button'); t1Ace.textContent = 'Service Ace'; t1Ace.className = 'score-btn score-btn-stat'; t1Ace.addEventListener('click', () => { const p = getSelectedPlayer('team1'); if (p) addPlayerStat('team1', p, 'ace'); else alert('Select a player first'); });
    const t1Block = document.createElement('button'); t1Block.textContent = 'Block'; t1Block.className = 'score-btn score-btn-stat'; t1Block.addEventListener('click', () => { const p = getSelectedPlayer('team1'); if (p) addPlayerStat('team1', p, 'block'); else alert('Select a player first'); });
    const t1Spike = document.createElement('button'); t1Spike.textContent = 'Spike'; t1Spike.className = 'score-btn score-btn-stat'; t1Spike.addEventListener('click', () => { const p = getSelectedPlayer('team1'); if (p) addPlayerStat('team1', p, 'spike'); else alert('Select a player first'); });
    team1Buttons.appendChild(t1Serve);
    team1Buttons.appendChild(t1Ace);
    team1Buttons.appendChild(t1Block);
    team1Buttons.appendChild(t1Spike);

    // Team 2 buttons
    team2Buttons.appendChild(createScoreButton('+1 Pt', 'team2', 1));
    team2Buttons.appendChild(createScoreButton('-1 Pt', 'team2', -1, false));
    const t2Serve = document.createElement('button'); t2Serve.textContent = 'Serve'; t2Serve.className = 'score-btn score-btn-stat'; t2Serve.addEventListener('click', () => { const p = getSelectedPlayer('team2'); if (p) addPlayerStat('team2', p, 'serve'); else alert('Select a player first'); });
    const t2Ace = document.createElement('button'); t2Ace.textContent = 'Service Ace'; t2Ace.className = 'score-btn score-btn-stat'; t2Ace.addEventListener('click', () => { const p = getSelectedPlayer('team2'); if (p) addPlayerStat('team2', p, 'ace'); else alert('Select a player first'); });
    const t2Block = document.createElement('button'); t2Block.textContent = 'Block'; t2Block.className = 'score-btn score-btn-stat'; t2Block.addEventListener('click', () => { const p = getSelectedPlayer('team2'); if (p) addPlayerStat('team2', p, 'block'); else alert('Select a player first'); });
    const t2Spike = document.createElement('button'); t2Spike.textContent = 'Spike'; t2Spike.className = 'score-btn score-btn-stat'; t2Spike.addEventListener('click', () => { const p = getSelectedPlayer('team2'); if (p) addPlayerStat('team2', p, 'spike'); else alert('Select a player first'); });
    team2Buttons.appendChild(t2Serve);
    team2Buttons.appendChild(t2Ace);
    team2Buttons.appendChild(t2Block);
    team2Buttons.appendChild(t2Spike);
}

// Adds or subtracts a specified number of points to a team's score
function addScore(team, points, playerName = null) {
    // Prevent score from going below zero if subtracting
    if (points < 0 && gameState.teams[team].score + points < 0) {
        gameState.teams[team].score = 0;
    } else {
        gameState.teams[team].score += points;
        
        // Track points for the selected player if provided and points are positive
        if (playerName && points > 0 && gameState.players[team] && gameState.players[team][playerName]) {
            gameState.players[team][playerName].points = (gameState.players[team][playerName].points || 0) + points;
        }
    }
    updateGameDisplay();
    syncToFirebase();
}

// Player + team stats
function addPlayerStat(team, playerName, stat) {
    if (!gameState.players[team] || !gameState.players[team][playerName]) return;
    const p = gameState.players[team][playerName];
    if (stat === 'serve') {
        p.serves++;
        gameState.stats[team].serves++;
    } else if (stat === 'ace') {
        p.aces++;
        gameState.stats[team].aces++;
        // Ace gives a point - track it for the player
        addScore(team, 1, playerName);
    } else if (stat === 'block') {
        p.blocks++;
        gameState.stats[team].blocks++;
    } else if (stat === 'spike') {
        p.spikes++;
        gameState.stats[team].spikes++;
    }
    updateStatsDisplay();
    syncToFirebase();
}

function populatePlayerSelects() {
    const t1Select = document.getElementById('team1-player-select');
    const t2Select = document.getElementById('team2-player-select');
    if (t1Select) {
        t1Select.innerHTML = '';
        Object.keys(gameState.players.team1 || {}).forEach(name => {
            const opt = document.createElement('option');
            opt.value = name; opt.textContent = name; t1Select.appendChild(opt);
        });
    }
    if (t2Select) {
        t2Select.innerHTML = '';
        Object.keys(gameState.players.team2 || {}).forEach(name => {
            const opt = document.createElement('option');
            opt.value = name; opt.textContent = name; t2Select.appendChild(opt);
        });
    }
}

function updateStatsDisplay() {
    const playerStatsDisplay = document.getElementById('player-stats-display');
    if (!playerStatsDisplay) return;

    const team1Label = gameState.teams.team1.id;
    const team2Label = gameState.teams.team2.id;

    let statsHtml = '';

    if (gameState.players.team1 && Object.keys(gameState.players.team1).length > 0) {
        statsHtml += '<h4>' + team1Label + ' Player Statistics</h4>';
        statsHtml += '<table class="player-stats-table">';
        statsHtml += '<thead><tr><th>Player</th><th>Serves</th><th>Aces</th><th>Blocks</th><th>Spikes</th><th>Points</th></tr></thead>';
        statsHtml += '<tbody>';
        
        Object.keys(gameState.players.team1).forEach(function(playerName) {
            const player = gameState.players.team1[playerName];
            statsHtml += '<tr>';
            statsHtml += '<td class="player-name">' + playerName + '</td>';
            statsHtml += '<td class="player-stat-value">' + (player.serves || 0) + '</td>';
            statsHtml += '<td class="player-stat-value">' + (player.aces || 0) + '</td>';
            statsHtml += '<td class="player-stat-value">' + (player.blocks || 0) + '</td>';
            statsHtml += '<td class="player-stat-value">' + (player.spikes || 0) + '</td>';
            statsHtml += '<td class="player-stat-value">' + (player.points || 0) + '</td>';
            statsHtml += '</tr>';
        });
        
        statsHtml += '</tbody></table>';
    }

    if (gameState.players.team2 && Object.keys(gameState.players.team2).length > 0) {
        statsHtml += '<h4>' + team2Label + ' Player Statistics</h4>';
        statsHtml += '<table class="player-stats-table">';
        statsHtml += '<thead><tr><th>Player</th><th>Serves</th><th>Aces</th><th>Blocks</th><th>Spikes</th><th>Points</th></tr></thead>';
        statsHtml += '<tbody>';
        
        Object.keys(gameState.players.team2).forEach(function(playerName) {
            const player = gameState.players.team2[playerName];
            statsHtml += '<tr>';
            statsHtml += '<td class="player-name">' + playerName + '</td>';
            statsHtml += '<td class="player-stat-value">' + (player.serves || 0) + '</td>';
            statsHtml += '<td class="player-stat-value">' + (player.aces || 0) + '</td>';
            statsHtml += '<td class="player-stat-value">' + (player.blocks || 0) + '</td>';
            statsHtml += '<td class="player-stat-value">' + (player.spikes || 0) + '</td>';
            statsHtml += '<td class="player-stat-value">' + (player.points || 0) + '</td>';
            statsHtml += '</tr>';
        });
        
        statsHtml += '</tbody></table>';
    }

    if (statsHtml === '') {
        statsHtml = '<p>No player statistics available. Start a match and record stats to see player data here.</p>';
    }

    playerStatsDisplay.innerHTML = statsHtml;
}

function downloadStatsToCSV() {
    if (!gameState.isActive) {
        alert('No active game to download.');
        return;
    }

    // Helper function to escape CSV values
    function escapeCSV(value) {
        if (value === null || value === undefined) return '';
        const stringValue = String(value);
        // If value contains comma, quote, or newline, wrap in quotes and escape quotes
        if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
            return '"' + stringValue.replace(/"/g, '""') + '"';
        }
        return stringValue;
    }

    const team1Label = gameState.teams.team1.id;
    const team2Label = gameState.teams.team2.id;

    // Start building CSV with Team 1 section
    let csv = '';

    // Team 1 players - separate table
    if (gameState.players.team1 && Object.keys(gameState.players.team1).length > 0) {
        csv += `${escapeCSV(team1Label)} Player Statistics\n`;
        csv += 'Player,Serves,Aces,Blocks,Spikes,Points\n';
        
        Object.keys(gameState.players.team1).forEach(function(playerName) {
            const player = gameState.players.team1[playerName];
            csv += `${escapeCSV(playerName)},${player.serves || 0},${player.aces || 0},${player.blocks || 0},${player.spikes || 0},${player.points || 0}\n`;
        });
        
        csv += '\n'; // Empty line between teams
    }

    // Team 2 players - separate table
    if (gameState.players.team2 && Object.keys(gameState.players.team2).length > 0) {
        csv += `${escapeCSV(team2Label)} Player Statistics\n`;
        csv += 'Player,Serves,Aces,Blocks,Spikes,Points\n';
        
        Object.keys(gameState.players.team2).forEach(function(playerName) {
            const player = gameState.players.team2[playerName];
            csv += `${escapeCSV(playerName)},${player.serves || 0},${player.aces || 0},${player.blocks || 0},${player.spikes || 0},${player.points || 0}\n`;
        });
    }

    // Create blob and download
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `game_stats_${team1Label}_vs_${team2Label}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// --- Set Management ---
function nextSet() {
    if (gameState.setNumber < gameState.maxSets) {
        gameState.setNumber++;
        updateGameDisplay();
        syncToFirebase();
    } else {
        alert('Match is complete! No more sets.');
        endGame();
    }
}

function endGame() {
    if (confirm('Are you sure you want to end this match?')) {
        gameState.isActive = false;
        document.getElementById('game-panel').classList.add('hidden');

        const finalGameState = { ...gameState, endTime: serverTimestamp() };
        addDoc(collection(db, 'gameHistory'), finalGameState)
            .then(() => console.log('Final game state saved to history.'))
            .catch(error => console.error('Error saving game history:', error));

        gameState.teams.team1.score = 0;
        gameState.teams.team2.score = 0;
        gameState.setNumber = 1;
        initializeStats();
        gameState.players = { team1: {}, team2: {} };
        updateGameDisplay();
        syncToFirebase();

        alert('Match ended successfully! Results saved to history.');
    }
}

// --- Initialization on page load ---
document.addEventListener('DOMContentLoaded', function() {
    console.log('Page loaded, initializing Firebase connection...');
    subscribeToRealtimeGame();
    console.log('Firebase Realtime Database subscription active. Listening to /currentGame');

    // Attach event listeners to buttons
    document.getElementById('start-match-btn').addEventListener('click', startGame);
    document.getElementById('next-set-btn').addEventListener('click', nextSet);
    document.
}