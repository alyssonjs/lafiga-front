import { Pixelify_Sans, Press_Start_2P } from "next/font/google";
import "./globals.css";
import Navbar from "./_components/Navbar";
import BottomNav from "./_components/BottomNav";
import { AuthProvider } from './_context/AuthContext';

const start = Press_Start_2P({ subsets: ["latin"], weight: "400" });
const pixel = Pixelify_Sans({ subsets: ["latin"], weight: "400" });

export const metadata = {
  title: "Lafiga - Quadro de Sessões",
  description: "Gerencie suas sessões de RPG com estilo pixelado!",
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <body className={start.className} style={{fontSize: '10px'}}>
        <AuthProvider>
          <Navbar />
          <main>{children}</main>
          <div id="dialogRoot" />
          <BottomNav />
        </AuthProvider>
      </body>
    </html>
  );
}
