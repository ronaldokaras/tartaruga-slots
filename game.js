// ==================== game.js ====================
// Agora usa CONFIG do arquivo config.js

let credits = CONFIG.INITIAL_CREDITS;
let currentBet = CONFIG.BET.DEFAULT;
let lastWin = 0;
let winStreak = 0;
let currentMultiplier = CONFIG.STREAK.BASE;
let bonusTurtleCount = 0;
let freeSpins = 0;
let level = 1;
let xp = 0;
let jackpot = 0;
let stats = { totalBet: 0, totalWin: 0, highestWin: 0 };
let rankings = [];
let spinning = false;
let autoSpinActive = false;
let autoSpinCount = 0;

// Missões – usa CONFIG.MISSIONS (mas mantém progresso)
let missions = CONFIG.MISSIONS.map(m => ({
    ...m,
    progress: 0,
    completed: false
}));
let lastMissionReset = Date.now();

let reels = [];
let creditSpan, betSpan, lastWinSpan, multiplierSpan, bonusSpan, levelSpan, xpSpan, betInput, spinBtn, stopAutoBtn;

// ========== FUNÇÕES AUXILIARES ==========
function getRandomSymbol() { return CONFIG.getRandomSymbol(); }
function renderSymbolHTML(sym) { return `<img src="${sym.img}" alt="${sym.name}">`; }

function updateUI() {
    if (!creditSpan) return;
    creditSpan.textContent = Math.floor(credits);
    betSpan.textContent = currentBet;
    betInput.value = currentBet;
    lastWinSpan.textContent = lastWin;
    multiplierSpan.textContent = `${currentMultiplier}x`;
    bonusSpan.textContent = bonusTurtleCount;
    levelSpan.textContent = level;
    xpSpan.textContent = `${xp}/${level * CONFIG.LEVEL.XP_PER_LEVEL}`;
    spinBtn.disabled = spinning;
    updateRankingUI();
    updateMissionsUI();
}

function addXP(amount) {
    xp += amount;
    while (xp >= level * CONFIG.LEVEL.XP_PER_LEVEL) {
        xp -= level * CONFIG.LEVEL.XP_PER_LEVEL;
        level++;
        credits += CONFIG.LEVEL.BONUS_CREDITS;
    }
    updateUI();
}

function updateRankingUI() {
    const list = document.getElementById("rankingList");
    if (!list) return;
    list.innerHTML = "";
    rankings.slice(0, CONFIG.RANKING_LIMIT).forEach(r => {
        const li = document.createElement("li");
        li.textContent = `${r.win} créditos - ${r.nome || 'Jogador'} (${new Date(r.data).toLocaleTimeString()})`;
        list.appendChild(li);
    });
}

// ========== MISSÕES ==========
function loadMissions() {
    const saved = localStorage.getItem("missions");
    if (saved) {
        const parsed = JSON.parse(saved);
        // Atualiza com as novas missões do CONFIG, mantendo progresso
        missions = CONFIG.MISSIONS.map(m => {
            const existing = parsed.find(p => p.id === m.id);
            return existing ? { ...m, progress: existing.progress, completed: existing.completed } : { ...m, progress: 0, completed: false };
        });
    } else {
        missions = CONFIG.MISSIONS.map(m => ({ ...m, progress: 0, completed: false }));
    }
    const savedReset = localStorage.getItem("lastMissionReset");
    if (savedReset) lastMissionReset = parseInt(savedReset);
}
function saveMissions() {
    localStorage.setItem("missions", JSON.stringify(missions));
    localStorage.setItem("lastMissionReset", lastMissionReset);
}
function updateMissionProgress(id, inc = 1) {
    const mission = missions.find(m => m.id === id);
    if (mission && !mission.completed) {
        mission.progress += inc;
        if (mission.progress >= mission.target) {
            mission.completed = true;
            credits += mission.reward;
            updateUI();
        }
        saveMissions();
        updateMissionsUI();
    }
}
function updateMissionsUI() {
    const container = document.getElementById("missionsList");
    if (!container) return;
    container.innerHTML = "";
    missions.forEach(m => {
        const li = document.createElement("li");
        li.innerHTML = `${m.desc} (${m.progress}/${m.target}) ${m.completed ? "✅" : "⏳"} +${m.reward}`;
        container.appendChild(li);
    });
}
function resetDailyMissions() {
    missions.forEach(m => { m.progress = 0; m.completed = false; });
    lastMissionReset = Date.now();
    saveMissions();
    updateMissionsUI();
}
function checkDailyReset() {
    if (Date.now() - lastMissionReset >= 24 * 60 * 60 * 1000) resetDailyMissions();
}

