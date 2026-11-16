export const EMOTES = ['😀', '😮', '😂', '😎', '😭', '👏', '🤝', '🔥'];

// Avatars are generated from the player's nickname, so there are no preset ids
// to store. A camera photo is the only override, kept inline with the player as
// a small square JPEG data URL.
export const AVATAR_PHOTO_MAX = 48 * 1024;
const PHOTO_RE = /^data:image\/(?:jpeg|png|webp);base64,[A-Za-z0-9+/]+={0,2}$/;
export const isPhotoAvatar = value =>
  typeof value === 'string' && value.length <= AVATAR_PHOTO_MAX && PHOTO_RE.test(value);
// Keeps a valid camera photo and drops anything else, so old preset ids fall
// back to a nickname-derived blobatar.
export const normalizeAvatar = value => isPhotoAvatar(value) ? value : null;
