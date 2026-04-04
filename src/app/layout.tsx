import './globals.css';
import type { Metadata } from 'next';
import { RegistrationProvider } from '@/context/RegistrationContext';

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
        <RegistrationProvider>
          <div className="container">
            {children}
          </div>
        </RegistrationProvider>
      </body>
    </html>
  );
}
