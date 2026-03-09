import { Geist } from "next/font/google";
import "./globals.css";

const geist = Geist({ subsets: ["latin"] });

export const metadata = {
  title: "AstroRAG - Chat con tus PDFs",
  description: "Interfaz de chat con IA para consultar documentos PDF de astronomía",
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body className={`${geist.className} antialiased`}>
        {children}
      </body>
    </html>
  );
}
