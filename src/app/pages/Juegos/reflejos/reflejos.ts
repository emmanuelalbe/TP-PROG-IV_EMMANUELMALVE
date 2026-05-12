import { Component, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../config/services/auth-service';
import {
  calificarReaccion,
  esMejorTiempo,
  FaseReflejos,
  guardarPartidasLocal,
  leerNumeroLocalStorage,
  leerRecordOpcional,
  LS_PARTIDAS,
  LS_RECORD_MS,
  tiempoEsperaAleatorioMs,
} from './reflejos-logic';

@Component({
  selector: 'app-reflejos',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './reflejos.html',
  styleUrl: './reflejos.css',
})
export class Reflejos implements OnInit, OnDestroy {
  private readonly auth = inject(AuthService);

  private momentoVerde: number | null = null;
  private timeoutId: ReturnType<typeof setTimeout> | null = null;
  private rankingAuthSub: { unsubscribe: () => void } | null = null;

  readonly fase = signal<FaseReflejos>('idle');
  readonly tiempoMs = signal<number | null>(null);
  readonly calificacion = signal('');
  readonly recordPersonal = signal<number | null>(null);
  readonly partidasJugadas = signal(0);
  readonly ranking = signal<{ email: string | null; tiempo_ms: number }[]>(
    [],
  );
  readonly errorServidor = signal<string | null>(null);

  ngOnInit(): void {
    this.recordPersonal.set(leerRecordOpcional(LS_RECORD_MS));
    this.partidasJugadas.set(
      leerNumeroLocalStorage(LS_PARTIDAS, 0),
    );
    void this.cargarRanking();

    const { data } = this.auth.supabase.auth.onAuthStateChange((event, session) => {
      if (
        (event === 'INITIAL_SESSION' || event === 'SIGNED_IN') &&
        session
      ) {
        void this.cargarRanking();
      }
    });
    this.rankingAuthSub = data.subscription;
  }

  ngOnDestroy(): void {
    this.limpiarTimeout();
    this.rankingAuthSub?.unsubscribe();
    this.rankingAuthSub = null;
  }

  textoPanel(): string {
    switch (this.fase()) {
      case 'idle':
        return 'Hacé clic en "Comenzar" cuando estés listo.';
      case 'esperando':
        return 'Esperá el color verde...';
      case 'verde':
        return '¡Ahora!';
      case 'muy_temprano':
        return '¡Muy temprano!';
      case 'resultado': {
        const ms = this.tiempoMs();
        return ms !== null ? `${ms} ms` : '';
      }
      default:
        return '';
    }
  }

  comenzarPartida(): void {
    if (this.fase() === 'esperando' || this.fase() === 'verde') return;
    this.iniciarRonda();
  }

  iniciarRonda(): void {
    this.limpiarTimeout();
    this.errorServidor.set(null);
    this.tiempoMs.set(null);
    this.calificacion.set('');
    this.momentoVerde = null;
    this.fase.set('esperando');

    const espera = tiempoEsperaAleatorioMs();
    this.timeoutId = setTimeout(() => {
      this.timeoutId = null;
      if (this.fase() !== 'esperando') return;
      this.fase.set('verde');
      this.momentoVerde = performance.now();
    }, espera);
  }

  jugarOtraVez(): void {
    this.iniciarRonda();
  }

  onClickPanel(): void {
    const f = this.fase();

    if (f === 'idle' || f === 'resultado' || f === 'muy_temprano') {
      return;
    }

    if (f === 'esperando') {
      this.limpiarTimeout();
      this.fase.set('muy_temprano');
      this.sumarPartidaLocal();
      return;
    }

    if (f === 'verde' && this.momentoVerde !== null) {
      const ms = Math.round(performance.now() - this.momentoVerde);
      this.tiempoMs.set(ms);
      this.calificacion.set(calificarReaccion(ms));
      this.fase.set('resultado');
      this.actualizarRecordLocal(ms);
      this.sumarPartidaLocal();
      void this.guardarRankingSiPuede(ms);
    }
  }

  private limpiarTimeout(): void {
    if (this.timeoutId !== null) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
  }

  private sumarPartidaLocal(): void {
    const n = this.partidasJugadas() + 1;
    this.partidasJugadas.set(n);
    guardarPartidasLocal(LS_PARTIDAS, n);
  }

  private actualizarRecordLocal(ms: number): void {
    const actual = this.recordPersonal();
    if (esMejorTiempo(actual, ms)) {
      this.recordPersonal.set(ms);
      try {
        localStorage.setItem(LS_RECORD_MS, String(ms));
      } catch {
      }
    }
  }

  private async guardarRankingSiPuede(ms: number): Promise<void> {
    try {
      await this.auth.guardarPartidaReflejos({ tiempo_ms: ms });
      await this.cargarRanking();
    } catch (e: unknown) {
      console.error('Error al guardar ranking Reflejos', e);
      const msg =
        e && typeof e === 'object' && 'message' in e
          ? String((e as { message: unknown }).message)
          : 'No se pudo guardar en el servidor.';
      this.errorServidor.set(
        `${msg} En Supabase: políticas RLS para partidas_reflejos (ver supabase-reflejos-rls.sql).`,
      );
      await this.cargarRanking();
    }
  }

  async cargarRanking(): Promise<void> {
    try {
      const data = await this.auth.obtenerRankingReflejos();
      this.ranking.set(data ?? []);
    } catch (e: unknown) {
      console.error('Error ranking Reflejos', e);
      this.ranking.set([]);
      const msg =
        e && typeof e === 'object' && 'message' in e
          ? String((e as { message: unknown }).message)
          : 'No se pudo cargar el ranking.';
      this.errorServidor.set(msg);
    }
  }
}
