import { Routes } from '@angular/router';
import { ActivityListComponent } from './components/activity-list.component';
import { ActivityDetailComponent } from './components/activity-detail.component';

export const routes: Routes = [
  {
    path: '',
    component: ActivityListComponent
  },
  {
    path: 'detail/:id',
    component: ActivityDetailComponent
  },
  {
    path: '**',
    redirectTo: ''
  }
];
