import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/navbar";
import { ThemeProvider } from "next-themes";
import { Toaster } from "@/components/ui/sonner"
import ErrorBoundary from "@/components/ErrorBoundary";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "MAPOS Customer Services Manager",
  description: "A customer services manager for MAPOS",
  icons: {
    icon: [
      {
        url: "/MAPOS_LOGO.png",
        sizes: "32x32",
        type: "image/png",
      },
    ],
    shortcut: "/MAPOS_LOGO.png",
    apple: "/MAPOS_LOGO.png",
  },
};

export default function RootLayout({ children }) {
  return (

    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/MAPOS_LOGO.png" type="image/png" />
        <link rel="shortcut icon" href="/MAPOS_LOGO.png" type="image/png" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <ErrorBoundary>
            <div className="relative flex flex-col h-screen">
              <Navbar />
              <main className="flex-grow w-full overflow-auto">
                {children}
              </main>
              <Toaster />
            </div>
          </ErrorBoundary>
        </ThemeProvider>
      </body>
    </html>

  );
}
