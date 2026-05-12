import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Preguntados } from './preguntados';
import { AuthService } from '../../../config/services/auth-service';
import {
  PreguntadosService,
  type TriviaQuestion,
} from '../../../config/services/servicio-preguntados';

describe('Preguntados', () => {
  let component: Preguntados;
  let fixture: ComponentFixture<Preguntados>;

  const mockPregunta: TriviaQuestion = {
    category: 'Test',
    difficulty: 'easy',
    question: '¿Dos más dos?',
    correct_answer: '4',
    incorrect_answers: ['3', '5', '22'],
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Preguntados],
      providers: [
        {
          provide: AuthService,
          useValue: {
            obtenerRankingPreguntados: async () => [],
            guardarPartidaPreguntados: async () => {},
            supabase: {
              auth: {
                onAuthStateChange: () => ({
                  data: { subscription: { unsubscribe: () => {} } },
                }),
              },
            },
          },
        },
        {
          provide: PreguntadosService,
          useValue: {
            obtenerPreguntas: async () => [mockPregunta],
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Preguntados);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
