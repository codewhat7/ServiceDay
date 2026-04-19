import { Component, OnInit, ChangeDetectorRef, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { ActivityService } from '../services/activity.service';
import { Activity, Employee } from '../models/activity.model';

@Component({
  selector: 'app-admin-participants',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './admin-participants.component.html'
})
export class AdminParticipantsComponent implements OnInit {
  activity!: Activity;
  participants: Employee[] = [];
  loading = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private activityService: ActivityService,
    private http: HttpClient,
    private cdr: ChangeDetectorRef,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loading = true;
    const id = Number(this.route.snapshot.paramMap.get('id'));

    // 1. First, get the Activity to show the Title and total count
    this.activityService.getActivityById(id).subscribe(act => {
      if (!act) {
        this.router.navigate(['/admin']);
        return;
      }
      this.activity = act;

      // 2. 🌟 THE FIX: Fetch the actual participants from the database
      // This replaces the "random name generator" logic
      this.http.get<Employee[]>(`http://localhost:3000/api/activities/${id}/participants`).subscribe({
        next: (realParticipants) => {
          this.participants = realParticipants;
          this.loading = false;
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Error loading real participants:', err);
          this.loading = false;
          this.cdr.detectChanges();
        }
      });
    });
  }

  removeStaff(staffId: number): void {
    if (isPlatformBrowser(this.platformId)) {
      if (confirm('Are you sure you want to remove this staff member from the activity?')) {
        this.activity.registeredStaffIds = this.activity.registeredStaffIds!.filter(id => Number(id) !== Number(staffId));
        this.activity.registeredSlots = this.activity.registeredStaffIds.length;

        this.activityService.updateActivity(this.activity.id, this.activity).subscribe(() => {
          alert('✅ Staff member removed successfully!');
          this.loadData();
        });
      }
    }
  }
}
