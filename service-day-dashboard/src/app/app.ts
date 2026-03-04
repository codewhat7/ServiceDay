import { Component } from '@angular/core';
import { RouterOutlet, RouterLink, Router } from '@angular/router'; // <-- 1. Added Router here
import { CommonModule } from '@angular/common';
import { AuthService } from './services/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, CommonModule],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class AppComponent {
  // 2. Added public router: Router to the constructor
  constructor(public authService: AuthService, public router: Router) {}
}
