import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from '../shared/shared.module';
import { AdminDashboardComponent } from './admin-dashboard.component';
import { AdminCreateComponent } from './admin-create.component'; // <-- Import the new component

const adminRoutes: Routes = [
  { path: '', component: AdminDashboardComponent },
  { path: 'create', component: AdminCreateComponent } // <-- Add the create route!
];

@NgModule({
  imports: [
    SharedModule,
    RouterModule.forChild(adminRoutes),
    AdminDashboardComponent,
    AdminCreateComponent
  ]
})
export class AdminModule { }
