import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'VIEW BATTLE — 조회수 대결 게임',
  description: '유튜브 실시간 조회수를 맞히는 대결 게임'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          href="https://fonts.googleapis.com/css2?family=Anton&family=Noto+Sans+KR:wght@400;500;700;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
