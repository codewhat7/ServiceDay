import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { isPlatformBrowser } from '@angular/common';
import { Observable, of, Subject } from 'rxjs';
import { delay, tap, catchError } from 'rxjs/operators';
import { Activity } from '../models/activity.model';

@Injectable()
export class ActivityService {
  // Use a relative path without the leading slash to avoid base href routing issues
  private activitiesUrl = 'assets/mock-data/activities.json';
  private cachedActivities: Activity[] = [];
  private activityUpdatedSubject = new Subject<void>();
  public activityUpdated$ = this.activityUpdatedSubject.asObservable();

  constructor(
    private http: HttpClient,
    @Inject(PLATFORM_ID) private platformId: Object
  ) { }

  // Load all activities from mock JSON
  getActivities(): Observable<Activity[]> {
    // 1. Skip on the server to prevent crashing
    if (!isPlatformBrowser(this.platformId)) {
      return of([]);
    }

    // 2. Fetch the data instantly without the delay() operator
    return this.http.get<Activity[]>(this.activitiesUrl).pipe(
      tap(data => console.log('✅ SUCCESS! JSON Data loaded:', data)),
      catchError(error => {
        console.error('❌ HTTP Error! Angular cannot find the file:', error);
        return of([]); // This guarantees the loading screen goes away even if it fails
      })
    );
  }

  // Get single activity by ID
  getActivityById(id: number): Observable<Activity | undefined> {
    if (!isPlatformBrowser(this.platformId)) {
      return of(undefined);
    }

    return new Observable(observer => {
      this.getActivities().subscribe({
        next: (activities) => {
          const activity = activities.find(a => a.id === id);
          observer.next(activity);
          observer.complete();
        },
        error: (error) => observer.error(error)
      });
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
  deleteActivity(activityId: number): Observable<any> {
    return of({ success: true, message: 'Activity deleted' }).pipe(
      delay(800),
      tap(() => {
        console.log(`Admin deleted activity ${activityId}`);
        // Notify the app that data changed so the UI refreshes instantly
        this.activityUpdatedSubject.next();
      })
    );
  }
  // Create a new activity
  createActivity(newActivityData: any): Observable<any> {
    return of({ success: true, message: 'Activity created' }).pipe(
      delay(800), // Simulate network delay
      tap(() => {
        // Automatically generate the next ID number
        const maxId = this.cachedActivities.length > 0
          ? Math.max(...this.cachedActivities.map(a => a.id))
          : 0;

        // Build the complete activity object
        const activityToAdd: Activity = {
          ...newActivityData,
          id: maxId + 1,
          registeredSlots: 0 // A new activity always starts with 0 volunteers
        };

        // Save it to our in-memory cache
        this.cachedActivities.push(activityToAdd);
        console.log(`Admin created new activity: ${activityToAdd.title}`);

        // Notify the app to refresh the data
        this.activityUpdatedSubject.next();
      })
    );
  }
}
