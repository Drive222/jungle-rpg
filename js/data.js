/* ================================
   DATA
================================ */

window.HERO_CLASSES = {
    warrior: {
        name: "⚔️ Воин",
        hp: 120,
        minDamage: 35,
        maxDamage: 50,
        spriteIdle: "assets/heroes/warrior/idle.png",
        spriteAttack: "assets/heroes/warrior/attack.png"
    },
    mage: {
        name: "🧙 Маг",
        hp: 90,
        minDamage: 45,
        maxDamage: 65,
        spriteIdle: "assets/heroes/mage/idle.png",
        spriteAttack: "assets/heroes/mage/attack.png"
    },
    archer: {
        name: "🏹 Лучник",
        hp: 100,
        minDamage: 40,
        maxDamage: 60,
        spriteIdle: "assets/heroes/archer/idle.png",
        spriteAttack: "assets/heroes/archer/attack.png"
    }
};

window.MONSTERS = {
    goblin: {
        name: "🧌 Гоблин",
        baseHp: 60,
        hpGrowth: 10,
        minAttack: 18,
        maxAttack: 28,
        chance: 0.6,
        spriteIdle: "assets/monsters/goblin/idle.png",
        spriteAttack: "assets/monsters/goblin/attack.png"
    },
    wolf: {
        name: "🐺 Волк",
        baseHp: 90,
        hpGrowth: 15,
        minAttack: 28,
        maxAttack: 42,
        chance: 0.4,
        spriteIdle: "assets/monsters/wolf/idle.png",
        spriteAttack: "assets/monsters/wolf/attack.png"
    }
};

/* ================================
   ITEMS
================================ */

