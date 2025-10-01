import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./features/timekeeper/timekeeper.component').then(m => m.TimekeeperComponent),
  },
  {
    path: '**',
    redirectTo: '',
  },
];
