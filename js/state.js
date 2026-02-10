/* ================================
   STATE
   global game state
================================ */

window.state = {
    /* ================================
       HERO
    ================================ */
    heroClass: null,

    heroHp: 0,
    heroMaxHp: 0,

    heroMinDmg: 0,
    heroMaxDmg: 0,

    heroDef: 0,

    baseHeroMaxHp: 0,
    baseHeroMinDmg: 0,
    baseHeroMaxDmg: 0,
    baseHeroDef: 0,

    /* ================================
       MONSTERS / BATTLE
    ================================ */
    monsterHp: 0,
    monsterCount: 0,

    fighting: false,
    selectedClassKey: null,

    /* ================================
       INVENTORY + EQUIPMENT
    ================================ */
    inventory: new Array(20).fill(null),
    selectedItemIndex: null,
    selectedEquipmentSlot: null,

    equipment: {
        head: null,
        chest: null,
        weaponMain: null,
        weaponOff: null,
        ring: null,
        neck: null,
        cloak: null,
        legs: null,
        boots: null
    }
};
