/* ==========================================================================
   KONOHA PAY — INTERACTIVE ENGINE (AUDIO SYNTH, CANVAS & ANIMATIONS)
   ========================================================================== */

// STATE MANAGEMENT
let userState = {
  name: "Sasuke Uchiha",
  ryos: 12500,
  xp: 450,
  rank: "GENIN",
  level: 4
};

let gaugeState = {
  currentRyos: 1482900,
  targetRyos: 2000000,
  percent: 74
};

// INITIALIZATION
document.addEventListener("DOMContentLoaded", () => {
  initSakuraCanvas();
  initFireworksCanvas();
  initCustomCursor();
  updateUserUI();
  updateGaugeUI();
});

// ==========================================================================
// 1. WEB AUDIO API SYNTHESIZER (NO EXTERNAL AUDIO ASSETS REQUIRED)
// ==========================================================================
const AudioContext = window.AudioContext || window.webkitAudioContext;
let audioCtx = null;

function getAudioContext() {
  if (!audioCtx) {
    audioCtx = new AudioContext();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

// Katana Slash Swoosh Sound
function playKatanaSwooshSound() {
  try {
    const ctx = getAudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(800, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.2);
    
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.start();
    osc.stop(ctx.currentTime + 0.2);
  } catch (e) {
    console.log("Audio not allowed yet");
  }
}

// Manga Stamp Impact Sound
function playStampImpactSound() {
  try {
    const ctx = getAudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(150, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(30, ctx.currentTime + 0.25);
    
    gain.gain.setValueAtTime(0.6, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.start();
    osc.stop(ctx.currentTime + 0.25);
  } catch (e) {}
}

// Coins Cha-Ching Sound
function playCoinsSound() {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;
    
    [987.77, 1318.51].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + i * 0.08);
      
      gain.gain.setValueAtTime(0.2, now + i * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.08 + 0.3);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start(now + i * 0.08);
      osc.stop(now + i * 0.08 + 0.3);
    });
  } catch (e) {}
}

// ==========================================================================
// 2. CANVAS SAKURA PETALS PARTICLE SYSTEM
// ==========================================================================
function initSakuraCanvas() {
  const canvas = document.getElementById('sakuraCanvas');
  const ctx = canvas.getContext('2d');
  
  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener('resize', resize);
  
  const petals = [];
  const petalCount = 35;
  
  for (let i = 0; i < petalCount; i++) {
    petals.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      size: Math.random() * 8 + 6,
      speedY: Math.random() * 1.2 + 0.8,
      speedX: Math.random() * 0.8 - 0.4,
      rotation: Math.random() * 360,
      rotSpeed: Math.random() * 2 - 1,
      opacity: Math.random() * 0.6 + 0.3
    });
  }
  
  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    petals.forEach(p => {
      p.y += p.speedY;
      p.x += Math.sin(p.y * 0.01) + p.speedX;
      p.rotation += p.rotSpeed;
      
      if (p.y > canvas.height + 20) {
        p.y = -20;
        p.x = Math.random() * canvas.width;
      }
      
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate((p.rotation * Math.PI) / 180);
      ctx.globalAlpha = p.opacity;
      
      // Draw Cherry Blossom Petal Path
      ctx.fillStyle = '#ffb7c5';
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.bezierCurveTo(-p.size, -p.size, -p.size, p.size, 0, p.size * 1.5);
      ctx.bezierCurveTo(p.size, p.size, p.size, -p.size, 0, 0);
      ctx.fill();
      ctx.restore();
    });
    
    requestAnimationFrame(animate);
  }
  animate();
}

// ==========================================================================
// 3. CANVAS FIREWORKS ENGINE FOR 100% GAUGE EVENT
// ==========================================================================
let fireworksArray = [];

