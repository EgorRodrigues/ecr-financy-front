import React from 'react';
import { unstable_noStore as noStore } from 'next/cache';

import { sanitizeApiUrl } from "@/lib/utils";

export function EnvInitializer() {
  noStore();
  // Acessa a variável de ambiente via notação de colchetes para evitar que o Webpack
  // a substitua pelo valor de tempo de build (que pode ser undefined no Docker).
  // No servidor (Node.js), process.env['...'] lerá o valor real em tempo de execução.
  const rawUrl = process.env["NEXT_PUBLIC_API_BASE_URL"];

  if (!rawUrl) {
    console.warn(
      "Aviso: A variável de ambiente NEXT_PUBLIC_API_BASE_URL não está definida. A aplicação pode não funcionar corretamente em runtime."
    );
    return null;
  }

  const apiUrl = sanitizeApiUrl(rawUrl);

  return (
    <script
      dangerouslySetInnerHTML={{
        __html: `window.__ENV = { NEXT_PUBLIC_API_BASE_URL: '${apiUrl}' };`,
      }}
    />
  );
}
