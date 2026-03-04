import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ActivityService } from '../services/activity.service';
import { Activity } from '../models/activity.model';

@Component({
  selector: 'app-admin-schedule',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './admin-schedule.component.html',
  styleUrls: ['./admin-schedule.component.css']
})
export class AdminScheduleComponent implements OnInit {
  activityId!: number;
  activityData: Partial<Activity> = {};

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private activityService: ActivityService
  ) {}

  ngOnInit(): void {
    // 1. Grab the ID from the URL (e.g., if you clicked Activity #2)
    this.activityId = Number(this.route.snapshot.paramMap.get('id'));

    // 2. Fetch the specific activity data
    this.activityService.getActivityById(this.activityId).subscribe(data => {
      if (data) {
        this.activityData = { ...data };

        // 3. If the activity doesn't have a schedule yet, create a blank one safely
        if (!this.activityData.reminders) {
          this.activityData.reminders = { oneWeek: false, threeDays: false, oneDay: false };
        }
      } else {
        alert('Activity not found!');
        this.router.navigate(['/admin']);
      }
    });
  }

  saveSchedule(): void {
    // 4. Save the new checkbox settings to the service
    this.activityService.updateActivity(this.activityId, this.activityData).subscribe(() => {
      alert(`✅ Automated reminders saved for ${this.activityData.title}!`);
      this.router.navigate(['/admin']);
    });
  }
}
