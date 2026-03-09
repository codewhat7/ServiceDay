import { Component, OnInit } from '@angular/core';
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
  qrData = 'Service Day Activity Entry';
  activity: Activity | undefined;
  currentUserId: number | null = null;
  isRegistered = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private activityService: ActivityService,
    private authService: AuthService,
    private notificationService: NotificationService
  ) { }

  ngOnInit(): void {
    // 1. Get logged in user
    this.authService.currentUser$.subscribe(user => {
      this.currentUserId = user ? user.id : null;
      this.checkRegistrationStatus();
    });

    // 2. Fetch the activity
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.activityService.getActivityById(id).subscribe(data => {
      this.activity = data;
      this.checkRegistrationStatus();
    });
  }

  // 3. Check if user is already registered
  checkRegistrationStatus(): void {
    if (this.activity && this.currentUserId && this.activity.registeredStaffIds) {
      this.isRegistered = this.activity.registeredStaffIds.includes(this.currentUserId);
    } else {
      this.isRegistered = false;
    }
  }

  register(): void {
    // 1. Check if the app actually knows who you are!
    if (!this.currentUserId) {
      alert('❌ ERROR: The app forgot your User ID! Please log out and log back in.');
      console.error('Missing User ID in Detail Component');
      return;
    }

    if (!this.activity) {
      alert('❌ ERROR: Activity data is missing!');
      return;
    }

    // 2. If we have the data, proceed with the whiteboard save!
    this.activityService.registerActivity(this.activity.id, this.currentUserId).subscribe(() => {
      this.isRegistered = true;
      this.notificationService.sendRegistrationEmail(this.currentUserId!, this.activity!.title);
      alert('✅ Successfully registered! Returning to list...');

      // 3. Navigate back to the list using the Router (Soft refresh)
      this.router.navigate(['/activities']);
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
