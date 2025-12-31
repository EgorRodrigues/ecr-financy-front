import React from 'react';

export function EnvInitializer() {
  // Acessa a variável de ambiente via notação de colchetes para evitar que o Webpack
  // a substitua pelo valor de tempo de build (que pode ser undefined no Docker).
  // No servidor (Node.js), process.env['...'] lerá o valor real em tempo de execução.
  const apiUrl = (
    process.env["NEXT_PUBLIC_API_BASE_URL"] ||
    "https://ecr-financy-back-562960722206.us-central1.run.app"
  ).replace("http://", "https://");

  return (
    <script
      dangerouslySetInnerHTML={{
        __html: `window.__ENV = { NEXT_PUBLIC_API_BASE_URL: '${apiUrl}' };`,
      }}
    />
  );
}
