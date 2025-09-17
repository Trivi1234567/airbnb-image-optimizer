import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Airbnb Image Optimizer',
  description: 'Transform your Airbnb listing images with AI-powered optimization',
  keywords: ['airbnb', 'image optimization', 'real estate', 'photography', 'AI'],
  authors: [{ name: 'Airbnb Image Optimizer' }],
  robots: 'index, follow',
  openGraph: {
    title: 'Airbnb Image Optimizer',
    description: 'Transform your Airbnb listing images with AI-powered optimization',
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Airbnb Image Optimizer',
    description: 'Transform your Airbnb listing images with AI-powered optimization',
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {children}
      </body>
    </html>
  );
}