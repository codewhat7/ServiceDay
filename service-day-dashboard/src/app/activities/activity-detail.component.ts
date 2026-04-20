import { Component, OnInit, NgZone, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule, Router } from '@angular/router';
import { ActivityService } from '../services/activity.service';
import { AuthService } from '../services/auth.service';
import { Activity } from '../models/activity.model';
import { NotificationService } from '../services/notification.service';

@Component({
  selector: 'app-activity-detail',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './activity-detail.component.html',
  styleUrls: ['./activity-detail.component.css']
})
export class ActivityDetailComponent implements OnInit {

  activity: Activity | undefined;
  currentUserId: number | null = null;
  isRegistered = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private activityService: ActivityService,
    private authService: AuthService,
    private notificationService: NotificationService,
    private zone: NgZone,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.authService.currentUser$.subscribe(user => {
      this.currentUserId = user ? user.id : null;
      this.checkRegistrationStatus();
      this.cdr.detectChanges();
    });

    this.route.paramMap.subscribe(params => {
      const id = Number(params.get('id'));
      if (id) {
        this.activityService.getActivityById(id).subscribe({
          next: (data) => {
            this.zone.run(() => {
              this.activity = data;
              this.checkRegistrationStatus();
              this.cdr.detectChanges();
            });
          }
        });
      }
    });
  }

  checkRegistrationStatus(): void {
    if (this.activity && this.currentUserId && this.activity.registeredStaffIds) {
      this.isRegistered = this.activity.registeredStaffIds.some(
        id => Number(id) === Number(this.currentUserId)
      );
    }
  }

  register(): void {
    if (!this.currentUserId || !this.activity) return;

    this.activityService.getActivities().subscribe(allActivities => {

      const myRegistrations = allActivities.filter(a =>
        a.registeredStaffIds?.some(id => Number(id) === Number(this.currentUserId))
      );

      // 🌟 ADDED: THE "STRICT 1 ACTIVITY" FRONTEND CHECK
      // This stops the user if they have ANY existing registration in the system.
      if (myRegistrations.length > 0) {
        alert("Employee had register an activity today so cant register for another one");
        return;
      }

      const targetDate = new Date(this.activity!.date).toDateString();

      const isAlreadyBookedToday = myRegistrations.some(reg =>
        new Date(reg.date).toDateString() === targetDate
      );

      if (isAlreadyBookedToday) {
        alert(`❌ CONFLICT: You are already registered for an activity on ${this.activity!.date}.`);
        return;
      }

      this.activityService.registerActivity(this.activity!.id, this.currentUserId!).subscribe({
        next: () => {
          this.isRegistered = true;
          this.notificationService.sendRegistrationEmail(this.currentUserId!, this.activity!.title);
          alert('✅ Successfully registered!');
          this.router.navigate(['/activities']);
        },
        error: (err: any) => {
          // This catches the "Limit Reached" error from your server.js
          const errorMessage = err.error?.error || '❌ Registration failed.';
          alert(errorMessage);
        }
      });
    });
  }

  cancel(): void {
    if (this.activity && this.currentUserId) {
      this.activityService.cancelRegistration(this.activity.id, this.currentUserId).subscribe({
        next: () => {
          this.isRegistered = false;
          this.notificationService.sendCancellationEmail(this.currentUserId!, this.activity!.title);
          alert('Registration cancelled.');
          this.router.navigate(['/activities']);
        },
        // 🌟 ADDED: Error handling for cancellation
        error: (err: any) => {
          console.error("Cancellation failed", err);
          alert('❌ Failed to cancel registration.');
        }
      });
    }
  }
}
