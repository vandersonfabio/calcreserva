import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen text-center px-4">
      <h1 className="text-4xl font-bold mb-4">404 - Página não encontrada</h1>
      <p className="text-gray-400">Desculpe, não conseguimos encontrar a página que você está procurando.</p>
      <Link href="/" className="mt-6 text-secondary hover:underline">Voltar para o Início</Link>
    </div>
  );
}
