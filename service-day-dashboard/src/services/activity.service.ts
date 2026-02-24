import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, Subject } from 'rxjs';
import { delay, tap, catchError } from 'rxjs/operators';
import { Activity } from '../models/activity.model';

@Injectable({
  providedIn: 'root'
})
export class ActivityService {
  private activitiesUrl = 'assets/mock-data/activities.json';
  private activityUpdatedSubject = new Subject<void>();
  public activityUpdated$ = this.activityUpdatedSubject.asObservable();

  constructor(private http: HttpClient) { }

  // Load all activities from mock JSON
  getActivities(): Observable<Activity[]> {
    return this.http.get<Activity[]>(this.activitiesUrl).pipe(
      delay(500), // Simulate network delay
      catchError(error => {
        console.error('Error loading activities:', error);
        return of([]);
      })
    );
  }

  // Get single activity by ID
  getActivityById(id: number): Observable<Activity | undefined> {
    return new Observable(observer => {
      this.getActivities().subscribe(
        activities => {
          const activity = activities.find(a => a.id === id);
          observer.next(activity);
          observer.complete();
        },
        error => observer.error(error)
      );
    });
  }

  // Register for activity
  registerActivity(activityId: number, employeeId: number): Observable<any> {
    const mockResponse = {
      success: true,
      message: 'Registration successful',
      registrationId: Math.floor(Math.random() * 10000)
    };

    return of(mockResponse).pipe(
      delay(1000),
      tap(() => {
        console.log(`Employee ${employeeId} registered for activity ${activityId}`);
        this.activityUpdatedSubject.next();
      })
    );
  }

  // Update activity slots
  updateActivitySlots(activityId: number, newSlots: number): Observable<any> {
    return of({ success: true }).pipe(
      delay(800),
      tap(() => this.activityUpdatedSubject.next())
    );
  }

  // Cancel registration
  cancelRegistration(registrationId: number): Observable<any> {
    return of({ success: true }).pipe(
      delay(800),
      tap(() => this.activityUpdatedSubject.next())
    );
  }
}
