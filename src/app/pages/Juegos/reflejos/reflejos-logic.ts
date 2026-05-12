export type FaseReflejos =
  | 'idle'
  | 'esperando'
  | 'verde'
  | 'muy_temprano'
  | 'resultado';

export const LS_RECORD_MS = 'reflejos-mejor-ms';
export const LS_PARTIDAS = 'reflejos-partidas';

export function tiempoEsperaAleatorioMs(): number {
  return 2000 + Math.floor(Math.random() * 3001);
}

export function calificarReaccion(
  ms: number,
): 'Excelente' | 'Muy bien' | 'Lento' {
  if (ms < 250) return 'Excelente';
  if (ms < 400) return 'Muy bien';
  return 'Lento';
}

export function leerNumeroLocalStorage(
  clave: string,
  porDefecto: number,
): number {
  try {
    const raw = localStorage.getItem(clave);
    if (raw === null) return porDefecto;
    const n = parseInt(raw, 10);
    return Number.isFinite(n) ? n : porDefecto;
  } catch {
    return porDefecto;
  }
}

export function leerRecordOpcional(clave: string): number | null {
  try {
    const raw = localStorage.getItem(clave);
    if (raw === null) return null;
    const n = parseInt(raw, 10);
    return Number.isFinite(n) ? n : null;
  } catch {
    return null;
  }
}

export function guardarPartidasLocal(clave: string, valor: number): void {
  try {
    localStorage.setItem(clave, String(valor));
  } catch {
  }
}

export function esMejorTiempo(
  actual: number | null,
  nuevoMs: number,
): boolean {
  if (actual === null) return true;
  return nuevoMs < actual;
}
