import { Press_Start_2P } from 'next/font/google';
import './globals.css';
import Navbar from './components/Navbar';

const inter = Press_Start_2P({ subsets: ['latin'], weight: "400" });

export const metadata = {
  title: 'Lafiga - Quadro de Sessões',
  description: 'Gerencie suas sessões de RPG com estilo pixelado!',
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <body className={inter.className}>
      <Navbar />
        {children}
      </body>
    </html>
  );
}