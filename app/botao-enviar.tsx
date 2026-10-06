"use client";

import { useFormStatus } from "react-dom";

// Botão de formulário que responde na hora: fica esmaecido e mostra que está
// trabalhando enquanto o servidor grava.
export function BotaoEnviar({
  children,
  className = "",
  enviando,
}: {
  children: React.ReactNode;
  className?: string;
  enviando?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className={`${className} transition disabled:cursor-wait disabled:opacity-50`}
    >
      {pending ? (enviando ?? children) : children}
    </button>
  );
}
