import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Reflejos } from './reflejos';
import { AuthService } from '../../../config/services/auth-service';

describe('Reflejos', () => {
  let component: Reflejos;
  let fixture: ComponentFixture<Reflejos>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Reflejos],
      providers: [
        {
          provide: AuthService,
          useValue: {
            guardarPartidaReflejos: async () => {},
            obtenerRankingReflejos: async () => [],
            supabase: {
              auth: {
                onAuthStateChange: () => ({
                  data: { subscription: { unsubscribe: () => {} } },
                }),
              },
            },
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Reflejos);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
