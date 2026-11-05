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

// Camera photos are stored inline with the player as a small square JPEG data URL.
export const AVATAR_PHOTO_MAX = 48 * 1024;
const PHOTO_RE = /^data:image\/(?:jpeg|png|webp);base64,[A-Za-z0-9+/]+={0,2}$/;
export const isPhotoAvatar = value =>
  typeof value === 'string' && value.length <= AVATAR_PHOTO_MAX && PHOTO_RE.test(value);
// Keeps preset IDs as-is, accepts valid photos, and falls back to the default preset otherwise.
export const normalizeAvatar = value => isPhotoAvatar(value) ? value : validAvatar(value);
