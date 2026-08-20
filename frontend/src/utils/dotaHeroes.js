export const DOTA_HEROES = {
  1: 'Anti-Mage', 2: 'Axe', 3: 'Bane', 4: 'Bloodseeker', 5: 'Crystal Maiden',
  6: 'Drow Ranger', 7: 'Earthshaker', 8: 'Juggernaut', 9: 'Mirana', 10: 'Morphling',
  11: 'Shadow Fiend', 14: 'Pudge', 18: 'Sven', 22: 'Zeus', 25: 'Lina',
  26: 'Lion', 35: 'Sniper', 44: 'Phantom Assassin', 48: 'Luna', 49: 'Dragon Knight',
  53: 'Nature\'s Prophet', 74: 'Invoker', 86: 'Rubick', 99: 'Bristleback'
};

export const getDotaHeroName = (heroId) => DOTA_HEROES[heroId] || `Hero #${heroId}`;
