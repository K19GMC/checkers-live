import './fonts.css';
import './globals.css';

export const metadata = {
  title: 'Checkers Live — knockout tournament',
  description:
    'A live knockout checkers tournament you play in the browser. Join with a PIN, get paired each round, and win or you are out.',
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#0f1f10',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}