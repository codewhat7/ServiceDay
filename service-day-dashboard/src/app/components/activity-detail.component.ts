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

  // 🌟 THE FIX: This is stored purely in temporary RAM, no localStorage needed!
  static lastRegistrationDate: string | null = null;

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
    this.authService.currentUser$.subscribe(user => {
      this.currentUserId = user ? user.id : null;
      this.checkRegistrationStatus();
    });

    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.activityService.getActivityById(id).subscribe(data => {
      this.activity = data;
      this.checkRegistrationStatus();
    });
  }

  checkRegistrationStatus(): void {
    if (this.activity && this.currentUserId && this.activity.registeredStaffIds) {
      this.isRegistered = this.activity.registeredStaffIds.some(
        id => Number(id) === Number(this.currentUserId)
      );
    } else {
      this.isRegistered = false;
    }
  }

  register(): void {
    if (!this.currentUserId || !this.activity) {
      alert('❌ ERROR: Missing user or activity data.');
      return;
    }

    // --- RULE 1: STAFF CAN ONLY REGISTER ONCE PER DAY (Using RAM) ---
    const today = new Date().toDateString();

    if (ActivityDetailComponent.lastRegistrationDate === today) {
      alert('⏳ REGISTRATION LIMIT: You have already registered for an activity today. Please come back tomorrow!');
      return; // Stops the function instantly
    }

    // --- RULE 2: STAFF CANNOT REGISTER FOR CONFLICTING EVENT DATES ---
    this.activityService.getActivities().subscribe(allActivities => {

      const myActivities = allActivities.filter(a => {
        if (!a.registeredStaffIds) return false;
        return a.registeredStaffIds.some(id => Number(id) === Number(this.currentUserId));
      });

      const targetDate = new Date(this.activity!.date).toDateString();

      const hasConflict = myActivities.some(myAct => {
        const existingDate = new Date(myAct.date).toDateString();
        return existingDate === targetDate;
      });

      if (hasConflict) {
        alert(`❌ SCHEDULE CONFLICT: You are already registered for another activity on ${this.activity!.date}. Staff can only attend 1 activity per event date!`);
        return; // Stops the function instantly
      }

      // --- SUCCESS: PROCEED WITH REGISTRATION ---
      this.activityService.registerActivity(this.activity!.id, this.currentUserId!).subscribe(() => {
        this.isRegistered = true;

        // Apply the Rule 1 Stamp: Save today's date into temporary RAM
        ActivityDetailComponent.lastRegistrationDate = today;

        // Trigger the automated confirmation email
        this.notificationService.sendRegistrationEmail(this.currentUserId!, this.activity!.title);

        alert('✅ Successfully registered! Returning to list...');
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
