/* ================================
   MAP (карта мира)
   Оверлей с картой, кнопками соседних локаций и логикой перехода
   ================================ */

window.mapModule = {
    overlay: null,
    closeBtn: null,
    mapImage: null,
    locationsContainer: null,
    travelOverlay: null,
    travelBar: null,
    travelText: null,

    isOpen: false,
    isTraveling: false,
    travelTimer: null,

    /* ================================
       INIT
    ================================ */
    init() {
        this.overlay = document.getElementById("mapOverlay");
        this.closeBtn = document.getElementById("mapCloseBtn");
        this.mapImage = document.getElementById("mapImage");
        this.locationsContainer = document.getElementById("mapLocations");
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

    /* ================================
       ПОЛУЧЕНИЕ СОСЕДНИХ ЛОКАЦИЙ
    ================================ */
    getNeighborLocations() {
        const current = this.getCurrentLocationData();
        if (!current) {
            console.warn("⚠️ mapModule.getNeighborLocations: current location data not found for", state.currentLocation);
            return [];
        }

        console.log("📍 Текущая локация:", state.currentLocation, current.location.name, "(регион:", current.region.name + ")");
        console.log("📋 Roads из данных:", JSON.stringify(current.location.roads || []));

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
            } else {
                console.warn(`⚠️ Не найден соседний локация "${road.to}" для дороги`);
            }
        }

        // 2) Выход в другой регион (exit_to_region)
        const exit = current.region.exit_to_region;
        if (exit && exit.from === state.currentLocation) {
            const exitNeighbor = this.findLocationById(exit.to_location);
            if (exitNeighbor) {
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
                console.log(`➡️ Найден выход в другой регион: ${exitNeighbor.location.name} (${exitNeighbor.region.name})`);
            }
        }

        console.log(`🛣️ Всего найдено путей: ${neighbors.length}`, neighbors.map(n => n.name));

        // Сортируем по возрастанию времени пути (сначала ближайшие)
        neighbors.sort((a, b) => a.travelTimeSeconds - b.travelTimeSeconds);

        return neighbors;
    },

    /* ================================
       РЕНДЕР КАРТЫ
    ================================ */
    render() {
        if (!this.locationsContainer) return;

        // Очищаем контейнер
        this.locationsContainer.innerHTML = "";

        // Получаем соседние локации
        const neighbors = this.getNeighborLocations();

        if (neighbors.length === 0) {
            const emptyMsg = document.createElement("p");
            emptyMsg.className = "map-no-locations";
            emptyMsg.textContent = "Нет доступных путей";
            this.locationsContainer.appendChild(emptyMsg);
            return;
        }

        // Создаём кнопки для каждой соседней локации
        for (const neighbor of neighbors) {
            const btn = document.createElement("button");
            btn.className = "map-location-btn";
            btn.dataset.locationId = neighbor.id;

            // Название локации
            const nameSpan = document.createElement("span");
            nameSpan.className = "map-location-name";
            nameSpan.textContent = neighbor.name;

            // Расстояние в секундах
            const distSpan = document.createElement("span");
            distSpan.className = "map-location-distance";

            // Форматируем время: если >= 60 секунд, показываем минуты
            const time = neighbor.travelTimeSeconds;
            if (time >= 60) {
                const minutes = Math.floor(time / 60);
                const secs = Math.round(time % 60);
                distSpan.textContent = `⏱ ${minutes} мин ${secs} сек`;
            } else {
                distSpan.textContent = `⏱ ${Math.round(time)} сек`;
            }

            btn.appendChild(nameSpan);
            btn.appendChild(distSpan);

            // Обработчик клика — начать переход
            btn.addEventListener("click", () => {
                this.startTravel(neighbor);
            });

            this.locationsContainer.appendChild(btn);
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

        // Скрываем кнопки локаций во время перехода
        const locationBtns = this.locationsContainer.querySelectorAll(".map-location-btn");
        locationBtns.forEach(btn => btn.disabled = true);

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

        // Обновляем карту — показываем новые доступные локации
        this.render();
    },

    /* ================================
       ОТКРЫТЬ / ЗАКРЫТЬ
    ================================ */
    open() {
        if (this.isTraveling) return;

        this.overlay.classList.remove("hidden");
        this.isOpen = true;

        // Устанавливаем изображение карты
        if (this.mapImage) {
            this.mapImage.src = "assets/map/map.webp";
            this.mapImage.alt = "Карта мира Grimwood";
            // Скрываем индикатор загрузки после загрузки изображения
            this.mapImage.onload = () => {
                this.updateLocationHeader();
            };
        }

        // Рендерим доступные локации
        this.render();

        // Показываем текущую локацию в заголовке
        this.updateLocationHeader();
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

        // Очищаем контейнер локаций
        if (this.locationsContainer) {
            this.locationsContainer.innerHTML = "";
        }
    },

    toggle() {
        this.isOpen ? this.close() : this.open();
    }
};