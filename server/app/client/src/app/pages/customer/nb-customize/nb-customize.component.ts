import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {Booking} from "../../../shared/models/booking.model";
import {AvailabilityData} from "../../../shared/models/availability-data.model";
import {RankUmbrella} from "../../../shared/models/rank-umbrella.model";
import {Service} from "../../../shared/models/service.model";
import {Umbrella} from "../../../shared/models/umbrella.model";
import {SalableModel} from "../../../shared/models/component-specific/salable.model";

@Component({
  selector: 'app-nb-customize',
  templateUrl: './nb-customize.component.html',
  styleUrls: ['./nb-customize.component.scss']
})
export class NbCustomizeComponent implements OnInit {
  @Input() booking: Booking;
  @Output() bookingChange: EventEmitter<Booking> = new EventEmitter<Booking>();

  availableRankings: RankUmbrella[];
  availableServices: Service[];

  @Output() customizationValidatorChange = new EventEmitter<boolean>();

  constructor() {

  }


  ngOnInit(): void {
  }


  setAvailableItems(availability: AvailabilityData) {
    if (availability != undefined) {
      this.availableRankings = availability.rankUmbrellas.map(rankModel => new RankUmbrella(rankModel))
        .filter(rank => rank.availableUmbrellas && rank.availableUmbrellas.length > 0);

      this.availableServices = availability.services.map(serviceModel => new Service(serviceModel))
        .filter(service => service.price > 0 && service.umbrellaRelated);

    } else {
      this.availableServices = undefined;
      this.availableRankings = undefined;
      // if going back to period, invalidate booking
      this.booking.umbrellas = [];
      this.booking.services = [];
      this.booking.price = 0.0;
      this.bookingChange.emit(this.booking);
      this.customizationValidatorChange.emit(false);
    }
  }

  insertUmbrella(item: SalableModel) {
    let umbrella = item as Umbrella;
    this.booking.umbrellas.push(umbrella);
    this.customizationValidatorChange.emit(true);
    this.bookingChange.emit(this.booking);
  }


  removeUmbrella(item: SalableModel) {
    let umbrella = item as Umbrella;
    const index = this.booking.umbrellas.indexOf(umbrella);
    if (index >= 0) {
      this.booking.umbrellas.splice(index, 1);
    }

    if (this.booking.umbrellas.length <= 0) {
      this.customizationValidatorChange.emit(false);
    }
    this.bookingChange.emit(this.booking);
  }


  insertService(item: SalableModel) {
    let service = item as Service;
    this.booking.services.push(service);
    this.bookingChange.emit(this.booking);
  }


  removeService(item: SalableModel) {
    let service = item as Service;
    const index = this.booking.services.indexOf(service);
    if (index >= 0) {
      this.booking.services.splice(index, 1);
    }
    this.bookingChange.emit(this.booking);
  }
}
