import { avatarFor } from '../lib/social.js';

export default function Avatar({ avatar, className = '' }) {
  const item = avatarFor(avatar);
  return <span className={`avatar ${className}`.trim()} role="img" aria-label={`${item.name} avatar`}>{item.symbol}</span>;
}
