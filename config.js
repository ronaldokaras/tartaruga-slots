// ==================== config.js ====================
// Todas as constantes do jogo Tartaruga Sortuda

const CONFIG = {

    // ---------- SÍMBOLOS E VALORES ----------
    SYMBOLS: [
        { img: "img/tartaruga.png", name: "TARTARUGA", value: 45, weight: 1 },
        { img: "img/trevo.png",    name: "TREVO",     value: 25, weight: 2 },
        { img: "img/diamante.png", name: "DIAMANTE",  value: 20, weight: 3 },
        { img: "img/estrela.png",  name: "ESTRELA",   value: 16, weight: 4 },
        { img: "img/concha.png",   name: "CONCHA",    value: 12, weight: 5 },
        { img: "img/onda.png",     name: "ONDA",      value: 10, weight: 6 },
        { img: "img/melancia.png", name: "MELANCIA",  value: 8,  weight: 7 }
    ],

    // ---------- APOSTAS ----------
    BET: {
        MIN: 10,
        MAX: 2000,
        STEP: 100,
        DEFAULT: 25
    },

    // ---------- MULTIPLICADORES DE PRÊMIOS (linha do meio) ----------
    PAYOUTS: {
        TURTLE_3:      10,     // 3 tartarugas
        TURTLE_2_TREVO: 6,     // 2 tartarugas + 1 trevo
        TURTLE_2:       4,     // 2 tartarugas
        TREVO_3:        5,     // 3 trevos
        THREE_SAME:     0.3,   // multiplicador base para 3 símbolos iguais (aplicado sobre o valor do símbolo)
        PAIR:           1,     // prêmio para qualquer par (2 símbolos iguais)
        BONUS_TURTLE:   2,     // bônus ao acumular 20 tartarugas (em créditos)
        BONUS_THRESHOLD:20     // quantas tartarugas para ativar o bônus
    },

    // ---------- PROBABILIDADES (pesos) ----------
    // O sorteio usa os pesos para escolher um símbolo. Quanto maior o peso, mais comum.
    // No código original, cada símbolo tem a mesma chance. Agora você pode ajustar.
    // Exemplo: TARTARUGA (peso 1) é mais rara, MELANCIA (peso 7) é mais comum.
    // O cálculo será: soma dos pesos, e cada símbolo tem probabilidade = peso/soma.
    // O método getRandomSymbol() usará esta tabela.

    // ---------- MULTIPLICADOR DE RAQUETE (win streak) ----------
    STREAK: {
        MAX_MULTIPLIER: 3,
        INCREMENT:      1,     // a cada quantas vitórias seguidas aumenta o multiplicador
        BASE:           1
    },

    // ---------- JACKPOT ----------
    JACKPOT: {
        PERCENT_LOSS:  0.05,   // 5% da aposta quando perde
        PERCENT_WIN:   0.02,   // 2% do ganho quando ganha
        MAX:           50000
    },

    // ---------- NÍVEL E XP ----------
    LEVEL: {
        XP_PER_LEVEL:  100,    // XP necessário para subir de nível (base)
        BONUS_CREDITS: 500,    // créditos ganhos ao subir de nível
        XP_PER_WIN:    0.1     // fração do ganho convertida em XP (ex: ganho 100 → 10 XP)
    },

    // ---------- MISSÕES DIÁRIAS ----------
    MISSIONS: [
        { id: "spin10",     desc: "Gire 10 vezes",        target: 10, reward: 100 },
        { id: "win3streak", desc: "Ganhe 3 vezes seguidas", target: 3,  reward: 150 },
        { id: "turtle5",    desc: "Acumule 5 tartarugas",  target: 5,  reward: 125 },
        { id: "bigWin",     desc: "Ganhe mais de 500 em 1 rodada", target: 1, reward: 250 }
    ],

    // ---------- GIROS GRÁTIS ----------
    FREE_SPINS: {
        COUNT: 2,          // número de giros grátis concedidos
        AUTO_DELAY: 600    // ms entre giros grátis automáticos
    },

    // ---------- ANIMAÇÃO ----------
    ANIMATION: {
        SPIN_INTERVAL: 50,     // ms entre cada troca de símbolo durante o giro
        SPIN_DURATION: 500,    // duração total do giro (ms)
        AUTO_SPIN_DELAY: 400,  // ms entre giros automáticos
        HIGHLIGHT_DURATION: 1400, // ms que a linha do meio fica destacada
        WIN_EFFECT_SMALL: 900,  // duração do efeito de vitória pequena
        WIN_EFFECT_BIG: 1600,   // duração do efeito de vitória grande
        CONFETTI_COUNT: 40,
        CONFETTI_DURATION: 2500
    },

    // ---------- CRÉDITOS INICIAIS ----------
    INITIAL_CREDITS: 1000,

    // ---------- LIMITES DO RANKING ----------
    RANKING_LIMIT: 10
};

// Função auxiliar para sortear símbolo com pesos
CONFIG.getRandomSymbol = function() {
    const symbols = this.SYMBOLS;
    const totalWeight = symbols.reduce((acc, s) => acc + s.weight, 0);
    let rand = Math.random() * totalWeight;
    for (let sym of symbols) {
        rand -= sym.weight;
        if (rand <= 0) {
            return { ...sym }; // retorna cópia para evitar mutação acidental
        }
    }
    return { ...symbols[symbols.length - 1] };
};