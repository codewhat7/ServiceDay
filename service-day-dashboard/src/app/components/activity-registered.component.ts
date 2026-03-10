import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ActivityService } from '../services/activity.service';
import { AuthService } from '../services/auth.service';
import { Activity } from '../models/activity.model';

@Component({
  selector: 'app-activity-registered',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './activity-registered.component.html',
  styleUrls: ['./activity-registered.component.css']
})
export class ActivityRegisteredComponent implements OnInit {
  myActivities: Activity[] = [];
  currentUserId: number | null = null;

  constructor(
    private activityService: ActivityService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.authService.currentUser$.subscribe(user => {
      this.currentUserId = user ? user.id : null;
      if (this.currentUserId) {
        this.loadMyActivities();
      }
    });
  }

  loadMyActivities(): void {
    this.activityService.getActivities().subscribe(allActivities => {
      // Find all activities where this user's ID is in the registeredStaffIds list
      this.myActivities = allActivities.filter(activity =>
        activity.registeredStaffIds && activity.registeredStaffIds.includes(this.currentUserId!)
      );
    });
  }

  // 🌟 THIS IS THE MAGIC FUNCTION!
  // It hides any activity where the event date has already passed.
  getVisibleActivities(): Activity[] {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset clock to midnight so today's events still show up!

    return this.myActivities.filter(activity => {
      const eventDate = new Date(activity.date);
      eventDate.setHours(0, 0, 0, 0);

      // If the eventDate is greater than or equal to today, keep it visible!
      return eventDate >= today;
    });
  }
}
