import { Routes } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { ActivityListComponent } from './components/activity-list.component';
import { ActivityDetailComponent } from './components/activity-detail.component';
import { adminGuard } from './guards/admin.guard';
import { staffGuard } from './guards/staff.guard';
import { RegisteredHistoryComponent } from './components/activity-registered.component';

export const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  {
    path: 'activities',
    component: ActivityListComponent,
    canActivate: [staffGuard]
  },
  {
    path: 'history',
    component: RegisteredHistoryComponent
  },
  {
    path: 'activities/:id',
    component: ActivityDetailComponent,
    canActivate: [staffGuard]
  },

  {
    path: 'admin',
    loadChildren: () => import('./admin/admin.module').then(m => m.AdminModule),
    canActivate: [adminGuard]
  }

];

