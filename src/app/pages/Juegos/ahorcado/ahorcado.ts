import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { AhorcadoService } from '../../../config/services/servicio-ahorcado';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../config/services/auth-service';

@Component({
  selector: 'app-ahorcado',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './ahorcado.html',
  styleUrl: './ahorcado.css'
})
export class Ahorcado implements OnInit, OnDestroy {

  
  authService = inject(AuthService);
  private rankingAuthSub: { unsubscribe: () => void } | null = null;
  ahorcadoService = inject(AhorcadoService);

  palabra: string = '';
  palabraArray: string[] = []; 
  palabraOculta: string[] = [];

  letras: string[] = [
    'A','B','C','D','E','F','G','H','I','J',
    'K','L','M','N','Ñ','O','P','Q','R','S',
    'T','U','V','W','X','Y','Z'
  ];

  letrasUsadas: string[] = [];
  ultimaLetra: string = '-';

  vidas: number = 6;

  inicioTiempo: number = 0;


  ranking: any[] = [];


  mostrarModal: boolean = false;
  mensajeModal: string = '';


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
    this.iniciarJuego();
  }

  ngOnDestroy(): void {
    this.rankingAuthSub?.unsubscribe();
    this.rankingAuthSub = null;
  }

  iniciarJuego() {

    this.palabra = this.ahorcadoService.obtenerPalabra().toLowerCase().trim();

    this.palabraArray = this.palabra.split('');

    this.palabraOculta = this.palabraArray.map(() => '_');

    this.inicioTiempo = Date.now();

    this.letrasUsadas = [];
    this.ultimaLetra = '-';

    this.vidas = 6;

    this.mostrarModal = false;
  }

  seleccionarLetra(letra: string) {

    if (this.mostrarModal || this.letrasUsadas.includes(letra)) return;

    this.letrasUsadas.push(letra);
    this.ultimaLetra = letra;

    let acierto = false;

    this.palabraArray.forEach((l, i) => {
      if (l === letra.toLowerCase()) {
        this.palabraOculta[i] = letra.toLowerCase();
        acierto = true;
      }
    });

    if (!acierto) this.vidas--;

    this.verificarEstado();
  }

  verificarEstado() {

    if (!this.palabraOculta.includes('_')) {
      this.finalizarJuego('ganó');
      return;
    }

    if (this.vidas <= 0) {
      this.finalizarJuego('perdió');
    }
  }

  async finalizarJuego(resultado: 'ganó' | 'perdió') {

    const tiempoFinal = Math.floor((Date.now() - this.inicioTiempo) / 1000);

    this.mensajeModal =
      resultado === 'ganó'
        ? 'GANASTE 🎉'
        : `PERDISTE 💀 - La palabra era: ${this.palabra}`;

    this.mostrarModal = true;

    await this.authService.guardarPartida({
      palabra: this.palabra,
      resultado,
      tiempo: tiempoFinal,
      letras: this.letrasUsadas.length
    });

    await this.cargarRanking();
  }

  async cargarRanking() {
    try {
      this.ranking = await this.authService.obtenerRanking();
    } catch (e) {
      console.error('Error ranking Ahorcado', e);
      this.ranking = [];
    }
  }

  cerrarModal() {
    this.mostrarModal = false;
  }
}