import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, map } from 'rxjs';
import { Employee } from '../models/activity.model';

@Injectable({
  providedIn: 'root' // 1. FIX: Makes this a global service so Angular doesn't delete it!
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<Employee | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(
    private http: HttpClient,
    @Inject(PLATFORM_ID) private platformId: Object // 2. FIX: Safely check for the browser
  ) {
    // 3. FIX: Check the browser's notebook right when the app loads
    if (isPlatformBrowser(this.platformId)) {
      const savedUser = localStorage.getItem('mockLoggedInUser');
      if (savedUser) {
        // If we found a saved user, log them in instantly
        this.currentUserSubject.next(JSON.parse(savedUser));
      }
    }
  }

  // Your exact login logic, completely untouched!
  login(email: string, passwordTyped: string): Observable<boolean> {
    // 🌟 Changed from 'assets/mock-data...' to your Node.js backend
    return this.http.get<Employee[]>('http://localhost:3000/api/employees').pipe(
      map(employees => {
        const user = employees.find(e => e.email === email && e.password === passwordTyped);

        if (user) {
          if (isPlatformBrowser(this.platformId)) {
            localStorage.setItem('mockLoggedInUser', JSON.stringify(user));
          }
          this.currentUserSubject.next(user);
          return true;
        }
        return false;
      })
    );
  }

  logout(): void {
    // 5. FIX: Erase the notebook when they log out
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem('mockLoggedInUser');
    }
    this.currentUserSubject.next(null);
  }

  // Your exact isAdmin logic, completely untouched!
  isAdmin(): boolean {
    const user = this.currentUserSubject.value;
    return user !== null && user.role === 'Admin';
  }
  // 🌟 NEW: Send a new user to the database
  registerEmployee(newUserData: any): Observable<any> {
    return this.http.post('http://localhost:3000/api/employees', newUserData);
  }
}
