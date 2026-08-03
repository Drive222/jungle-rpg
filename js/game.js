// Загружаем данные grimwood_data.json
let GRIMWOOD_DATA_LOADED = false;

async function loadGrimwoodData() {
    try {
        const response = await fetch("assets/grimwood_data.json");
        const data = await response.json();
        window.GRIMWOOD_DATA = data;
        GRIMWOOD_DATA_LOADED = true;
        console.log("✅ Данные Grimwood загружены");
        return data;
    } catch (err) {
        console.warn("⚠️ Не удалось загрузить grimwood_data.json:", err);
        return null;
    }
}

document.addEventListener("DOMContentLoaded", async () => {
    ui.init();
    inventory.init();

    // Загружаем данные карты ДО инициализации карты
    await loadGrimwoodData();

    mapModule.init();

    const inventoryBtn = document.getElementById("inventoryBtn");
    const mapBtn = document.getElementById("mapBtn");
    const menuScreen = document.getElementById("menuScreen");
    const gameScreen = document.getElementById("game");
    const modalLayer = document.getElementById("menuModalLayer");
    const menuModals = Array.from(document.querySelectorAll(".menu-modal"));
    const openModalButtons = Array.from(document.querySelectorAll("[data-open-modal]"));
    const closeModalButtons = Array.from(document.querySelectorAll("[data-close-modal]"));
    const classCards = Array.from(document.querySelectorAll("[data-class-card]"));
    const nameInput = document.getElementById("characterNameInput");
    const createCharacterBtn = document.getElementById("createCharacterBtn");
    const previewSprite = document.getElementById("createPreviewSprite");
    const previewName = document.getElementById("createPreviewName");
    const previewClass = document.getElementById("createPreviewClass");
    const previewHp = document.getElementById("createPreviewHp");
    const previewDmg = document.getElementById("createPreviewDmg");
    let activeModal = null;

    inventoryBtn.addEventListener("click", () => {
        inventory.toggle();
    });

    if (mapBtn) {
        mapBtn.addEventListener("click", () => {
            mapModule.toggle();
        });
    }

    let bestScore = Number(localStorage.getItem("bestScore") || 0);
    ui.recordEl.textContent = `🏆 Рекорд: ${bestScore}`;

    function getSafeCharacterName() {
        const rawName = nameInput ? nameInput.value.trim() : "";
        return rawName || "Странник";
    }

    function updateCreationPreview(classKey) {
        const data = HERO_CLASSES[classKey];
        if (!data) return;

        state.selectedClassKey = classKey;

        if (previewSprite) {
            previewSprite.style.backgroundImage = `url(${data.spriteIdle})`;
        }

        if (previewName) {
            previewName.textContent = getSafeCharacterName();
        }

        if (previewClass) {
            previewClass.textContent = data.name;
        }

        if (previewHp) {
            previewHp.textContent = String(data.hp);
        }

        if (previewDmg) {
            previewDmg.textContent = `${data.minDamage} - ${data.maxDamage}`;
        }
    }

    function openMenuModal(modalId) {
        const modal = document.getElementById(modalId);
        if (!modal) return;

        menuModals.forEach((item) => item.classList.add("hidden"));
        modalLayer.classList.remove("hidden");
        modal.classList.remove("hidden");
        document.body.classList.add("menu-modal-open");
        activeModal = modal;
    }

    function closeMenuModal() {
        if (!activeModal) return;

        activeModal.classList.add("hidden");
        modalLayer.classList.add("hidden");
        document.body.classList.remove("menu-modal-open");
        activeModal = null;
    }

    function resetHeroInventory() {
        state.inventory = new Array(20).fill(null);
        state.selectedItemIndex = null;
        state.selectedEquipmentSlot = null;
        state.equipment = {
            head: null,
            chest: null,
            weaponMain: null,
            weaponOff: null,
            ring: null,
            neck: null,
            cloak: null,
            legs: null,
            boots: null
        };
    }

    function beginGameWithClass(classKey) {
        const data = HERO_CLASSES[classKey];
        if (!data) return;

        state.heroName = getSafeCharacterName();
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
        state.heroBuffs = [];
        state.monsterHp = 0;
        state.monsterCount = 0;
        state.gold = 0;
        state.crystals = 0;
        state.fighting = false;
        state.visitedLocations = ["loc_0_0"];

        resetHeroInventory();

        ui.updateHpBar();
        ui.updateCurrencies();
        ui.hero.className = "hero idle";
        ui.hero.style.backgroundImage = `url(${data.spriteIdle})`;

        inventory.setHeroSprite(data.spriteIdle);
        inventory.addItem("potion_small");
        inventory.addItem("sword_rusty");
        inventory.addItem("hood_old");
        inventory.addItem("ring_copper");
        inventory.recalculateHeroStats();
        inventory.renderItems();
        inventory.renderEquipment();
        inventory.renderItemInfo();

        ui.monster.className = "monster hidden";
        ui.monster.style.backgroundImage = "";
        ui.fightBtn.classList.remove("hidden");
        ui.fightBtn.disabled = false;
        ui.reviveBtn.classList.add("hidden");
        ui.log.innerHTML = "";

        menuScreen.classList.add("hidden");
        gameScreen.classList.remove("hidden");
        closeMenuModal();

        ui.writeLog(`✨ Герой ${state.heroName} вступает в Grimwood`);
        ui.writeLog(`⚔️ Выбран класс: ${data.name}`);
        ui.writeLog("⚔️ Нажми «В БОЙ»");

        mapModule.updatePortalButton();
    }

    openModalButtons.forEach((button) => {
        button.addEventListener("click", () => {
            openMenuModal(button.dataset.openModal);
        });
    });

    closeModalButtons.forEach((button) => {
        button.addEventListener("click", closeMenuModal);
    });

    classCards.forEach((card) => {
        card.addEventListener("click", () => {
            classCards.forEach((item) => item.classList.remove("is-selected"));
            card.classList.add("is-selected");
            updateCreationPreview(card.dataset.classCard);
        });
    });

    if (nameInput) {
        nameInput.addEventListener("input", () => {
            updateCreationPreview(state.selectedClassKey || "warrior");
        });
    }

    if (createCharacterBtn) {
        createCharacterBtn.addEventListener("click", () => {
            beginGameWithClass(state.selectedClassKey || "warrior");
        });
    }

    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape") {
            closeMenuModal();
        }
    });

    updateCreationPreview("warrior");

    ui.fightBtn.addEventListener("click", () => {
        if (state.fighting || state.heroHp <= 0) return;

        state.fighting = true;
        ui.fightBtn.disabled = true;
        battle.spawnMonster();
    });

    ui.reviveBtn.addEventListener("click", () => {
        state.heroHp = state.heroMaxHp;
        state.heroEffects = [];

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
