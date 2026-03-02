import { NgModule, Optional, SkipSelf } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { ActivityService } from '../services/activity.service';

@NgModule({
  providers: [
    AuthService,
    ActivityService
  ]
})
export class CoreModule {
  // This is a standard security best-practice. It prevents the app
  // from accidentally importing the service module twice.
  constructor(@Optional() @SkipSelf() parentModule: CoreModule) {
    if (parentModule) {
      throw new Error('CoreModule is already loaded. Import it in the app.config.ts only.');
    }
  }
}
