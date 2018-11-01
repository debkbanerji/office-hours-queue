import {Component, HostListener, OnInit} from '@angular/core';
import {environment} from "../../environments/environment";
import {MatSnackBar} from "@angular/material";

@Component({
    selector: 'app-home',
    templateUrl: './home.component.html',
    styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {

    bufferSize = 16;
    minBufferCheckLength = 13;
    doubleSwipeWindow = 2000;
    messageDurationMilliseconds = 2000;
    privilegesTimeoutMilliseconds = 10000;
    version = environment.VERSION;
    isDarkTheme: boolean = false;
    LOGO_URL = '/assets/images/Buzz.png';

    appInitialized: boolean = false;
    isInitializing: boolean = false;
    keypressBuffer = [];
    keypressTimestampBuffer = [];

    hasElevatedPrivileges: boolean = false;
    elevatedPrivilegesTimeout = null;

    studentDirectory = {};
    taDirectory = {};
    studentQueue = [];
    taDutyList = [];

    disableAddStudents: boolean = false;

    className: string = null;
    customStudentName: string = null;

    constructor(public snackBar: MatSnackBar) {
    }

    ngOnInit() {
        const component = this;
        document.onkeypress = function (e) {
            component.keypressBuffer.push(String.fromCharCode(e.keyCode));
            component.keypressTimestampBuffer.push(Date.now());
            if (component.keypressBuffer.length > component.bufferSize) {
                component.keypressBuffer.shift();
                component.keypressTimestampBuffer.shift();
            }
            component.checkForCardSwipe();
        };
    }

    checkForCardSwipe() {
        const component = this;
        if (component.appInitialized && component.keypressBuffer.length >= component.minBufferCheckLength) {
            const joinedBuffer = component.keypressBuffer.join('');
            const bufferMatch = /;1570=9(\d{8})/gm.exec(joinedBuffer);
            if (bufferMatch) {
                component.keypressBuffer = [];
                component.keypressTimestampBuffer = [];
                const matchContents = bufferMatch[0];
                const inputGTID = matchContents.substring(6);
                component.handleSwipe(inputGTID);
            }
        }
    }

    handleSwipe(inputGTID) {
        const component = this;
        if (component.studentDirectory[inputGTID]) {
            component.handleStudentSwipe(inputGTID);
        } else if (component.taDirectory[inputGTID]) {
            component.handleTASwipe(inputGTID);
        } else {
            component.showMessage('GTID not recognized');
        }
    }

    unelevatePrivileges() {
        const component = this;
        if (component.elevatedPrivilegesTimeout) {
            clearTimeout(component.elevatedPrivilegesTimeout);
        }
        component.hasElevatedPrivileges = false;
    }

    refreshElevatedPrivileges() {
        const component = this;
        if (component.elevatedPrivilegesTimeout) {
            clearTimeout(component.elevatedPrivilegesTimeout);
        } else {
            component.showMessage('Enabled admin mode');
        }
        component.elevatedPrivilegesTimeout = setTimeout(function () {
            component.hasElevatedPrivileges = false;
            component.elevatedPrivilegesTimeout = null;
        }, component.privilegesTimeoutMilliseconds);
        component.hasElevatedPrivileges = true;
    }


    handleTASwipe(gtid: string) {
        const component = this;
        let taIndex = -1;
        for (let i = 0; i < component.taDutyList.length; i++) {
            if (component.taDutyList[i].gtid === gtid) {
                taIndex = i;
                break;
            }
        }
        if (taIndex >= 0) {
            component.refreshElevatedPrivileges()
        } else {
            let taToAdd = component.taDirectory[gtid];
            component.taDutyList.push({
                name: taToAdd.name,
                email: taToAdd.email,
                nameColor: taToAdd.nameColor,
                gtid: gtid,
                startTime: Date.now(),
                imageURL: taToAdd.imageURL
            });
            component.showMessage(taToAdd.name + ' is now on duty');
        }
    }

    handleStudentSwipe(gtid: string) {
        const component = this;
        if (component.disableAddStudents) {
            component.showMessage('Queue is currently closed - cannot add student')
        } else {
            let studentIndex = -1;
            for (let i = 0; i < component.studentQueue.length; i++) {
                if (component.studentQueue[i].gtid === gtid) {
                    studentIndex = i;
                    break;
                }
            }
            if (studentIndex >= 0) {
                const removedStudent = component.studentQueue[studentIndex];
                if (Date.now() - removedStudent.startTime > component.doubleSwipeWindow) {
                    component.studentQueue.splice(studentIndex, 1);
                    component.showMessage(removedStudent.name + ' removed from queue')
                }
            } else {
                component.studentQueue.push({
                    name: component.studentDirectory[gtid].name,
                    gtid: gtid,
                    startTime: Date.now()
                });
                component.showMessage(component.studentDirectory[gtid].name + ' added to queue')
            }
        }
    }

    addCustomStudent() {
        const component = this;
        component.refreshPrivilegesIfElevated();
        const nameToAdd = component.customStudentName;
        const swipeMatch = /;1570=9(\d{8})/gm.exec(nameToAdd);
        if (swipeMatch) {
            component.keypressBuffer = [];
            component.keypressTimestampBuffer = [];
            const matchContents = swipeMatch[0];
            const inputGTID = matchContents.substring(6);
            component.handleSwipe(inputGTID);
        } else {
            component.studentQueue.push({
                name: nameToAdd,
                gtid: null,
                startTime: Date.now()
            });
            component.showMessage(nameToAdd + ' added to queue');
        }
        component.customStudentName = '';
    }

    classNameChange() {
        const component = this;
        if (/9(\d{8})/gm.exec(component.className)) {
            component.className = ''; // Clear if someone accidentally swiped a buzzcard while this input was selected
        }
        component.refreshPrivilegesIfElevated();
    }

    refreshPrivilegesIfElevated() {
        const component = this;
        if (component.hasElevatedPrivileges) {
            component.refreshElevatedPrivileges();
        }
    }

    initializeApp(filesInput: FileList) {
        const component = this;
        const targetRosterFile = filesInput[0];
        component.isInitializing = true;
        if (targetRosterFile && /.*\.csv$/gim.test(targetRosterFile.name)) {
            const fileReader = new FileReader();
            fileReader.readAsText(targetRosterFile, "UTF-8");
            fileReader.onload = function (evt) {
                const csvLines = fileReader.result.split('\n');
                for (let lineNum = 1; lineNum < csvLines.length; lineNum++) {
                    const line = csvLines[lineNum].replace(/"[^"]*?"/gim, "\"REPLACED\"");
                    const lineSplit = line.split(',');
                    if (lineSplit.length >= 7) {
                        if (/student/gim.test(lineSplit[5])) {
                            component.studentDirectory[lineSplit[2]] = {
                                name: lineSplit[0]
                            };
                        } else if (/(.*t(\.|)a(\.|)$)|(teacher)|(professor)/gim.test(lineSplit[5])) {
                            component.taDirectory[lineSplit[2]] = {
                                name: lineSplit[0],
                                email: lineSplit[1],
                                nameColor: lineSplit.length > 8 && lineSplit[8] && lineSplit[8].length > 1 ? lineSplit[8] : (
                                    /(teacher)|(professor)/gim.test(lineSplit[5]) ? '#a6a000' : (
                                        /head\s*t(\.|)a(\.|)/gim.test(lineSplit[5]) ? '#e91e63' : (
                                            /senior\s*t(\.|)a(\.|)/gim.test(lineSplit[5]) ? '#4882d6'
                                                : null
                                        )
                                    )
                                ),
                                imageURL: lineSplit.length > 7 ? lineSplit[7] : null
                            };
                        } else {
                            console.log('Could not classify ' + lineSplit[0] + ' as T.A. or Teacher')
                        }
                    }
                }
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

    public moveStudentUp(index) {
        this.switchElements(this.studentQueue, index, index - 1);
        this.refreshElevatedPrivileges();
    }

    public moveStudentDown(index) {
        this.switchElements(this.studentQueue, index, index + 1);
        this.refreshElevatedPrivileges();
    }

    public removeStudent(index) {
        this.studentQueue = this.removeAtIndex(this.studentQueue, index);
        this.refreshElevatedPrivileges();
    }

    public removeTA(index) {
        this.taDutyList = this.removeAtIndex(this.taDutyList, index);
        this.refreshElevatedPrivileges();
    }

    public removeAtIndex(arr, index) {
        arr.splice(index, 1);
        return arr
    }

    public switchElements = function (arr, i1, i2) {
        const temp = arr[i1];
        arr[i1] = arr[i2];
        arr[i2] = temp;
    };

    @HostListener('window:beforeunload', ['$event'])
    doSomething($event) {
        if (this.studentQueue.length > 0) $event.returnValue = 'Warning: queue data will be lost';
    }
}
