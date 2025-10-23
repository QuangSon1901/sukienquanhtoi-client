import { Inter } from 'next/font/google';
import './assets/css/globals.css';

const inter = Inter({ subsets: ['latin', 'vietnamese'] });

export const metadata = {
  title: 'Sự kiện quanh tôi',
  description: 'Tìm kiếm trải nghiệm độc đáo quanh bạn',
  icons: {
    icon: [
      { url: '/assets/logos/logo-icon.png?v1.0.0', sizes: '32x32', type: 'image/png' },
      { url: '/assets/logos/logo-icon.png?v1.0.0', sizes: '192x192', type: 'image/png' },
    ],
    apple: '/assets/logos/logo-icon.png?v1.0.0',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="vi">
      <head></head>
      <body className={inter.className}>{children}</body>
    </html>
  );
}