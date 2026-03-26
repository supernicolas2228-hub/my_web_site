import { redirect } from "next/navigation";

export default function AdminClientRedirectPage({ params }: { params: { id: string } }) {
  redirect(`/admin?c=${encodeURIComponent(params.id)}`);
}
