import './globals.css';
import { Funnel_Display, Funnel_Sans, DM_Mono } from 'next/font/google';

const display = Funnel_Display({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-display',
  display: 'swap',
});
const text = Funnel_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-text',
  display: 'swap',
});
const mono = DM_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-mono',
  display: 'swap',
});

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
    <html lang="en" className={`${display.variable} ${text.variable} ${mono.variable}`}>
      <body>{children}</body>
    </html>
  );
}