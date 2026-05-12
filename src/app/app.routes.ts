import { Routes } from '@angular/router';

import  { Home } from './pages/home/home';

import { AboutMe } from './pages/about-me/about-me'

import { Login } from './pages/login/login';

import { Registro } from './pages/registro/registro';

import { Preguntados } from './pages/Juegos/preguntados/preguntados';

import { Ahorcado } from './pages/Juegos/ahorcado/ahorcado';

import { MayorMenor } from './pages/Juegos/mayormenor/mayor-menor';

import { authGuardGuard } from './config/guard/auth-guard-guard';

export const routes: Routes = [

  { path: '', redirectTo: 'home', pathMatch: 'full' },

  {
    path: 'home',
    canActivate: [authGuardGuard],
    loadComponent: () => import('./pages/home/home').then(m => m.Home)
  },
  {
    path: 'about-me',
    canActivate: [authGuardGuard],
    loadComponent: () => import('./pages/about-me/about-me').then(m => m.AboutMe)
  },
  {
    path: 'preguntados',
    canActivate: [authGuardGuard],
    loadComponent: () => import('./pages/Juegos/preguntados/preguntados').then(m => m.Preguntados)
  },
  {
    path: 'ahorcado',
    canActivate: [authGuardGuard],
    loadComponent: () => import('./pages/Juegos/ahorcado/ahorcado').then(m => m.Ahorcado)
  },
  {
    path: 'mayor-menor',
    canActivate: [authGuardGuard],
    loadComponent: () => import('./pages/Juegos/mayormenor/mayor-menor').then(m => m.MayorMenor)
  },
  {
    path: 'reflejos',
    canActivate: [authGuardGuard],
    loadComponent: () =>
      import('./pages/Juegos/reflejos/reflejos').then((m) => m.Reflejos),
  },

  {
    path: 'login',
    loadComponent: () => import('./pages/login/login').then(m => m.Login)
  },
  {
    path: 'registro',
    loadComponent: () => import('./pages/registro/registro').then(m => m.Registro)
  },
  {
    path: 'chat',
    loadComponent: () => import('./chat/chat/chat').then(m => m.Chat)
  }

];
