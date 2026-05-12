import { inject, Injectable, signal } from '@angular/core';
import {
  AuthResponse,
  createClient,
  RealtimeChannel,
  SupabaseClient,
  User,
} from '@supabase/supabase-js';
import { usuarioRegistro } from '../../models/usuarioRegistro';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root',
})
export class AuthService {

  supabaseUrl = 'https://igirdobwmknqfucrsxbk.supabase.co';
  publicKey = 'sb_publishable_Cc_fDA4zDKetBTDgb3Ayhw_hDK64eyR';

  supabase: SupabaseClient<any, 'public', 'public', any, any>;

  canal!: RealtimeChannel;

  usuarioActual = signal<User | null>(null);

  router: Router;

  constructor() {
    this.supabase = createClient(this.supabaseUrl, this.publicKey);
    this.canal = this.createMensajesChannel();
    this.router = inject(Router);

    this.supabase.auth.onAuthStateChange((event, session) => {
      const user = session?.user;
      this.usuarioActual.set(user ?? null);

      if (event === 'SIGNED_IN' && user) {
        this.router.navigateByUrl('home');
      }
    });
  }

  hydrateUserFromSession(): Promise<void> {
    return this.supabase.auth.getSession().then(({ data: { session } }) => {
      this.usuarioActual.set(session?.user ?? null);
    });
  }

  private async usuarioParaMutaciones(): Promise<User | null> {
    const desdeSignal = this.usuarioActual();
    if (desdeSignal) return desdeSignal;
    const { data: { session } } = await this.supabase.auth.getSession();
    const user = session?.user ?? null;
    if (user) this.usuarioActual.set(user);
    return user;
  }

  private createMensajesChannel(): RealtimeChannel {
    return this.supabase.channel('mensajes-chat');
  }

  async resetMensajesRealtimeChannel(): Promise<void> {
    try {
      await this.supabase.removeChannel(this.canal);
    } catch {
    }
    this.canal = this.createMensajesChannel();
  }

  async registrarUsuario(datos: usuarioRegistro): Promise<{ ok: true } | { ok: false; error: string }> {
    const response: AuthResponse = await this.supabase.auth.signUp({
      email: datos.email,
      password: datos.password,
      options: {
        data: {
          nombre: datos.nombre,
          apellido: datos.apellido,
          edad: datos.edad
        }
      }
    });

    if (response.error) {
      console.log(response.error.message);
      return { ok: false, error: response.error.message };
    } else {
      this.usuarioActual.set(response.data.user);
      this.router.navigate(['/home']);
      return { ok: true };
    }
  }

  async login(datos: { email: string, password: string }): Promise<{ ok: true } | { ok: false; error: string }> {
    const response: AuthResponse = await this.supabase.auth.signInWithPassword(datos);

    if (response.error) {
      console.log(response.error.message);
      return { ok: false, error: 'Email o contraseña incorrectos.' };
    }

    this.usuarioActual.set(response.data.user);
    return { ok: true };
  }

  async cerrarSesion(): Promise<void> {
    await this.supabase.auth.signOut();
    this.usuarioActual.set(null);
    this.router.navigate(['/login']);
  }


  async guardarPartida(data: {
    palabra: string;
    resultado: string;
    tiempo: number;
    letras: number;
  }) {

    const user = this.usuarioActual();
    if (!user) return;

    const baseInsert = {
      usuario_id: user.id,
      palabra: data.palabra,
      resultado: data.resultado,
      tiempo_segundos: data.tiempo,
      letras_usadas: data.letras
    };

    const insertConUsuario = {
      ...baseInsert,
      email: user.email ?? null,
      nombre: (user.user_metadata as any)?.nombre ?? null
    };

    const { error } = await this.supabase.from('partidas_ahorcado').insert(insertConUsuario as any);
    if (error) {
      const { error: fallbackError } = await this.supabase.from('partidas_ahorcado').insert(baseInsert as any);
      if (fallbackError) console.error(fallbackError);
    }
  }

  async obtenerRanking() {
    return this.withRankingSessionRetry(async () => {
      const { data, error } = await this.supabase
        .from('partidas_ahorcado')
        .select('*')
        .eq('resultado', 'ganó')
        .order('tiempo_segundos', { ascending: true })
        .limit(5);

      if (error) {
        console.error(error);
        return [];
      }

      return data || [];
    });
  }

