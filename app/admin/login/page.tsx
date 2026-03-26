import { Suspense } from "react";
import AdminLoginForm from "./AdminLoginForm";

export default function AdminLoginPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen px-4 py-20">
          <div className="site-container mx-auto max-w-md text-center text-sm opacity-75">Загрузка...</div>
        </main>
      }
    >
      <AdminLoginForm />
    </Suspense>
  );
}
