import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, map } from 'rxjs';
import { Employee } from '../models/activity.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<Employee | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient) { }

  login(email: string, passwordTyped: string): Observable<boolean> {
    return this.http.get<Employee[]>('assets/mock-data/employees.json').pipe(
      map(employees => {
        // Checks that BOTH the email and password match the JSON exactly
        const user = employees.find(e => e.email === email && e.password === passwordTyped);

        if (user) {
          this.currentUserSubject.next(user);
          return true;
        }
        return false;
      })
    );
  }

  logout(): void {
    this.currentUserSubject.next(null);
  }

  isAdmin(): boolean {
    const user = this.currentUserSubject.value;
    return user !== null && user.role === 'Admin';
  }
}
