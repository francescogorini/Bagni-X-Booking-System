import { Component, OnInit } from '@angular/core';
import {Booking, BookingModel} from "../../../shared/models/booking.model";
import {ActivatedRoute, Router} from "@angular/router";
import {ApiService} from "../../../core/api/api.service";
import {MatSnackBar} from "@angular/material/snack-bar";
import {AppbarAction} from "../../../shared/components/appbars/appbars.model";
import {MatDialog, MAT_DIALOG_DATA} from '@angular/material/dialog';
import {AlertDialogComponent} from "../../../shared/components/alert-dialog/alert-dialog.component";
import {DateUtils} from "../../../shared/utils/date.utils";

@Component({
  selector: 'app-booking-details',
  templateUrl: './booking-details.component.html',
  styleUrls: ['./booking-details.component.scss']
})
export class BookingDetailsComponent implements OnInit {
  // params
  bookingId: string;
  bookingTitle: string;

  downloadedBooking: Booking;
  actions: AppbarAction[] = [];

  constructor(private route: ActivatedRoute,
              private api: ApiService,
              private snackBar: MatSnackBar,
              private dialog: MatDialog,
              private router: Router) { }

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.bookingId = params.id;
      this.bookingTitle = params.title;

      this.api.getBooking(this.bookingId).subscribe(data => {
        const bookingData = data as BookingModel;
        this.downloadedBooking = bookingData ? new Booking(bookingData) : undefined;
        let context = this;
        this.actions.push({
          id: "0",
          name: "Annulla prenotazione",
          mdiIcon: 'trash-can-outline',
          isMdi: true,
          disabled: DateUtils.twoDaysBefore(this.downloadedBooking.dateFrom).getTime() < new Date().getTime(),
          execute: function () {
            context.dialog.open(AlertDialogComponent, {
              data: {
                content: "Sei sicuro di voler annullare la tua prenotazione? L'azione non è reversibile. Ricorda che puoi annullare la prenotazione fino a un massimo di due giorni prima dell'erogazione del servizio.",
                positiveAction: {
                  text: "Sì, annulla",
                  execute: function() {
                    context.api.deleteBooking(context.bookingId).subscribe(resp => {
                      context.router.navigate(['/bookings']).then(() => {
                        context.snackBar.open("Prenotazione annullata.", null, { duration: 4000 });
                      });
                    });
                  }
                },
                negativeAction: {
                  text: "No",
                  execute: function() { }
                }
              }
            });
          }
        });
      });
    });
  }


  /**
   * Compute appbar title basing on the available information.
   */
  getAppbarTitle() : string {
    if (this.downloadedBooking) {
      return this.downloadedBooking.getTitle();
    } else if (this.bookingTitle) {
      return this.bookingTitle;
    } else {
      return '';
    }
  }
}


