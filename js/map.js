/* ================================
   MAP (карта мира)
   Оверлей с картой, кнопками соседних локаций и логикой перехода
   ================================ */

window.mapModule = {
    REGION_MAP_DESIGN_WIDTH: 1200,
    REGION_MAP_DESIGN_HEIGHT: 800,
    WORLD_MAP_DESIGN_WIDTH: 1536,
    WORLD_MAP_DESIGN_HEIGHT: 1024,

    overlay: null,
    closeBtn: null,
    mapImage: null,
    pinsLayer: null,
    travelOverlay: null,
    travelBar: null,
    travelText: null,

    isOpen: false,
    isTraveling: false,
    travelTimer: null,

    viewMode: "region",
    viewingRegionId: null,

    activeDesignWidth: this.REGION_MAP_DESIGN_WIDTH,
    activeDesignHeight: this.REGION_MAP_DESIGN_HEIGHT,

    calibrationMode: false,

    SCENE_CONFIG: {
        "loc_0_0": { background: "assets/backgrounds/bazaar_scene.webp", disableFight: true }
    },

    /* ================================
       INIT
    ================================ */
    init() {
        this.overlay = document.getElementById("mapOverlay");
        this.closeBtn = document.getElementById("mapCloseBtn");
        this.mapImage = document.getElementById("mapImage");
        this.pinsLayer = document.getElementById("mapPinsLayer");
        this.travelOverlay = document.getElementById("travelOverlay");
        this.travelBar = document.getElementById("travelBar");
        this.travelText = document.getElementById("travelText");

        // Закрытие по кнопке
        if (this.closeBtn) {
            this.closeBtn.addEventListener("click", () => this.close());
        }

        // Закрытие по клику вне карты
        if (this.overlay) {
            this.overlay.addEventListener("click", (e) => {
                if (e.target === this.overlay) {
                    this.close();
                }
            });
        }

        // Клавиша Esc
        document.addEventListener("keydown", (e) => {
            if (e.key === "Escape" && this.isOpen && !this.isTraveling) {
                this.close();
            }
        });

        const viewToggleBtn = document.getElementById("mapViewToggleBtn");
        if (viewToggleBtn) {
            viewToggleBtn.addEventListener("click", () => {
                if (this.viewMode === "region") {
                    this.viewMode = "world";
                    viewToggleBtn.textContent = "📍 Карта региона";
                } else {
                    this.viewMode = "region";
                    this.viewingRegionId = this.getCurrentLocationData().region.id;
                    viewToggleBtn.textContent = "🌍 Карта мира";
                }
                this.renderCurrentView();
            });
        }

        const portalLocationBtn = document.getElementById("portalLocationBtn");
        if (portalLocationBtn) {
            portalLocationBtn.addEventListener("click", () => this.openPortal());
        }

        const portalCloseBtn = document.getElementById("portalCloseBtn");
        if (portalCloseBtn) {
            portalCloseBtn.addEventListener("click", () => this.closePortal());
        }

        if (this.mapImage) {
            this.mapImage.addEventListener("click", (e) => {
                if (!this.calibrationMode) return;

                const rect = this.mapImage.getBoundingClientRect();
                const percentX = ((e.clientX - rect.left) / rect.width) * 100;
                const percentY = ((e.clientY - rect.top) / rect.height) * 100;

                const coords = {
                    x: Math.round((percentX / 100) * this.activeDesignWidth),
                    y: Math.round((percentY / 100) * this.activeDesignHeight)
                };

                ui.writeLog(`Клик: x=${coords.x}, y=${coords.y}`);
                console.log(coords);
            });
        }
    },

    /* ================================
       ПОЛУЧЕНИЕ ДАННЫХ
    ================================ */
    getGrimwoodData() {
        // Пробуем получить данные из grimwood_data.json через fetch
        // Для работы требуется, чтобы данные были загружены
        if (window.GRIMWOOD_DATA) {
            return window.GRIMWOOD_DATA;
        }
        return null;
    },

    getCharacterSpeed() {
        // Берём скорость из класса персонажа
        // Если в state.heroClass есть speed — используем её
        const heroClass = state.heroClass;
        if (!heroClass) return 100; // значение по умолчанию

        // heroClass может быть из HERO_CLASSES (data.js) или из grimwood_data.json
        if (heroClass.speed && typeof heroClass.speed === 'object' && heroClass.speed.final) {
            return heroClass.speed.final;
        }
        if (typeof heroClass.speed === 'number') {
            return heroClass.speed;
        }
        if (heroClass.baseSpeed) {
            return heroClass.baseSpeed;
        }
        return 100;
    },

    findLocationById(locId) {
        const data = this.getGrimwoodData();
        if (!data) return null;
        for (const region of data.regions) {
            for (const loc of region.locations) {
                if (loc.id === locId) {
                    return { location: loc, region };
                }
            }
        }
        return null;
    },

    getCurrentLocationData() {
        const locId = state.currentLocation || "loc_0_0";
        return this.findLocationById(locId);
    },

    markVisited(locId) {
        if (!state.visitedLocations.includes(locId)) {
            state.visitedLocations.push(locId);
        }
    },

    getTeleportTargets() {
        const data = this.getGrimwoodData();
        if (!data) return [];

        const currentRegionId = this.getCurrentLocationData()?.region.id;
        const targets = [];

        for (const region of data.regions) {
            const centralLocId = `loc_${region.id}_0`;
            if (!state.visitedLocations.includes(centralLocId)) continue;
            if (region.id === currentRegionId) continue;

            const centralLoc = region.locations.find((loc) => loc.id === centralLocId);
            if (!centralLoc) continue;

            targets.push({
                regionId: region.id,
                regionName: region.name,
                locationId: centralLocId,
                locationName: centralLoc.name
            });
        }

        return targets;
    },

    teleportTo(locationId) {
        state.currentLocation = locationId;
        this.markVisited(locationId);
        this.closePortal();

        if (this.isOpen) {
            const targetData = this.findLocationById(locationId);
            this.viewMode = "region";
            this.viewingRegionId = targetData ? targetData.region.id : null;
            this.renderCurrentView();
        }

        this.updatePortalButton();
        this.updateLocationScene();
    },

    updatePortalButton() {
        const portalBtn = document.getElementById("portalLocationBtn");
        if (!portalBtn) return;
        portalBtn.classList.toggle("hidden", state.currentLocation !== "loc_0_4");
    },

    updateLocationScene() {
        const scene = document.getElementById("scene");
        const fightBtn = document.getElementById("fightBtn");
        const monster = document.getElementById("monster");
        const hero = document.getElementById("hero");
        const hotspotLayer = document.getElementById("locationHotspotLayer");
        if (!scene) return;
        const current = this.getCurrentLocationData();
        const config = this.SCENE_CONFIG[state.currentLocation];
        const isSafeRegion = current && current.region.type === "safe";

        if (config) {
            scene.style.backgroundImage = `url(${config.background})`;
        } else {
            scene.style.backgroundImage = "";
        }

        if (fightBtn) fightBtn.classList.toggle("hidden", (config && config.disableFight) || isSafeRegion);
        if (hero) hero.classList.toggle("hidden", !!config);
        if (monster) monster.classList.toggle("hidden", true);
        if (hotspotLayer) {
            if (config && config.hotspots !== false && window.shopModule && state.currentLocation === "loc_0_0") {
                shopModule.renderHotspots(hotspotLayer);
            } else {
                hotspotLayer.innerHTML = "";
            }
        }
    },

    openPortal() {
        const overlay = document.getElementById("portalOverlay");
        if (!overlay) return;
        overlay.classList.remove("hidden");
        this.renderPortalList();
    },

    closePortal() {
        const overlay = document.getElementById("portalOverlay");
        if (!overlay) return;
        overlay.classList.add("hidden");
    },

    renderPortalList() {
        const list = document.getElementById("portalList");
        if (!list) return;

        list.innerHTML = "";

        const targets = this.getTeleportTargets();

        if (targets.length === 0) {
            const empty = document.createElement("p");
            empty.className = "bazaar-empty";
            empty.textContent = "Пока нет доступных точек — сначала дойди туда пешком";
            list.appendChild(empty);
            return;
        }

        for (const target of targets) {
            const row = document.createElement("div");
            row.className = "bazaar-item";

            const info = document.createElement("div");
            info.className = "bazaar-item-info";

            const name = document.createElement("div");
            name.className = "bazaar-item-name";
            name.textContent = `${target.regionName} — ${target.locationName}`;

            info.appendChild(name);
            row.appendChild(info);

            const btn = document.createElement("button");
            btn.className = "bazaar-buy-btn";
            btn.textContent = "Телепортироваться";
            btn.addEventListener("click", () => this.teleportTo(target.locationId));

            row.appendChild(btn);
            list.appendChild(row);
        }
    },

    getRegionMapPath(regionId) {
        return `assets/regions/region_${regionId}/map.webp`;
    },

    coordToPercent(coord) {
        return {
            left: (coord.x / this.activeDesignWidth) * 100,
            top: (coord.y / this.activeDesignHeight) * 100
        };
    },

    getWorldMapPath() {
        return "assets/map/map.webp";
    },

    worldCoordToPercent(coord) {
        return {
            left: (coord.x / this.WORLD_MAP_DESIGN_WIDTH) * 100,
            top: (coord.y / this.WORLD_MAP_DESIGN_HEIGHT) * 100
        };
    },

    findRegionById(regionId) {
        const data = this.getGrimwoodData();
        if (!data) return null;
        return data.regions.find((region) => region.id === regionId) || null;
    },

    /* ================================
       ПОЛУЧЕНИЕ СОСЕДНИХ ЛОКАЦИЙ
    ================================ */
    getNeighborLocations() {
        const current = this.getCurrentLocationData();
        if (!current) {
            return [];
        }

        const roads = current.location.roads || [];
        const neighbors = [];

        // 1) Обычные дороги (roads) внутри региона
        for (const road of roads) {
            const neighborData = this.findLocationById(road.to);
            if (neighborData) {
                const speed = this.getCharacterSpeed();
                const distanceSteps = road.distance;
                const travelTimeSeconds = speed > 0 ? distanceSteps / speed : distanceSteps;

                neighbors.push({
                    id: road.to,
                    name: neighborData.location.name,
                    regionName: neighborData.region.name,
                    distance: distanceSteps,
                    travelTimeSeconds: travelTimeSeconds,
                    road: road
                });
            }
        }

        // 2) Выход в другой регион (exit_to_region)
        const exits = Array.isArray(current.region.exit_to_region)
            ? current.region.exit_to_region
            : (current.region.exit_to_region ? [current.region.exit_to_region] : []);

        exits.forEach((exit) => {
            if (exit.from !== state.currentLocation) return;
            const exitNeighbor = this.findLocationById(exit.to_location);
            if (!exitNeighbor) return;
            const speed = this.getCharacterSpeed();
            const distanceSteps = exit.distance;
            const travelTimeSeconds = speed > 0 ? distanceSteps / speed : distanceSteps;

            neighbors.push({
                id: exit.to_location,
                name: exitNeighbor.location.name,
                regionName: exitNeighbor.region.name,
                distance: distanceSteps,
                travelTimeSeconds: travelTimeSeconds,
                road: { to: exit.to_location, distance: exit.distance },
                isExit: true,
                exitDescription: exit.description
            });
        });

        // Сортируем по возрастанию времени пути (сначала ближайшие)
        neighbors.sort((a, b) => a.travelTimeSeconds - b.travelTimeSeconds);

        return neighbors;
    },

    /* ================================
       РЕНДЕР КАРТЫ
    ================================ */
    formatTravelTime(time) {
        if (time >= 60) {
            const minutes = Math.floor(time / 60);
            const secs = Math.round(time % 60);
            return `${minutes} мин ${secs} сек`;
        }
        return `${Math.round(time)} сек`;
    },

    renderRegionPins() {
        if (!this.pinsLayer) return;

        this.pinsLayer.innerHTML = "";

        const playerCurrent = this.getCurrentLocationData();
        const isPlayerRegion = playerCurrent && this.viewingRegionId === playerCurrent.region.id;

        if (!isPlayerRegion) {
            const viewingRegion = this.findRegionById(this.viewingRegionId);
            if (!viewingRegion) return;

            viewingRegion.locations.forEach((loc) => {
                const position = this.coordToPercent(loc.coord);
                const pin = document.createElement("button");
                pin.className = "map-pin";
                pin.style.left = position.left + "%";
                pin.style.top = position.top + "%";

                if (loc.id === playerCurrent.location.id) {
                    pin.classList.add("map-pin--current");
                    pin.title = loc.name;
                } else {
                    pin.classList.add("map-pin--locked");
                    pin.title = loc.name;
                }

                this.pinsLayer.appendChild(pin);
            });

            return;
        }

        const current = playerCurrent;
        const neighbors = this.getNeighborLocations();
        const exitNeighbor = neighbors.find((n) => n.isExit) || null;

        current.region.locations.forEach((loc) => {
            const position = this.coordToPercent(loc.coord);
            const pin = document.createElement("button");
            pin.className = "map-pin";
            pin.style.left = position.left + "%";
            pin.style.top = position.top + "%";

            if (loc.id === state.currentLocation) {
                pin.classList.add("map-pin--current");
                pin.title = loc.name;
            } else {
                const neighbor = neighbors.find((n) => !n.isExit && n.id === loc.id);
                if (neighbor) {
                    pin.classList.add("map-pin--reachable");
                    pin.title = `${neighbor.name} · ${this.formatTravelTime(neighbor.travelTimeSeconds)}`;
                    pin.addEventListener("click", () => {
                        this.startTravel(neighbor);
                    });
                } else {
                    pin.classList.add("map-pin--locked");
                    pin.title = loc.name;
                }
            }

            this.pinsLayer.appendChild(pin);
        });

        if (exitNeighbor) {
            const exitPin = document.createElement("button");
            exitPin.className = "map-pin map-pin--reachable";
            exitPin.style.left = "95%";
            exitPin.style.top = "50%";
            exitPin.title = `➜ ${exitNeighbor.regionName}: ${exitNeighbor.name}`;
            exitPin.addEventListener("click", () => {
                this.startTravel(exitNeighbor);
            });
            this.pinsLayer.appendChild(exitPin);
        }
    },

    renderWorldPins() {
        if (!this.pinsLayer) return;

        this.pinsLayer.innerHTML = "";

        const data = this.getGrimwoodData();
        if (!data) return;

        const playerCurrent = this.getCurrentLocationData();
        const playerRegionId = playerCurrent ? playerCurrent.region.id : null;

        data.regions.forEach((region) => {
            const position = this.worldCoordToPercent(region.coordinates);
            const pin = document.createElement("button");
            pin.className = "map-pin";
            pin.style.left = position.left + "%";
            pin.style.top = position.top + "%";
            pin.title = region.name;

            if (region.id === playerRegionId) {
                pin.classList.add("map-pin--current");
            } else {
                pin.classList.add("map-pin--reachable");
            }

            pin.addEventListener("click", () => {
                this.viewingRegionId = region.id;
                this.viewMode = "region";
                this.renderCurrentView();
            });

            this.pinsLayer.appendChild(pin);
        });
    },

    renderCurrentView() {
        if (this.viewMode === "region") {
            const playerCurrent = this.getCurrentLocationData();
            const region = this.findRegionById(this.viewingRegionId);
            if (!region) return;

            const container = this.getMapImageContainer();
            if (container) {
                container.classList.remove("map-fallback");
            }

            this.activeDesignWidth = this.REGION_MAP_DESIGN_WIDTH;
            this.activeDesignHeight = this.REGION_MAP_DESIGN_HEIGHT;

            this.mapImage.src = this.getRegionMapPath(region.id);
            this.mapImage.onerror = () => {
                this.mapImage.onerror = null;
                const fallbackContainer = this.getMapImageContainer();
                if (fallbackContainer) {
                    fallbackContainer.classList.add("map-fallback");
                }
                this.activeDesignWidth = this.WORLD_MAP_DESIGN_WIDTH;
                this.activeDesignHeight = this.WORLD_MAP_DESIGN_HEIGHT;
                this.mapImage.src = this.getWorldMapPath();
                this.renderRegionPins();
            };
            this.renderRegionPins();

            const isPlayerRegion = playerCurrent && playerCurrent.region.id === region.id;
            const headerEl = document.getElementById("mapCurrentLocation");
            if (headerEl) {
                headerEl.textContent = isPlayerRegion ? `📍 ${region.name}` : `📍 ${region.name} (обзор)`;
            }
        }

        if (this.viewMode === "world") {
            const container = this.getMapImageContainer();
            if (container) {
                container.classList.remove("map-fallback");
            }
            this.activeDesignWidth = this.WORLD_MAP_DESIGN_WIDTH;
            this.activeDesignHeight = this.WORLD_MAP_DESIGN_HEIGHT;
            this.mapImage.src = this.getWorldMapPath();
            this.renderWorldPins();

            const headerEl = document.getElementById("mapCurrentLocation");
            if (headerEl) {
                headerEl.textContent = "Карта мира";
            }
        }
    },

    /* ================================
       ПЕРЕХОД МЕЖДУ ЛОКАЦИЯМИ
    ================================ */
    startTravel(neighbor) {
        if (this.isTraveling) return;
        this.isTraveling = true;

        // Показываем оверлей перехода
        if (this.travelOverlay) {
            this.travelOverlay.classList.remove("hidden");
        }

        const totalTime = neighbor.travelTimeSeconds * 1000; // в миллисекундах
        const startTime = Date.now();

        // Скрываем пины локаций во время перехода
        if (this.pinsLayer) {
            const pinBtns = this.pinsLayer.querySelectorAll(".map-pin");
            pinBtns.forEach(pin => pin.disabled = true);
        }

        // Анимация прогресс-бара
        const updateProgress = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / totalTime, 1);

            if (this.travelBar) {
                this.travelBar.style.width = `${progress * 100}%`;
            }

            if (this.travelText) {
                // Показываем название локации, куда идём
                const remaining = Math.max(0, Math.ceil((totalTime - elapsed) / 1000));
                this.travelText.textContent = `🚶 Переход в ${neighbor.name}... ${remaining} сек`;
            }

            if (progress < 1) {
                this.travelTimer = requestAnimationFrame(updateProgress);
            } else {
                this.completeTravel(neighbor);
            }
        };

        this.travelTimer = requestAnimationFrame(updateProgress);
    },

    completeTravel(neighbor) {
        // Останавливаем таймер
        if (this.travelTimer) {
            cancelAnimationFrame(this.travelTimer);
            this.travelTimer = null;
        }

        // Обновляем текущую локацию персонажа
        state.currentLocation = neighbor.id;
        this.markVisited(neighbor.id);
        this.updatePortalButton();

        // Скрываем оверлей перехода
        if (this.travelOverlay) {
            this.travelOverlay.classList.add("hidden");
        }

        this.isTraveling = false;

        // Лог в игровой чат
        if (window.ui) {
            const currentData = this.findLocationById(neighbor.id);
            if (currentData) {
                ui.writeLog(`🚶 Прибыли в ${neighbor.name} (${currentData.region.name})`);
            } else {
                ui.writeLog(`🚶 Прибыли в ${neighbor.name}`);
            }
        }

        const current = this.getCurrentLocationData();
        this.viewMode = "region";
        this.viewingRegionId = current ? current.region.id : null;
        this.renderCurrentView();
        this.updateLocationScene();
    },

    /* ================================
       ОТКРЫТЬ / ЗАКРЫТЬ
    ================================ */
    getMapImageContainer() {
        if (!this.mapImage) return null;
        return this.mapImage.closest(".map-image-container");
    },

    open() {
        if (this.isTraveling) return;

        this.overlay.classList.remove("hidden");
        this.isOpen = true;

        const current = this.getCurrentLocationData();
        this.viewMode = "region";
        this.viewingRegionId = current ? current.region.id : null;

        const viewToggleBtn = document.getElementById("mapViewToggleBtn");
        if (viewToggleBtn) {
            viewToggleBtn.textContent = "🌍 Карта мира";
        }

        this.renderCurrentView();
    },

    updateLocationHeader() {
        const currentData = this.getCurrentLocationData();
        const headerEl = document.getElementById("mapCurrentLocation");
        if (headerEl) {
            if (currentData) {
                headerEl.textContent = `📍 ${currentData.location.name} (${currentData.region.name})`;
            } else if (window.GRIMWOOD_DATA) {
                // Данные загружены, но локация не найдена — возможно неверный ID
                headerEl.textContent = `📍 Неизвестная локация (${state.currentLocation})`;
            } else {
                // Данные ещё не загружены
                headerEl.textContent = `📍 Загрузка данных карты...`;
            }
        }
    },

    close() {
        if (this.isTraveling) return;

        this.overlay.classList.add("hidden");
        this.isOpen = false;

        // Очищаем слой пинов
        if (this.pinsLayer) {
            this.pinsLayer.innerHTML = "";
        }
    },

    toggle() {
        this.isOpen ? this.close() : this.open();
    }
};

window.toggleMapCalibration = () => {
    mapModule.calibrationMode = !mapModule.calibrationMode;
    console.log(mapModule.calibrationMode ? "Калибровка включена" : "Калибровка выключена");
};
