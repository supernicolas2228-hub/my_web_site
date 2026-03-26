import { Suspense } from "react";
import AccountClient from "./AccountClient";

export default function AccountPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center px-4 pt-24">
          <p className="text-sm opacity-70">Загрузка…</p>
        </main>
      }
    >
      <AccountClient />
    </Suspense>
  );
}
