import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Analytics } from '@vercel/analytics/next'; // <-- Adicionado aqui

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
});

export const metadata: Metadata = {
  title: 'CalcReserva Policial Militar',
  description: 'Calculadora de Reserva Militar para a PMRN seguindo a Lei Complementar 692/2021',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" className={`${inter.variable} dark`} suppressHydrationWarning>
      <body className="font-sans antialiased">
        {children}
        <Analytics /> {/* <-- Adicionado aqui */}
      </body>
    </html>
  );
}