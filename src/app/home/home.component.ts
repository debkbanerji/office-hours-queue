import {Component, OnInit} from '@angular/core';
import {environment} from "../../environments/environment";

@Component({
    selector: 'app-home',
    templateUrl: './home.component.html',
    styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {

    version = environment.VERSION;
    maxGTIDLength = 9;

    digitKeypressBuffer = [];

    constructor() {
    }

    ngOnInit() {
        const component = this;
        document.onkeypress = function (e) {
            console.log(e.keyCode);
            const detectedDigit = e.keyCode - 48;
            if (detectedDigit >= 0 && detectedDigit <= 9) {
                component.digitKeypressBuffer.push(detectedDigit.toString());
                if (component.digitKeypressBuffer.length > component.maxGTIDLength) {
                    component.digitKeypressBuffer.shift();
                }
            }
        };
    }
}
