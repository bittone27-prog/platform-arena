// Platform Arena - Jeu de plateforme 2 joueurs (local ou en ligne)
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const toastEl = document.getElementById('toast');
const roleBadge = document.getElementById('roleBadge');
const lobbyEl = document.getElementById('lobby');
const gameEl = document.getElementById('game');
const btnCreate = document.getElementById('btnCreate');
const btnJoin = document.getElementById('btnJoin');
const btnStart = document.getElementById('btnStart');
const lobbyCodeEl = document.getElementById('lobbyCode');
const playerListEl = document.getElementById('playerList');
const playerCountEl = document.getElementById('playerCount');
const lobbyHintEl = document.getElementById('lobbyHint');

let localMode = true;
let myId = Math.random().toString(36).substr(2, 9);
let players = new Map();
let itId = '';
let bombCooldown = false;

// Taille
canvas.width = 800;
canvas.height = 500;

// Plateformes (rose/vert/bleu)
const platforms = [
  { x: 0, y: 450, w: 800, h: 50, color: '#ec4899' }, // sol rose
  { x: 100, y: 380, w: 120, h: 20, color: '#4ade80' },
  { x: 300, y: 320, w: 120, h: 20, color: '#a855f7' },
  { x: 500, y: 260, w: 120, h: 20, color: '#4ade80' },
  { x: 150, y: 200, w: 120, h: 20, color: '#ec4899' },
  { x: 400, y: 140, w: 120, h: 20, color: '#a855f7' },
];

// Téléporteurs
const teleporters = [
  { x: 50, y: 400, w: 30, h: 40, target: { x: 600, y: 280 }, color: '#fbbf24' },
  { x: 600, y: 280, w: 30, h: 40, target: { x: 50, y: 400 }, color: '#fbbf24' },
];

// Joueurs
const playerSize = 30;
const gravity = 0.6;
const jumpForce = 12;
const speed = 4.5;

// Clavier
const keys = {};
window.addEventListener('keydown', e => keys[e.code] = true);
window.addEventListener('keyup', e => keys[e.code] = false);

// Collision plateforme
function isOnPlatform(p) {
  return platforms.some(pl => 
    p.y + playerSize >= pl.y && p.y + playerSize <= pl.y + 10 &&
    p.x + playerSize >= pl.x && p.x <= pl.x + pl.w
  );
}

// Collision téléporteur
function useTeleporter(p) {
  for (const t of teleporters) {
    if (Math.abs(p.x - t.x) < t.w + playerSize && Math.abs(p.y - t.y) < t.h + playerSize) {
      return t.target;
    }
  }
  return null;
}

// Mise à jour joueur
function updatePlayer(p) {
  // Gravité
  if (!isOnPlatform(p)) p.vy += gravity;
  p.y += p.vy;

  // Limite sol
  if (p.y + playerSize > 500) {
    p.y = 500 - playerSize;
    p.vy = 0;
  }

  // Saut
  if (keys[p.keyUp] && isOnPlatform(p)) {
    p.vy = -jumpForce;
  }

  // Mouvement
  if (keys[p.keyLeft]) p.x -= speed;
  if (keys[p.keyRight]) p.x += speed;

  // Limite gauche/droite
  if (p.x < 0) p.x = 0;
  if (p.x > canvas.width - playerSize) p.x = canvas.width - playerSize;

  // Téléporteur
  const target = useTeleporter(p);
  if (target) {
    p.x = target.x;
    p.y = target.y;
  }

  // Transmission bombe
  if (keys[p.keyPass] && itId === p.id && !bombCooldown) {
    bombCooldown = true;
    setTimeout(() => bombCooldown = false, 1000);
    const others = Array.from(players.values()).filter(o => o.id !== p.id);
    if (others.length) {
      itId = others[Math.floor(Math.random() * others.length)].id;
    }
  }
}

