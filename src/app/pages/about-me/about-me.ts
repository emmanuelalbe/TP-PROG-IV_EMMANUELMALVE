import { Component, computed, inject, OnInit, signal } from '@angular/core';

import { Usergithub } from '../../config/services/usergithub';

import { Card } from '../../components/card/card';




@Component({
  selector: 'app-about-me',
  imports: [Card],
  templateUrl: './about-me.html',
  styleUrl: './about-me.css',
}) 
export class AboutMe implements OnInit {

  githubService = inject(Usergithub);

  usuario = signal<any | null>(null);

  readonly cardTitle = computed(() => {
    const u = this.usuario();
    if (!u) return 'Cargando…';
    return u.name || u.login;
  });

  readonly cardImage = computed(
    () => this.usuario()?.avatar_url ?? '/image/logo.png',
  );

  readonly cardDescription = computed(() => {
    const u = this.usuario();
    if (!u) return 'Obteniendo datos del perfil…';
    return u.bio || 'Sin bio disponible.';
  });

  ngOnInit() {

    this.githubService.obtenerUsuarioGithub().subscribe(data => {
        this.usuario.set(data);
      });
  }


}