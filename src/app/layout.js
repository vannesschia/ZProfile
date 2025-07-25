import { Host_Grotesk, Geist } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";

export const dynamic = "force-dynamic";

const hostGrotesk = Host_Grotesk({
  variable: "--font-host-grotesk",
  subsets: ["latin"],
});

const geist = Geist({
  variable: "--font-geist",
  subsets: ["latin"],
});

export const metadata = {
  title: "ZProfile",
};

export default async function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${geist.className} antialiased`}
      >
        {children}
        <Toaster position="top-center" richColors />
      </body>
    </html>
  );
}
