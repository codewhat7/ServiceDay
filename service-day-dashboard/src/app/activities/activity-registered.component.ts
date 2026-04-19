import { Component, OnInit, ChangeDetectorRef } from '@angular/core'; // 🌟 Added ChangeDetectorRef
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
    private authService: AuthService,
    private cdr: ChangeDetectorRef // 🌟 Injected ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    // 1. Get current user and load activities
    this.authService.currentUser$.subscribe(user => {
      this.currentUserId = user ? user.id : null;
      if (this.currentUserId) {
        this.loadMyActivities();
      }
      this.cdr.detectChanges(); // Force UI update when user data arrives
    });

    // 2. 🌟 Listen for updates (like if a user cancels an activity on the detail page)
    this.activityService.activityUpdated$.subscribe(() => {
      this.loadMyActivities();
    });
  }

  loadMyActivities(): void {
    this.activityService.getActivities().subscribe(allActivities => {
      // 🌟 THE FIX: Use strict Number comparison for your MongoDB numeric IDs
      this.myActivities = allActivities.filter(activity =>
        activity.registeredStaffIds &&
        activity.registeredStaffIds.some(id => Number(id) === Number(this.currentUserId))
      );

      this.cdr.detectChanges(); // 🌟 THE FIX: Force the UI to show the list immediately
    });
  }

  // Hides any activity where the event date has already passed.
  getVisibleActivities(): Activity[] {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return this.myActivities.filter(activity => {
      const eventDate = new Date(activity.date);
      eventDate.setHours(0, 0, 0, 0);
      return eventDate >= today;
    });
  }
}
