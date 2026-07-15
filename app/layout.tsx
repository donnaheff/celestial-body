import type { Metadata } from "next";
import { Cormorant_Garamond, Lora } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "600"],
  variable: "--font-cormorant",
  display: "swap",
});

const lora = Lora({
  subsets: ["latin"],
  weight: ["400", "600"],
  variable: "--font-lora",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Acme Bids — Health & Social Care Bid Writing",
  description:
    "Technical writing that wins NHS and social care tenders — CQC and Ofsted applications, ITT/PQQ responses and framework bids.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${cormorant.variable} ${lora.variable}`}>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
