/* ================================
   BATTLE
================================ */

window.battle = (() => {

    function random(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    function getRandomMonsterType() {
        return Math.random() < MONSTERS.goblin.chance ? "goblin" : "wolf";
    }

    function spawnMonster() {
        state.monsterCount++;

        const type = getRandomMonsterType();
        const data = MONSTERS[type];

        state.monsterHp =
            data.baseHp +
            random(0, data.hpGrowth) +
            state.monsterCount * 3;

        ui.monster.className = `monster ${type}`;
        ui.monster.style.backgroundImage = `url(${data.spriteIdle})`;
        ui.monster.classList.remove("hidden");

        ui.writeLog(`${data.name} №${state.monsterCount} выходит из леса!`);
        battleTurn(type, data);
    }

    function battleTurn(type, data) {
        if (state.heroHp <= 0) {
            die();
            return;
        }

        if (state.monsterHp <= 0) {
            ui.monster.classList.add("hidden");
            ui.writeLog(`☠️ ${data.name} побеждён`);
            ui.writeLog(`❤️ У героя осталось ${state.heroHp} HP`);

            const bestScore = Number(localStorage.getItem("bestScore") || 0);
            if (state.monsterCount > bestScore) {
                localStorage.setItem("bestScore", String(state.monsterCount));
                ui.recordEl.textContent = `🏆 Рекорд: ${state.monsterCount}`;
                ui.writeLog(`🏆 Новый рекорд: ${state.monsterCount}`);
            }

            state.fighting = false;
            ui.fightBtn.disabled = false;
            return;
        }

        ui.playAttack(ui.hero, state.heroClass.spriteAttack);
        const heroDmg = random(state.heroMinDmg, state.heroMaxDmg);
        state.monsterHp -= heroDmg;
        ui.writeLog(`⚔️ Герой ударил (-${heroDmg})`);

        setTimeout(() => {
            ui.hero.classList.remove("attack");
            ui.hero.style.backgroundImage =
                `url(${state.heroClass.spriteIdle})`;

            if (state.monsterHp <= 0) {
                battleTurn(type, data);
                return;
            }

            ui.playAttack(ui.monster, data.spriteAttack);
            const monsterDmg = random(data.minAttack, data.maxAttack);
            state.heroHp -= monsterDmg;
            ui.updateHpBar();
            ui.writeLog(`${data.name} ударил (-${monsterDmg})`);

            setTimeout(() => {
                ui.monster.classList.remove("attack");
                ui.monster.style.backgroundImage =
                    `url(${data.spriteIdle})`;
                setTimeout(() => battleTurn(type, data), 160);
            }, 600);

        }, 600);
    }

    function die() {
        ui.monster.classList.add("hidden");
        ui.writeLog("💀 Герой погиб");

        ui.fightBtn.classList.add("hidden");
        ui.reviveBtn.classList.remove("hidden");
        state.fighting = false;
    }

    return {
        spawnMonster
    };
})();
