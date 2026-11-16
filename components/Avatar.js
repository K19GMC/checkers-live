import { blobatarUri } from 'blobatar/uri';
import { isPhotoAvatar } from '../lib/social.js';

// The blobatar is a pure function of the nickname, so it renders the same on
// the server and in every browser without storing an avatar id.
export default function Avatar({ name = '', avatar, className = '' }) {
  const label = String(name || '').trim() || 'Player';
  const src = isPhotoAvatar(avatar) ? avatar : blobatarUri(label);
  return (
    <span className={`avatar avatar-photo ${className}`.trim()} role="img" aria-label={`${label} avatar`}>
      <img src={src} alt="" />
    </span>
  );
}
