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

    writeLog(text) {
        this.log.innerHTML += text + "<br>";
        this.log.scrollTop = this.log.scrollHeight;
    },

    playAttack(el, sprite) {
        el.classList.remove("attack");
        void el.offsetWidth;
        el.classList.add("attack");
        el.style.backgroundImage = `url(${sprite})`;
    }
};
