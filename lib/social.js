// ids are stable keys stored in game state; only the display symbol changes.
export const AVATARS = [
  { id: 'fox', symbol: '1', name: 'Player 1' },
  { id: 'panda', symbol: '2', name: 'Player 2' },
  { id: 'frog', symbol: '3', name: 'Player 3' },
  { id: 'robot', symbol: '4', name: 'Player 4' },
  { id: 'lion', symbol: '5', name: 'Player 5' },
  { id: 'penguin', symbol: '6', name: 'Player 6' },
  { id: 'alien', symbol: '7', name: 'Player 7' },
  { id: 'cat', symbol: '8', name: 'Player 8' },
];

export const EMOTES = ['😀', '😮', '😂', '😎', '😭', '👏', '🤝', '🔥'];

export const avatarFor = id => AVATARS.find(a => a.id === id) || AVATARS[0];
export const validAvatar = id => AVATARS.some(a => a.id === id) ? id : AVATARS[0].id;
