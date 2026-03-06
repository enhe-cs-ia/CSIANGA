import { initializeApp } from "https://www.gstatic.com/firebasejs/12.8.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.8.0/firebase-analytics.js";
import { getDatabase, ref, set, onValue, get } from "https://www.gstatic.com/firebasejs/12.8.0/firebase-database.js";
import { getFirestore, collection, doc, setDoc, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/12.8.0/firebase-firestore.js";
const firebaseConfig = {
  apiKey: "AIzaSyDlhOu0RANZMd4LViEgKEXA4MDy4OQnMkw",
  authDomain: "studio-6675617369-e0d3f.firebaseapp.com",
  databaseURL: "https://studio-6675617369-e0d3f-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "studio-6675617369-e0d3f",
  storageBucket: "studio-6675617369-e0d3f.firebasestorage.app",
  messagingSenderId: "194010478063",
  appId: "1:194010478063:web:bdb62eeb929ae48b74321a"
};
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
console.log('Firebase initialized successfully');
console.log('Database URL:', firebaseConfig.databaseURL);

const realtimeDB = getDatabase(app);
const realtimeGameRef = ref(realtimeDB, 'currentGame');
const realtimePreviousGameRef = ref(realtimeDB, 'previousGame');
console.log('Realtime Database reference created for path: /currentGame');
console.log('Full database path: https://iacs-95ea7-default-rtdb.asia-southeast1.firebasedatabase.app/currentGame');
const db = getFirestore(app);
const gameRef = doc(db, 'games', 'currentGame');

let isLocalRealtimeSync = false;
function subscribeToRealtimeGame() {
    console.log('Connecting to Firebase Realtime Database... Please WAIT BRO');
    console.log('Database URL: https://iacs-95ea7-default-rtdb.asia-southeast1.firebasedatabase.app/');
    console.log('Listening to path with ma EARS: /currentGame');
 
    const connectedRef = ref(realtimeDB, '.info/connected');
    onValue(connectedRef, (snapshot) => {
        if (snapshot.val() === true) {
            console.log('✓ Connected to Firebase Realtime Database!!! yippee');
        } else {
            console.log('✗ Disconnected from Firebase Realtime Database!!! oh no');
        }
    });
onValue(realtimeGameRef, (snapshot) => {
        console.log('Received update from Firebase Realtime Database!!! yippee');
     
        if (!snapshot.exists()) {
            console.log('No game data found in database');
            return;
        }
        if (isLocalRealtimeSync) {
            console.log('Ignoring local sync update');
            return; }
        const remoteState = snapshot.val();
        if (!remoteState) {
            console.log('EMPTY REMOTE STATE BRO');
            return; }
        console.log('Updating game state from database:', remoteState);
        gameState = JSON.parse(JSON.stringify(remoteState));
        if (!gameState.teams) {
            gameState.teams = {
                team1: { id: '', score: 0, setsWon: 0 },
                team2: { id: '', score: 0, setsWon: 0 }
            }; }
        if (!gameState.stats) {
            gameState.stats = {
                team1: { serves: 0, aces: 0, blocks: 0, spikes: 0 },
                team2: { serves: 0, aces: 0, blocks: 0, spikes: 0 }
            }; }
        if (!gameState.players) { gameState.players = { team1: {}, team2: {} }; }
        if (!gameState.setHistory) {gameState.setHistory = []; }
        if (gameState.isActive === undefined) {gameState.isActive = false;  }
        if (!gameState.sport) {gameState.sport = 'volleyball'; }
        if (!gameState.setNumber) {gameState.setNumber = 1; }
        if (!gameState.maxSets) {gameState.maxSets = 3; }
        const gamePanel = document.getElementById('game-panel');
        if (gameState.isActive) {
            if (gamePanel) gamePanel.classList.remove('hidden');
            setTimeout(() => {
                createScoringButtons();
                populatePlayerSelects();
            }, 50);
        } else {
            if (gamePanel) gamePanel.classList.add('hidden');
        }

updateGameDisplay();
        console.log('✓ UI updated with latest game state from database');
    }, (error) => {
        console.error('Error connecting to Firebase Realtime Database:', error);
        console.error('Error details:', error.message);
        alert('Error connecting to database. Please check your connection and try again.');
    });
}
let gameState = {
    isActive: false,
    sport: 'volleyball',
    teams: {
        team1: { id: '', score: 0, setsWon: 0 },
        team2: { id: '', score: 0, setsWon: 0 }
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
    },
    setHistory: []
};
function syncToFirebase() {
    const stateToSync = {
        isActive: gameState.isActive || false,
        sport: gameState.sport || 'volleyball',
        teams: {
            team1: {
                id: gameState.teams?.team1?.id || '',
                score: gameState.teams?.team1?.score || 0,
                setsWon: gameState.teams?.team1?.setsWon || 0
            },
            team2: {
                id: gameState.teams?.team2?.id || '',
                score: gameState.teams?.team2?.score || 0,
                setsWon: gameState.teams?.team2?.setsWon || 0
            }
        },
        setNumber: gameState.setNumber || 1,
        maxSets: gameState.maxSets || 3,
        stats: {
            team1: gameState.stats?.team1 || { serves: 0, aces: 0, blocks: 0, spikes: 0 },
            team2: gameState.stats?.team2 || { serves: 0, aces: 0, blocks: 0, spikes: 0 }
        },
        players: {
            team1: gameState.players?.team1 || {},
            team2: gameState.players?.team2 || {}
        },
        setHistory: gameState.setHistory || [],
        playerNames: gameState.playerNames || { team1: [], team2: [] }
    };

    isLocalRealtimeSync = true;
    set(realtimeGameRef, stateToSync)
    .then(() => {
        console.log('✓ Synced to Firebase Realtime Database at /currentGame');
        console.log('Synced state:', stateToSync);
      
        setDoc(gameRef, stateToSync).catch(err => {
            console.warn('Firestore sync warning:', err);
        });
    })
    .catch(error => {
        console.error('✗Error in Firebase Sync bro:', error);
        alert('Error syncing to database. Changes may not be saved.');
    })
    .finally(() => {
        setTimeout(() => {
            isLocalRealtimeSync = false;
        }, 100);
    });
}

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

    gameState.teams.team1 = { id: team1Identifier, score: 0, setsWon: 0 };
    gameState.teams.team2 = { id: team2Identifier, score: 0, setsWon: 0 };
    gameState.sport = 'volleyball';
    gameState.isActive = true;
    gameState.setNumber = 1;
    gameState.maxSets = 3;
    gameState.setHistory = [];

    const t1PlayersRaw = document.getElementById('team1-players').value || '';
    const t2PlayersRaw = document.getElementById('team2-players').value || '';
    gameState.playerNames = {
        team1: t1PlayersRaw.split(',').map(p => p.trim()).filter(Boolean),
        team2: t2PlayersRaw.split(',').map(p => p.trim()).filter(Boolean)
    };
 
    gameState.players.team1 = {};
    gameState.players.team2 = {};
    gameState.playerNames.team1.forEach(name => {
        gameState.players.team1[name] = { serves: 0, aces: 0, blocks: 0, spikes: 0, points: 0 };
    });
    gameState.playerNames.team2.forEach(name => {
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
    gameState.stats.team1 = { serves: 0, aces: 0, blocks: 0, spikes: 0 };
    gameState.stats.team2 = { serves: 0, aces: 0, blocks: 0, spikes: 0 };
}

function updateGameDisplay() {

    if (!gameState.teams) {
        gameState.teams = {
            team1: { id: '', score: 0, setsWon: 0 },
            team2: { id: '', score: 0, setsWon: 0 }
        };
    }
    
    const team1Label = gameState.teams.team1?.id || '';
    const team2Label = gameState.teams.team2?.id || '';
    const team1Score = gameState.teams.team1?.score || 0;
    const team2Score = gameState.teams.team2?.score || 0;
    const team1SetsWon = gameState.teams.team1?.setsWon || 0;
    const team2SetsWon = gameState.teams.team2?.setsWon || 0;
    const setNumber = gameState.setNumber || 1;

    const displayTeam1 = document.getElementById('display-team1');
    const displayTeam2 = document.getElementById('display-team2');
    const score1 = document.getElementById('score1');
    const score2 = document.getElementById('score2');
    const team1ControlTitle = document.getElementById('team1-control-title');
    const team2ControlTitle = document.getElementById('team2-control-title');
    const periodDisplay = document.getElementById('period-display');

    if (displayTeam1) displayTeam1.textContent = team1Label;
    if (displayTeam2) displayTeam2.textContent = team2Label;
    if (score1) score1.textContent = team1Score;
    if (score2) score2.textContent = team2Score;
    if (team1ControlTitle) team1ControlTitle.textContent = team1Label;
    if (team2ControlTitle) team2ControlTitle.textContent = team2Label;
    if (periodDisplay) {
        periodDisplay.textContent = `Set ${setNumber} | Sets: ${team1SetsWon} - ${team2SetsWon}`;
    }

    updateStatsDisplay();
    populatePlayerSelects();
}

function createScoringButtons() {
    const team1Buttons = document.getElementById('team1-buttons');
    const team2Buttons = document.getElementById('team2-buttons');
    team1Buttons.innerHTML = '';
    team2Buttons.innerHTML = '';
    function createScoreButton(text, team, points, isPlus = true) {
        const button = document.createElement('button');
        button.textContent = text;
        button.className = `score-btn ${isPlus ? 'score-btn-plus' : 'score-btn-minus'}`;
        button.onclick = () => {
            const selectedPlayer = getSelectedPlayer(team);
            addScore(team, points, selectedPlayer); }; 
        return button; }

function createStatButtonGroup(label, team, statType) {
    const container = document.createElement('div');
        container.style.display = 'flex';
        container.style.alignItems = 'center';
        container.style.gap = '5px';
        container.style.marginBottom = '5px';
    const labelSpan = document.createElement('span');
        labelSpan.textContent = label + ':';
        labelSpan.style.fontWeight = 'bold';
        labelSpan.style.minWidth = '100px';
        labelSpan.setAttribute('name', statType);
    const minusBtn = document.createElement('button');
        minusBtn.textContent = '-';
        minusBtn.className = 'score-btn score-btn-minus';
        minusBtn.style.padding = '5px 10px';
        minusBtn.onclick = () => {
    const p = getSelectedPlayer(team);
            if (p) addPlayerStat(team, p, statType, -1);};
    const plusBtn = document.createElement('button');
        plusBtn.textContent = '+';
        plusBtn.className = 'score-btn score-btn-plus';
        plusBtn.style.padding = '5px 10px';
        plusBtn.onclick = () => {
    const p = getSelectedPlayer(team);
            if (p) addPlayerStat(team, p, statType, 1);};
        container.appendChild(labelSpan);
        container.appendChild(minusBtn);
        container.appendChild(plusBtn);    
        return container;}
    const getSelectedPlayer = (team) => {
        const select = document.getElementById(`${team}-player-select`);
        return select && select.value ? select.value : null;};
    team1Buttons.appendChild(createScoreButton('+1 Pt', 'team1', 1));
    team1Buttons.appendChild(createScoreButton('-1 Pt', 'team1', -1, false));
    team1Buttons.appendChild(createStatButtonGroup('Serve', 'team1', 'serve'));
    team1Buttons.appendChild(createStatButtonGroup('Service Ace', 'team1', 'ace'));
    team1Buttons.appendChild(createStatButtonGroup('Block', 'team1', 'block'));
    team1Buttons.appendChild(createStatButtonGroup('Spike', 'team1', 'spike'));
        team2Buttons.appendChild(createScoreButton('+1 Pt', 'team2', 1));
        team2Buttons.appendChild(createScoreButton('-1 Pt', 'team2', -1, false));
        team2Buttons.appendChild(createStatButtonGroup('Serve', 'team2', 'serve'));
        team2Buttons.appendChild(createStatButtonGroup('Service Ace', 'team2', 'ace'));
        team2Buttons.appendChild(createStatButtonGroup('Block', 'team2', 'block'));
        team2Buttons.appendChild(createStatButtonGroup('Spike', 'team2', 'spike'));}

function addScore(team, points, playerName = null) {
    if (points < 0 && gameState.teams[team].score + points < 0) {
        gameState.teams[team].score = 0;} else {
        gameState.teams[team].score += points;
        if (playerName && gameState.players[team] && gameState.players[team][playerName]) {
            const currentPoints = gameState.players[team][playerName].points || 0;
            const newPoints = currentPoints + points;
            gameState.players[team][playerName].points = Math.max(0, newPoints);}     }
    updateGameDisplay();
    syncToFirebase();}
function addPlayerStat(team, playerName, stat, increment = 1) {
    if (!gameState.players[team] || !gameState.players[team][playerName]) return;
    const p = gameState.players[team][playerName];
    if (stat === 'serve') {
        p.serves = (p.serves || 0) + increment;
        if (p.serves < 0) p.serves = 0; gameState.stats[team].serves = (gameState.stats[team].serves || 0) + increment;
        if (gameState.stats[team].serves < 0) gameState.stats[team].serves = 0; } else if (stat === 'ace') { p.aces = (p.aces || 0) + increment;
        if (p.aces < 0) p.aces = 0; gameState.stats[team].aces = (gameState.stats[team].aces || 0) + increment;
        if (gameState.stats[team].aces < 0) gameState.stats[team].aces = 0;p.serves = (p.serves || 0) + increment;
        if (p.serves < 0) p.serves = 0; gameState.stats[team].serves = (gameState.stats[team].serves || 0) + increment;
        if (gameState.stats[team].serves < 0) gameState.stats[team].serves = 0;
        if (increment > 0) { addScore(team, increment, playerName); } else if (increment < 0) { addScore(team, increment, playerName); }}
            else if (stat === 'block') 
            { p.blocks = (p.blocks || 0) + increment;
        if (p.blocks < 0) p.blocks = 0;gameState.stats[team].blocks = (gameState.stats[team].blocks || 0) + increment;
        if (gameState.stats[team].blocks < 0) gameState.stats[team].blocks = 0;
    addScore(team, increment, playerName);
            } else if (stat === 'spike') {p.spikes = (p.spikes || 0) + increment;
        if (p.spikes < 0) p.spikes = 0;
        gameState.stats[team].spikes = (gameState.stats[team].spikes || 0) + increment;
        if (gameState.stats[team].spikes < 0) gameState.stats[team].spikes = 0;
        addScore(team, increment, playerName);}
    updateStatsDisplay();
    syncToFirebase();}

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

function renderPreviousGame(previousState) {
   const container = document.getElementById('previous-game-display');
   if (!container) return;

   if (!previousState) {
       container.innerHTML = '<p>No previous match saved yet.</p>';
       return;
   }

   const t1 = previousState?.teams?.team1?.id || 'Team 1';
   const t2 = previousState?.teams?.team2?.id || 'Team 2';
   const setsWon1 = previousState?.teams?.team1?.setsWon ?? 0;
   const setsWon2 = previousState?.teams?.team2?.setsWon ?? 0;
   const sets = Array.isArray(previousState?.setHistory) ? previousState.setHistory : [];

   let html = '';
   html += `<h4>Previous Match: ${t1} vs ${t2}</h4>`;
   html += `<p><strong>Final sets:</strong> ${setsWon1} - ${setsWon2}</p>`;

   if (sets.length > 0) {
       html += '<div style="display:flex; flex-direction:column; gap:6px;">';
       sets.forEach((s) => {
           const setNo = s.setNumber ?? '';
           const s1 = s.team1Score ?? 0;
           const s2 = s.team2Score ?? 0;
           html += `<div>Set ${setNo}: <strong>${t1}</strong> ${s1} - ${s2} <strong>${t2}</strong></div>`;
       });
       html += '</div>';
   } else {
       html += '<p>No set history saved for previous match.</p>';
   }

   container.innerHTML = html;
}

async function loadPreviousGameState() {
   try {
       const snapshot = await get(realtimePreviousGameRef);
       if (snapshot.exists()) {
            renderPreviousGame(snapshot.val());}
            else {renderPreviousGame(null);}}
            catch (err) {
       console.error('Error loading previous game:', err);}}
async function savePreviousGameSnapshot() {
   const snapshot = JSON.parse(JSON.stringify({
       ...gameState,
       savedAt: Date.now(),
       isActive: false
   }));
   await set(realtimePreviousGameRef, snapshot);
   renderPreviousGame(snapshot);}
function downloadStatsToCSV() {
    if (!gameState.isActive) {
        alert('No active game to download.');
        return;
    }
function escapeCSV(value) {
        if (value === null || value === undefined) return '';
        const stringValue = String(value);
        if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
        return '"' + stringValue.replace(/"/g, '""') + '"';}
        return stringValue;}
    const team1Label = gameState.teams.team1.id;
    const team2Label = gameState.teams.team2.id;
    let csv = '';
    if (gameState.players.team1 && Object.keys(gameState.players.team1).length > 0) {
        csv += `${escapeCSV(team1Label)} Player Statistics\n`;
        csv += 'Player,Serves,Aces,Blocks,Spikes,Points\n';
    
        Object.keys(gameState.players.team1).forEach(function(playerName) {
            const player = gameState.players.team1[playerName];
            csv += `${escapeCSV(playerName)},${player.serves || 0},${player.aces || 0},${player.blocks || 0},${player.spikes || 0},${player.points || 0}\n`;});
        csv += '\n';
    }
    if (gameState.players.team2 && Object.keys(gameState.players.team2).length > 0) {
        csv += `${escapeCSV(team2Label)} Player Statistics\n`;
        csv += 'Player,Serves,Aces,Blocks,Spikes,Points\n';
    
        Object.keys(gameState.players.team2).forEach(function(playerName) {
            const player = gameState.players.team2[playerName];
            csv += `${escapeCSV(playerName)},${player.serves || 0},${player.aces || 0},${player.blocks || 0},${player.spikes || 0},${player.points || 0}\n`;
        });
    }

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
function saveCurrentSetToHistory() {
    const setData = {
        setNumber: gameState.setNumber,
        team1Score: gameState.teams.team1.score,
        team2Score: gameState.teams.team2.score,
        winner: gameState.teams.team1.score > gameState.teams.team2.score ? 'team1' : 'team2',
        team1Players: JSON.parse(JSON.stringify(gameState.players.team1)),
        team2Players: JSON.parse(JSON.stringify(gameState.players.team2))};
    gameState.setHistory.push(setData);
    if (setData.winner === 'team1') {
        gameState.teams.team1.setsWon++;} else {
        gameState.teams.team2.setsWon++;}}
function resetPlayerStatsForNewSet() {
    if (gameState.playerNames) {
        gameState.playerNames.team1.forEach(name => {
            gameState.players.team1[name] = { serves: 0, aces: 0, blocks: 0, spikes: 0, points: 0 };
        });
        gameState.playerNames.team2.forEach(name => {
            gameState.players.team2[name] = { serves: 0, aces: 0, blocks: 0, spikes: 0, points: 0 };
        });
    }
    gameState.teams.team1.score = 0;
    gameState.teams.team2.score = 0;
    initializeStats();
}

function nextSet() {
    saveCurrentSetToHistory();
    if (gameState.teams.team1.setsWon >= 2) {
        alert(`${gameState.teams.team1.id} wins the match 2-${gameState.teams.team2.setsWon}!`);
        endGame();return;}
    if (gameState.teams.team2.setsWon >= 2) {
        alert(`${gameState.teams.team2.id} wins the match 2-${gameState.teams.team1.setsWon}!`);
        endGame();return;}
    if (gameState.setNumber < gameState.maxSets) { 
        gameState.setNumber++;
        resetPlayerStatsForNewSet();
        updateGameDisplay();
        syncToFirebase();
        alert(`Set ${gameState.setNumber} starting!`);}}
function generateMatchCSV() {
    function escapeCSV(value) {
        if (value === null || value === undefined) return '';
            const stringValue = String(value);
        if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
            return '"' + stringValue.replace(/"/g, '""') + '"';}
        return stringValue;}
        const team1Label = gameState.teams.team1.id;
        const team2Label = gameState.teams.team2.id;
    let csv = '';
        csv += `Match: ${team1Label} vs ${team2Label}\n`;
        csv += `Final Result: ${team1Label} ${gameState.teams.team1.setsWon} - ${gameState.teams.team2.setsWon} ${team2Label}\n`;
        csv += `Match Winner: ${gameState.teams.team1.setsWon > gameState.teams.team2.setsWon ? team1Label : team2Label}\n\n`;
    gameState.setHistory.forEach((setData, index) => {
            csv += `=== SET ${setData.setNumber} ===\n`;
            csv += `Score: ${team1Label} ${setData.team1Score} - ${setData.team2Score} ${team2Label}\n`;
            csv += `Set Winner: ${setData.winner === 'team1' ? team1Label : team2Label}\n\n`;
            csv += `${team1Label} Player Statistics (Set ${setData.setNumber})\n`;
            csv += 'Player,Serves,Aces,Blocks,Spikes,Points\n';
        Object.keys(setData.team1Players).forEach(playerName => {
            const player = setData.team1Players[playerName];
        csv += `${escapeCSV(playerName)},${player.serves || 0},${player.aces || 0}
        ,${player.blocks || 0},${player.spikes || 0},${player.points || 0}\n`;});
        csv += '\n';
        csv += `${team2Label} Player Statistics (Set ${setData.setNumber})\n`;
        csv += 'Player,Serves,Aces,Blocks,Spikes,Points\n';
        Object.keys(setData.team2Players).forEach(playerName => {
            const player = setData.team2Players[playerName];
            csv += `${escapeCSV(playerName)},${player.serves || 0},${player.aces || 0}
            ,${player.blocks || 0},${player.spikes || 0},${player.points || 0}\n`;});
            csv += '\n';});
    return csv;}

function endGame() {
    if (confirm('Are you sure you want to end this match?')) {
        if (gameState.setHistory.length < gameState.setNumber) {
            saveCurrentSetToHistory();}
        savePreviousGameSnapshot().catch(err => console.error('Error saving previous game snapshot:', err));
        const csv = generateMatchCSV();
        const team1Label = gameState.teams.team1.id;
        const team2Label = gameState.teams.team2.id;

        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `match_${team1Label}_vs_${team2Label}_${new Date().toISOString().slice(0,10)}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link); link.click();
        document.body.removeChild(link);
        gameState.isActive = false;
        document.getElementById('game-panel').classList.add('hidden');

        const finalGameState = { ...gameState, endTime: serverTimestamp() };
        addDoc(collection(db, 'gameHistory'), finalGameState)
            .then(() => console.log('Final game state saved to history.'))
            .catch(error => console.error('Error saving game history:', error));
function resetGameState() {
        gameState.teams.team1.score = 0;
        gameState.teams.team2.score = 0;
        gameState.teams.team1.setsWon = 0;
        gameState.teams.team2.setsWon = 0;
        gameState.setNumber = 1;
        gameState.setHistory = [];
        initializeStats();
        gameState.players = { team1: {}, team2: {} };
        updateGameDisplay();
        syncToFirebase(); 
    }
        alert('Match ended successfully! CSV downloaded and results saved to history.');
    }
}

window.startGame = startGame;
window.nextSet = nextSet;
window.endGame = endGame;
window.downloadStatsToCSV = downloadStatsToCSV;

async function loadInitialGameState() {
    try {const snapshot = await get(realtimeGameRef);
        if (snapshot.exists()) {
            const remoteState = snapshot.val();
            console.log('Loading initial game state from database:', remoteState);
            if (!isLocalRealtimeSync && remoteState) {
                gameState = JSON.parse(JSON.stringify(remoteState));
                if (!gameState.teams) {
                    gameState.teams = {
                        team1: { id: '', score: 0, setsWon: 0 },
                        team2: { id: '', score: 0, setsWon: 0 }};}
                if (!gameState.stats) {
                    gameState.stats = {
                        team1: { serves: 0, aces: 0, blocks: 0, spikes: 0 },
                        team2: { serves: 0, aces: 0, blocks: 0, spikes: 0 }};}
                if (!gameState.players) {
                    gameState.players = { team1: {}, team2: {} };}
                if (!gameState.setHistory) {
                    gameState.setHistory = [];}
                if (gameState.isActive) {
                    document.getElementById('game-panel')?.classList.remove('hidden');
                    createScoringButtons();}
                updateGameDisplay();
                console.log('✓ Initial game state loaded from Firebase');}}
                else {
                console.log('No existing game state found in database');} } catch (error) {
            console.error('Error loading initial game state:', error);
        }}

document.addEventListener('DOMContentLoaded', function() {
    console.log('Page loaded, initializing Firebase connection...');
  
   loadInitialGameState();
   loadPreviousGameState();
    subscribeToRealtimeGame();
    console.log('Firebase Realtime Database subscription active. Listening to /currentGame');
    createScoringButtons();
    setInterval(() => {
        if (gameState.isActive) {
    
            const connectedRef = ref(realtimeDB, '.info/connected');
            get(connectedRef).then((snapshot) => {
                if (snapshot.val() === false) {
                    console.warn('Connection lost, attempting to reconnect...');
                }
            }).catch(err => {
                console.error('Connection check error:', err);
            });
        }
    }, 30000); 
  
    console.log('✓ Firebase Realtime Database sync initialized and active');
});