// ========== EFEITOS VISUAIS ==========
function showWinEffect(amount) {
    const overlay = document.createElement('div');
    overlay.className = 'win-overlay ' + (amount > 500 ? 'big' : 'small');
    document.body.appendChild(overlay);
    const floating = document.createElement('div');
    floating.className = 'floating-win';
    floating.textContent = `+${amount} CRÉDITOS!`;
    document.body.appendChild(floating);
    if (amount > 500) {
        const appDiv = document.querySelector('.app');
        if (appDiv) appDiv.classList.add('shake');
        const colors = ['#ffd166', '#06d6a0', '#118ab2', '#ef476f', '#ffd76b'];
        for (let i = 0; i < CONFIG.ANIMATION.CONFETTI_COUNT; i++) {
            const c = document.createElement('div');
            c.className = 'confetti';
            c.style.backgroundColor = colors[i % colors.length];
            c.style.left = Math.random() * 100 + 'vw';
            c.style.top = (-20 - Math.random() * 40) + 'px';
            c.style.transform = `rotate(${Math.random() * 360}deg)`;
            document.body.appendChild(c);
            setTimeout(() => c.remove(), CONFIG.ANIMATION.CONFETTI_DURATION);
        }
    }
    setTimeout(() => overlay.remove(), amount > 500 ? CONFIG.ANIMATION.WIN_EFFECT_BIG : CONFIG.ANIMATION.WIN_EFFECT_SMALL);
    setTimeout(() => {
        floating.remove();
        const appDiv = document.querySelector('.app');
        if (appDiv) appDiv.classList.remove('shake');
    }, amount > 500 ? CONFIG.ANIMATION.WIN_EFFECT_BIG + 600 : CONFIG.ANIMATION.WIN_EFFECT_SMALL + 500);
}

// ========== LÓGICA DE PRÊMIOS ==========
function evaluateMiddleRowWin(slots, bet, multiplier) {
    const mid = [slots[3], slots[4], slots[5]];
    const names = mid.map(s => s.name);
    const turtleCount = names.filter(n => n === "TARTARUGA").length;
    const trevoCount = names.filter(n => n === "TREVO").length;
    let win = 0, addBonus = 0, triggerFree = false, triggerJackpot = false;

    const P = CONFIG.PAYOUTS;

    if (turtleCount === 3) {
        win = bet * P.TURTLE_3;
        addBonus = 2;
        triggerJackpot = true;
    } else if (turtleCount === 2 && trevoCount === 1) {
        win = bet * P.TURTLE_2_TREVO;
        addBonus = 1;
    } else if (turtleCount === 2) {
        win = bet * P.TURTLE_2;
        addBonus = 1;
    } else if (trevoCount === 3) {
        win = bet * P.TREVO_3;
        triggerFree = true;
    } else if (names[0] === names[1] && names[1] === names[2]) {
        win = bet * mid[0].value * P.THREE_SAME;
    }

    // Regra do par
    if (win === 0) {
        const counts = {};
        names.forEach(n => counts[n] = (counts[n] || 0) + 1);
        const hasPair = Object.values(counts).some(c => c >= 2);
        if (hasPair) {
            win = bet * P.PAIR;
        }
    }

    // Bônus por acúmulo de tartarugas
    if (bonusTurtleCount + addBonus >= P.BONUS_THRESHOLD) {
        win += bet * P.BONUS_TURTLE;
        bonusTurtleCount = 0;
    } else {
        bonusTurtleCount += addBonus;
    }

    if (triggerJackpot && jackpot > 0) {
        jackpot = 0;
    }

    if (triggerFree && freeSpins === 0) {
        freeSpins = CONFIG.FREE_SPINS.COUNT;
    }

    win = Math.floor(win * multiplier);
    return { winAmount: win, addBonus, triggerFree };
}

