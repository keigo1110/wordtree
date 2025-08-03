import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { QueryProvider } from "@/components/QueryProvider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "WordTree - 多言語辞書・類語・語源検索",
  description: "ブラウザ上で単語を選択して多言語訳・類語・語源を即座に取得できる軽量Webアプリ",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className={inter.className}>
        <QueryProvider>
          {children}
        </QueryProvider>
      </body>
    </html>
  );
}
