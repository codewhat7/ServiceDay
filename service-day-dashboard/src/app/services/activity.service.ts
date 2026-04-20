import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, Subject, tap } from 'rxjs'; // 🌟 Added Subject and tap
import { Activity } from '../models/activity.model';

@Injectable({
  providedIn: 'root'
})
export class ActivityService {

  // 🌟 The master tunnel to your real database!
  private apiUrl = 'http://localhost:3000/api/activities';

  // 🌟 THE FIX: This creates the "radio station" property your list component is looking for.
  // It allows components to "listen" for data changes in real-time.
  public activityUpdated$ = new Subject<void>();

  constructor(private http: HttpClient) {}

  /**
   * Helper method to trigger a refresh across the entire application.
   */
  notifyUpdate(): void {
    this.activityUpdated$.next();
  }

  // 1. Get ALL activities (Used by Dashboards)
  getActivities(): Observable<Activity[]> {
    return this.http.get<Activity[]>(this.apiUrl);
  }

  // 2. Get ONE activity (Used by ActivityDetailComponent)
  getActivityById(id: number): Observable<Activity> {
    return this.http.get<Activity>(`${this.apiUrl}/${id}`);
  }

  // 3. Create an activity (Used by Admin Create)
  createActivity(activityData: any): Observable<Activity> {
    return this.http.post<Activity>(this.apiUrl, activityData)
      .pipe(tap(() => this.notifyUpdate())); // Broadcast update on success
  }

  // 4. Update an activity (Used by Admin Edit)
  updateActivity(id: number, activityData: any): Observable<Activity> {
    return this.http.put<Activity>(`${this.apiUrl}/${id}`, activityData)
      .pipe(tap(() => this.notifyUpdate())); // Broadcast update on success
  }

  // 5. Delete an activity (Used by Admin Dashboard)
  deleteActivity(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`)
      .pipe(tap(() => this.notifyUpdate())); // Broadcast update on success
  }

  // ==========================================
  // REGISTRATION LOGIC (Used by ActivityDetail)
  // ==========================================

  // 6. Register a staff member
  registerActivity(activityId: number, employeeId: number): Observable<any> {
    // We send the employeeId in the body so Node.js can read `req.body.employeeId`
    return this.http.post(`${this.apiUrl}/${activityId}/register`, { employeeId })
      .pipe(tap(() => this.notifyUpdate())); // Broadcast update so list shows new slot count
  }

  // 7. Cancel a registration
  cancelRegistration(activityId: number, employeeId: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/${activityId}/cancel`, { employeeId })
      .pipe(tap(() => this.notifyUpdate())); // Broadcast update so list shows freed slot
  }

  removeParticipantByAdmin(activityId: number, employeeId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${activityId}/participants/${employeeId}`).pipe(
      tap(() => {
        // 🌟 THE FIX: Matches your exact variable name!
        this.activityUpdated$.next();
      })
    );
  }
}
