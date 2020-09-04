import {Component, Input, OnInit} from '@angular/core';
import {Booking} from "../../../models/booking.model";

@Component({
  selector: 'app-new-booking-appbar',
  templateUrl: './new-booking-appbar.component.html',
  styleUrls: ['./new-booking-appbar.component.scss']
})
export class NewBookingAppbarComponent implements OnInit {
  @Input('back-route') backRoute: string;
  @Input('back-page-name') backPageName: string;
  @Input() booking: Booking;

  constructor() { }

  ngOnInit(): void {
  }

}
