import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

@NgModule({
  imports: [
    CommonModule
  ],
  exports: [
    CommonModule // Exporting this makes *ngIf and *ngFor available to any module that imports SharedModule
  ]
})
export class SharedModule { }
