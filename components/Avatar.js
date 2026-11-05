import { avatarFor, isPhotoAvatar } from '../lib/social.js';

export default function Avatar({ avatar, className = '' }) {
  if (isPhotoAvatar(avatar)) {
    return (
      <span className={`avatar avatar-photo ${className}`.trim()}>
        <img src={avatar} alt="Player avatar" />
      </span>
    );
  }
  const item = avatarFor(avatar);
  return <span className={`avatar ${className}`.trim()} role="img" aria-label={`${item.name} avatar`}>{item.symbol}</span>;
}
