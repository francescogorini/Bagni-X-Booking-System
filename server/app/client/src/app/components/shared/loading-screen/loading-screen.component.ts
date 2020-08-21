import { Component, OnInit } from '@angular/core';
import {Subscription, timer} from 'rxjs';


/**
 * Creates a loading screen with a spinner, that occupies all the
 * available space in the page.
 */

@Component({
  selector: 'app-loading-screen',
  templateUrl: './loading-screen.component.html',
  styleUrls: ['./loading-screen.component.scss']
})
export class LoadingScreenComponent implements OnInit {

  loadingPhrases: String[] = [
    "Aprendo gli ombrelloni...",
    "Sistemando i lettini...",
    "Montando le cabine...",
    "Pulendo la spiaggia..."
  ];

  currentIndex: number;
  timerSubscription: Subscription;

  constructor() {
    this.currentIndex = 0;
  }

  ngOnInit(): void {
    this.startPhrasesTimer();
  }

  ngOnDestroy(): void {
    this.stopPhrasesTimer()
  }


  startPhrasesTimer(): void {
    const source = timer(1000, 1000);
    this.timerSubscription = source.subscribe(val => {
      this.currentIndex = this.newRandomIndex(this.loadingPhrases.length, this.currentIndex);
    });
  }


  newRandomIndex(nOfPhrases: number, previous: number): number {
    let next = Math.floor(Math.random() * nOfPhrases);
    while (previous == next) {
      next = Math.floor(Math.random() * nOfPhrases);
    }
    return next;
  }


  stopPhrasesTimer(): void {
    this.timerSubscription.unsubscribe();
  }
}
