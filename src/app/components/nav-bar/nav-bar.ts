import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink,Router } from '@angular/router';
import { AuthService } from '../../config/services/auth-service';

@Component({
  selector: 'app-nav-bar',
  imports: [CommonModule],
  templateUrl: './nav-bar.html',
  styleUrl: './nav-bar.css',
})

export class NavBar {

  authService = inject(AuthService);

  router = inject(Router);

  menu = [
    { label: 'Login', route: 'login', auth: false },
    { label: 'Registro', route: 'registro', auth: false },
    { label: 'About Me', route: 'about-me', auth: true },
    { label: 'Home', route: 'home', auth: true },
    { label: 'Ahorcado', route: 'ahorcado', auth: true },
    { label: 'Preguntados', route: 'preguntados', auth: true },
    { label: 'Mayor o Menor', route: 'mayor-menor', auth: true },
    { label: 'Chat', route: 'chat', auth: true }
  ];

  navegar(ruta: string) {

  const estaLogueado = !!this.authService.usuarioActual();

  const rutasPublicas = ['login', 'registro'];

  if (!estaLogueado && !rutasPublicas.includes(ruta)) {
    this.router.navigateByUrl('login');
    return;
  }

  if (estaLogueado && rutasPublicas.includes(ruta)) {
    this.router.navigateByUrl('home');
    return;
  }

  this.router.navigateByUrl(ruta);
}
  cerrarSesion() {
    this.authService.cerrarSesion();
  }
}

