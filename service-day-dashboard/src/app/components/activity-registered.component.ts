import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ActivityService } from '../services/activity.service';
import { AuthService } from '../services/auth.service';
import { Activity } from '../models/activity.model';

@Component({
  selector: 'app-registered-history',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './activity-registered.component.html',
  styleUrls: ['./activity-registered.component.css']
})
export class RegisteredHistoryComponent implements OnInit {
  myActivities: Activity[] = [];
  loading = true;

  constructor(
    private activityService: ActivityService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    // 1. Listen for the logged-in user
    this.authService.currentUser$.subscribe(user => {
      if (user) {
        // 2. Fetch all activities
        this.activityService.getActivities().subscribe(allActivities => {
          // 3. Filter to only keep activities where this user's ID is in the array
          this.myActivities = allActivities.filter(a =>
            a.registeredStaffIds && a.registeredStaffIds.includes(user.id)
          );
          this.loading = false;
        });
      } else {
        this.loading = false; // Stop loading if nobody is logged in
      }
    });
  }
}