// ========== SINCRONIZAÇÃO COM SERVIDOR ==========
async function syncToServer(winAmount) {
    try {
        await fetch('/api/sync', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                user: playerName,
                credits: Math.floor(credits),
                win: winAmount || 0
            })
        });
    } catch(e) {
        console.error('syncToServer error:', e);
    }
}

// ========== GIRO PRINCIPAL ==========
async function performSpin(isFree = false) {
    if (spinning) return;
    if (!isFree && credits < currentBet && freeSpins === 0) return;

    spinning = true;
    updateUI();

    try {
        if (!isFree) {
            credits -= currentBet;
            stats.totalBet += currentBet;
        }

        reels.forEach(r => r.classList.add("spinning"));
        const interval = setInterval(() => {
            reels.forEach(r => r.innerHTML = renderSymbolHTML(getRandomSymbol()));
        }, CONFIG.ANIMATION.SPIN_INTERVAL);

        await new Promise(r => setTimeout(r, CONFIG.ANIMATION.SPIN_DURATION));
        clearInterval(interval);

        const finals = Array.from({ length: 9 }, () => getRandomSymbol());
        reels.forEach((r, i) => r.innerHTML = renderSymbolHTML(finals[i]));
        reels.forEach(r => r.classList.remove("spinning"));

        const result = evaluateMiddleRowWin(finals, currentBet, currentMultiplier);
        let win = result.winAmount;

        if (win > 0) {
            credits += win;
            lastWin = win;
            stats.totalWin += win;
            if (win > stats.highestWin) stats.highestWin = win;

            addXP(Math.floor(win * CONFIG.LEVEL.XP_PER_WIN));
            showWinEffect(win);

            reels.slice(3, 6).forEach(r => r.classList.add("middle-highlight"));
            setTimeout(() => reels.slice(3, 6).forEach(r => r.classList.remove("middle-highlight")), CONFIG.ANIMATION.HIGHLIGHT_DURATION);

            winStreak++;
            currentMultiplier = Math.min(CONFIG.STREAK.MAX_MULTIPLIER, CONFIG.STREAK.BASE + Math.floor(winStreak / CONFIG.STREAK.INCREMENT));
            updateMissionProgress("spin10", 1);
            updateMissionProgress("win3streak", 1);
            updateMissionProgress("turtle5", result.addBonus);
            if (win > 500) updateMissionProgress("bigWin", 1);
        } else {
            winStreak = 0;
            currentMultiplier = CONFIG.STREAK.BASE;
            updateMissionProgress("spin10", 1);
        }

        // Jackpot
        if (win === 0) jackpot += Math.floor(currentBet * CONFIG.JACKPOT.PERCENT_LOSS);
        else jackpot += Math.floor(win * CONFIG.JACKPOT.PERCENT_WIN);
        if (jackpot > CONFIG.JACKPOT.MAX) jackpot = CONFIG.JACKPOT.MAX;

        if (isFree && freeSpins > 0) freeSpins--;

        try {
            await syncToServer(win);
            if (typeof loadRankingFromDB === "function") loadRankingFromDB();
        } catch(e) {
            console.error(e);
        }

    } catch (error) {
        console.error("Erro no giro:", error);
    } finally {
        spinning = false;
        updateUI();
    }

    if (!spinning) {
        if (autoSpinActive && autoSpinCount > 0) {
            autoSpinCount--;
            if (autoSpinCount <= 0) {
                autoSpinActive = false;
                stopAutoBtn.disabled = true;
            } else {
                setTimeout(() => performSpin(freeSpins > 0), CONFIG.ANIMATION.AUTO_SPIN_DELAY);
            }
        } else if (freeSpins > 0 && !autoSpinActive) {
            setTimeout(() => performSpin(true), CONFIG.FREE_SPINS.AUTO_DELAY);
        }
    }
}