  async guardarPartidaMayorMenor(datos: { puntaje: number }) {

    const user = this.usuarioActual();
    if (!user) return;

    const { error } = await this.supabase
      .from('partidas_mayor_menor')
      .insert({
        usuario_id: user.id,
        puntaje: datos.puntaje,
        email: user.email
      });

    if (error) console.error(error);
  }

  async obtenerRankingMayorMenor() {
    return this.withRankingSessionRetry(async () => {
      const { data, error } = await this.supabase
        .from('partidas_mayor_menor')
        .select('puntaje, email')
        .order('puntaje', { ascending: false })
        .limit(5);

      if (error) {
        console.error(error);
        return [];
      }

      return data || [];
    });
  }

  async guardarPartidaReflejos(datos: { tiempo_ms: number }): Promise<void> {
    const user = await this.usuarioParaMutaciones();
    if (!user) {
      throw new Error('No hay sesión: iniciá sesión para guardar en el ranking.');
    }

    const { error } = await this.supabase.from('partidas_reflejos').insert({
      usuario_id: user.id,
      email: user.email,
      tiempo_ms: datos.tiempo_ms,
    });

    if (error) {
      console.error('[Reflejos insert]', error.message, error.code, error.details);
      throw error;
    }
  }

  async obtenerRankingReflejos(): Promise<
    { email: string | null; tiempo_ms: number }[]
  > {
    const mapRows = (
      rows: { email?: string | null; tiempo_ms?: number | string | null }[],
    ): { email: string | null; tiempo_ms: number }[] =>
      (rows ?? []).map((row) => ({
        email: row.email ?? null,
        tiempo_ms:
          typeof row.tiempo_ms === 'string'
            ? parseInt(row.tiempo_ms, 10)
            : Number(row.tiempo_ms),
      })).filter((r) => !Number.isNaN(r.tiempo_ms));

    return this.withRankingSessionRetry(async () => {
      const { data, error } = await this.supabase
        .from('partidas_reflejos')
        .select('tiempo_ms, email')
        .order('tiempo_ms', { ascending: true })
        .limit(5);

      if (error) {
        console.error('[Reflejos select]', error.message, error.code, error.details);
        throw error;
      }
      return mapRows(data || []);
    });
  }

  async guardarPartidaPreguntados(datos: { aciertos: number; total_preguntas: number }) {
    const user = await this.usuarioParaMutaciones();
    if (!user) {
      throw new Error('No hay sesión: iniciá sesión para guardar la partida.');
    }

    const { error } = await this.supabase
      .from('partidas_preguntados')
      .insert({
        usuario_id: user.id,
        email: user.email,
        aciertos: datos.aciertos,
        total_preguntas: datos.total_preguntas
      });

    if (error) {
      console.error('[Preguntados insert]', error.message, error.code, error.details);
      throw error;
    }
  }

  async obtenerRankingPreguntados(): Promise<
    { email: string | null; aciertos: number; total_preguntas: number }[]
  > {
    return this.withRankingSessionRetry(async () => {
      const { data, error } = await this.supabase
        .from('partidas_preguntados')
        .select('aciertos, total_preguntas, email')
        .order('aciertos', { ascending: false })
        .order('total_preguntas', { ascending: true })
        .limit(5);

      if (error) {
        console.error('[Preguntados ranking]', error.message, error.code, error.details);
        return [];
      }

      return (data || []) as {
        email: string | null;
        aciertos: number;
        total_preguntas: number;
      }[];
    });
  }

  async traerMensajesYaExistentes() {
    const { data, error } = await this.supabase
      .from('mensajes')
      .select('*')
      .order('id', { ascending: true });

    if (error) {
      console.error(error);
      return [];
    }

    return data ?? [];
  }

  async enviarMensaje(usuario: string, contenido: string) {
    const { error } = await this.supabase.from('mensajes').insert({
      usuario,
      contenido,
    });

    if (error) console.error(error);
  }

  private async withRankingSessionRetry<T>(load: () => Promise<T[]>): Promise<T[]> {
    let rows = await load();
    if (rows.length === 0) {
      await this.supabase.auth.refreshSession();
      rows = await load();
    }
    return rows;
  }
}