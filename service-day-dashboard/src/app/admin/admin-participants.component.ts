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

    this.activityService.getActivityById(id).subscribe(act => {
      if (!act) {
        if (isPlatformBrowser(this.platformId)) {
          alert('Activity not found!');
        }
        this.router.navigate(['/admin']);
        return;
      }
      this.activity = act;

      if (!this.activity.registeredStaffIds) {
        this.activity.registeredStaffIds = [];
      }

      while (this.activity.registeredStaffIds.length < (this.activity.registeredSlots || 0)) {
        const randomId = Math.floor(Math.random() * 9000) + 1000;
        if (!this.activity.registeredStaffIds.includes(randomId)) {
          this.activity.registeredStaffIds.push(randomId);
        }
      }

      this.activity.registeredSlots = this.activity.registeredStaffIds.length;

      this.http.get<Employee[]>('assets/mock-data/employees.json').subscribe({
        next: (realEmployees) => {

          // 👉 THE NAME GENERATOR: Mixes first and last names to create 300 unique real names!
          const firstNames = ['Ahmad', 'Siti', 'Mei Ling', 'Rajesh', 'John', 'Emily', 'Amirul', 'Jessica', 'Bala', 'Nur', 'David', 'Farah', 'Kelvin', 'Priya', 'Ziqal', 'Carmen', 'Irfan', 'Nadia', 'Wei Jian', 'Arif'];
          const lastNames = ['Faizal', 'Wong', 'Kumar', 'Chen', 'Amin', 'Davis', 'Lee', 'Teo', 'Sharma', 'Hakimi', 'Abdullah', 'Tan', 'Lim', 'Goh', 'Singh'];

          let allRealNames: string[] = [];
          for (const first of firstNames) {
            for (const last of lastNames) {
              allRealNames.push(`${first} ${last}`);
            }
          }

          // Shuffle the 300 names like a deck of cards
          allRealNames.sort(() => Math.random() - 0.5);

          this.participants = this.activity.registeredStaffIds!.map(staffId => {
            const numericId = Number(staffId);
            const realPerson = realEmployees.find(emp => Number(emp.id) === numericId);

            if (realPerson) {
              return realPerson;
            } else {
              // 🤖 Draw the top name from our massive 300-card deck and delete it so it can never be duplicated!
              const assignedName = allRealNames.shift()!;

              const cleanEmail = assignedName.replace(/\s+/g, '.').toLowerCase();

              return {
                id: numericId,
                name: assignedName,
                email: `${cleanEmail}${numericId}@serviceday.com`,
                password: '',
                role: 'Staff',
                department: 'General Operations'
              } as Employee;
            }
          });

          this.loading = false;
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Error loading employees:', err);
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
