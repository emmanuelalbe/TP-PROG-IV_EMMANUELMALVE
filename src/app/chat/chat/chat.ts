import { DatePipe } from '@angular/common';
import { Component, inject, OnDestroy, OnInit, signal, WritableSignal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import { AuthService } from '../../config/services/auth-service';

@Component({
  selector: 'app-chat',
  imports: [FormsModule, DatePipe],
  templateUrl: './chat.html',
  styleUrl: './chat.css',
})
export class Chat implements OnInit, OnDestroy {

  AuthService = inject(AuthService);
  mensajes: WritableSignal<IMensaje[]> = signal([]);


  mensaje : string = '';
  usuario: string = '';

  async enviar(): Promise<void> {
    const u = this.usuario.trim();
    const m = this.mensaje.trim();
    if (!u || !m) {
      return;
    }
    await this.AuthService.enviarMensaje(u, m);
    this.mensaje = '';
  }

  async ngOnInit(): Promise<void> {
    await this.AuthService.resetMensajesRealtimeChannel();

    const data = (await this.AuthService.traerMensajesYaExistentes()) as IMensaje[];

    this.mensajes.set(data);

    this.AuthService.canal
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'mensajes',
        },
        (payload: RealtimePostgresChangesPayload<IMensaje>) => {
          console.log(payload);

          this.mensajes.update((valorAnterior) => {
            return [...valorAnterior, payload.new as IMensaje];
          });
        },
      )
      .subscribe();
  }

  ngOnDestroy(): void {
    void this.AuthService.resetMensajesRealtimeChannel();
  }

}

interface IMensaje {
  usuario: string;
  contenido: string;
  id: number;
  creado_en: Date;
}

