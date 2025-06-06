import { Host_Grotesk } from "next/font/google";
import "./globals.css";

export const dynamic = "force-dynamic";

const hostGrotesk = Host_Grotesk({
  variable: "--font-host-grotesk",
  subsets: ["latin"],
});

export const metadata = {
  title: "ZProfile",
};

export default async function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${hostGrotesk.className} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
