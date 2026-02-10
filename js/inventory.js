/* ================================
   INVENTORY + EQUIPMENT
================================ */

window.inventory = {
    overlay: null,
    grid: null,
    itemInfo: null,
    closeBtn: null,
    equipSlots: [],
    isOpen: false,

    equipMap: {
        head: "head",
        chest: "chest",
        ring: "ring",
        neck: "neck",
        cloak: "cloak",
        legs: "legs",
        boots: "boots"
    },

    init() {
        this.overlay = document.getElementById("inventoryOverlay");
        this.grid = document.querySelector(".inventory-grid");
        this.itemInfo = document.getElementById("itemInfo");
        this.closeBtn = document.getElementById("inventoryCloseBtn");
        this.equipSlots = Array.from(document.querySelectorAll(".equip-slot[data-slot]"));

        this.createGrid();
        this.bindEquipmentSlots();

        if (this.closeBtn) {
            this.closeBtn.addEventListener("click", () => this.close());
        }

        this.overlay.addEventListener("click", (e) => {
            if (e.target === this.overlay) {
                this.close();
            }
        });
    },

    getItemData(entry) {
        if (!entry || !entry.id) return null;
        return ITEMS[entry.id] || null;
    },

    getItemAmount(entry) {
        if (!entry) return 0;
        return entry.amount || 1;
    },

    makeEntry(itemId, amount = 1) {
        return { id: itemId, amount };
    },

    isStackable(itemData) {
        return Boolean(itemData && itemData.stackable);
    },

    log(text) {
        if (window.ui && ui.log) {
            ui.writeLog(text);
        }
    },

    createGrid() {
        this.grid.innerHTML = "";

        for (let i = 0; i < 20; i++) {
            const cell = document.createElement("div");
            cell.className = "inventory-cell";
            cell.dataset.index = i;
            cell.addEventListener("click", () => this.selectItem(i));
            this.grid.appendChild(cell);
        }
    },

    bindEquipmentSlots() {
        this.equipSlots.forEach((slotEl) => {
            const slotKey = slotEl.dataset.slot;
            slotEl.addEventListener("click", () => this.selectEquipmentSlot(slotKey));
        });
    },

    getEquipmentEntry(slotKey) {
        const entry = state.equipment[slotKey];
        if (entry && entry.blockedBy) {
            return state.equipment[entry.blockedBy] || null;
        }
        return entry;
    },

    renderItems() {
        const cells = this.grid.querySelectorAll(".inventory-cell");

        cells.forEach((cell, index) => {
            cell.innerHTML = "";
            cell.classList.remove("selected");

            const entry = state.inventory[index];
            const itemData = this.getItemData(entry);
            if (!entry || !itemData) return;

            if (itemData.icon) {
                const img = document.createElement("img");
                img.src = itemData.icon;
                img.alt = itemData.name;
                img.className = "inventory-item";
                cell.appendChild(img);
            } else {
                const label = document.createElement("div");
                label.textContent = itemData.name;
                label.className = "inventory-placeholder";
                cell.appendChild(label);
            }

            const amount = this.getItemAmount(entry);
            if (amount > 1) {
                const amountEl = document.createElement("div");
                amountEl.className = "inventory-item-amount";
                amountEl.textContent = `x${amount}`;
                cell.appendChild(amountEl);
            }

            if (state.selectedItemIndex === index) {
                cell.classList.add("selected");
            }
        });
    },

    renderEquipment() {
        this.equipSlots.forEach((slotEl) => {
            const slotKey = slotEl.dataset.slot;
            const directEntry = state.equipment[slotKey];
            const entry = this.getEquipmentEntry(slotKey);
            const itemData = this.getItemData(entry);

            slotEl.innerHTML = "";
            slotEl.classList.remove("has-item", "selected", "blocked");

            if (directEntry && directEntry.blockedBy) {
                slotEl.classList.add("blocked");
                const marker = document.createElement("div");
                marker.className = "equip-slot-blocked";
                marker.textContent = "2H";
                slotEl.appendChild(marker);
            }

            if (entry && itemData) {
                slotEl.classList.add("has-item");

                if (itemData.icon) {
                    const img = document.createElement("img");
                    img.src = itemData.icon;
                    img.alt = itemData.name;
                    img.className = "inventory-item";
                    slotEl.appendChild(img);
                } else {
                    const label = document.createElement("div");
                    label.className = "equip-slot-label";
                    label.textContent = itemData.name;
                    slotEl.appendChild(label);
                }
            }

            if (state.selectedEquipmentSlot === slotKey) {
                slotEl.classList.add("selected");
            }
        });
    },

    selectItem(index) {
        const entry = state.inventory[index];

        if (!entry) {
            state.selectedItemIndex = null;
            state.selectedEquipmentSlot = null;
            this.renderItems();
            this.renderEquipment();
            this.renderItemInfo();
            return;
        }

        state.selectedItemIndex = index;
        state.selectedEquipmentSlot = null;
        this.renderItems();
        this.renderEquipment();
        this.renderItemInfo();
    },

    selectEquipmentSlot(slotKey) {
        const entry = this.getEquipmentEntry(slotKey);

        if (!entry) {
            state.selectedEquipmentSlot = null;
            state.selectedItemIndex = null;
            this.renderEquipment();
            this.renderItems();
            this.renderItemInfo();
            return;
        }

        state.selectedEquipmentSlot = slotKey;
        state.selectedItemIndex = null;
        this.renderEquipment();
        this.renderItems();
        this.renderItemInfo();
    },

    addItem(itemId) {
        const itemData = ITEMS[itemId];
        if (!itemData) return false;

        if (this.isStackable(itemData)) {
            for (let i = 0; i < state.inventory.length; i++) {
                const slot = state.inventory[i];
                if (!slot || slot.id !== itemId) continue;

                const currentAmount = this.getItemAmount(slot);
                if (currentAmount < itemData.maxStack) {
                    state.inventory[i] = this.makeEntry(itemId, currentAmount + 1);
                    this.renderItems();
                    return true;
                }
            }
        }

        for (let i = 0; i < state.inventory.length; i++) {
            if (state.inventory[i] === null) {
                state.inventory[i] = this.makeEntry(itemId, 1);
                this.renderItems();
                return true;
            }
        }

        this.log("🎒 Инвентарь заполнен");
        return false;
    },

    getFreeSlotsCount() {
        return state.inventory.filter((slot) => slot === null).length;
    },

    addEntryToInventory(entry) {
        const itemData = this.getItemData(entry);
        if (!itemData) return false;

        let amountToStore = this.getItemAmount(entry);

        if (this.isStackable(itemData)) {
            for (let i = 0; i < state.inventory.length; i++) {
                const slot = state.inventory[i];
                if (!slot || slot.id !== entry.id) continue;

                const currentAmount = this.getItemAmount(slot);
                const canAdd = Math.max(0, itemData.maxStack - currentAmount);
                if (canAdd <= 0) continue;

                const add = Math.min(canAdd, amountToStore);
                state.inventory[i] = this.makeEntry(entry.id, currentAmount + add);
                amountToStore -= add;

                if (amountToStore === 0) {
                    this.renderItems();
                    return true;
                }
            }
        }

        while (amountToStore > 0) {
            const emptyIndex = state.inventory.findIndex((slot) => slot === null);
            if (emptyIndex === -1) {
                this.log("🎒 Не хватает места в инвентаре");
                this.renderItems();
                return false;
            }

            const putAmount = this.isStackable(itemData)
                ? Math.min(amountToStore, itemData.maxStack)
                : 1;

            state.inventory[emptyIndex] = this.makeEntry(entry.id, putAmount);
            amountToStore -= putAmount;
        }

        this.renderItems();
        return true;
    },

    getEquipTarget(entry) {
        const itemData = this.getItemData(entry);
        if (!itemData) return null;

        if (itemData.equipSlot && this.equipMap[itemData.equipSlot]) {
            return { type: "single", slot: this.equipMap[itemData.equipSlot] };
        }

        if (itemData.equipSlot === "weapon" || itemData.type === "weapon") {
            const handed = itemData.handed === "two" || itemData.twoHanded ? "two" : "one";
            return { type: "weapon", handed };
        }

        return null;
    },

    equipSelectedItem() {
        if (state.selectedItemIndex === null) return;
        this.equipFromInventory(state.selectedItemIndex);
    },

    clearWeaponBlock() {
        if (state.equipment.weaponOff && state.equipment.weaponOff.blockedBy) {
            state.equipment.weaponOff = null;
        }
    },

    unequipEntryFromSlot(slotKey) {
        const directEntry = state.equipment[slotKey];
        const entry = this.getEquipmentEntry(slotKey);
        if (!entry) return true;

        const sourceSlot = directEntry && directEntry.blockedBy ? directEntry.blockedBy : slotKey;

        if (!this.addEntryToInventory(this.makeEntry(entry.id, 1))) {
            return false;
        }

        state.equipment[sourceSlot] = null;
        if (sourceSlot === "weaponMain") {
            this.clearWeaponBlock();
        }

        return true;
    },

    equipFromInventory(index) {
        const entry = state.inventory[index];
        const itemData = this.getItemData(entry);
        if (!entry || !itemData) return;

        const target = this.getEquipTarget(entry);
        if (!target) {
            this.log("ℹ️ Этот предмет нельзя надеть");
            return;
        }

        const currentAmount = this.getItemAmount(entry);
        const consumeInventoryOne = () => {
            if (currentAmount > 1) {
                state.inventory[index] = this.makeEntry(entry.id, currentAmount - 1);
            } else {
                state.inventory[index] = null;
                state.selectedItemIndex = null;
            }
        };

        if (target.type === "single") {
            if (state.equipment[target.slot]) {
                if (!this.unequipEntryFromSlot(target.slot)) return;
            }

            consumeInventoryOne();
            state.equipment[target.slot] = this.makeEntry(entry.id, 1);
            this.log(`🧩 Надето: ${itemData.name}`);
        }

        if (target.type === "weapon") {
            if (target.handed === "two") {
                const needToMove = [];
                if (state.equipment.weaponMain) needToMove.push("weaponMain");
                if (state.equipment.weaponOff && !state.equipment.weaponOff.blockedBy) {
                    needToMove.push("weaponOff");
                }

                const free = this.getFreeSlotsCount();
                if (free < needToMove.length) {
                    this.log("🎒 Недостаточно места, чтобы надеть двуручное оружие");
                    return;
                }

                for (const slot of needToMove) {
                    if (!this.unequipEntryFromSlot(slot)) return;
                }

                consumeInventoryOne();
                state.equipment.weaponMain = this.makeEntry(entry.id, 1);
                state.equipment.weaponOff = { blockedBy: "weaponMain" };
                this.log(`🗡️ Двуручное оружие надето: ${itemData.name}`);
            } else {
                const hasTwoHand = state.equipment.weaponOff && state.equipment.weaponOff.blockedBy;
                if (hasTwoHand) {
                    if (!this.unequipEntryFromSlot("weaponMain")) return;
                }

                const slot = !state.equipment.weaponMain ? "weaponMain" : (!state.equipment.weaponOff ? "weaponOff" : null);
                if (!slot) {
                    this.log("⚠️ Оружейные слоты заняты");
                    return;
                }

                consumeInventoryOne();
                state.equipment[slot] = this.makeEntry(entry.id, 1);
                this.log(`🗡️ Надето оружие: ${itemData.name}`);
            }
        }

        this.recalculateHeroStats();
        this.renderItems();
        this.renderEquipment();
        this.renderItemInfo();
    },

    unequipSelectedSlot() {
        if (!state.selectedEquipmentSlot) return;
        if (!this.unequipEntryFromSlot(state.selectedEquipmentSlot)) return;

        state.selectedEquipmentSlot = null;
        this.recalculateHeroStats();
        this.renderEquipment();
        this.renderItems();
        this.renderItemInfo();
    },

    getEquipmentBonuses() {
        const bonus = {
            hp: 0,
            minDmg: 0,
            maxDmg: 0,
            def: 0
        };

        Object.entries(state.equipment).forEach(([slotKey, entry]) => {
            if (!entry || entry.blockedBy) return;

            if (slotKey === "weaponOff" && state.equipment.weaponOff && state.equipment.weaponOff.blockedBy) {
                return;
            }

            const itemData = this.getItemData(entry);
            if (!itemData) return;

            bonus.hp += itemData.hpBonus || 0;
            bonus.minDmg += itemData.minDamageBonus || 0;
            bonus.maxDmg += itemData.maxDamageBonus || 0;
            bonus.def += itemData.defBonus || 0;
        });

        return bonus;
    },

    recalculateHeroStats() {
        if (!state.heroClass) return;

        const bonus = this.getEquipmentBonuses();

        const oldMaxHp = state.heroMaxHp;
        state.heroMaxHp = state.baseHeroMaxHp + bonus.hp;
        state.heroMinDmg = state.baseHeroMinDmg + bonus.minDmg;
        state.heroMaxDmg = state.baseHeroMaxDmg + bonus.maxDmg;
        state.heroDef = state.baseHeroDef + bonus.def;

        if (oldMaxHp > 0 && state.heroHp > oldMaxHp) {
            state.heroHp = state.heroMaxHp;
        } else {
            state.heroHp = Math.min(state.heroHp, state.heroMaxHp);
        }

        this.updateHeroStats();
        ui.updateHpBar();
    },

    getSelectedEquipmentInfo() {
        const slot = state.selectedEquipmentSlot;
        if (!slot) return null;

        const entry = this.getEquipmentEntry(slot);
        const itemData = this.getItemData(entry);
        if (!entry || !itemData) return null;

        return {
            source: "equipment",
            slot,
            entry,
            itemData
        };
    },

    getSelectedInventoryInfo() {
        const index = state.selectedItemIndex;
        if (index === null) return null;

        const entry = state.inventory[index];
        const itemData = this.getItemData(entry);
        if (!entry || !itemData) return null;

        return {
            source: "inventory",
            index,
            entry,
            itemData
        };
    },

    renderItemInfo() {
        if (!this.itemInfo) return;

        const invInfo = this.getSelectedInventoryInfo();
        const equipInfo = this.getSelectedEquipmentInfo();
        const info = invInfo || equipInfo;

        if (!info) {
            this.itemInfo.classList.add("hidden");
            this.itemInfo.innerHTML = "";
            return;
        }

        this.itemInfo.classList.remove("hidden");

        const { itemData, entry, source } = info;
        const amount = this.getItemAmount(entry);

        const bonusParts = [];
        if (itemData.hpBonus) bonusParts.push(`❤️ +${itemData.hpBonus} HP`);
        if (itemData.minDamageBonus || itemData.maxDamageBonus) {
            bonusParts.push(`⚔️ +${itemData.minDamageBonus || 0}..+${itemData.maxDamageBonus || 0} урона`);
        }
        if (itemData.defBonus) bonusParts.push(`🛡️ +${itemData.defBonus} защиты`);

        let actionsHtml = "";

        if (source === "inventory") {
            if (itemData.type === "consumable") {
                actionsHtml += `<button id="useItemBtn">Использовать</button>`;
            }

            if (this.getEquipTarget(entry)) {
                actionsHtml += `<button id="equipItemBtn">Надеть</button>`;
            }
        }

        if (source === "equipment") {
            actionsHtml += `<button id="unequipItemBtn">Снять</button>`;
        }

        const amountText = source === "inventory" && amount > 1
            ? `<p>Количество: ${amount}</p>`
            : "";

        const bonusText = bonusParts.length > 0
            ? `<p>${bonusParts.join(" · ")}</p>`
            : "";

        this.itemInfo.innerHTML = `
            <h4>${itemData.name}</h4>
            <p>${itemData.description || ""}</p>
            ${amountText}
            ${bonusText}
            <div class="item-actions">${actionsHtml}</div>
        `;

        const useBtn = document.getElementById("useItemBtn");
        if (useBtn) {
            useBtn.addEventListener("click", () => this.useItem(info.index));
        }

        const equipBtn = document.getElementById("equipItemBtn");
        if (equipBtn) {
            equipBtn.addEventListener("click", () => this.equipSelectedItem());
        }

        const unequipBtn = document.getElementById("unequipItemBtn");
        if (unequipBtn) {
            unequipBtn.addEventListener("click", () => this.unequipSelectedSlot());
        }
    },

    useItem(index) {
        const entry = state.inventory[index];
        const itemData = this.getItemData(entry);
        if (!entry || !itemData) return;

        if (itemData.id === "potion_small") {
            const healAmount = 30;
            state.heroHp = Math.min(state.heroHp + healAmount, state.heroMaxHp);

            const amount = this.getItemAmount(entry);
            if (amount > 1) {
                state.inventory[index] = this.makeEntry(itemData.id, amount - 1);
            } else {
                state.inventory[index] = null;
                state.selectedItemIndex = null;
            }

            this.renderItems();
            this.renderItemInfo();
            this.updateHeroStats();
            ui.updateHpBar();
        }
    },

    setHeroSprite(sprite) {
        const spriteEl = document.querySelector(".hero-sprite");
        if (!spriteEl) return;
        spriteEl.style.backgroundImage = `url(${sprite})`;
    },

    updateHeroStats() {
        if (!state.heroClass) return;

        document.getElementById("statHp").textContent =
            `${state.heroHp} / ${state.heroMaxHp}`;

        document.getElementById("statDmg").textContent =
            `${state.heroMinDmg}–${state.heroMaxDmg}`;

        document.getElementById("statDef").textContent =
            state.heroDef;
    },

    open() {
        this.overlay.classList.remove("hidden");
        this.isOpen = true;

        this.renderItems();
        this.renderEquipment();
        this.renderItemInfo();
        this.updateHeroStats();
    },

    close() {
        this.overlay.classList.add("hidden");
        this.isOpen = false;
    },

    toggle() {
        this.isOpen ? this.close() : this.open();
    }
};
