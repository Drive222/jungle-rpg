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

    heroDef: 0, // защита (пока 0, позже экипировка)

    /* ================================
       MONSTERS / BATTLE
    ================================ */
    monsterHp: 0,
    monsterCount: 0,

    fighting: false,
    selectedClassKey: null,

    /* ================================
       INVENTORY (STEP 6.2)
    ================================ */
    inventory: new Array(20).fill(null), // 20 ячеек
    selectedItemIndex: null              // выбранный предмет
};
