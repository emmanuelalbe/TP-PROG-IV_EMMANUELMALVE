import { bootstrapApplication } from '@angular/platform-browser';
import { provideAppInitializer, inject } from '@angular/core';

import { App } from './app/app';

import { provideRouter } from '@angular/router';

import { routes } from './app/app.routes';
import { AuthService } from './app/config/services/auth-service';


bootstrapApplication(App, {
  providers: [
    provideRouter(routes),
    provideAppInitializer(() => {
      const auth = inject(AuthService);
      return auth.hydrateUserFromSession();
    }),
  ],
});