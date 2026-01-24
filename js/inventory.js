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

            if (item.icon) {
                const img = document.createElement("img");
                img.src = item.icon;
                img.alt = item.name;
                img.className = "inventory-item";
                cell.appendChild(img);
            } else {
                const label = document.createElement("div");
                label.textContent = item.name;
                label.className = "inventory-placeholder";
                cell.appendChild(label);
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
        const item = ITEMS[itemId];
        if (!item) return;

        for (let i = 0; i < state.inventory.length; i++) {
            if (state.inventory[i] === null) {
                state.inventory[i] = item;
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
        if (!item) {
            this.itemInfo.classList.add("hidden");
            this.itemInfo.innerHTML = "";
            return;
        }

        this.itemInfo.classList.remove("hidden");

        let actionsHtml = "";

        if (item.type === "consumable") {
            actionsHtml = `
                <div class="item-actions">
                    <button id="useItemBtn">Использовать</button>
                </div>
            `;
        }

        this.itemInfo.innerHTML = `
            <h4>${item.name}</h4>
            <p>${item.description || ""}</p>
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
        if (!item) return;

        if (item.id === "potion_small") {
            const healAmount = 30;

            state.heroHp = Math.min(
                state.heroHp + healAmount,
                state.heroMaxHp
            );

            state.inventory[index] = null;
            state.selectedItemIndex = null;

            this.renderItems();
            this.renderItemInfo();
            this.updateHeroStats();
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
