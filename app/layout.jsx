import "./globals.css";

export const metadata = {
  title: "Jewellery Management System",
  description: "Jewellery Management Software",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}