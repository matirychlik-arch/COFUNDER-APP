import AppSidebar from "@/components/layout/AppSidebar";

export default function ChatLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-white">
      <AppSidebar />
      <main className="flex-1 ml-16 min-h-screen">
        {children}
      </main>
    </div>
  );
}
