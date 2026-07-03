// ==================== game.js ====================
const SYMBOLS = [
    { img: "img/tartaruga.png", name: "TARTARUGA", value: 45 },
    { img: "img/trevo.png", name: "TREVO", value: 25 },
    { img: "img/diamante.png", name: "DIAMANTE", value: 20 },
    { img: "img/estrela.png", name: "ESTRELA", value: 16 },
    { img: "img/concha.png", name: "CONCHA", value: 12 },
    { img: "img/onda.png", name: "ONDA", value: 10 },
    { img: "img/melancia.png", name: "MELANCIA", value: 8 }
];

let credits = 1000;
let currentBet = 25;
let lastWin = 0;
let winStreak = 0;
let currentMultiplier = 1;
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

let missions = [
    { id: "spin10", desc: "Gire 10 vezes", progress: 0, target: 10, reward: 100, completed: false },
    { id: "win3streak", desc: "Ganhe 3 vezes seguidas", progress: 0, target: 3, reward: 150, completed: false },
    { id: "turtle5", desc: "Acumule 5 tartarugas", progress: 0, target: 5, reward: 125, completed: false },
    { id: "bigWin", desc: "Ganhe mais de 500 em 1 rodada", progress: 0, target: 1, reward: 250, completed: false }
];
let lastMissionReset = Date.now();

let reels = [];
let creditSpan, betSpan, lastWinSpan, multiplierSpan, bonusSpan, levelSpan, xpSpan, betInput, spinBtn, stopAutoBtn;

function getRandomSymbol() { return SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)]; }
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
    xpSpan.textContent = `${xp}/${level * 100}`;
    spinBtn.disabled = spinning;
    updateRankingUI();
    updateMissionsUI();
}

function addXP(amount) {
    xp += amount;
    while (xp >= level * 100) {
        xp -= level * 100;
        level++;
        credits += 500;
    }
    updateUI();
}

function updateRankingUI() {
    const list = document.getElementById("rankingList");
    if (!list) return;
    list.innerHTML = "";
    rankings.slice(0, 5).forEach(r => {
        const li = document.createElement("li");
        li.textContent = `${r.win} créditos - ${r.nome || 'Jogador'} (${new Date(r.data).toLocaleTimeString()})`;
        list.appendChild(li);
    });
}

function loadMissions() {
    const saved = localStorage.getItem("missions");
    if (saved) missions = JSON.parse(saved);
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
        for (let i = 0; i < 40; i++) {
            const c = document.createElement('div');
            c.className = 'confetti';
            c.style.backgroundColor = colors[i % colors.length];
            c.style.left = Math.random() * 100 + 'vw';
            c.style.top = (-20 - Math.random() * 40) + 'px';
            c.style.transform = `rotate(${Math.random() * 360}deg)`;
            document.body.appendChild(c);
            setTimeout(() => c.remove(), 2500);
        }
    }
    setTimeout(() => overlay.remove(), amount > 500 ? 1600 : 900);
    setTimeout(() => {
        floating.remove();
        const appDiv = document.querySelector('.app');
        if (appDiv) appDiv.classList.remove('shake');
    }, amount > 500 ? 2200 : 1400);
}

