/* ================================
   INVENTORY (steps 3–6.5)
   overlay + grid + hero avatar + hero stats + items + item info + use item + close
================================ */

window.inventory = {
    overlay: null,
    grid: null,
    itemInfo: null,
    closeBtn: null,
    isOpen: false,

    getItemData(entry) {
        if (!entry) return null;

        if (entry.id && ITEMS[entry.id]) {
            return ITEMS[entry.id];
        }

        return entry;
    },

    getItemAmount(entry) {
        if (!entry) return 0;
        return entry.amount || 1;
    },

    /* ================================
       INIT
    ================================ */
    init() {
        this.overlay = document.getElementById("inventoryOverlay");
        this.grid = document.querySelector(".inventory-grid");
        this.itemInfo = document.getElementById("itemInfo");
        this.closeBtn = document.getElementById("inventoryCloseBtn");

        this.createGrid();

        // кнопка ❌
        if (this.closeBtn) {
            this.closeBtn.addEventListener("click", () => {
                this.close();
            });
        }

        // клик по затемнению — закрыть
        this.overlay.addEventListener("click", (e) => {
            if (e.target === this.overlay) {
                this.close();
            }
        });
    },

    /* ================================
       GRID
    ================================ */
    createGrid() {
        this.grid.innerHTML = "";

        for (let i = 0; i < 20; i++) {
            const cell = document.createElement("div");
            cell.className = "inventory-cell";
            cell.dataset.index = i;

            cell.addEventListener("click", () => {
                this.selectItem(i);
            });

            this.grid.appendChild(cell);
        }
    },

    /* ================================
       RENDER ITEMS (STEP 6.3)
    ================================ */
    renderItems() {
        const cells = this.grid.querySelectorAll(".inventory-cell");

        cells.forEach((cell, index) => {
            cell.innerHTML = "";
            cell.classList.remove("selected");

            const item = state.inventory[index];
            if (!item) return;

            const itemData = this.getItemData(item);
            const amount = this.getItemAmount(item);
            if (!itemData) return;

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

    /* ================================
       SELECT ITEM
    ================================ */
    selectItem(index) {
        const item = state.inventory[index];

        if (!item) {
            state.selectedItemIndex = null;
            this.renderItems();
            this.renderItemInfo();
            return;
        }

        state.selectedItemIndex = index;
        this.renderItems();
        this.renderItemInfo();
    },

    /* ================================
       ADD ITEM (TEMP / TEST)
    ================================ */
    addItem(itemId) {
        const itemData = ITEMS[itemId];
        if (!itemData) return;

        if (itemData.stackable) {
            for (let i = 0; i < state.inventory.length; i++) {
                const slot = state.inventory[i];
                if (!slot || slot.id !== itemId) continue;

                const currentAmount = this.getItemAmount(slot);
                if (currentAmount < itemData.maxStack) {
                    state.inventory[i] = {
                        id: itemId,
                        amount: currentAmount + 1
                    };
                    this.renderItems();
                    return;
                }
            }
        }

        for (let i = 0; i < state.inventory.length; i++) {
            if (state.inventory[i] === null) {
                state.inventory[i] = {
                    id: itemId,
                    amount: 1
                };
                break;
            }
        }

        this.renderItems();
    },

    /* ================================
       ITEM INFO + ACTIONS (STEP 6.4–6.5)
    ================================ */
    renderItemInfo() {
        if (!this.itemInfo) return;

        const index = state.selectedItemIndex;

        if (index === null) {
            this.itemInfo.classList.add("hidden");
            this.itemInfo.innerHTML = "";
            return;
        }

        const item = state.inventory[index];
        const itemData = this.getItemData(item);

        if (!item || !itemData) {
            this.itemInfo.classList.add("hidden");
            this.itemInfo.innerHTML = "";
            return;
        }

        this.itemInfo.classList.remove("hidden");

        let actionsHtml = "";

        if (itemData.type === "consumable") {
            actionsHtml = `
                <div class="item-actions">
                    <button id="useItemBtn">Использовать</button>
                </div>
            `;
        }

        const amount = this.getItemAmount(item);
        const amountText = amount > 1 ? `<p>Количество: ${amount}</p>` : "";

        this.itemInfo.innerHTML = `
            <h4>${itemData.name}</h4>
            <p>${itemData.description || ""}</p>
            ${amountText}
            ${actionsHtml}
        `;

        const useBtn = document.getElementById("useItemBtn");
        if (useBtn) {
            useBtn.addEventListener("click", () => {
                this.useItem(index);
            });
        }
    },

    /* ================================
       USE ITEM (STEP 6.5)
    ================================ */
    useItem(index) {
        const item = state.inventory[index];
        const itemData = this.getItemData(item);
        if (!item || !itemData) return;

        if (itemData.id === "potion_small") {
            const healAmount = 30;

            state.heroHp = Math.min(
                state.heroHp + healAmount,
                state.heroMaxHp
            );

            const amount = this.getItemAmount(item);
            if (amount > 1) {
                state.inventory[index] = {
                    id: itemData.id,
                    amount: amount - 1
                };
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

    /* ================================
       HERO AVATAR
    ================================ */
    setHeroSprite(sprite) {
        const spriteEl = document.querySelector(".hero-sprite");
        if (!spriteEl) return;

        spriteEl.style.backgroundImage = `url(${sprite})`;
    },

    /* ================================
       HERO STATS
    ================================ */
    updateHeroStats() {
        if (!state.heroClass) return;

        document.getElementById("statHp").textContent =
            `${state.heroHp} / ${state.heroMaxHp}`;

        document.getElementById("statDmg").textContent =
            `${state.heroMinDmg}–${state.heroMaxDmg}`;

        document.getElementById("statDef").textContent =
            state.heroDef;
    },

    /* ================================
       OPEN / CLOSE
    ================================ */
    open() {
        this.overlay.classList.remove("hidden");
        this.isOpen = true;

        this.renderItems();
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