// Dessin
function draw() {
  // Fond bleu
  ctx.fillStyle = '#60a5fa';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Décor kawaii
  // Fleurs
  ctx.fillStyle = '#f472b6';
  platforms.forEach(p => {
    if (p.color === '#4ade80') {
      ctx.beginPath();
      ctx.arc(p.x + p.w/2, p.y - 10, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fbbf24';
      ctx.beginPath();
      ctx.arc(p.x + p.w/2, p.y - 25, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#f472b6';
    }
  });
  // Arbres
  ctx.fillStyle = '#22c55e';
  ctx.fillRect(700, 380, 20, -60);
  ctx.beginPath();
  ctx.arc(710, 380, 25, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#a855f7';
  ctx.fillRect(50, 400, 20, -40);
  ctx.beginPath();
  ctx.arc(60, 400, 20, 0, Math.PI * 2);
  ctx.fill();

  // Plateformes
  platforms.forEach(pl => {
    ctx.fillStyle = pl.color;
    ctx.fillRect(pl.x, pl.y, pl.w, pl.h);
  });

  // Téléporteurs
  teleporters.forEach(t => {
    ctx.fillStyle = t.color;
    ctx.fillRect(t.x, t.y, t.w, t.h);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('🌀', t.x + t.w/2, t.y + t.h/2 + 4);
  });

  // Joueurs
  players.forEach(p => {
    ctx.fillStyle = p.id === itId ? '#ef4444' : '#3b82f6';
    ctx.fillRect(p.x, p.y, playerSize, playerSize);
    ctx.fillStyle = '#fff';
    ctx.font = '14px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(p.name[0], p.x + playerSize/2, p.y + playerSize/2 + 5);
  });

  // Bombe sur le porteur (remplace la couronne 👑)
  const it = players.get(itId);
  if (it) {
    const bob = Math.sin(Date.now() / 200) * 3;
    // ficelle
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(it.x + playerSize/2, it.y - 15);
    ctx.lineTo(it.x + playerSize/2 + 4, it.y - 40 + bob);
    ctx.stroke();
    // bombe (corps noir)
    ctx.beginPath();
    ctx.arc(it.x + playerSize/2, it.y - 45 + bob, 10, 0, Math.PI * 2);
    ctx.fillStyle = '#1e293b';
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#f97316';
    ctx.stroke();
    // reflet
    ctx.beginPath();
    ctx.arc(it.x + playerSize/2 - 3, it.y - 49 + bob, 2, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,255,255,.5)';
    ctx.fill();
    // mèche + étincelle animée
    const spark = 2 + Math.sin(Date.now() / 100) * 1.5;
    ctx.strokeStyle = '#78350f';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(it.x + playerSize/2 + 6, it.y - 52 + bob);
    ctx.quadraticCurveTo(it.x + playerSize/2 + 12, it.y - 60 + bob, it.x + playerSize/2 + 10, it.y - 65 + bob);
    ctx.stroke();
    // étincelle orange qui pulse
    ctx.beginPath();
    ctx.arc(it.x + playerSize/2 + 10, it.y - 67 + bob, spark, 0, Math.PI * 2);
    ctx.fillStyle = '#fbbf24';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(it.x + playerSize/2 + 10, it.y - 67 + bob, spark + 2, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(251,191,36,.3)';
    ctx.fill();
  }
}

// Boucle jeu
function gameLoop() {
  updatePlayer(players.get(myId));
  draw();
  requestAnimationFrame(gameLoop);
}

// Notifications
function toast(msg) {
  toastEl.textContent = msg;
  setTimeout(() => toastEl.textContent = '', 3000);
}

// -------- LOBBY --------

function addLobbyPlayer(p, host) {
  if (document.getElementById(`lobby-${p.id}`)) return;
  const li = document.createElement('li');
  li.id = `lobby-${p.id}`;
  li.textContent = p.name + (p.id === myId ? ' (toi)' : '');
  if (host) li.classList.add('host');
  if (p.id === myId) li.classList.add('me');
  playerListEl.appendChild(li);
  updatePlayerCount();
}

function updatePlayerCount() {
  const count = document.querySelectorAll('#playerList li').length;
  playerCountEl.textContent = count;
  if (count >= 2) {
    btnStart.classList.remove('hidden');
    lobbyHintEl.classList.add('hidden');
  } else {
    btnStart.classList.add('hidden');
    lobbyHintEl.classList.remove('hidden');
  }
}

// Démarrage
btnCreate.addEventListener('click', () => {
  localMode = true;
  myId = 'player1';
  players = new Map();
  players.set('player1', { id: 'player1', name: 'Joueur 1', x: 50, y: 300, vy: 0, keyLeft: 'KeyA', keyRight: 'KeyD', keyUp: 'KeyW', keyPass: 'KeyQ' });
  players.set('player2', { id: 'player2', name: 'Joueur 2', x: 150, y: 300, vy: 0, keyLeft: 'ArrowLeft', keyRight: 'ArrowRight', keyUp: 'ArrowUp', keyPass: 'ArrowDown' });
  itId = Math.random() < 0.5 ? 'player1' : 'player2';
  lobbyEl.classList.add('hidden');
  gameEl.classList.remove('hidden');
  updateLobbyUI();
  gameLoop();
});

function updateLobbyUI() {
  playerListEl.innerHTML = '';
  players.forEach(p => addLobbyPlayer(p, false));
}

// -------- INIT --------
updateLobbyUI();
toast('Bienvenue sur Platform Arena ! Créer ou rejoindre une partie.');