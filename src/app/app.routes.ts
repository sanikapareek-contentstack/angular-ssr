import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'streaming-test',
    loadComponent: () => import('./streaming-test/streaming-test.component').then(m => m.StreamingTestComponent)
  },
  {
    path: '',
    redirectTo: '/',
    pathMatch: 'full'
  }
];
