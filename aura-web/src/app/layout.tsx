export const metadata = {
  title: "Aura Web",
  description: "Frontend scaffold for Aura",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <body className="min-h-screen bg-zinc-950 text-zinc-100 antialiased">
        <div className="max-w-5xl mx-auto p-6">{children}</div>
      </body>
    </html>
  );
}
