/* ================================
   BATTLE
================================ */

window.battle = (() => {

    function random(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    function getWeightedRandomKey(pool) {
        const entries = Object.entries(pool);
        const total = entries.reduce((sum, [, data]) => sum + (data.chance || 0), 0);

        if (total <= 0) return entries[0][0];

        let roll = Math.random() * total;

        for (const [key, data] of entries) {
            roll -= data.chance || 0;
            if (roll <= 0) return key;
        }

        return entries[entries.length - 1][0];
    }

    function isBossWave() {
        return state.monsterCount > 0 && state.monsterCount % 5 === 0;
    }

    function pickEncounter() {
        if (isBossWave()) {
            const bossKey = getWeightedRandomKey({
                rootbound_colossus: { chance: 34 },
                abyss_hart: { chance: 33 },
                witch_queen_thorns: { chance: 33 }
            });

            return {
                key: bossKey,
                data: BOSSES[bossKey],
                isBoss: true
            };
        }

        const monsterKey = getWeightedRandomKey(MONSTERS);
        return {
            key: monsterKey,
            data: MONSTERS[monsterKey],
            isBoss: false
        };
    }

    function createCombatState(encounter) {
        return {
            ...encounter,
            defenseBoost: 0,
            defenseBoostTurns: 0,
            damageMinBoost: 0,
            damageMaxBoost: 0,
            damageBoostTurns: 0,
            dodgeTurns: 0
        };
    }

    function applyOngoingHeroEffects() {
        if (!state.heroEffects) state.heroEffects = [];

        let totalDamage = 0;
        const next = [];

        state.heroEffects.forEach((effect) => {
            totalDamage += effect.damagePerTurn;
            if (effect.turnsLeft - 1 > 0) {
                next.push({
                    ...effect,
                    turnsLeft: effect.turnsLeft - 1
                });
            }
        });

        if (totalDamage > 0) {
            state.heroHp -= totalDamage;
            ui.updateHpBar();
            ui.writeLog(`☣️ Эффекты наносят герою ${totalDamage} урона`);
        }

        state.heroEffects = next;

        if (state.heroBuffs && state.heroBuffs.length > 0) {
            let buffExpired = false;
            const nextBuffs = [];

            state.heroBuffs.forEach((buff) => {
                buff.turnsLeft--;
                if (buff.turnsLeft <= 0) {
                    buffExpired = true;
                } else {
                    nextBuffs.push(buff);
                }
            });

            state.heroBuffs = nextBuffs;

            if (buffExpired) {
                inventory.recalculateHeroStats();
            }
        }
    }

    function addHeroEffect(effectName, damage, turns) {
        if (!state.heroEffects) state.heroEffects = [];
        state.heroEffects.push({
            name: effectName,
            damagePerTurn: damage,
            turnsLeft: turns
        });
    }

    function applyMonsterAbilities(combat) {
        const abilities = combat.data.abilities || [];

        abilities.forEach((ability) => {
            if (Math.random() > (ability.chance || 0)) return;

            if (ability.effect === "poison") {
                addHeroEffect(ability.name, ability.damage || 3, ability.turns || 2);
                ui.writeLog(`🕯️ ${combat.data.name} применяет «${ability.name}»`);
            }

            if (ability.effect === "bleed") {
                addHeroEffect(ability.name, ability.damage || 3, ability.turns || 2);
                ui.writeLog(`🩸 ${combat.data.name} применяет «${ability.name}»`);
            }

            if (ability.effect === "fortify") {
                combat.defenseBoost = ability.defenseBoost || 2;
                combat.defenseBoostTurns = ability.turns || 1;
                ui.writeLog(`🛡️ ${combat.data.name} укрепляет защиту (${combat.defenseBoost})`);
            }

            if (ability.effect === "enrage") {
                combat.damageMinBoost = ability.minBoost || 2;
                combat.damageMaxBoost = ability.maxBoost || 3;
                combat.damageBoostTurns = ability.turns || 1;
                ui.writeLog(`🔥 ${combat.data.name} впадает в ярость`);
            }

            if (ability.effect === "dodge") {
                combat.dodgeTurns = ability.turns || 1;
                ui.writeLog(`💨 ${combat.data.name} становится неуловимым`);
            }
        });
    }

    function decayMonsterBuffs(combat) {
        if (combat.defenseBoostTurns > 0) {
            combat.defenseBoostTurns--;
            if (combat.defenseBoostTurns === 0) {
                combat.defenseBoost = 0;
            }
        }

        if (combat.damageBoostTurns > 0) {
            combat.damageBoostTurns--;
            if (combat.damageBoostTurns === 0) {
                combat.damageMinBoost = 0;
                combat.damageMaxBoost = 0;
            }
        }

        if (combat.dodgeTurns > 0) {
            combat.dodgeTurns--;
        }
    }

    function spawnMonster() {
        state.monsterCount++;

        const encounter = pickEncounter();
        const combat = createCombatState(encounter);

        state.monsterHp = combat.data.hp;

        ui.monster.className = `monster ${combat.data.cssClass || combat.key}`;
        ui.monster.style.backgroundImage = `url(${combat.data.spriteIdle})`;
        ui.monster.classList.remove("hidden");

        const title = combat.isBoss
            ? `👑 БОСС: ${combat.data.name}`
            : `${combat.data.name} №${state.monsterCount}`;
        ui.writeLog(`${title} выходит из леса!`);

        battleTurn(combat);
    }

    function battleTurn(combat) {
        applyOngoingHeroEffects();

        if (state.heroHp <= 0) {
            die();
            return;
        }

        if (state.monsterHp <= 0) {
            ui.monster.classList.add("hidden");
            ui.writeLog(`☠️ ${combat.data.name} побеждён`);
            ui.writeLog(`❤️ У героя осталось ${state.heroHp} HP`);

            const goldReward = combat.isBoss ? 45 : 12 + Math.floor(state.monsterCount / 5);
            const crystalReward = combat.isBoss ? 6 : 2;

            state.gold += goldReward;
            state.crystals += crystalReward;
            ui.updateCurrencies();

            if (combat.isBoss && combat.data.reward) {
                ui.writeLog(`🎁 Награда: ${combat.data.reward}`);
            }

            ui.writeLog(`🪙 Получено ${goldReward} золота`);
            ui.writeLog(`🔷 Получено ${crystalReward} кристаллов`);

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
        const rawHeroDmg = random(state.heroMinDmg, state.heroMaxDmg);

        if (combat.dodgeTurns > 0 && Math.random() < 0.5) {
            ui.writeLog(`💨 ${combat.data.name} уклоняется от удара`);
        } else {
            const finalHeroDmg = Math.max(1, rawHeroDmg - ((combat.data.defense || 0) + combat.defenseBoost));
            state.monsterHp -= finalHeroDmg;
            ui.writeLog(`⚔️ Герой ударил (-${finalHeroDmg})`);
        }

        setTimeout(() => {
            ui.hero.classList.remove("attack");
            ui.hero.style.backgroundImage =
                `url(${state.heroClass.spriteIdle})`;

            if (state.monsterHp <= 0) {
                battleTurn(combat);
                return;
            }

            applyMonsterAbilities(combat);

            ui.playAttack(ui.monster, combat.data.spriteAttack);
            const monsterDmg = random(
                combat.data.minAttack + combat.damageMinBoost,
                combat.data.maxAttack + combat.damageMaxBoost
            );
            state.heroHp -= monsterDmg;
            ui.updateHpBar();
            ui.writeLog(`${combat.data.name} ударил (-${monsterDmg})`);

            setTimeout(() => {
                ui.monster.classList.remove("attack");
                ui.monster.style.backgroundImage =
                    `url(${combat.data.spriteIdle})`;
                decayMonsterBuffs(combat);
                setTimeout(() => battleTurn(combat), 160);
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
