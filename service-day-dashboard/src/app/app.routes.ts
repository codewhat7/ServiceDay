import { Routes } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { ActivityListComponent } from './activities/activity-list.component';
import { ActivityDetailComponent } from './activities/activity-detail.component';
import { adminGuard } from './guards/admin.guard';
import { staffGuard } from './guards/staff.guard';
import { ActivityRegisteredComponent } from './activities/activity-registered.component';
import { AdminEditComponent } from './admin/admin-edit.component';
import { AdminScheduleComponent } from './admin/admin-schedule.component';
import { AdminParticipantsComponent } from './admin/admin-participants.component';

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
    component: ActivityRegisteredComponent
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
  },

  { path: 'admin/edit/:id', component: AdminEditComponent },

  { path: 'admin/schedule/:id', component: AdminScheduleComponent},

  { path: 'admin/participants/:id', component: AdminParticipantsComponent },

];

