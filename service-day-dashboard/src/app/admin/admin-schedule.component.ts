import { Component, OnInit, ChangeDetectorRef } from '@angular/core'; // 🌟 Add ChangeDetectorRef
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
  isLoading = true;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private activityService: ActivityService,
    private cdr: ChangeDetectorRef // 🌟 1. Inject it here!
  ) {}

  ngOnInit(): void {
    this.activityId = Number(this.route.snapshot.paramMap.get('id'));

    this.activityService.getActivityById(this.activityId).subscribe({
      next: (data) => {
        if (data) {
          this.activityData = { ...data };
          if (!this.activityData.reminders) {
            this.activityData.reminders = { oneWeek: false, threeDays: false, oneDay: false, oneSecond: false };
          }

          this.isLoading = false;
          this.cdr.detectChanges(); // 🌟 2. Force the screen to hide the loading text!

        } else {
          alert('Activity not found!');
          this.router.navigate(['/admin']);
        }
      },
      error: (err) => {
        console.error("Error fetching activity:", err);
        this.isLoading = false;
        this.cdr.detectChanges(); // 🌟 Force update on error too
        alert("Failed to load schedule.");
        this.router.navigate(['/admin']);
      }
    });
  }
  saveSchedule(): void {
    // 🌟 THE FIX: We completely removed `this.isLoading = true` from here.
    // Now, the form stays on the screen while Node.js saves the data!

    this.activityService.updateActivity(this.activityId, this.activityData).subscribe({
      next: () => {
        // Pop the success message, then instantly redirect to the dashboard
        alert(`✅ Automated reminders saved for ${this.activityData.title}!`);
        this.router.navigate(['/admin']);
      },
      error: (err) => {
        console.error("Save failed:", err);
        alert("❌ Failed to save schedule.");
      }
    });
  }
}
