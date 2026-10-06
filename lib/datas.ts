// Datas do sistema são dias de calendário no formato "AAAA-MM-DD".

const DIA_MS = 86_400_000;

export function hoje() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
  }).format(new Date());
}

function paraUTC(data: string) {
  return new Date(`${data}T00:00:00Z`);
}

export function somarDias(data: string, dias: number) {
  return new Date(paraUTC(data).getTime() + dias * DIA_MS)
    .toISOString()
    .slice(0, 10);
}

export function diasEntre(de: string, ate: string) {
  return Math.round((paraUTC(ate).getTime() - paraUTC(de).getTime()) / DIA_MS);
}

export function ehSegunda(data: string) {
  return paraUTC(data).getUTCDay() === 1;
}

export function formatarData(data: string | null) {
  if (!data) return "—";
  const [ano, mes, dia] = data.split("-");
  return `${dia}/${mes}/${ano}`;
}

// Converte um instante (timestamp) no dia de calendário de São Paulo.
export function diaDe(instante: string) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
  }).format(new Date(instante));
}
