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
            color: "#3f51b5"
        },
        mage: {
            name: "🧙 Маг",
            hp: 90,
            minDamage: 45,
            maxDamage: 65,
            color: "#8e24aa"
        },
        archer: {
            name: "🏹 Лучник",
            hp: 100,
            minDamage: 40,
            maxDamage: 60,
            color: "#2e7d32"
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
       RECORD (localStorage)
    ================================ */
    let bestScore = localStorage.getItem("bestScore");
    bestScore = bestScore ? Number(bestScore) : 0;
    recordEl.textContent = `🏆 Рекорд: ${bestScore}`;

    /* ================================
       HELPERS
    ================================ */
    function random(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    function writeLog(text) {
        log.innerHTML += text + "<br>";
        log.scrollTop = log.scrollHeight;
    }

    function getRandomMonsterType() {
        return Math.random() < MONSTERS.goblin.chance ? "goblin" : "wolf";
    }

    /* ================================
       CLASS SELECTION (2 CLICKS)
    ================================ */
    document.querySelectorAll(".classes button").forEach(btn => {
        btn.addEventListener("click", () => {
            const classKey = btn.dataset.class;
            const data = HERO_CLASSES[classKey];

            // 1-й клик — показать статы
            if (selectedClassKey !== classKey) {
                selectedClassKey = classKey;

                previewName.textContent = data.name;
                previewHp.textContent = `❤️ HP: ${data.hp}`;
                previewDmg.textContent =
                    `⚔️ Урон: ${data.minDamage} – ${data.maxDamage}`;

                classPreview.classList.remove("hidden");
                return;
            }

            // 2-й клик — подтверждение выбора
            heroClass = data;
            heroMaxHp = data.hp;
            heroHp = heroMaxHp;
            heroMinDmg = data.minDamage;
            heroMaxDmg = data.maxDamage;

            document.querySelector(".hero .torso").style.background =
                data.color;

            classSelect.style.display = "none";
            game.classList.remove("hidden");

            writeLog(`✨ Выбран класс: ${data.name}`);
            writeLog("⚔️ Нажми «В БОЙ»");
        });
    });

    /* ================================
       FIGHT BUTTON
    ================================ */
    fightBtn.addEventListener("click", () => {
        if (fighting || heroHp <= 0) return;

        fighting = true;
        fightBtn.disabled = true;

        writeLog("🌲 Герой движется вперёд...");
        hero.classList.add("run");

        setTimeout(() => {
            hero.classList.remove("run");
            spawnMonster();
        }, 350);
    });

    /* ================================
       SPAWN MONSTER
    ================================ */
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

    /* ================================
       BATTLE LOOP
    ================================ */
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

        // Атака героя
        hero.classList.add("attack");
        const heroDmg = random(heroMinDmg, heroMaxDmg);
        monsterHp -= heroDmg;
        writeLog(`⚔️ Герой ударил (-${heroDmg})`);

        setTimeout(() => {
            hero.classList.remove("attack");

            if (monsterHp <= 0) {
                battleTurn(type, data);
                return;
            }

            // Атака монстра
            monster.classList.add("attack");
            const monsterDmg = random(
                data.minAttack,
                data.maxAttack
            );
            heroHp -= monsterDmg;
            writeLog(`${data.name} ударил (-${monsterDmg})`);

            setTimeout(() => {
                monster.classList.remove("attack");
                setTimeout(() => battleTurn(type, data), 140);
            }, 80);

        }, 80);
    }

    /* ================================
       DEATH & RECORD
    ================================ */
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

    /* ================================
       REVIVE
    ================================ */
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