function evaluateMiddleRowWin(slots, bet, multiplier) {
    const mid = [slots[3], slots[4], slots[5]];
    const names = mid.map(s => s.name);
    const turtleCount = names.filter(n => n === "TARTARUGA").length;
    const trevoCount = names.filter(n => n === "TREVO").length;
    let win = 0, addBonus = 0, triggerFree = false, triggerJackpot = false;

    // MULTIPLICADORES BEM REDUZIDOS
    if (turtleCount === 3) {
        win = bet * 10;
        addBonus = 2;
        triggerJackpot = true;
    } else if (turtleCount === 2 && trevoCount === 1) {
        win = bet * 6;
        addBonus = 1;
    } else if (turtleCount === 2) {
        win = bet * 4;
        addBonus = 1;
    } else if (trevoCount === 3) {
        win = bet * 5;
        triggerFree = true;
    } else if (names[0] === names[1] && names[1] === names[2]) {
        win = bet * mid[0].value * 0.3;
    }

    // 🆕 NOVA REGRA: Se não ganhou nada ainda, verifica se tem 2 símbolos iguais
    if (win === 0) {
        const counts = {};
        names.forEach(n => counts[n] = (counts[n] || 0) + 1);
        const hasPair = Object.values(counts).some(c => c >= 2);
        if (hasPair) {
            win = bet * 1; // prêmio pequeno (1x a aposta)
        }
    }

    // Bônus por acúmulo: se chegar a 20, ganha um pouco
    if (bonusTurtleCount + addBonus >= 20) {
        win += bet * 2;
        bonusTurtleCount = 0;
    } else {
        bonusTurtleCount += addBonus;
    }

    // Jackpot não adiciona mais ao prêmio
    if (triggerJackpot && jackpot > 0) {
        jackpot = 0;
    }

    if (triggerFree && freeSpins === 0) {
        freeSpins = 2;
    }

    win = Math.floor(win * multiplier);
    return { winAmount: win, addBonus, triggerFree };
}

// 🔄 Função que envia TUDO de uma vez para o servidor
async function syncToServer(winAmount) {
    try {
        await fetch('/api/sync', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                user: playerName,          // playerName deve estar definida globalmente (nome do usuário logado)
                credits: Math.floor(credits),
                win: winAmount || 0
            })
        });
    } catch(e) {
        console.error('syncToServer error:', e);
    }
}

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
        }, 30); // velocidade de atualização dos rolos

        await new Promise(r => setTimeout(r, 300)); // Otimização: espera mínima antes de parar os rolos
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

            addXP(Math.floor(win / 10));
            showWinEffect(win);

            reels.slice(3, 6).forEach(r => r.classList.add("middle-highlight"));
            setTimeout(() => reels.slice(3, 6).forEach(r => r.classList.remove("middle-highlight")), 1400);

            winStreak++;
            currentMultiplier = Math.min(3, 1 + Math.floor(winStreak / 3));
            updateMissionProgress("spin10", 1);
            updateMissionProgress("win3streak", 1);
            updateMissionProgress("turtle5", result.addBonus);
            if (win > 500) updateMissionProgress("bigWin", 1);
        } else {
            winStreak = 0;
            currentMultiplier = 1;
            updateMissionProgress("spin10", 1);
        }

        // Acumula jackpot
        if (win === 0) jackpot += Math.floor(currentBet * 0.05);
        else jackpot += Math.floor(win * 0.02);
        if (jackpot > 50000) jackpot = 50000;

        if (isFree && freeSpins > 0) freeSpins--;

        // ✅ SINCRONIZAÇÃO ÚNICA COM O SERVIDOR (substitui saveUserToDB e saveWinToDB)
        try {
            await syncToServer(win);
            // Se existir a função de carregar ranking, chama depois de salvar
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
                setTimeout(() => performSpin(freeSpins > 0), 400);
            }
        } else if (freeSpins > 0 && !autoSpinActive) {
            setTimeout(() => performSpin(true), 600);
        }
    }
}

function setBet(value) {
    let newBet = Math.min(2000, Math.max(10, value));
    if (newBet > credits) newBet = credits;
    currentBet = newBet;
    updateUI();
}

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
    document.getElementById("decreaseBet").onclick = () => setBet(currentBet - 100);
    document.getElementById("increaseBet").onclick = () => setBet(currentBet + 100);
    document.getElementById("maxBetBtn").onclick = () => setBet(Math.min(2000, credits));
    betInput.onchange = () => setBet(parseInt(betInput.value) || 10);
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

async function initGameAfterLogin() {
    // Dispara o carregamento para o cache em segundo plano, sem aguardar (sem await)
    SYMBOLS.forEach(s => {
        const img = new Image();
        img.src = s.img;
    });

    // Inicializa o jogo imediatamente
    reels.forEach(r => r.innerHTML = renderSymbolHTML(getRandomSymbol()));
    updateUI();
    checkDailyReset();
    console.log("Jogo inicializado após login");
}