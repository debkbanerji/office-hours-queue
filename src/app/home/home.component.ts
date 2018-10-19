import {Component, OnInit} from '@angular/core';
import {environment} from "../../environments/environment";
import {MatSnackBar} from "@angular/material";
import {conditionallyCreateMapObjectLiteral} from "@angular/compiler/src/render3/view/util";

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
    csvRegex = /.*\.csv$/gim;
    studentRegex = /student/gim;
    taRegex = /student/gim;

    version = environment.VERSION;
    isDarkTheme: boolean = false; // TODO: Add toggle

    appInitialized: boolean = false;
    isInitializing: boolean = false;
    digitKeypressBuffer = [];
    digitKeypressTimestampBuffer = [];

    studentDirectory = {};
    taDirectory = {};
    studentQueue = [];
    taDutyQueue = [];

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
        component.isInitializing = true;
        if (targetRosterFile && component.csvRegex.test(targetRosterFile.name)) {
            const fileReader = new FileReader();
            fileReader.readAsText(targetRosterFile, "UTF-8");
            fileReader.onload = function (evt) {
                console.log(fileReader.result);
                const csvLines = fileReader.result.split('\n');
                for (let lineNum = 1; lineNum < csvLines.length; lineNum++) {
                    const line = csvLines[lineNum];
                    const lineSplit = line.split(',');
                    if (lineSplit.length >= 7) {
                        // console.log(lineSplit);
                        if (component.studentRegex.test(lineSplit[5])) {
                            component.studentDirectory[lineSplit[2]] = {
                                name: lineSplit[0]
                            };
                        } else {
                            component.taDirectory[lineSplit[2]] = {
                                name: lineSplit[0]
                            };
                        }
                    }
                }
                console.log(component.studentDirectory);
                console.log(component.taDirectory);
                component.isInitializing = false;
                component.appInitialized = true;
            };
            fileReader.onerror = function (evt) {
                component.isInitializing = false;
                component.showMessage('Unable to read roster csv file');
            }
        } else {
            component.isInitializing = false;
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
