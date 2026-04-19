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
  static lastRegistrationDate: string | null = null;
  activity: Activity | undefined;
  currentUserId: number | null = null;
  isRegistered = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private activityService: ActivityService,
    private authService: AuthService,
    private notificationService: NotificationService,
    private zone: NgZone, // 🌟 Force zone execution
    private cdr: ChangeDetectorRef // 🌟 Force UI repaint
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
            // 🌟 THE FIX: Force the UI to update as soon as data arrives
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
    const today = new Date().toDateString();
    if (ActivityDetailComponent.lastRegistrationDate === today) {
      alert('⏳ You already registered for an activity today!');
      return;
    }
    this.activityService.registerActivity(this.activity.id, this.currentUserId).subscribe(() => {
      this.isRegistered = true;
      ActivityDetailComponent.lastRegistrationDate = today;
      this.notificationService.sendRegistrationEmail(this.currentUserId!, this.activity!.title);
      alert('✅ Successfully registered!');
      this.router.navigate(['/activities']);
    });
  }

  cancel(): void {
    if (this.activity && this.currentUserId) {
      this.activityService.cancelRegistration(this.activity.id, this.currentUserId).subscribe(() => {
        this.isRegistered = false;
        ActivityDetailComponent.lastRegistrationDate = null;
        this.notificationService.sendCancellationEmail(this.currentUserId!, this.activity!.title);
        alert('Registration cancelled.');
        this.router.navigate(['/activities']);
      });
    }
  }
}
