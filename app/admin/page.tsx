import { Suspense } from "react";
import AdminMessenger from "./AdminMessenger";

export default function AdminPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center px-4 pt-20">
          <p className="text-sm opacity-70">Загрузка…</p>
        </main>
      }
    >
      <AdminMessenger />
    </Suspense>
  );
}
