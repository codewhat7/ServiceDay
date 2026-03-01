import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms'; // Required for forms!
import { Router, RouterModule } from '@angular/router';
import { ActivityService } from '../services/activity.service';

@Component({
  selector: 'app-admin-create',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './admin-create.component.html',
  styleUrls: ['./admin-create.component.css']
})
export class AdminCreateComponent {
  // Temporary object to hold the form data
  newActivity: any = {
    title: '',
    description: '',
    date: '',
    time: '',
    location: '',
    category: 'Environmental',
    totalSlots: 10,
    organization: '',
    registrationDeadline: '',
    difficulty: 'Easy'
  };

  submitting = false;

  constructor(
    private activityService: ActivityService,
    private router: Router
  ) {}

  onSubmit(): void {
    this.submitting = true;
    this.activityService.createActivity(this.newActivity).subscribe(() => {
      alert('Success! The new activity has been created.');
      this.submitting = false;
      this.router.navigate(['/admin']); // Send the admin back to the dashboard
    });
  }
}
