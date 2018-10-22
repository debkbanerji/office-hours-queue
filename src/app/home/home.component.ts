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
    listenForPrivilegesTimeoutMilliseconds = 3000;
    version = environment.VERSION;
    isDarkTheme: boolean = false; // TODO: Add toggle

    appInitialized: boolean = false;
    isInitializing: boolean = false;
    keypressBuffer = [];
    keypressTimestampBuffer = [];

    listeningForElevatedPrivileges: boolean = false;
    hasElevatedPrivileges: boolean = false;
    listeningForElevatedPrivilegesTimeout = null;

    studentDirectory = {};
    taDirectory = {};
    studentQueue = [];
    taDutyList = [];

    className: string = null;

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
        if (component.keypressBuffer.length >= component.minBufferCheckLength) {
            const joinedBuffer = component.keypressBuffer.join('');
            const bufferMatch = /;1570=9(\d{8})/gm.exec(joinedBuffer);
            if (bufferMatch) {
                component.keypressBuffer = [];
                component.keypressTimestampBuffer = [];
                const matchContents = bufferMatch[0];
                const inputGTID = matchContents.substring(6);
                if (component.listeningForElevatedPrivileges) {
                    component.elevatePrivilegesIfPossible(inputGTID);
                } else if (!component.hasElevatedPrivileges) {
                    if (component.studentDirectory[inputGTID]) {
                        component.handleStudentSwipe(inputGTID);
                    } else if (component.taDirectory[inputGTID]) {
                        component.handleTASwipe(inputGTID);
                    } else {
                        component.showMessage('GTID not recognized');
                    }
                }
            }
        }
    }

    listenForElevatedPrivileges() {
        const component = this;
        component.listeningForElevatedPrivileges = true;
        if (component.listeningForElevatedPrivilegesTimeout) {
            clearTimeout(component.listeningForElevatedPrivilegesTimeout);
        }
        component.listeningForElevatedPrivilegesTimeout = setTimeout(function () {
            if (component.listeningForElevatedPrivileges) {
                component.listeningForElevatedPrivileges = false;
            }
        }, component.listenForPrivilegesTimeoutMilliseconds);
    }

    unelevatePrivileges() {
        const component = this;
        component.hasElevatedPrivileges = false;
        component.listeningForElevatedPrivileges = false;
    }

    elevatePrivilegesIfPossible(inputGTID) {
        const component = this;
        if (component.taDirectory[inputGTID]) {
            component.hasElevatedPrivileges = true;
            component.showMessage('Enabled editing');
        } else {
            component.showMessage('Insufficient privileges');
            component.hasElevatedPrivileges = false;
        }
        component.listeningForElevatedPrivileges = false;
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
            const offDutyTA = component.taDutyList[taIndex];
            if (Date.now() - offDutyTA.startTime > component.doubleSwipeWindow) {
                component.taDutyList.splice(taIndex, 1);
                component.showMessage(offDutyTA.name + ' is now off duty')
            }
        } else {
            let taToAdd = component.taDirectory[gtid];
            component.taDutyList.push({
                name: taToAdd.name,
                email: taToAdd.email,
                isProfessor: taToAdd.isProfessor,
                gtid: gtid,
                startTime: Date.now(),
                imageURL: taToAdd.imageURL
            });
            component.showMessage(taToAdd.name + ' is now on duty')
        }
    }

    handleStudentSwipe(gtid: string) {
        const component = this;
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
                    const line = csvLines[lineNum];
                    const lineSplit = line.split(',');
                    if (lineSplit.length >= 7) {
                        if (/student/gim.test(lineSplit[5])) {
                            component.studentDirectory[lineSplit[2]] = {
                                name: lineSplit[0]
                            };
                        } else {
                            component.taDirectory[lineSplit[2]] = {
                                name: lineSplit[0],
                                email: lineSplit[1],
                                isProfessor: /professor/gim.test(lineSplit[5]),
                                imageURL: lineSplit.length > 7 ? lineSplit[7] : null
                            };
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
    }

    public moveStudentDown(index) {
        this.switchElements(this.studentQueue, index, index + 1);
    }

    public removeStudent(index) {
        this.studentQueue = this.removeAtIndex(this.studentQueue, index);
    }

    public removeTA(index) {
        this.taDutyList = this.removeAtIndex(this.taDutyList, index);
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
