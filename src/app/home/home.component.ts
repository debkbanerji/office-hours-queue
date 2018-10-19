import {Component, OnInit} from '@angular/core';
import {environment} from "../../environments/environment";
import {MatSnackBar} from "@angular/material";

@Component({
    selector: 'app-home',
    templateUrl: './home.component.html',
    styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {

    maxGTIDLength = 9;
    GTIDRegex = /9(\d{8})/gm;
    cardSwipeTimeMilliseconds = 500;
    messageDurationMilliseconds = 2000;
    csvRegex = /.*\.csv$/gm;

    version = environment.VERSION;
    isDarkTheme: boolean = false; // TODO: Add toggle

    appInitialized: boolean = false;
    digitKeypressBuffer = [];
    digitKeypressTimestampBuffer = [];

    className: string = null;

    constructor(public snackBar: MatSnackBar) {
    }

    ngOnInit() {
        const component = this;
        document.onkeypress = function (e) {
            const detectedDigit = e.keyCode - 48;
            if (detectedDigit >= 0 && detectedDigit <= 9) {
                component.digitKeypressBuffer.push(detectedDigit.toString());
                component.digitKeypressTimestampBuffer.push(Date.now());
                if (component.digitKeypressBuffer.length > component.maxGTIDLength) {
                    component.digitKeypressBuffer.shift();
                    component.digitKeypressTimestampBuffer.shift();
                }
                if (component.digitKeypressBuffer.length >= component.maxGTIDLength) {
                    component.checkForCardSwipe();
                }
            }
        };
    }

    checkForCardSwipe() {
        const component = this;
        if (component.appInitialized && Date.now() - component.digitKeypressTimestampBuffer[0] < component.cardSwipeTimeMilliseconds) {
            const inputGTID = component.digitKeypressBuffer.join('').toString();
            if (component.GTIDRegex.test(inputGTID)) {
                console.log(inputGTID);
            }
        }
    }

    initializeApp(filesInput: FileList) {
        const component = this;
        const targetRosterFile = filesInput[0];
        if (targetRosterFile && component.csvRegex.test(targetRosterFile.name)) {
            const fileReader = new FileReader();
            fileReader.readAsText(targetRosterFile, "UTF-8");
            fileReader.onload = function (evt) {
                console.log(fileReader.result);
            };
            fileReader.onerror = function (evt) {
                component.showMessage('Unable to read roster csv file');
            }
        } else {
            component.showMessage('Please select a csv file');
        }
    }

    showMessage(message: string) {
        const component = this;
        component.snackBar.open(message, null, {
            duration: component.messageDurationMilliseconds,
        });
    }
}
