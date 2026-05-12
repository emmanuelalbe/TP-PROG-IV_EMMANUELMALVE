import { Component } from '@angular/core';

import { CommonModule } from '@angular/common';

import { Card } from '../card/card';

@Component({
  selector: 'app-card-juegos',
  imports: [Card, CommonModule],
  templateUrl: './card-juegos.html',
  styleUrl: './card-juegos.css',
})
export class CardJuegos {

  misJuegos = [
    {
      title: 'Ahorcado',
      image: '/image/ahorcado.png',
      description: 'Adiviná la palabra letra por letra antes de quedarte sin intentos. Cada error acerca el final, pensá bien tus jugadas.'
    },
    {
      title: 'Mayor o menor',
      image: '/image/mayor.png',
      description: 'Elegí si la próxima carta/número será mayor o menor y sumá puntos. Si te equivocás perdés la racha, así que jugá con estrategia.'
    },
    {
      title: 'Preguntados',
      image: '/image/preguntados.png',
      description: 'Respondé preguntas de cultura general y competí por categorías. Mientras más aciertos tengas, más rápido completás todas las áreas.'
    },
    {
      title: 'Reflejos',
      image: '/image/logo.png',
      description:
        'Esperá el verde y tocá lo más rápido posible: medimos tu tiempo de reacción en milisegundos. Superá tu récord y entrá al ranking.',
    }
  ];
}
