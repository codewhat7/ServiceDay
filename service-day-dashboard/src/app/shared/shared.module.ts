import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

@NgModule({
  declarations: [],
  imports: [
    // We import the common tools here
    CommonModule,
    FormsModule,
    RouterModule
  ],
  exports: [
    // We EXPORT them so any component that imports SharedModule gets all of these automatically!
    CommonModule,
    FormsModule,
    RouterModule
  ]
})
export class SharedModule { }
