import { Component, inject, signal } from '@angular/core';

import {RouterOutlet } from '@angular/router';

import { Login } from "./pages/login/login";

import { Registro } from "./pages/registro/registro";

import{ AboutMe } from "./pages/about-me/about-me";

import { Home } from './pages/home/home';

import { NavBar } from './components/nav-bar/nav-bar';

import { Api } from './config/services/api';

import { FormsModule } from '@angular/forms';
import { AuthService } from './config/services/auth-service';



@Component({

  selector: 'app-root',

  imports: [RouterOutlet,  NavBar, FormsModule],

  templateUrl: './app.html',

  styleUrl: './app.css'
})
export class App {

  protected readonly title = signal('TrabajoPractico');

  api = inject(Api);

  authService = inject(AuthService)




}
