import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { isPlatformBrowser } from '@angular/common';
import { Observable, of, Subject } from 'rxjs';
import { delay, tap, catchError } from 'rxjs/operators';
import { Activity } from '../models/activity.model';

@Injectable({
  providedIn: 'root' // <-- CRITICAL: This makes the "Whiteboard" permanent!
})
export class ActivityService {
  private activitiesUrl = 'assets/mock-data/activities.json';
  private cachedActivities: Activity[] = [];
  private activityUpdatedSubject = new Subject<void>();
  public activityUpdated$ = this.activityUpdatedSubject.asObservable();

  constructor(
    private http: HttpClient,
    @Inject(PLATFORM_ID) private platformId: Object
  ) { }

  getActivities(): Observable<Activity[]> {
    if (!isPlatformBrowser(this.platformId)) {
      return of([]);
    }

    if (this.cachedActivities.length > 0) {
      return of(this.cachedActivities);
    }

    return this.http.get<Activity[]>(this.activitiesUrl).pipe(
      tap(data => {
        this.cachedActivities = data;
        console.log('✅ SUCCESS! JSON Data loaded into cache');
      }),
      catchError(error => {
        console.error('❌ HTTP Error! Angular cannot find the file:', error);
        return of([]);
      })
    );
  }

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

  registerActivity(activityId: number, employeeId: number): Observable<any> {
    return of({ success: true, message: 'Registration successful' }).pipe(
      delay(800),
      tap(() => {
        const activity = this.cachedActivities.find(a => a.id === activityId);
        if (activity) {
          if (!activity.registeredStaffIds) {
            activity.registeredStaffIds = [];
          }
          if (!activity.registeredStaffIds.includes(employeeId)) {
            activity.registeredStaffIds.push(employeeId);
            activity.registeredSlots = (activity.registeredSlots || 0) + 1;
          }
        }
        console.log(`Employee ${employeeId} registered for activity ${activityId}`);
        this.activityUpdatedSubject.next();
      })
    );
  }

  cancelRegistration(activityId: number, employeeId: number): Observable<any> {
    return of({ success: true }).pipe(
      delay(800),
      tap(() => {
        const activity = this.cachedActivities.find(a => a.id === activityId);
        if (activity && activity.registeredStaffIds) {
          activity.registeredStaffIds = activity.registeredStaffIds.filter(id => id !== employeeId);
          if (activity.registeredSlots && activity.registeredSlots > 0) {
            activity.registeredSlots -= 1;
          }
        }
        console.log(`Employee ${employeeId} cancelled registration for activity ${activityId}`);
        this.activityUpdatedSubject.next();
      })
    );
  }

  updateActivitySlots(activityId: number, newSlots: number): Observable<any> {
    return of({ success: true }).pipe(
      delay(800),
      tap(() => this.activityUpdatedSubject.next())
    );
  }

  deleteActivity(activityId: number): Observable<any> {
    return of({ success: true, message: 'Activity deleted' }).pipe(
      delay(800),
      tap(() => {
        this.cachedActivities = this.cachedActivities.filter(a => a.id !== activityId);
        console.log(`Admin deleted activity ${activityId}`);
        this.activityUpdatedSubject.next();
      })
    );
  }

  createActivity(newActivityData: any): Observable<any> {
    return of({ success: true, message: 'Activity created' }).pipe(
      delay(800),
      tap(() => {
        const maxId = this.cachedActivities.length > 0
          ? Math.max(...this.cachedActivities.map(a => a.id))
          : 0;

        const activityToAdd: Activity = {
          ...newActivityData,
          id: maxId + 1,
          registeredSlots: 0,
          registeredStaffIds: []
        };

        this.cachedActivities.push(activityToAdd);
        console.log(`Admin created new activity: ${activityToAdd.title}`);
        this.activityUpdatedSubject.next();
      })
    );
  }
}
