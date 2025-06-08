import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "../contexts/ThemeContext";
import { NotificationProvider } from "../contexts/NotificationContext";
import LayoutWithFooter from "../components/layout/LayoutWithFooter";
import { Toaster } from 'react-hot-toast';

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "PharmaSave AI - Turn Near-Expired Medications Into Revenue",
  description: "Connect with nearby pharmacies to sell or trade near-expired medications before they become deadstock. Save 5,000-10,000 EGP monthly with our secure marketplace for Egyptian pharmacies.",
  keywords: "pharmacy, Egypt, near-expired medications, pharma marketplace, medicine trading, pharmacy business",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} antialiased`}>
        <ThemeProvider>
          <NotificationProvider>
            <LayoutWithFooter>
              {children}
            </LayoutWithFooter>
          </NotificationProvider>
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 6000,
              style: {
                background: '#fff',
                color: '#374151',
                fontSize: '14px',
                fontWeight: '500',
                padding: '16px 20px',
                borderRadius: '12px',
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                border: '1px solid #f3f4f6',
                maxWidth: '420px',
              },
              success: {
                style: {
                  background: '#f0fdf4',
                  color: '#166534',
                  border: '1px solid #22c55e',
                },
                iconTheme: {
                  primary: '#22c55e',
                  secondary: '#f0fdf4',
                },
              },
              error: {
                style: {
                  background: '#fef2f2',
                  color: '#dc2626',
                  border: '1px solid #ef4444',
                },
                iconTheme: {
                  primary: '#ef4444',
                  secondary: '#fef2f2',
                },
              },
              loading: {
                style: {
                  background: '#eff6ff',
                  color: '#1d4ed8',
                  border: '1px solid #3b82f6',
                },
                iconTheme: {
                  primary: '#3b82f6',
                  secondary: '#eff6ff',
                },
              },
            }}
          />
        </ThemeProvider>
      </body>
    </html>
  );
}
