import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ActivityService } from '../services/activity.service';
import { Activity } from '../models/activity.model';

@Component({
  selector: 'app-admin-edit',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './admin-edit.component.html' // <-- Updated to match the new HTML file name
})
export class AdminEditComponent implements OnInit {
  activityId!: number;
  activityData: Partial<Activity> = {};

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private activityService: ActivityService
  ) {}

  ngOnInit(): void {
    // 1. Get the ID from the URL
    this.activityId = Number(this.route.snapshot.paramMap.get('id'));

    // 2. Fetch the existing details
    this.activityService.getActivityById(this.activityId).subscribe(data => {
      if (data) {
        this.activityData = { ...data };
      } else {
        alert('Activity not found!');
        this.router.navigate(['/activities']);
      }
    });
  }

  saveChanges(): void {
    // 3. Send the updated data to the Service
    this.activityService.updateActivity(this.activityId, this.activityData).subscribe(() => {
      alert('✅ Activity updated successfully!');
      this.router.navigate(['/activities']);
    });
  }
}
