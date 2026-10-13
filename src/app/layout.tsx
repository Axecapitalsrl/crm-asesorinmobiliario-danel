import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = { title:"CRM Inmobiliario | Danel", description:"CRM privado para clientes, propiedades, seguimientos y métricas inmobiliarias.", robots:{index:false,follow:false} };
export default function RootLayout({ children }: Readonly<{children:React.ReactNode}>) { return <html lang="es"><body>{children}</body></html>; }