'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body>
        <div className="flex flex-col items-center justify-center min-h-screen text-center px-4">
          <h2 className="text-2xl font-bold mb-4">Erro Crítico do Sistema</h2>
          <button
            onClick={() => reset()}
            className="px-4 py-2 bg-secondary text-[#412d00] rounded-lg font-bold"
          >
            Tentar novamente
          </button>
        </div>
      </body>
    </html>
  );
}
