import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'GameOn Scheduler',
  description: 'Youth Sports Scheduling Platform',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <div className="container">
          {children}
        </div>
      </body>
    </html>
  );
}
