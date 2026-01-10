document.addEventListener("DOMContentLoaded", () => {
    console.log("game.js loaded");

    /* ================================
       DOM ELEMENTS
    ================================ */
    const classSelect = document.getElementById("classSelect");
    const game = document.getElementById("game");

    const hero = document.getElementById("hero");
    const monster = document.getElementById("monster");
    const log = document.getElementById("log");

    const fightBtn = document.getElementById("fightBtn");
    const reviveBtn = document.getElementById("reviveBtn");

    const classPreview = document.getElementById("classPreview");
    const previewName = document.getElementById("previewName");
    const previewHp = document.getElementById("previewHp");
    const previewDmg = document.getElementById("previewDmg");

    const recordEl = document.getElementById("record");

    /* ================================
       HERO CLASSES
    ================================ */
    const HERO_CLASSES = {
        warrior: {
            name: "⚔️ Воин",
            hp: 120,
            minDamage: 35,
            maxDamage: 50,
            spriteIdle: "assets/heroes/warrior/idle.png",
            spriteAttack: "assets/heroes/warrior/attack.png"
        },
        mage: {
            name: "🧙 Маг",
            hp: 90,
            minDamage: 45,
            maxDamage: 65,
            spriteIdle: "assets/heroes/mage/idle.png",
            spriteAttack: "assets/heroes/mage/attack.png"
        },
        archer: {
            name: "🏹 Лучница",
            hp: 100,
            minDamage: 40,
            maxDamage: 60,
            spriteIdle: "assets/heroes/archer/idle.png",
            spriteAttack: "assets/heroes/archer/attack.png"
        }
    };

    /* ================================
       MONSTERS
    ================================ */
    const MONSTERS = {
        goblin: {
            name: "🧌 Гоблин",
            baseHp: 60,
            hpGrowth: 10,
            minAttack: 18,
            maxAttack: 28,
            chance: 0.6
        },
        wolf: {
            name: "🐺 Волк",
            baseHp: 90,
            hpGrowth: 15,
            minAttack: 28,
            maxAttack: 42,
            chance: 0.4
        }
    };

    /* ================================
       GAME STATE
    ================================ */
    let heroClass = null;
    let heroMaxHp = 0;
    let heroHp = 0;
    let heroMinDmg = 0;
    let heroMaxDmg = 0;

    let monsterHp = 0;
    let monsterCount = 0;
    let fighting = false;
    let selectedClassKey = null;

    /* ================================
       RECORD
    ================================ */
    let bestScore = Number(localStorage.getItem("bestScore") || 0);
    recordEl.textContent = `🏆 Рекорд: ${bestScore}`;

    /* ================================
       HELPERS
    ================================ */
    function random(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    /**
     * ⭐ ЖЁСТКО ОГРАНИЧЕННЫЙ СКРОЛЛ ЛОГА
     * ЛОГ НИКОГДА НЕ ДОЕЗЖАЕТ ДО НИЗА
     * последняя строка всегда полностью видна
     */
    function writeLog(text) {
    const prevScrollTop = log.scrollTop;
    const prevScrollHeight = log.scrollHeight;

    log.innerHTML += text + "<br>";

    const lineHeight = 18; // под твой font-size
    const maxAllowedScroll =
        log.scrollHeight - log.clientHeight - lineHeight;

    // если мы были выше "безопасной зоны" — скроллим
    if (prevScrollTop < maxAllowedScroll) {
        log.scrollTop = prevScrollTop + (log.scrollHeight - prevScrollHeight);
    } else {
        // иначе ЖЁСТКО держим на безопасной границе
        log.scrollTop = maxAllowedScroll;
    }
}

    function getRandomMonsterType() {
        return Math.random() < MONSTERS.goblin.chance ? "goblin" : "wolf";
    }

    /* ================================
       CLASS SELECTION
    ================================ */
    document.querySelectorAll(".classes button").forEach(btn => {
        btn.addEventListener("click", () => {
            const classKey = btn.dataset.class;
            const data = HERO_CLASSES[classKey];

            if (selectedClassKey !== classKey) {
                selectedClassKey = classKey;

                previewName.textContent = data.name;
                previewHp.textContent = `❤️ HP: ${data.hp}`;
                previewDmg.textContent =
                    `⚔️ Урон: ${data.minDamage} – ${data.maxDamage}`;

                classPreview.classList.remove("hidden");
                return;
            }

            heroClass = data;
            heroMaxHp = data.hp;
            heroHp = heroMaxHp;
            heroMinDmg = data.minDamage;
            heroMaxDmg = data.maxDamage;

            hero.style.backgroundImage = `url(${data.spriteIdle})`;
            hero.className = "hero idle";

            classSelect.style.display = "none";
            game.classList.remove("hidden");

            writeLog(`✨ Выбран класс: ${data.name}`);
            writeLog("⚔️ Нажми «В БОЙ»");
        });
    });

    /* ================================
       FIGHT
    ================================ */
    fightBtn.addEventListener("click", () => {
        if (fighting || heroHp <= 0) return;

        fighting = true;
        fightBtn.disabled = true;
        spawnMonster();
    });

    function spawnMonster() {
        monsterCount++;

        const type = getRandomMonsterType();
        const data = MONSTERS[type];

        monsterHp =
            data.baseHp +
            random(0, data.hpGrowth) +
            monsterCount * 3;

        monster.className = `monster ${type}`;
        monster.classList.remove("hidden");

        writeLog(`${data.name} №${monsterCount} выходит из леса!`);
        battleTurn(type, data);
    }

    function battleTurn(type, data) {
        if (heroHp <= 0) {
            die();
            return;
        }

        if (monsterHp <= 0) {
            monster.classList.add("hidden");
            writeLog(`☠️ ${data.name} побеждён`);
            writeLog(`❤️ У героя осталось ${heroHp} HP`);
            writeLog("⏸️ Нажми «В БОЙ» для следующего врага");

            fighting = false;
            fightBtn.disabled = false;
            return;
        }

        hero.classList.add("attack");
        hero.style.backgroundImage = `url(${heroClass.spriteAttack})`;

        const heroDmg = random(heroMinDmg, heroMaxDmg);
        monsterHp -= heroDmg;
        writeLog(`⚔️ Герой ударил (-${heroDmg})`);

        setTimeout(() => {
            hero.classList.remove("attack");
            hero.style.backgroundImage = `url(${heroClass.spriteIdle})`;

            if (monsterHp <= 0) {
                battleTurn(type, data);
                return;
            }

            monster.classList.add("attack");
            const monsterDmg = random(
                data.minAttack,
                data.maxAttack
            );
            heroHp -= monsterDmg;
            writeLog(`${data.name} ударил (-${monsterDmg})`);

            setTimeout(() => {
                monster.classList.remove("attack");
                setTimeout(() => battleTurn(type, data), 160);
            }, 120);

        }, 500);
    }

    function die() {
        monster.classList.add("hidden");

        const score = monsterCount - 1;

        writeLog("💀 Герой погиб");
        writeLog(`🏁 Побеждено монстров: ${score}`);

        if (score > bestScore) {
            bestScore = score;
            localStorage.setItem("bestScore", bestScore);
            recordEl.textContent = `🏆 Рекорд: ${bestScore}`;
            writeLog("🔥 НОВЫЙ РЕКОРД!");
        }

        fightBtn.classList.add("hidden");
        reviveBtn.classList.remove("hidden");
        fighting = false;
    }

    reviveBtn.addEventListener("click", () => {
        heroHp = heroMaxHp;
        monsterCount = 0;
        log.innerHTML = "";

        writeLog("✨ Герой возродился");
        writeLog("⚔️ Готов к новым боям");

        reviveBtn.classList.add("hidden");
        fightBtn.classList.remove("hidden");
        fightBtn.disabled = false;
    });
});
