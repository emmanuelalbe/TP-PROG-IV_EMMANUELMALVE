import { inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({

  providedIn: 'root',

})

export class Api {
  
http = inject(HttpClient);

apiUrl = 'https://api.attackontitanapi.com/characters?name=';

personaje = signal<any | null>(null);

  getName(name: string) {



    const peticion = this.http.get<any>(this.apiUrl + name);


    const subscripcion = peticion.subscribe((respuesta) => {

      if(respuesta.results && respuesta.results.length > 0) {
        this.personaje.set(respuesta.results[0]);
      }

      subscripcion.unsubscribe();
    });

  }

}