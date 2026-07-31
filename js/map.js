/* ================================
   MAP (карта мира)
   Оверлей с картой, кнопками соседних локаций и логикой перехода
   ================================ */

window.mapModule = {
    overlay: null,
    closeBtn: null,
    mapImage: null,
    mapImageContainer: null,
    locationsContainer: null,
    travelOverlay: null,
    travelBar: null,
    travelText: null,

    isOpen: false,
    isTraveling: false,
    travelTimer: null,

    // Zoom & drag state
    scale: 1,
    minScale: 1,
    maxScale: 3,
    translateX: 0,
    translateY: 0,
    isDragging: false,
    dragStartX: 0,
    dragStartY: 0,
    dragStartTranslateX: 0,
    dragStartTranslateY: 0,

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

        // Инициализация зума и перетаскивания
        this.initZoomAndDrag();
    },

    /* ================================
       ZOOM & DRAG
    ================================ */
    initZoomAndDrag() {
        this.mapImageContainer = document.querySelector(".map-image-container");
        if (!this.mapImageContainer) return;

        // Wheel zoom
        this.mapImageContainer.addEventListener("wheel", (e) => {
            e.preventDefault();
            const rect = this.mapImageContainer.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;

            const delta = e.deltaY > 0 ? -0.1 : 0.1;
            const newScale = Math.min(this.maxScale, Math.max(this.minScale, this.scale + delta));

            if (newScale !== this.scale) {
                // Zoom towards mouse pointer
                const scaleRatio = newScale / this.scale;
                this.translateX = mouseX - scaleRatio * (mouseX - this.translateX);
                this.translateY = mouseY - scaleRatio * (mouseY - this.translateY);
                this.scale = newScale;
                this.applyTransform();
            }
        }, { passive: false });

        // Mouse drag
        this.mapImageContainer.addEventListener("mousedown", (e) => {
            if (e.button !== 0) return;
            this.isDragging = true;
            this.dragStartX = e.clientX;
            this.dragStartY = e.clientY;
            this.dragStartTranslateX = this.translateX;
            this.dragStartTranslateY = this.translateY;
            this.mapImageContainer.classList.add("dragging");
        });

        document.addEventListener("mousemove", (e) => {
            if (!this.isDragging) return;
            const dx = e.clientX - this.dragStartX;
            const dy = e.clientY - this.dragStartY;
            this.translateX = this.dragStartTranslateX + dx;
            this.translateY = this.dragStartTranslateY + dy;
            this.applyTransform();
        });

        document.addEventListener("mouseup", () => {
            if (this.isDragging) {
                this.isDragging = false;
                this.mapImageContainer.classList.remove("dragging");
            }
        });
    },

    applyTransform() {
        if (!this.mapImage) return;
        this.mapImage.style.transform = `translate(${this.translateX}px, ${this.translateY}px) scale(${this.scale})`;
    },

    resetZoomAndDrag() {
        this.scale = 1;
        this.translateX = 0;
        this.translateY = 0;
        this.isDragging = false;
        if (this.mapImage) {
            this.mapImage.style.transform = "";
            this.mapImage.style.transition = "transform 0.15s ease-out";
        }
        if (this.mapImageContainer) {
            this.mapImageContainer.classList.remove("dragging");
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

        // Сбрасываем зум и позицию при каждом открытии
        this.resetZoomAndDrag();

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