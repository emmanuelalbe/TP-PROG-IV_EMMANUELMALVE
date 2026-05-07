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

      if (user) {
        this.router.navigateByUrl('home');
      }
    });
  }

  private createMensajesChannel(): RealtimeChannel {
    return this.supabase.channel('mensajes-chat');
  }

  async resetMensajesRealtimeChannel(): Promise<void> {
    try {
      await this.supabase.removeChannel(this.canal);
    } catch {
      /* canal ya removido o en estado intermedio */
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
  }

  // =========================
  // PREGUNTADOS
  // =========================
  async guardarPartidaPreguntados(datos: { aciertos: number; total_preguntas: number }) {
    const user = this.usuarioActual();
    if (!user) return;

    const { error } = await this.supabase
      .from('partidas_preguntados')
      .insert({
        usuario_id: user.id,
        email: user.email,
        aciertos: datos.aciertos,
        total_preguntas: datos.total_preguntas
      });

    if (error) console.error(error);
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
}