import type { Metadata } from "next";
import { Playfair_Display, Crimson_Text, Poiret_One, Bebas_Neue } from "next/font/google";
import "./globals.css";

const playfair = Playfair_Display({ 
  subsets: ["latin"],
  variable: "--font-playfair",
});

const crimson = Crimson_Text({ 
  weight: ["400", "600", "700"],
  subsets: ["latin"],
  variable: "--font-crimson",
});

const poiret = Poiret_One({ 
  weight: "400",
  subsets: ["latin"],
  variable: "--font-poiret",
});

const bebas = Bebas_Neue({ 
  weight: "400",
  subsets: ["latin"],
  variable: "--font-bebas",
});

export const metadata: Metadata = {
  title: "The Backroom Leeds - Table Booking",
  description: "Reserve your table at Leeds' premier prohibition-themed nightclub. Experience the speakeasy atmosphere with exclusive VIP tables and premium bottle service.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${playfair.variable} ${crimson.variable} ${poiret.variable} ${bebas.variable}`}>
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}