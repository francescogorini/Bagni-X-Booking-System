import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { HomeComponent } from "./customer/home/home.component";
import { FeedComponent } from "./customer/feed/feed.component";
import { BookingsComponent } from "./customer/bookings/bookings.component";
import { ProfileComponent } from "./customer/profile/profile.component";

// populate app routes
const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'feed', component: FeedComponent },
  { path: 'bookings', component: BookingsComponent },
  { path: 'profile', component: ProfileComponent }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
