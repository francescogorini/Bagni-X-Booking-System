import { Component, OnInit } from '@angular/core';
import {Customer} from "../../../shared/models/customer.model";
import {ApiService} from "../../../core/api/api.service";
import {MatSnackBar} from "@angular/material/snack-bar";
import {AlertDialogComponent} from "../../../shared/components/alert-dialog/alert-dialog.component";
import {MatDialog} from "@angular/material/dialog";
import {Booking} from "../../../shared/models/booking.model";

@Component({
  selector: 'app-admin-contacts',
  templateUrl: './admin-contacts.component.html',
  styleUrls: ['./admin-contacts.component.scss']
})
export class AdminContactsComponent implements OnInit {
  customers: Customer[];

  constructor(private api: ApiService,
              private dialog: MatDialog,
              private snackbar: MatSnackBar) { }

  ngOnInit(): void {
    this.api.getCustomers().subscribe(data => {
      this.customers = data.map(model => new Customer(model));
    });
  }

  generateDeleteCustomerAction(customer: Customer): Function {
    return () => {
      this.dialog.open(AlertDialogComponent, { data: {
          content: "Sei sicuro di voler eliminare il cliente? L'azione interesserà le future prenotazioni, ma non quelle già effettuate.",
          positiveAction: { text: "Sì, elimina", execute: () => {
              this.api.deleteUnregisteredCustomer(customer.id).subscribe(() => {
                this.snackbar.open('Cliente eliminato.', null, {duration: 4000});
                this.updateContacts();
              });
          }},
          negativeAction: { text: "No", execute: () => {} }
      }});
    }
  }

  updateContacts(): void {
    this.api.getCustomers().subscribe(data => {
      this.customers = data.map(model => new Customer(model));
    });
  }
}