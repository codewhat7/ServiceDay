import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {

  constructor() { }

  // 1. Automated: Successful Registration
  sendRegistrationEmail(userId: number, activityTitle: string): void {
    console.log(`%c📧 EMAIL SENT: To User #${userId}`, 'color: #28a745; font-weight: bold; font-size: 14px;');
    console.log(`Subject: Registration Confirmed - ${activityTitle}`);
    console.log(`Body: You have successfully registered for this Service Day activity. We will see you there!`);
  }

  // 2. Automated: Cancellation
  sendCancellationEmail(userId: number, activityTitle: string): void {
    console.log(`%c📧 EMAIL SENT: To User #${userId}`, 'color: #dc3545; font-weight: bold; font-size: 14px;');
    console.log(`Subject: Registration Cancelled - ${activityTitle}`);
    console.log(`Body: You have successfully withdrawn from this event. Your slot has been opened for others.`);
  }

  // 3. Admin: Broadcast Message
  broadcastMessage(message: string): void {
    console.log(`%c📢 SYSTEM BROADCAST: To ALL Staff & NGOs`, 'color: #0dcaf0; font-weight: bold; font-size: 14px;');
    console.log(`Message: ${message}`);
  }

  // 4. Admin: Set Reminder Schedule
  setReminderSchedule(intervals: string[]): void {
    console.log(`%c⚙️ SYSTEM SETTINGS UPDATED`, 'color: #f59e0b; font-weight: bold; font-size: 14px;');
    console.log(`Automated schedule reminders will now fire: ${intervals.join(', ')} before the activity.`);
  }
}
