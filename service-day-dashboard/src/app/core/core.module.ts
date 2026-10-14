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
  constructor(@Optional() @SkipSelf() parentModule: CoreModule) {
    if (parentModule) {
      throw new Error('CoreModule is already loaded. Import it in app.config.ts only.');
    }
  }
}
