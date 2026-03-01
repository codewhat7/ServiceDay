import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { ActivityService } from '../services/activity.service';
import { Activity } from '../models/activity.model';

@Component({
  selector: 'app-activity-detail',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './activity-detail.component.html',
  styleUrls: ['./activity-detail.component.css']
})
export class ActivityDetailComponent implements OnInit {
  activity: Activity | null = null;
  loading = true;
  registering = false;
  registrationSuccess = false;
  isAlreadyRegistered = false;
  deadlinePassed = false;
  currentEmployeeId = 1;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private activityService: ActivityService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadActivity(Number(id));
    }
  }

  loadActivity(id: number): void {
    this.activityService.getActivityById(id).subscribe({
      next: (activity) => {
        this.activity = activity || null;
        if (this.activity) {
          this.checkDeadline();
        }
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.loading = false;
        this.router.navigate(['/']);
        this.cdr.detectChanges();
      }
    });
  }

  checkDeadline(): void {
    if (!this.activity) return;
    const deadline = new Date(this.activity.registrationDeadline);
    const today = new Date();
    this.deadlinePassed = today > deadline;
  }

  registerForActivity(): void {
    if (!this.activity || this.registering || this.isAlreadyRegistered || this.deadlinePassed) {
      return;
    }

    this.registering = true;

    this.activityService.registerActivity(
      this.activity.id,
      this.currentEmployeeId
    ).subscribe({
      next: () => {
        this.registrationSuccess = true;
        this.activity!.registeredSlots++;
        this.isAlreadyRegistered = true;
        this.registering = false;

        setTimeout(() => {
          this.router.navigate(['/activities']);
        }, 2000);
      },
      error: () => {
        alert('Registration failed. Please try again.');
        this.registering = false;
      }
    });
  }

  getAvailableSlots(): number {
    if (!this.activity) return 0;
    return this.activity.totalSlots - this.activity.registeredSlots;
  }

  getProgressPercentage(): number {
    if (!this.activity) return 0;
    return (this.activity.registeredSlots / this.activity.totalSlots) * 100;
  }

  goBack(): void {
    this.router.navigate(['/']);
  }
}
