// app/layout.tsx
import React, { ReactNode } from "react";
import "./globals.css"; // import Tailwind + global styles

export const metadata = {
  title: "Music Sentiment & Genre Demo",
  description: "A Next.js 13 app demoing an interactive audio sentiment analysis UI",
};

export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-gray-50 text-gray-900">
        {children}
      </body>
    </html>
  );
}
