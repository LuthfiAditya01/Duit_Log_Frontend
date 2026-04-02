export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto grid min-h-screen w-full max-w-6xl place-items-center px-4 py-10">
        {children}
      </div>
    </div>
  );
}
