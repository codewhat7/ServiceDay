import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms'; // <-- Required for the Notification Center
import { ActivityService } from '../services/activity.service';
import { NotificationService } from '../services/notification.service';
import { Activity } from '../models/activity.model';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.css'] // Ensure this matches your actual CSS file name
})
export class AdminDashboardComponent implements OnInit {
  activities: Activity[] = [];
  loading = true;

  // Stats
  totalActivities = 0;
  totalAvailableSlots = 0;
  totalRegisteredParticipants = 0;

  // Use Case 5: Notification Center Variables
  broadcastMessageText: string = '';
  reminders = { oneWeek: true, threeDays: true, oneDay: true };

  constructor(
    private activityService: ActivityService,
    private notificationService: NotificationService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadActivities();
  }

  loadActivities(): void {
    this.loading = true;
    this.activityService.getActivities().subscribe(data => {
      this.activities = data;
      this.calculateStats();
      this.loading = false;
      this.cdr.detectChanges();
    });
  }

  calculateStats(): void {
    this.totalActivities = this.activities.length;
    this.totalAvailableSlots = this.activities.reduce((sum, act) => sum + act.totalSlots, 0);
    this.totalRegisteredParticipants = this.activities.reduce((sum, act) => sum + (act.registeredSlots || 0), 0);
  }

  getParticipationRate(activity: Activity): number {
    if (!activity.totalSlots) return 0;
    return ((activity.registeredSlots || 0) / activity.totalSlots) * 100;
  }

  // Use Case 1: Delete
  deleteActivity(id: number): void {
    if (confirm('Are you sure you want to delete this activity?')) {
      this.activityService.deleteActivity(id).subscribe(() => {
        this.loadActivities(); // Refresh table
      });
    }
  }

  // Use Case 4: Manual Reminder
  sendReminder(activity: Activity): void {
    const availableSlots = activity.totalSlots - (activity.registeredSlots || 0);
    const confirmSend = confirm(`Send reminder to staff? There are still ${availableSlots} slots available for "${activity.title}".`);

    if (confirmSend) {
      console.log(`System: Broadcasting reminder for Activity ID ${activity.id} to available employees.`);
      alert(`✅ Reminder successfully sent to available employees for ${activity.title}!`);
    }
  }

  // Use Case 5: Broadcast Message
  sendBroadcast(): void {
    if (this.broadcastMessageText.trim()) {
      this.notificationService.broadcastMessage(this.broadcastMessageText);
      alert('✅ Broadcast message sent to all staff and NGOs!');
      this.broadcastMessageText = ''; // clear input box
    }
  }

}
