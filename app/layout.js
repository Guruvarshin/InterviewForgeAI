import "./globals.css";
import Providers from "@/components/site/providers";
import Navbar from "@/components/site/navbar";
import Footer from "@/components/site/footer";
import CareerCoachFloat from "@/components/public/CareerCoachFloat";
import ClerkThemeProvider from "@/components/site/ClerkThemeProvider";

export const metadata = {
  title: "InterviewForge AI",
  description: "Practice mock interviews with an AI hiring manager.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-background text-foreground antialiased">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed top-2 left-2 z-[100] rounded bg-primary px-3 py-2 text-primary-foreground"
        >
          Skip to content
        </a>

        {/* Your app-wide providers (must include next-themes ThemeProvider inside) */}
        <Providers>
          {/* Clerk is now themed by the current client theme */}
          <ClerkThemeProvider>
            <Navbar />
            <main id="main" className="mx-auto max-w-6xl px-4 py-8">
              {children}
            </main>
            <Footer />
            <CareerCoachFloat />
          </ClerkThemeProvider>
        </Providers>
      </body>
    </html>
  );
}
