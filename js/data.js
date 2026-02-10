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
        description: "Одноручный меч. Немного увеличивает урон.",
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
    }
};
