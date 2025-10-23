import { Inter } from 'next/font/google';
import './assets/css/globals.css';

const inter = Inter({ subsets: ['latin', 'vietnamese'] });

export const metadata = {
  title: 'Sự kiện quanh tôi',
  description: 'Tìm kiếm trải nghiệm độc đáo quanh bạn',
};

export default function RootLayout({ children }) {
  return (
    <html lang="vi">
      <head></head>
      <body className={inter.className}>{children}</body>
    </html>
  );
}