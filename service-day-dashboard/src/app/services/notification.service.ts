import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, Subject, tap } from 'rxjs';

// 🌟 FIX: Must 'export' this so other files can use it
export interface AppNotification {
  _id: string;
  recipientId?: number;
  type: 'Reminder' | 'Broadcast' | 'Update' | 'Registration' | 'Cancellation';
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  activityId?: number;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private apiUrl = 'https://yt2m56quld.execute-api.us-east-1.amazonaws.com/prod/api/notifications';

  public notificationUpdated$ = new Subject<void>();

  constructor(private http: HttpClient) {}

  notifyUpdate(): void {
    this.notificationUpdated$.next();
  }

  getNotifications(id: number): Observable<AppNotification[]> {
    return this.http.get<AppNotification[]>(`${this.apiUrl}/${id}`);
  }

  // 🌟 FIX: Added missing markAsRead
  markAsRead(id: string): Observable<any> {
    return this.http.patch(`${this.apiUrl}/${id}/read`, {})
      .pipe(tap(() => this.notifyUpdate()));
  }

  // 🌟 FIX: broadcastMessage now handles 1 or 2 arguments to prevent TS2554
  broadcastMessage(title: string, message: string = ''): Observable<any> {
    return this.http.post('${this.apiUrl}/api/admin/broadcast', { title, message })
      .pipe(tap(() => this.notifyUpdate()));
  }

  // 🌟 FIX: Added missing email methods for activity-detail.component
  sendRegistrationEmail(userId: number, activityTitle: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/register-email`, { userId, activityTitle });
  }

  sendCancellationEmail(userId: number, activityTitle: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/cancel-email`, { userId, activityTitle });
  }

  getUnreadCount(id: number): Observable<{ unreadCount: number }> {
    return this.http.get<{ unreadCount: number }>(`${this.apiUrl}/${id}/count`);
  }
}
