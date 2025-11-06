// app/layout.tsx
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Erick W. Espinoza — Resume",
  description:
    "IT professional, software engineer, and ethical tech advocate.",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <meta
          name="google-adsense-account"
          content="ca-pub-9525224672257232"
        />
        {/* Any other global tags like analytics can go here */}
      </head>
      <body>{children}</body>
    </html>
  );
}