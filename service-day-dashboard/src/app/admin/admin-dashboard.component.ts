import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { SharedModule } from '../shared/shared.module';
import { ActivityService } from '../services/activity.service';
import { Activity } from '../models/activity.model';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [SharedModule, RouterModule],
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.css']
})
export class AdminDashboardComponent implements OnInit {
  activities: Activity[] = [];
  loading = true;

  constructor(
    private activityService: ActivityService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadData();
    this.activityService.activityUpdated$.subscribe(() => {
      this.loadData();
    });
  }

  loadData(): void {
    this.loading = true;
    this.activityService.getActivities().subscribe(data => {
      this.activities = data;
      this.loading = false;
      this.cdr.detectChanges();
    });
  }

  // --- 1. MONITOR PARTICIPATION LOGIC ---
  get totalActivities(): number {
    return this.activities.length;
  }

  get totalRegisteredParticipants(): number {
    return this.activities.reduce((sum, activity) => sum + activity.registeredSlots, 0);
  }

  get totalAvailableSlots(): number {
    return this.activities.reduce((sum, activity) => sum + activity.totalSlots, 0);
  }

  getParticipationRate(activity: Activity): number {
    if (activity.totalSlots === 0) return 0;
    return (activity.registeredSlots / activity.totalSlots) * 100;
  }

  // --- 2. MANAGE ACTIVITIES LOGIC ---
  deleteActivity(id: number): void {
    if(confirm('Are you sure you want to delete this NGO activity?')) {
      this.activityService.deleteActivity(id).subscribe(() => {
        alert('Activity deleted successfully!');
      });
    }
  }

  // Mock add function to prove management capabilities
  addNewActivity(): void {
    alert('This opens the "Create Activity" form! (Simulation for Assignment)');
  }
}
