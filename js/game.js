document.addEventListener("DOMContentLoaded", () => {
    console.log("Game init");

    /* ================================
       INIT UI & INVENTORY
    ================================ */
    ui.init();
    inventory.init();

    const inventoryBtn = document.getElementById("inventoryBtn");
    inventoryBtn.addEventListener("click", () => {
        inventory.toggle();
    });

    /* ================================
       RECORD
    ================================ */
    let bestScore = Number(localStorage.getItem("bestScore") || 0);
    ui.recordEl.textContent = `🏆 Рекорд: ${bestScore}`;

    /* ================================
       CLASS SELECTION
    ================================ */
    document.querySelectorAll(".classes button").forEach(btn => {
        btn.addEventListener("click", () => {
            const key = btn.dataset.class;
            const data = HERO_CLASSES[key];

            // 1️⃣ ПЕРВЫЙ КЛИК — превью
            if (state.selectedClassKey !== key) {
                state.selectedClassKey = key;

                document.getElementById("previewName").textContent = data.name;
                document.getElementById("previewHp").textContent = `❤️ HP: ${data.hp}`;
                document.getElementById("previewDmg").textContent =
                    `⚔️ Урон: ${data.minDamage} – ${data.maxDamage}`;

                document.getElementById("classPreview")
                    .classList.remove("hidden");
                return;
            }

            // 2️⃣ ВТОРОЙ КЛИК — ОКОНЧАТЕЛЬНЫЙ ВЫБОР ГЕРОЯ
            state.heroClass = data;
            state.baseHeroMaxHp = data.hp;
            state.baseHeroMinDmg = data.minDamage;
            state.baseHeroMaxDmg = data.maxDamage;
            state.baseHeroDef = 0;

            state.heroMaxHp = data.hp;
            state.heroHp = data.hp;
            state.heroMinDmg = data.minDamage;
            state.heroMaxDmg = data.maxDamage;
            state.heroDef = 0;
            state.heroEffects = [];

            // 🔥 ОБНОВЛЯЕМ HP-БАР СРАЗУ
            ui.updateHpBar();

            // герой на сцене
            ui.hero.className = "hero idle";
            ui.hero.style.backgroundImage = `url(${data.spriteIdle})`;

            // герой в инвентаре
            inventory.setHeroSprite(data.spriteIdle);
            inventory.updateHeroStats();
            inventory.addItem("potion_small");
            inventory.addItem("sword_rusty");
            inventory.addItem("hood_old");
            inventory.addItem("ring_copper");
            inventory.recalculateHeroStats();

            // переход в игру
            document.getElementById("classSelect").style.display = "none";
            document.getElementById("game").classList.remove("hidden");

            ui.writeLog(`✨ Выбран класс: ${data.name}`);
            ui.writeLog("⚔️ Нажми «В БОЙ»");
        });
    });

    /* ================================
       FIGHT
    ================================ */
    ui.fightBtn.addEventListener("click", () => {
        if (state.fighting || state.heroHp <= 0) return;

        state.fighting = true;
        ui.fightBtn.disabled = true;
        battle.spawnMonster();
    });

    /* ================================
       REVIVE
    ================================ */
    ui.reviveBtn.addEventListener("click", () => {
        state.heroHp = state.heroMaxHp;
        state.heroEffects = [];

        // 🔥 ОБНОВЛЯЕМ HP-БАР
        ui.updateHpBar();

        state.monsterCount = 0;
        document.getElementById("log").innerHTML = "";

        ui.writeLog("✨ Герой возродился");
        ui.writeLog("⚔️ Готов к новым боям");

        ui.reviveBtn.classList.add("hidden");
        ui.fightBtn.classList.remove("hidden");
        ui.fightBtn.disabled = false;
    });
});