// ========== CONFIGURAÇÕES DE APOSTA ==========
function setBet(value) {
    let newBet = Math.min(CONFIG.BET.MAX, Math.max(CONFIG.BET.MIN, value));
    if (newBet > credits) newBet = credits;
    currentBet = newBet;
    updateUI();
}

// ========== VINCULAÇÃO DE ELEMENTOS ==========
function bindGameElements() {
    const grid = document.getElementById("reelsGrid");
    if (grid && grid.children.length === 0) {
        for (let i = 0; i < 9; i++) {
            const div = document.createElement('div');
            div.className = 'reel';
            div.id = `reel${i}`;
            grid.appendChild(div);
        }
    }
    reels = Array.from({ length: 9 }, (_, i) => document.getElementById(`reel${i}`));
    creditSpan = document.getElementById("creditAmount");
    betSpan = document.getElementById("betAmount");
    lastWinSpan = document.getElementById("lastWin");
    multiplierSpan = document.getElementById("multiplierValue");
    bonusSpan = document.getElementById("bonusCounter");
    levelSpan = document.getElementById("levelValue");
    xpSpan = document.getElementById("xpValue");
    betInput = document.getElementById("betInput");
    spinBtn = document.getElementById("spinBtn");
    stopAutoBtn = document.getElementById("stopAutoBtn");
    console.log("Elementos vinculados:", !!creditSpan);
}

function setupGameEventListeners() {
    console.log("Configurando event listeners");
    document.getElementById("decreaseBet").onclick = () => setBet(currentBet - CONFIG.BET.STEP);
    document.getElementById("increaseBet").onclick = () => setBet(currentBet + CONFIG.BET.STEP);
    document.getElementById("maxBetBtn").onclick = () => setBet(Math.min(CONFIG.BET.MAX, credits));
    betInput.onchange = () => setBet(parseInt(betInput.value) || CONFIG.BET.MIN);
    spinBtn.onclick = () => performSpin(false);

    document.getElementById("autoSpin5Btn").onclick = () => {
        if (spinning) return;
        autoSpinActive = true;
        autoSpinCount = 5;
        stopAutoBtn.disabled = false;
        performSpin(false);
    };
    document.getElementById("autoSpin10Btn").onclick = () => {
        if (spinning) return;
        autoSpinActive = true;
        autoSpinCount = 10;
        stopAutoBtn.disabled = false;
        performSpin(false);
    };
    stopAutoBtn.onclick = () => {
        autoSpinActive = false;
        stopAutoBtn.disabled = true;
    };

    document.getElementById("resetRankingBtn").onclick = () => {
        rankings = [];
        updateRankingUI();
    };
    console.log("Event listeners configurados");
}

// ========== INICIALIZAÇÃO ==========
async function initGameAfterLogin() {
    // 1. Cria overlay de carregamento
    const loadingDiv = document.createElement('div');
    loadingDiv.id = 'loading-overlay';

    const spinner = document.createElement('div');
    spinner.className = 'spinner';

    const text = document.createElement('div');
    text.className = 'loading-text';
    text.textContent = 'Carregando...';

    loadingDiv.appendChild(spinner);
    loadingDiv.appendChild(text);
    document.body.appendChild(loadingDiv);

    // 2. Pré‑carrega todas as imagens usando CONFIG.SYMBOLS
    const imagePromises = CONFIG.SYMBOLS.map(s => {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = () => reject(new Error(`Falha ao carregar ${s.img}`));
            img.src = s.img;
        });
    });

    try {
        await Promise.all(imagePromises);
        console.log('Todas as imagens carregadas com sucesso.');
    } catch (error) {
        console.error('Erro no carregamento de imagens:', error);
    }

    // 3. Remove o overlay
    if (loadingDiv.parentNode) loadingDiv.parentNode.removeChild(loadingDiv);

    // 4. Inicializa o jogo
    reels.forEach(r => r.innerHTML = renderSymbolHTML(getRandomSymbol()));
    updateUI();
    checkDailyReset();
    console.log("Jogo inicializado após login");
}