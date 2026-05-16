import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Iris',
  description: 'A private relationship network for the people who make the place.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-paper text-ink antialiased">
        {children}
      </body>
    </html>
  );
}
