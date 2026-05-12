import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { AuthService } from '../../../config/services/auth-service';
import { PreguntadosService } from '../../../config/services/servicio-preguntados';

type PreguntaUI = {
  category: string;
  difficulty: 'easy' | 'medium' | 'hard';
  question: string;
  correct: string;
  options: string[];
};

type FilaRankingPreguntados = {
  email: string | null;
  aciertos: number;
  total_preguntas: number;
};

@Component({
  selector: 'app-preguntados',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './preguntados.html',
  styleUrl: './preguntados.css',
})
export class Preguntados implements OnInit, OnDestroy {
  private authService = inject(AuthService);
  private preguntadosService = inject(PreguntadosService);
  private rankingAuthSub: { unsubscribe: () => void } | null = null;

  cargando = false;
  error = '';

  preguntas: PreguntaUI[] = [];
  indice = 0;

  aciertos = 0;
  total = 10;

  opciones: string[] = [];
  bloqueado = false;
  opcionSeleccionada: string | null = null;

  terminado = false;
  guardando = false;
  errorGuardado = '';

  ranking: FilaRankingPreguntados[] = [];

  ngOnInit() {
    void this.cargarRanking();
    const { data } = this.authService.supabase.auth.onAuthStateChange(
      (event, session) => {
        if (
          (event === 'INITIAL_SESSION' || event === 'SIGNED_IN') &&
          session
        ) {
          void this.cargarRanking();
        }
      },
    );
    this.rankingAuthSub = data.subscription;
    void this.iniciarPartida();
  }

  ngOnDestroy(): void {
    this.rankingAuthSub?.unsubscribe();
    this.rankingAuthSub = null;
  }

  get preguntaActual(): PreguntaUI | null {
    return this.preguntas[this.indice] ?? null;
  }

  async iniciarPartida() {
    this.cargando = true;
    this.error = '';
    this.errorGuardado = '';
    this.terminado = false;
    this.guardando = false;

    this.aciertos = 0;
    this.indice = 0;
    this.bloqueado = false;
    this.opcionSeleccionada = null;

    const raw = await this.preguntadosService.obtenerPreguntas({ amount: this.total });
    this.preguntas = raw.map((q) => {
      const correct = this.decodeHtml(q.correct_answer);
      const incorrect = q.incorrect_answers.map((x) => this.decodeHtml(x));
      const options = this.shuffle([correct, ...incorrect]);

      return {
        category: this.decodeHtml(q.category),
        difficulty: q.difficulty,
        question: this.decodeHtml(q.question),
        correct,
        options,
      };
    });

    if (!this.preguntas.length) {
      this.error = 'No se pudieron cargar preguntas. Reintentá.';
      this.cargando = false;
      return;
    }

    this.actualizarOpciones();
    this.cargando = false;
  }

  seleccionar(opcion: string) {
    if (this.bloqueado || this.terminado) return;
    const q = this.preguntaActual;
    if (!q) return;

    this.bloqueado = true;
    this.opcionSeleccionada = opcion;

    if (opcion === q.correct) {
      this.aciertos++;
    }
  }

  async siguiente() {
    if (this.terminado) return;

    if (this.indice >= this.preguntas.length - 1) {
      await this.finalizar();
      return;
    }

    this.indice++;
    this.bloqueado = false;
    this.opcionSeleccionada = null;
    this.actualizarOpciones();
  }

  async finalizar() {
    this.terminado = true;
    this.guardando = true;
    this.errorGuardado = '';
    try {
      await this.authService.guardarPartidaPreguntados({
        aciertos: this.aciertos,
        total_preguntas: this.preguntas.length
      });
      await this.cargarRanking();
    } catch (e: unknown) {
      const msg =
        e && typeof e === 'object' && 'message' in e
          ? String((e as { message: unknown }).message)
          : 'No se pudo guardar la partida.';
      this.errorGuardado = `${msg} En Supabase: tabla partidas_preguntados y políticas (ver supabase-preguntados-rls.sql).`;
    } finally {
      this.guardando = false;
    }
  }

  async cargarRanking() {
    try {
      this.ranking = await this.authService.obtenerRankingPreguntados();
    } catch (e) {
      console.error('Error ranking Preguntados', e);
      this.ranking = [];
    }
  }

  esCorrecta(opcion: string): boolean {
    const q = this.preguntaActual;
    return !!q && opcion === q.correct;
  }

  private actualizarOpciones() {
    const q = this.preguntaActual;
    if (!q) {
      this.opciones = [];
      return;
    }

    this.opciones = q.options;
  }

  decodeHtml(texto: string): string {
    const doc = new DOMParser().parseFromString(texto, 'text/html');
    return doc.documentElement.textContent ?? texto;
  }

  private shuffle<T>(arr: T[]): T[] {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }
}
