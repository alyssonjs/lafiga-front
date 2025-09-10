import "./globals.css";
import Navbar from "./_components/navbar/Navbar";
import { AuthProvider } from './_context/AuthContext';
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
      <body className="pixellari">
        <AuthProvider>
          <Navbar />
          <main>{children}</main>
          <div id="dialogRoot" />
        </AuthProvider>
      </body>
    </html>
  );
}
