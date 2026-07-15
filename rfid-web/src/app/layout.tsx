import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'RFID EduTracker',
  description: 'Sistema de Asistencia y Perfiles Escolares',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
