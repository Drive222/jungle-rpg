/* ================================
   UI
================================ */

window.ui = {
    hero: null,
    monster: null,
    log: null,
    fightBtn: null,
    reviveBtn: null,
    recordEl: null,

    init() {
        this.hero = document.getElementById("hero");
        this.monster = document.getElementById("monster");
        this.log = document.getElementById("log");
        this.fightBtn = document.getElementById("fightBtn");
        this.reviveBtn = document.getElementById("reviveBtn");
        this.recordEl = document.getElementById("record");
    },

    /* ================================
       LOG
    ================================ */
    writeLog(text) {
        this.log.innerHTML += text + "<br>";
        this.log.scrollTop = this.log.scrollHeight;
    },

    /* ================================
       ANIMATIONS
    ================================ */
    playAttack(el, sprite) {
        el.classList.remove("attack");
        void el.offsetWidth; // перезапуск анимации
        el.classList.add("attack");
        el.style.backgroundImage = `url(${sprite})`;
    },

    /* ================================
       HERO HP BAR
    ================================ */
    updateHpBar() {
        const bar = document.getElementById("heroHpBar");
        const text = document.getElementById("heroHpText");

        if (!bar || !text || state.heroMaxHp === 0) return;

        const percent = Math.max(
            0,
            (state.heroHp / state.heroMaxHp) * 100
        );

        // ширина
        bar.style.width = percent + "%";

        // текст
        text.textContent = `${state.heroHp} / ${state.heroMaxHp}`;

        // цвет
        bar.classList.remove("hp-good", "hp-mid", "hp-low");

        if (percent > 60) {
            bar.classList.add("hp-good");
        } else if (percent > 30) {
            bar.classList.add("hp-mid");
        } else {
            bar.classList.add("hp-low");
        }
    }
};
