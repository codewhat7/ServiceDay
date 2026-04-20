import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationService, AppNotification } from '../services/notification.service';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-notification-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './notification-list.component.html',
  styleUrls: ['./notification-list.component.css']
})
export class NotificationListComponent implements OnInit {
  notifications: AppNotification[] = [];
  currentUserId: number | null = null;
  loading = true;

  constructor(
    private notifService: NotificationService,
    private authService: AuthService,
    private cdr: ChangeDetectorRef
  ) {}

  // 🌟 THE FIX: This function MUST exist if 'implements OnInit' is at the top
  ngOnInit(): void {
    this.authService.currentUser$.subscribe(user => {
      if (user) {
        this.currentUserId = user.id;
        this.loadNotifications();
      }
    });
  }

  loadNotifications(): void {
    if (this.currentUserId) {
      this.notifService.getNotifications(this.currentUserId).subscribe({
        next: (data) => {
          this.notifications = data;
          this.loading = false;
          this.cdr.detectChanges();
        },
        error: (err) => console.error('Error loading notifications:', err)
      });
    }
  }

  handleNotifClick(notif: AppNotification): void {
    if (!notif.isRead) {
      this.notifService.markAsRead(notif._id).subscribe(() => {
        notif.isRead = true;
      });
    }
  }
}
