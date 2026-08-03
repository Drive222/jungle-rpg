window.shopModule = {
    BAZAAR_DESIGN_WIDTH: 1600,
    BAZAAR_DESIGN_HEIGHT: 900,

    MERCHANTS: [
        { id: "weapon", name: "Оружейник", coord: { x: 248, y: 396 }, category: (item) => item.equipSlot === "weapon", stock: ["sword_rusty"] },
        { id: "armor", name: "Бронник", coord: { x: 615, y: 392 }, category: (item) => ["head","chest","legs","boots","cloak"].includes(item.equipSlot), stock: ["hood_old"] },
        { id: "accessories", name: "Ювелир", coord: { x: 982, y: 403 }, category: (item) => ["ring","neck"].includes(item.equipSlot), stock: ["ring_copper"] },
        { id: "potions", name: "Зельевар", coord: { x: 1385, y: 394 }, category: (item) => item.type === "consumable", stock: ["potion_small"] }
    ],

    activeMerchantId: null,
    calibrationMode: false,

    init() {
        const popupCloseBtn = document.getElementById("merchantPopupCloseBtn");
        if (popupCloseBtn) popupCloseBtn.addEventListener("click", () => this.closeMerchantPopup());

        const scene = document.getElementById("scene");
        if (scene) {
            scene.addEventListener("click", (e) => {
                if (!this.calibrationMode) return;
                const rect = scene.getBoundingClientRect();
                const percentX = ((e.clientX - rect.left) / rect.width) * 100;
                const percentY = ((e.clientY - rect.top) / rect.height) * 100;
                const coords = {
                    x: Math.round((percentX / 100) * this.BAZAAR_DESIGN_WIDTH),
                    y: Math.round((percentY / 100) * this.BAZAAR_DESIGN_HEIGHT)
                };
                ui.writeLog(`Клик по сцене: x=${coords.x}, y=${coords.y}`);
                console.log(coords);
            });
        }
    },

    coordToPercent(coord) {
        return {
            left: (coord.x / this.BAZAAR_DESIGN_WIDTH) * 100,
            top: (coord.y / this.BAZAAR_DESIGN_HEIGHT) * 100
        };
    },

    renderHotspots(layer) {
        layer.innerHTML = "";
        this.MERCHANTS.forEach((merchant) => {
            const pos = this.coordToPercent(merchant.coord);
            const btn = document.createElement("button");
            btn.className = "merchant-hotspot";
            btn.style.left = pos.left + "%";
            btn.style.top = pos.top + "%";
            btn.title = merchant.name;
            btn.addEventListener("click", () => this.openMerchantPopup(merchant.id));
            layer.appendChild(btn);
        });
    },

    openMerchantPopup(merchantId) {
        this.activeMerchantId = merchantId;
        const merchant = this.MERCHANTS.find((m) => m.id === merchantId);
        if (!merchant) return;

        document.getElementById("merchantPopupTitle").textContent = merchant.name;
        const buyList = document.getElementById("merchantBuyList");
        const sellList = document.getElementById("merchantSellList");
        buyList.innerHTML = "";
        sellList.innerHTML = "";

        if (merchant.stock.length === 0) {
            buyList.innerHTML = "<p class=\"bazaar-empty\">Пока нечего купить</p>";
        }

        merchant.stock.forEach((itemId) => {
            const itemData = ITEMS[itemId];
            if (!itemData) return;
            const icon = itemData.currency === "crystal" ? "💎" : "🪙";
            const balance = itemData.currency === "crystal" ? state.crystals : state.gold;
            const row = document.createElement("div");
            row.className = "bazaar-item";
            row.innerHTML = `<div class="bazaar-item-info"><div class="bazaar-item-name">${itemData.name}</div></div><span>${itemData.price} ${icon}</span>`;
            const btn = document.createElement("button");
            btn.className = "bazaar-buy-btn";
            btn.textContent = "Купить";
            btn.disabled = balance < itemData.price;
            btn.addEventListener("click", () => this.buyItem(itemId));
            row.appendChild(btn);
            buyList.appendChild(row);
        });

        const sellableEntries = state.inventory
            .map((entry, index) => ({ entry, index }))
            .filter(({ entry }) => entry && ITEMS[entry.id] && ITEMS[entry.id].price && merchant.category(ITEMS[entry.id]));

        if (sellableEntries.length === 0) {
            sellList.innerHTML = "<p class=\"bazaar-empty\">Нечего продать этому продавцу</p>";
        }

        sellableEntries.forEach(({ entry, index }) => {
            const itemData = ITEMS[entry.id];
            const icon = itemData.currency === "crystal" ? "💎" : "🪙";
            const sellPrice = Math.floor(itemData.price / 2);
            const row = document.createElement("div");
            row.className = "bazaar-item";
            row.innerHTML = `<div class="bazaar-item-info"><div class="bazaar-item-name">${itemData.name}</div></div><span>${sellPrice} ${icon}</span>`;
            const btn = document.createElement("button");
            btn.className = "bazaar-buy-btn";
            btn.textContent = "Продать";
            btn.addEventListener("click", () => this.sellItem(index));
            row.appendChild(btn);
            sellList.appendChild(row);
        });

        document.getElementById("merchantPopup").classList.remove("hidden");
    },

    closeMerchantPopup() {
        document.getElementById("merchantPopup").classList.add("hidden");
        this.activeMerchantId = null;
    },

    buyItem(itemId) {
        const itemData = ITEMS[itemId];
        if (!itemData) return;
        const balance = itemData.currency === "crystal" ? state.crystals : state.gold;
        if (balance < itemData.price) return;
        if (!inventory.addItem(itemId)) return;
        if (itemData.currency === "crystal") {
            state.crystals -= itemData.price;
        } else {
            state.gold -= itemData.price;
        }
        ui.updateCurrencies();
        ui.writeLog(`🏪 Куплено: ${itemData.name}`);
        this.openMerchantPopup(this.activeMerchantId);
    },

    sellItem(index) {
        const entry = state.inventory[index];
        const itemData = entry ? ITEMS[entry.id] : null;
        if (!itemData || !itemData.price) return;
        const sellPrice = Math.floor(itemData.price / 2);
        const amount = inventory.getItemAmount(entry);
        if (amount > 1) {
            state.inventory[index] = inventory.makeEntry(entry.id, amount - 1);
        } else {
            state.inventory[index] = null;
        }
        if (itemData.currency === "crystal") {
            state.crystals += sellPrice;
        } else {
            state.gold += sellPrice;
        }
        ui.updateCurrencies();
        inventory.renderItems();
        ui.writeLog(`🏪 Продано: ${itemData.name} за ${sellPrice} ${itemData.currency === "crystal" ? "💎" : "🪙"}`);
        this.openMerchantPopup(this.activeMerchantId);
    }
};

window.toggleBazaarCalibration = () => {
    shopModule.calibrationMode = !shopModule.calibrationMode;
    console.log(shopModule.calibrationMode ? "Калибровка сцены включена" : "Калибровка сцены выключена");
};
