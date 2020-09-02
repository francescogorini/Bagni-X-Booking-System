import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {AbstractControl, Form, FormBuilder, FormGroup, Validators} from "@angular/forms";
import {Booking} from "../../../shared/models/booking.model";
import {bookingsMock} from "../../../core/mocks/bookings.mock";
import {MatRadioChange} from "@angular/material/radio";

@Component({
  selector: 'app-nb-period',
  templateUrl: './nb-period.component.html',
  styleUrls: ['./nb-period.component.scss']
})
export class NbPeriodComponent implements OnInit {
  @Input() booking: Booking;
  @Output() bookingChange: EventEmitter<Booking> = new EventEmitter<Booking>();
  formGroup: FormGroup;
  seasonMinDate: Date;
  seasonMaxDate: Date;
  currentDateFrom: Date;
  currentDateTo: Date;

  readonly DATE_RANGE_TYPES = {
    period: 'period',
    day: 'day',
    halfDay: 'halfDay'
  }

  readonly HALF_DAY_PERIODS = {
    morning: 'morning',
    afternoon: 'afternoon'
  }


  constructor(private _formBuilder: FormBuilder) { }


  /**
   * Initializes the component, assigning initialization values.
   */
  ngOnInit(): void {
    this.currentDateFrom = this.booking.dateFrom;
    this.currentDateTo = this.booking.dateTo;

    // todo get from server?
    this.seasonMinDate = new Date('2020-5-15');
    this.seasonMaxDate = new Date('2020-10-1');

    this.formGroup = this._formBuilder.group({
      dateRangeType: [this.DATE_RANGE_TYPES.period, Validators.required],
      periodDateRange: this._formBuilder.group({
        periodDateFrom: [this.currentDateFrom, Validators.required],
        periodDateTo: [this.currentDateTo, Validators.required],
      }),
      dailyDatePicker: [{value: this.currentDateFrom, disabled: true}, Validators.required],
      halfDay: this._formBuilder.group({
        halfDayDatePicker: [{value: this.currentDateFrom, disabled: true}, Validators.required],
        halfDayPeriod: [{value: this.HALF_DAY_PERIODS.morning, disabled: true}, Validators.required]
      })
    });
  }


  /**
   * When the user selects a different date range type, the associated fields
   * are enabled.
   * @param event: data about the new data range type
   */
  dateRangeTypeChange(event: MatRadioChange) {
    switch(event.value) {
      case this.DATE_RANGE_TYPES.period:
        this.formGroup.get('periodDateRange').enable();
        this.formGroup.get('dailyDatePicker').disable();
        this.formGroup.get('halfDay').disable();
        break;

      case this.DATE_RANGE_TYPES.day:
        this.formGroup.get('periodDateRange').disable();
        this.formGroup.get('dailyDatePicker').enable();
        this.formGroup.get('halfDay').disable();
        break;

      case this.DATE_RANGE_TYPES.halfDay:
        this.formGroup.get('periodDateRange').disable();
        this.formGroup.get('dailyDatePicker').disable();
        this.formGroup.get('halfDay').enable();
        break;
    }
  }


  /**
   * If the form is valid, and the user clicks into the next step
   * (or into the button to earn it), the following function is fired
   * from new-booking component, emitting the new booking value with
   * updated dates.
   */
  updateBookingDates() {
    let dateFrom: Date;
    let dateTo: Date;

    switch(this.formGroup.get('dateRangeType').value) {
      case this.DATE_RANGE_TYPES.period:
        // adds a day to t
        dateFrom = new Date(this.formGroup.get('periodDateRange.periodDateFrom').value);
        dateTo = this.addDay(new Date(this.formGroup.get('periodDateRange.periodDateTo').value));
        break;

      case this.DATE_RANGE_TYPES.day:
        dateFrom = new Date(this.formGroup.get('dailyDatePicker').value);
        dateTo = this.addDay(dateFrom);
        break;

      case this.DATE_RANGE_TYPES.halfDay:
        if (this.formGroup.get('halfDay.halfDayPeriod').value == this.HALF_DAY_PERIODS.morning) {
          dateFrom = new Date(this.formGroup.get('halfDay.halfDayDatePicker').value);
          dateTo = this.addHalfDay(dateFrom);
        } else {
          dateFrom = this.addHalfDay(new Date(this.formGroup.get('halfDay.halfDayDatePicker').value));
          dateTo = this.addHalfDay(dateFrom);
        }
        break;
    }

    this.booking.dateFrom = dateFrom;
    this.booking.dateTo = dateTo;
    this.bookingChange.emit(this.booking);
  }


  // utilities

  addDay(date: Date): Date {
    date.setDate(date.getDate() + 1);
    return date;
  }

  addHalfDay(date: Date): Date {
    date.setTime(date.getTime() + 12*60*60*1000);
    return date;
  }
}

