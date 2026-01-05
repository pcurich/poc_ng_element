import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'admin',
    pathMatch: 'full'
  },
  {
    path: 'home',
    loadComponent: () => import('./home/home.component')
      .then(m => m.HomeComponent)
  },
  {
    path: 'admin',
    children: [
      {
        path: 'debug',
        children: [
          {
            path: 'monitor',
            loadComponent: () => import('./admin/debug/db.monitor/db.monitor.component')
              .then(m => m.DbMonitorComponent)
          },
          {
            path: 'repository-tester',
            loadComponent: () => import('./admin/debug/db.repository-tester/repository-tester.component')
              .then(m => m.RepositoryTesterComponent)
          },
          {
            path: 'service-tester',
            loadComponent: () => import('./admin/debug/db.service-tester/service-tester.component')
              .then(m => m.ServiceTesterComponent)
          },
          {
            path: '',
            redirectTo: 'monitor',
            pathMatch: 'full'
          }
        ]
      },
      {
        path: '',
        redirectTo: 'debug',
        pathMatch: 'full'
      }
    ]
  },
  {
    path: '**',
    redirectTo: '',
    pathMatch: 'full'
  }
];