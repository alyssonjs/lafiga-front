import { Pixelify_Sans, Press_Start_2P, VT323 } from "next/font/google";
import "./globals.css";
import Navbar from "./_components/Navbar";

const start = Press_Start_2P({ subsets: ["latin"], weight: "400" });
const pixel = Pixelify_Sans({ subsets: ["latin"], weight: "400" });

export const metadata = {
  title: "Lafiga - Quadro de Sessões",
  description: "Gerencie suas sessões de RPG com estilo pixelado!",
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <body className={pixel.className}>
        <Navbar />
        <main>{children}</main>
        <div id="dialogRoot"></div>
      </body>
    </html>
  );
}