const ITEMS = {
    potion_small: {
        id: "potion_small",
        name: "Малое зелье лечения",
        description: "Восстанавливает 30 HP.",
        icon: "assets/items/potion_red.png",
        type: "consumable",
        stackable: true,
        maxStack: 5
    },

    sword_rusty: {
        id: "sword_rusty",
        name: "Ржавый меч",
        description: "Старый меч. Урон небольшой, но лучше, чем ничего.",
        type: "weapon",
        equipSlot: "weapon",
        handed: "one",
        minDamageBonus: 4,
        maxDamageBonus: 7,
        stackable: false
    },

    hood_old: {
        id: "hood_old",
        name: "Старый капюшон",
        description: "Простой головной убор.",
        type: "armor",
        equipSlot: "head",
        defBonus: 2,
        stackable: false
    },

    ring_copper: {
        id: "ring_copper",
        name: "Медное кольцо",
        description: "Чуть усиливает здоровье.",
        type: "accessory",
        equipSlot: "ring",
        hpBonus: 10,
        stackable: false
    },

    // Одноручное оружие
    blade_doomwhisper: {
        id: "blade_doomwhisper",
        name: "Клинок Погибели",
        description: "Лезвие выковано из руды, добытой в забытых катакомбах. От него веет ледяной злостью.",
        type: "weapon",
        equipSlot: "weapon",
        handed: "one",
        minDamageBonus: 6,
        maxDamageBonus: 10,
        defBonus: 1,
        stackable: false
    },
    thorn_fang: {
        id: "thorn_fang",
        name: "Клык Терновника",
        description: "Изогнутый меч друидов-изгнанников, напитанный ядом чёрных лоз. Каждый взмах оставляет кровавый след.",
        type: "weapon",
        equipSlot: "weapon",
        handed: "one",
        minDamageBonus: 5,
        maxDamageBonus: 11,
        hpBonus: 8,
        stackable: false
    },
    ember_warden_mace: {
        id: "ember_warden_mace",
        name: "Булава Тлеющего Дозора",
        description: "Сердцевина булавы хранит угли древнего костра стражей леса. Удары дробят кости и волю.",
        type: "weapon",
        equipSlot: "weapon",
        handed: "one",
        minDamageBonus: 7,
        maxDamageBonus: 9,
        defBonus: 2,
        stackable: false
    },

    // Двуручное оружие
    thunder_lord_hammer: {
        id: "thunder_lord_hammer",
        name: "Молот Громовержца",
        description: "Гром заперт в рунах на бойке этого молота. Земля дрожит, когда он обрушивается на врага.",
        type: "weapon",
        equipSlot: "weapon",
        handed: "two",
        minDamageBonus: 10,
        maxDamageBonus: 16,
        stackable: false
    },
    moonreap_halberd: {
        id: "moonreap_halberd",
        name: "Алебарда Лунной Жатвы",
        description: "Сталь алебарды впитала свет затмений. Её острие разрезает доспех так же легко, как ночной туман.",
        type: "weapon",
        equipSlot: "weapon",
        handed: "two",
        minDamageBonus: 9,
        maxDamageBonus: 17,
        hpBonus: 10,
        stackable: false
    },
    abyss_oak_cleaver: {
        id: "abyss_oak_cleaver",
        name: "Секира Бездонного Дуба",
        description: "Топорище вырезано из чёрного дуба, растущего над могилами королей. Один удар оставляет трещины в щитах.",
        type: "weapon",
        equipSlot: "weapon",
        handed: "two",
        minDamageBonus: 11,
        maxDamageBonus: 15,
        defBonus: 1,
        stackable: false
    },

    // Ожерелья
    amulet_ashen_prayer: {
        id: "amulet_ashen_prayer",
        name: "Ожерелье Пепельной Молитвы",
        description: "Зачарованные кости на нити шепчут забытые литании. Владелец чувствует их защиту в смертельный миг.",
        type: "accessory",
        equipSlot: "neck",
        hpBonus: 22,
        defBonus: 2,
        stackable: false
    },
    pendant_black_dawn: {
        id: "pendant_black_dawn",
        name: "Кулон Чёрной Зари",
        description: "Камень кулона впитывает первые лучи рассвета и превращает их в силу. Свет в нём никогда не гаснет полностью.",
        type: "accessory",
        equipSlot: "neck",
        minDamageBonus: 3,
        maxDamageBonus: 6,
        hpBonus: 12,
        stackable: false
    },
    chain_gravekeeper_oath: {
        id: "chain_gravekeeper_oath",
        name: "Цепь Клятвы Могильщика",
        description: "Железные звенья скованы над братской могилой древнего ордена. Они делают сердце хозяина твёрже стали.",
        type: "accessory",
        equipSlot: "neck",
        hpBonus: 16,
        defBonus: 4,
        stackable: false
    },

    // Кольца
    ring_withered_king: {
        id: "ring_withered_king",
        name: "Кольцо Иссохшего Короля",
        description: "Тронный артефакт короля, чьё имя стёрто из летописей. Оно требует крови, но дарует стойкость.",
        type: "accessory",
        equipSlot: "ring",
        hpBonus: 18,
        defBonus: 2,
        stackable: false
    },
    ring_raven_eclipse: {
        id: "ring_raven_eclipse",
        name: "Кольцо Вороньего Затмения",
        description: "Чёрный обсидиан в оправе поглощает свет и делает удары хозяина точнее. Вороны следуют за этим знаком.",
        type: "accessory",
        equipSlot: "ring",
        minDamageBonus: 4,
        maxDamageBonus: 7,
        stackable: false
    },
    ring_deep_roots: {
        id: "ring_deep_roots",
        name: "Кольцо Глубинных Корней",
        description: "Изнутри кольцо покрыто живыми рунами лесных духов. Оно связывает носителя с древней землёй.",
        type: "accessory",
        equipSlot: "ring",
        hpBonus: 12,
        minDamageBonus: 2,
        maxDamageBonus: 4,
        stackable: false
    },

    // Штаны
    greaves_gloom_path: {
        id: "greaves_gloom_path",
        name: "Поножи Тропы Мрака",
        description: "Кожаные пластины впитали сырость ночных чащ. Они дают шагу уверенность даже на костях врагов.",
        type: "armor",
        equipSlot: "legs",
        hpBonus: 14,
        defBonus: 3,
        stackable: false
    },
    trousers_bramble_watch: {
        id: "trousers_bramble_watch",
        name: "Штаны Терновой Стражи",
        description: "Швы пропитаны смолой священных деревьев. Ткань гасит боль и удерживает тепло в ледяном тумане.",
        type: "armor",
        equipSlot: "legs",
        hpBonus: 20,
        defBonus: 2,
        stackable: false
    },
    leggings_barrow_warden: {
        id: "leggings_barrow_warden",
        name: "Поножи Курганного Стража",
        description: "Кольчужные нити звенят, как дальний колокол могил. Их носили воины, охранявшие запретные склепы.",
        type: "armor",
        equipSlot: "legs",
        defBonus: 5,
        minDamageBonus: 1,
        maxDamageBonus: 2,
        stackable: false
    },

    // Ботинки
    boots_night_trail: {
        id: "boots_night_trail",
        name: "Ботинки Ночной Тропы",
        description: "Мягкая подошва заглушает шаги на мокрой листве. Даже звери не слышат приближения охотника.",
        type: "armor",
        equipSlot: "boots",
        hpBonus: 10,
        defBonus: 2,
        stackable: false
    },
    sabatons_iron_moss: {
        id: "sabatons_iron_moss",
        name: "Сабатоны Железного Мха",
        description: "Их металл покрыт живым мхом, что впитывает кровь и тьму. Носитель держится на ногах после тяжких ударов.",
        type: "armor",
        equipSlot: "boots",
        hpBonus: 14,
        defBonus: 3,
        stackable: false
    },
    boots_hollow_embers: {
        id: "boots_hollow_embers",
        name: "Ботинки Пустотного Пепла",
        description: "Пепел из древнего святилища запаян в кожу. Каждый шаг разжигает в воине ярость выживания.",
        type: "armor",
        equipSlot: "boots",
        minDamageBonus: 2,
        maxDamageBonus: 4,
        defBonus: 2,
        stackable: false
    },

    // Нагрудники
    cuirass_blood_oak: {
        id: "cuirass_blood_oak",
        name: "Кираса Кровавого Дуба",
        description: "Пластины брони скреплены корой древнего дерева, видевшего сотни казней. Она держит удар и гнев.",
        type: "armor",
        equipSlot: "chest",
        hpBonus: 24,
        defBonus: 6,
        stackable: false
    },
    breastplate_silent_howl: {
        id: "breastplate_silent_howl",
        name: "Нагрудник Безмолвного Воя",
        description: "Внутри стали звучит глухой вой лесных духов. Он отводит смертоносные удары от сердца.",
        type: "armor",
        equipSlot: "chest",
        hpBonus: 18,
        defBonus: 7,
        stackable: false
    },
    armor_rune_thorns: {
        id: "armor_rune_thorns",
        name: "Доспех Рунных Шипов",
        description: "Руны на броне вспыхивают при опасности, будто колючий венец. Враг платит за каждую ошибку.",
        type: "armor",
        equipSlot: "chest",
        hpBonus: 20,
        defBonus: 5,
        minDamageBonus: 2,
        maxDamageBonus: 3,
        stackable: false
    },

    // Шлемы
    helm_cold_throne: {
        id: "helm_cold_throne",
        name: "Шлем Холодного Трона",
        description: "Лобовая пластина хранит печать замёрзшего королевства. Его носили те, кто не склонял колен.",
        type: "armor",
        equipSlot: "head",
        hpBonus: 12,
        defBonus: 4,
        stackable: false
    },
    hood_moon_shadow: {
        id: "hood_moon_shadow",
        name: "Капюшон Лунной Тени",
        description: "Тьма прячется в складках ткани, пока луна не коснётся её краёв. Тогда она становится живой бронёй.",
        type: "armor",
        equipSlot: "head",
        hpBonus: 8,
        defBonus: 3,
        minDamageBonus: 2,
        maxDamageBonus: 4,
        stackable: false
    },
    crown_withered_thorns: {
        id: "crown_withered_thorns",
        name: "Корона Увядших Шипов",
        description: "Изломанные шипы венца хранят клятвы павших владык. Она дарует стойкость ценой вечной тяжести.",
        type: "armor",
        equipSlot: "head",
        hpBonus: 16,
        defBonus: 3,
        stackable: false
    },

    // Плащи
    cloak_moonshade: {
        id: "cloak_moonshade",
        name: "Плащ Лунной Тени",
        description: "Ткань соткана из нитей ночного тумана. Она скрывает силуэт и укрывает от смертоносных чар.",
        type: "armor",
        equipSlot: "cloak",
        hpBonus: 14,
        defBonus: 3,
        stackable: false
    },
    mantle_black_briar: {
        id: "mantle_black_briar",
        name: "Мантия Чёрного Шипа",
        description: "Этот плащ принадлежал стражу запретной рощи. От него веет колдовством старого леса.",
        type: "armor",
        equipSlot: "cloak",
        minDamageBonus: 3,
        maxDamageBonus: 6,
        defBonus: 2,
        stackable: false
    },
    shroud_forgotten_saints: {
        id: "shroud_forgotten_saints",
        name: "Покров Забытых Святых",
        description: "Серый покров был снят с алтаря, где молились о спасении во тьме. Он хранит слабый, но упрямый свет.",
        type: "armor",
        equipSlot: "cloak",
        hpBonus: 20,
        defBonus: 2,
        stackable: false
    }
};
