import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ActivityService } from '../services/activity.service';
import { Activity } from '../models/activity.model';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-activity-list',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './activity-list.component.html',
  styleUrls: ['./activity-list.component.css']
})
export class ActivityListComponent implements OnInit {
  activities: Activity[] = [];
  loading = true;
  error: string | null = null;
  selectedCategory = 'All';
  categories = ['All', 'Education', 'Environmental', 'Health'];
  currentUserId: number | null = null;
  userRole: string | null = null;

  constructor(
    private activityService: ActivityService,
    private cdr: ChangeDetectorRef,
    private authService: AuthService
  ) { }

  ngOnInit(): void {
    // 1. INSTANT AUTH CHECK: Run this immediately, do not trap it inside anything else!
    this.authService.currentUser$.subscribe(user => {
      this.currentUserId = user ? user.id : null;
      this.userRole = user ? user.role : null;
      this.cdr.detectChanges(); // Tell the screen to redraw
    });

    // 2. Load the activities from memory or JSON
    this.loadActivities();

    // 3. Listen for changes (like when you click register on the details page)
    this.activityService.activityUpdated$.subscribe(() => {
      this.loadActivities();
    });
  }

  loadActivities(): void {
    this.loading = true;
    this.activityService.getActivities().subscribe({
      next: (data) => {
        this.activities = data;
        this.loading = false;
        this.error = null;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error loading activities:', err);
        this.error = 'Failed to load activities';
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  getFilteredActivities(): Activity[] {
    if (this.selectedCategory === 'All') {
      return this.activities;
    }
    return this.activities.filter(a => a.category === this.selectedCategory);
  }

  getAvailableSlots(activity: Activity): number {
    // Adding a fallback to 0 in case registeredSlots is missing
    return activity.totalSlots - (activity.registeredSlots || 0);
  }

  isDeadlinePassed(activity: Activity): boolean {
    const deadline = new Date(activity.registrationDeadline);
    const today = new Date();
    return today > deadline;
  }

  isUserRegistered(activity: Activity): boolean {
    // If the component doesn't know who Sarah is, return false
    if (!this.currentUserId || !activity.registeredStaffIds) {
      return false;
    }
    // Check if Sarah's ID is in the array
    return activity.registeredStaffIds.some(id => String(id) === String(this.currentUserId));
  }

  deleteActivity(id: number): void {
    if (confirm('Are you sure you want to completely delete this activity?')) {
      this.activityService.deleteActivity(id).subscribe(() => {
        alert('Activity deleted successfully.');
      });
    }
  }
}