function initFireworksCanvas() {
  const canvas = document.getElementById('fireworksCanvas');
  const ctx = canvas.getContext('2d');
  
  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener('resize', resize);
  
  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    for (let i = fireworksArray.length - 1; i >= 0; i--) {
      const p = fireworksArray[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.05; // gravity
      p.alpha -= 0.015;
      
      if (p.alpha <= 0) {
        fireworksArray.splice(i, 1);
        continue;
      }
      
      ctx.save();
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    
    requestAnimationFrame(animate);
  }
  animate();
}

function launchFireworksBurst() {
  const colors = ['#00e5ff', '#ffd700', '#ff3d00', '#00e676', '#e040fb'];
  const centerX = window.innerWidth / 2;
  const centerY = window.innerHeight / 3;
  
  for (let b = 0; b < 5; b++) {
    setTimeout(() => {
      const px = centerX + (Math.random() * 400 - 200);
      const py = centerY + (Math.random() * 200 - 100);
      const color = colors[Math.floor(Math.random() * colors.length)];
      
      for (let i = 0; i < 60; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 6 + 2;
        fireworksArray.push({
          x: px,
          y: py,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          color: color,
          radius: Math.random() * 3 + 2,
          alpha: 1
        });
      }
      playKatanaSwooshSound();
    }, b * 250);
  }
}

// ==========================================================================
// 4. CUSTOM SHURIKEN CURSOR TRACKER
// ==========================================================================
function initCustomCursor() {
  const cursor = document.getElementById('shurikenCursor');
  window.addEventListener('mousemove', (e) => {
    cursor.style.left = `${e.clientX}px`;
    cursor.style.top = `${e.clientY}px`;
  });
}

// ==========================================================================
// 5. CONTRIBUTION PAYMENT LOGIC (KATANA SLASH + MANGA STAMP)
// ==========================================================================
function payContribution(cardId, cost, xpReward) {
  if (userState.ryos < cost) {
    alert("⚡ Vous n'avez pas assez de Ryos ! Complétez des missions ou faites des dons pour augmenter vos fonds.");
    return;
  }
  
  const card = document.getElementById(cardId);
  if (!card) return;
  
  // Deduct Ryos & Add XP
  userState.ryos -= cost;
  userState.xp += xpReward;
  updateUserUI();
  playCoinsSound();
  
  // 1. Katana Slash Animation
  const slashLine = card.querySelector('.katana-slash-line');
  if (slashLine) {
    slashLine.classList.remove('slash-active');
    void slashLine.offsetWidth; // trigger reflow
    slashLine.classList.add('slash-active');
    playKatanaSwooshSound();
  }
  
  // 2. Manga Stamp Validation Impact (After 200ms)
  setTimeout(() => {
    const stamp = card.querySelector('.manga-stamp');
    if (stamp) {
      stamp.classList.add('stamp-active');
      playStampImpactSound();
    }
  }, 220);
  
  // 3. Update Will of Fire Gauge
  incrementGauge(cost);
}

// Custom Donation Slider Logic
function updateDonationValue(val) {
  document.getElementById('donationValueText').innerText = `${val} Ryos`;
}

function payDonation() {
  const val = parseInt(document.getElementById('donationRange').value);
  payContribution('card-reconstruction', val, Math.floor(val * 0.8));
}

// ==========================================================================
// 6. WILL OF FIRE GAUGE PROGRESSION & EVENT UNLOCK
// ==========================================================================
function incrementGauge(amount) {
  gaugeState.currentRyos += amount;
  gaugeState.percent = Math.min(100, Math.floor((gaugeState.currentRyos / gaugeState.targetRyos) * 100));
  updateGaugeUI();
  
  // Check 100% Server Event Trigger
  if (gaugeState.percent >= 100) {
    triggerServerEvent();
  }
}

function updateGaugeUI() {
  const fill = document.getElementById('fireGaugeFill');
  const text = document.getElementById('gaugePercentText');
  const totalPaid = document.getElementById('totalTaxesPaid');
  
  if (fill) fill.style.width = `${gaugeState.percent}%`;
  if (text) text.innerText = `${gaugeState.percent}%`;
  if (totalPaid) totalPaid.innerText = gaugeState.currentRyos.toLocaleString('fr-FR');
}

function triggerServerEvent() {
  const banner = document.getElementById('doubleXpBanner');
  if (banner) banner.classList.remove('hidden');
  launchFireworksBurst();
}

// ==========================================================================
// 7. USER PROFILE & MODALS LOGIC
// ==========================================================================
function updateUserUI() {
  document.getElementById('userRyos').innerText = userState.ryos.toLocaleString('fr-FR');
  document.getElementById('userRankBadge').innerText = userState.rank;
  document.getElementById('userLevelText').innerText = `Niv. ${userState.level}`;
}

function toggleScrollModal() {
  const modal = document.getElementById('scrollModal');
  modal.classList.toggle('active');
  playKatanaSwooshSound();
}

function handleScrollSubmit(e) {
  e.preventDefault();
  const nameInput = document.getElementById('ninjaNameInput').value;
  if (nameInput) {
    userState.name = nameInput;
    alert(`📜 Rouleau scellé avec succès ! Bienvenue Citoyen ${userState.name} à Konoha.`);
    toggleScrollModal();
  }
}

function openHokageNews() {
  document.getElementById('newsModal').classList.add('active');
  playKatanaSwooshSound();
}

function closeHokageNews() {
  document.getElementById('newsModal').classList.remove('active');
}

function openNinjaShop() {
  document.getElementById('shopModal').classList.add('active');
  playKatanaSwooshSound();
}

function closeNinjaShop() {
  document.getElementById('shopModal').classList.remove('active');
}

function buyShopItem(itemName, cost) {
  if (userState.ryos >= cost) {
    userState.ryos -= cost;
    updateUserUI();
    playCoinsSound();
    alert(`🎉 Vous avez acheté : ${itemName} ! (Ajouté à votre inventaire Ninja)`);
  } else {
    alert("⚡ Ryos insuffisants pour cet objet.");
  }
}

function filterCards(category) {
  const cards = document.querySelectorAll('.contribution-card');
  const buttons = document.querySelectorAll('.pill-btn');
  
  buttons.forEach(btn => btn.classList.remove('active'));
  event.target.classList.add('active');
  
  cards.forEach(card => {
    if (category === 'all' || card.dataset.category === category) {
      card.style.display = 'flex';
    } else {
      card.style.display = 'none';
    }
  });
}

function scrollToSection(id) {
  const elem = document.getElementById(id);
  if (elem) {
    elem.scrollIntoView({ behavior: 'smooth' });
  }
}
