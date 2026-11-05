import { avatarFor } from '../lib/social.js';

const imageStyle = { width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%', display: 'block' };

export default function Avatar({ avatar, className = '' }) {
  const item = avatarFor(avatar);
  return (
    <span className={`avatar ${className}`.trim()} role="img" aria-label={`${item.name} avatar`}>
      {item.image ? <img src={item.image} alt="" style={imageStyle} /> : item.symbol}
    </span>
  );
}
