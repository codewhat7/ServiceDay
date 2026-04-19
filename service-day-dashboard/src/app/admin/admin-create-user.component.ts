import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-admin-create-user',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-create-user.component.html',
  styleUrls: ['./admin-create-user.component.css']
})
export class AdminCreateUserComponent {

  // Data model starts completely blank for security
  newUser: any = {
    name: '',
    email: '',
    password: '',
    department: '',
    role: ''
  };

  isSubmitting = false;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  onSubmit(): void {
    // 🌟 Logic check for @ and .com
    const emailVal = this.newUser.email.toLowerCase();
    if (!emailVal.includes('@') || !emailVal.endsWith('.com')) {
      alert('❌ Please provide a valid email address ending in .com');
      return;
    }

    this.isSubmitting = true;

    this.authService.registerEmployee(this.newUser).subscribe({
      next: () => {
        alert(`✅ Success! ${this.newUser.name} account created.`);
        this.isSubmitting = false;
        this.router.navigate(['/admin']);
      },
      error: (err) => {
        console.error('Error saving user:', err);
        alert(err.error?.message || '❌ Failed to save user.');
        this.isSubmitting = false;
      }
    });
  }

  // Safely route back to the dashboard without saving
  cancel(): void {
    this.router.navigate(['/admin']);
  }
}
