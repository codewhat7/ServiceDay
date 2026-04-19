import { Component, OnInit, NgZone, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule, Router } from '@angular/router';
import { ActivityService } from '../services/activity.service';
import { AuthService } from '../services/auth.service';
import { Activity } from '../models/activity.model';
import { NotificationService } from '../services/notification.service';
import { QRCodeComponent } from 'angularx-qrcode';

@Component({
  selector: 'app-activity-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, QRCodeComponent],
  templateUrl: './activity-detail.component.html',
  styleUrls: ['./activity-detail.component.css']
})
export class ActivityDetailComponent implements OnInit {

  // 🌟 THE FIX: Removed 'static lastRegistrationDate'.
  // We now check the database instead of a shared global variable.

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

    // 1. 🌟 Fetch all activities to see what this specific user has joined
    this.activityService.getActivities().subscribe(allActivities => {

      // Filter activities where THIS user is a participant
      const myRegistrations = allActivities.filter(a =>
        a.registeredStaffIds?.some(id => Number(id) === Number(this.currentUserId))
      );

      // 2. 🌟 DATE CHECK: See if the user is already booked for THIS activity's date
      const targetDate = new Date(this.activity!.date).toDateString();

      const isAlreadyBookedToday = myRegistrations.some(reg =>
        new Date(reg.date).toDateString() === targetDate
      );

      if (isAlreadyBookedToday) {
        alert(`❌ CONFLICT: You are already registered for an activity on ${this.activity!.date}.`);
        return;
      }

      // 3. If no conflict, proceed with registration
      this.activityService.registerActivity(this.activity!.id, this.currentUserId!).subscribe(() => {
        this.isRegistered = true;
        this.notificationService.sendRegistrationEmail(this.currentUserId!, this.activity!.title);
        alert('✅ Successfully registered!');
        this.router.navigate(['/activities']);
      });
    });
  }

  cancel(): void {
    if (this.activity && this.currentUserId) {
      this.activityService.cancelRegistration(this.activity.id, this.currentUserId).subscribe(() => {
        this.isRegistered = false;
        this.notificationService.sendCancellationEmail(this.currentUserId!, this.activity!.title);
        alert('Registration cancelled.');
        this.router.navigate(['/activities']);
      });
    }
  }
}
