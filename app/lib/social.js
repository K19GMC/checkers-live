export const AVATARS = [
  { id: 'fox', symbol: '🦊', name: 'Fox' },
  { id: 'panda', symbol: '🐼', name: 'Panda' },
  { id: 'frog', symbol: '🐸', name: 'Frog' },
  { id: 'robot', symbol: '🤖', name: 'Robot' },
  { id: 'lion', symbol: '🦁', name: 'Lion' },
  { id: 'penguin', symbol: '🐧', name: 'Penguin' },
  { id: 'alien', symbol: '👽', name: 'Alien' },
  { id: 'cat', symbol: '🐱', name: 'Cat' },
];

export const EMOTES = ['😀', '😮', '😂', '😎', '😭', '👏', '🤝', '🔥'];

export const avatarFor = id => AVATARS.find(a => a.id === id) || AVATARS[0];
export const validAvatar = id => AVATARS.some(a => a.id === id) ? id : AVATARS[0].id;
