import Link from "next/link";

export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <Link href="/financeiro" className="text-blue-500 hover:underline">
        Ir para o Financeiro
      </Link>
    </div>
  );
}
