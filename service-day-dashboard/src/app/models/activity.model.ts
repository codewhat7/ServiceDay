export interface Activity {
  id:number;
  title:string;
  description:string;
  date:string;
  time:string;
  location:string;
  category:string;
  totalSlots:number;
  registeredSlots:number;
  organization:string;
  registrationDeadline:string;
  difficulty:'Easy'|'Medium'|'Hard';
  registeredStaffIds: number[];
}
export interface Registration {
  id: number;
  employeeId: number;
  activityId: number;
  registrationDate: string;
  status: 'Confirmed' | 'Waitlist' | 'Cancelled';
}

export interface Employee {
  id: number;
  name: string;
  password: string;
  email: string;
  department: string;
  role: string;
}
