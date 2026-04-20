import { Component, ChangeDetectorRef } from '@angular/core';
import { CommonModule, Location } from '@angular/common'; // 🌟 Added Location
import { HttpClient } from '@angular/common/http';
import { ZXingScannerModule } from '@zxing/ngx-scanner';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-admin-scanner',
  standalone: true,
  imports: [CommonModule, ZXingScannerModule, RouterModule],
  templateUrl: './admin-scanner.component.html',
  styleUrls: ['./admin-scanner.component.css']
})
export class AdminScannerComponent {
  statusMessage = 'Waiting for QR Code...';
  isProcessing = false;

  constructor(
    private http: HttpClient,
    private location: Location,
    private cdr: ChangeDetectorRef // 🌟 THE FIX: Forces the UI to refresh!
  ) {}

  handleScanSuccess(scannedString: string) {
    if (this.isProcessing) return;

    this.isProcessing = true;
    this.statusMessage = 'Processing scan...';
    this.cdr.detectChanges(); // 🌟 Tell screen to show "Processing..."

    try {
      const payload = JSON.parse(scannedString);

      if (!payload.employeeId || !payload.activityId) {
        throw new Error("Invalid QR Code Format");
      }

      this.http.post('http://localhost:3000/api/activities/attendance', payload)
        .subscribe({
          next: () => {
            this.statusMessage = '✅ Success! Attendance recorded.';
            this.cdr.detectChanges(); // 🌟 Tell screen to show Success
            this.startCooldown(3000);
          },
          error: (err) => {
            console.error(err);
            this.statusMessage = `❌ Error: ${err.error?.message || err.error?.error || 'Scan failed'}`;
            this.cdr.detectChanges(); // 🌟 Tell screen to show Error
            this.startCooldown(3000);
          }
        });

    } catch (error) {
      this.statusMessage = '❌ Error: Unrecognized QR format.';
      this.cdr.detectChanges(); // 🌟 Tell screen to show Error
      this.startCooldown(3000);
    }
  }

  startCooldown(delay: number) {
    setTimeout(() => {
      this.isProcessing = false;
      this.statusMessage = 'Ready for next scan...';
      this.cdr.detectChanges(); // 🌟 Tell screen it is ready again
    }, delay);
  }
}
