import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ActivityService } from '../services/activity.service';
import { Activity } from '../models/activity.model';

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

  constructor(private activityService: ActivityService) { }

  ngOnInit(): void {
    this.loadActivities();

    // Subscribe to updates
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
      },
      error: (err) => {
        console.error('Error loading activities:', err);
        this.error = 'Failed to load activities';
        this.loading = false;
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
    return activity.totalSlots - activity.registeredSlots;
  }

  isDeadlinePassed(activity: Activity): boolean {
    const deadline = new Date(activity.registrationDeadline);
    const today = new Date();
    return today > deadline;
  }
}
