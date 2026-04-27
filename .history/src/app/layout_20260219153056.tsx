import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "TaskFlow — Premium Todo App",
  description:
    "Manage your tasks efficiently with TaskFlow, a beautiful and powerful todo application powered by Next.js and MongoDB.",
  keywords: ["todo", "task management", "productivity", "nextjs", "mongodb"],
  authors: [{ name: "TaskFlow" }],
  openGraph: {
    title: "TaskFlow — Premium Todo App",
    description: "Manage your tasks efficiently with TaskFlow",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body className={inter.className}>{children}</body>
    </html>
  );
}
