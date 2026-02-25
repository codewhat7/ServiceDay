import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';  // ← CHANGE THIS

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],  // ← REMOVE HttpClientModule from here
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class AppComponent {
  title = 'Service Day Dashboard';
}
