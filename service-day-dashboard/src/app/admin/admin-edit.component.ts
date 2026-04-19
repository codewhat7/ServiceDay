import { Component, OnInit, NgZone, ChangeDetectorRef } from '@angular/core'; // 🌟 Added NgZone and ChangeDetectorRef
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ActivityService } from '../services/activity.service';
import { Activity } from '../models/activity.model';

@Component({
  selector: 'app-admin-edit',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './admin-edit.component.html',
  styleUrl: './admin-edit.component.css'
})
export class AdminEditComponent implements OnInit {
  activityId!: number;
  activityData: Partial<Activity> = {};
  loading = true; // 🌟 Added loading state

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private activityService: ActivityService,
    private zone: NgZone, // 🌟 Injected NgZone
    private cdr: ChangeDetectorRef // 🌟 Injected ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    // 1. 🌟 THE FIX: Subscribe to paramMap instead of using snapshot
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.activityId = Number(id); // 🌟 Ensure numeric ID conversion for MongoDB

        // 2. Fetch the existing details
        this.activityService.getActivityById(this.activityId).subscribe({
          next: (data) => {
            if (data) {
              // 🌟 THE FIX: Force the UI to populate fields instantly
              this.zone.run(() => {
                this.activityData = { ...data };
                this.loading = false;
                this.cdr.detectChanges();
              });
            } else {
              alert('Activity not found!');
              this.router.navigate(['/activities']);
            }
          },
          error: (err) => {
            console.error('❌ Error fetching activity:', err);
            this.loading = false;
          }
        });
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
