import "./globals.css";
import Navbar from "./_components/navbar/Navbar";
import Loader from "./_components/UI/Loader";
import { AuthProvider } from './_context/AuthContext';
import { ToastProvider } from './_context/ToastContext';
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
          <ToastProvider>
            <Loader>
              <Navbar />
              <main>{children}</main>
              <div id="dialogRoot" />
            </Loader>
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
