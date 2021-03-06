import {Component, HostListener, OnInit} from '@angular/core';
import {environment} from "../../environments/environment";
import {MatDialog, MatSnackBar} from "@angular/material";
import {TimeInfoDialogComponent} from "../dialogs/time-info-dialog/time-info-dialog.component";
import {ActivatedRoute, Router} from "@angular/router";
import {HashingService} from "../hashing.service";
import {GenerateRosterComponent} from "../generate-roster/generate-roster.component";

declare let particlesJS: any;

@Component({
    selector: 'app-home',
    templateUrl: './home.component.html',
    styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {

    bufferSize = 16;
    minBufferCheckLength = 13;
    doubleSwipeWindow = 2000;
    messageDurationMilliseconds = 4000;
    privilegesTimeoutMilliseconds = 10000;
    version = environment.VERSION;
    backgroundTintMap = GenerateRosterComponent.backgroundTintMap;
    isDarkTheme: boolean = false;
    showParticles: boolean = false;
    LOGO_URL = '/assets/images/Buzz.png';

    appInitialized: boolean = false;
    isInitializing: boolean = false;
    keypressBuffer = [];
    keypressTimestampBuffer = [];

    hasElevatedPrivileges: boolean = false;
    elevatedPrivilegesTimeout = null;
    currentlyElevatedGTID = null;

    studentDirectory = {};
    taDirectory = {};
    studentQueue = [];
    taDutyList = [];

    trackStats: boolean = false;
    taCheckInTimeMap = {};
    taTotalTimeMap = {};
    taTotalResolvedStudentsMap = {};
    appStartTime: number;

    disableAddStudents: boolean = false;

    className: string = null;
    customStudentName: string = null;

    taManualGTID: string = null;

    showTAPictures: boolean = true;
    showFullQueue: boolean = false;
    studentHideLength: number = 12;
    taPictureHideLength: number = 4;
    studentMaxSingleColumnLength: number = 7;

    constructor(public snackBar: MatSnackBar,
                public dialog: MatDialog,
                private router: Router,
                private route: ActivatedRoute,
    ) {
    }

    ngOnInit() {
        const component = this;
        component.route.queryParams.subscribe(params => {
            component.isDarkTheme = (params['dark-mode'] == 'true');
        });
        document.onkeypress = function (e) {
            component.keypressBuffer.push(String.fromCharCode(e.keyCode));
            component.keypressTimestampBuffer.push(Date.now());
            if (component.keypressBuffer.length > component.bufferSize) {
                component.keypressBuffer.shift();
                component.keypressTimestampBuffer.shift();
            }
            component.checkForCardSwipe();
        };
        component.appStartTime = Date.now();
    }

    onDarkModeChange() {
        this.router.navigate(['/'], {queryParams: {'dark-mode': this.isDarkTheme}});
    }

    openGenerateRosterPage() {
        this.router.navigate(['/generate-roster'], {queryParams: {'dark-mode': this.isDarkTheme}});
    }

    toggleParticles() {
        // Used to get around Angular not finding property pJSDom on type of window
        const tempWindow: any = window;
        if (this.showParticles) {
            tempWindow.pJSDom = [];
            particlesJS.load('particles-js-target', 'assets/json/particles-js-config.json', function () {
            });
        } else {
            tempWindow.pJSDom[0].pJS.fn.vendors.destroypJS()
        }
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
        const hashedGTID = HashingService.getGTIDHash(inputGTID);
        if (component.studentDirectory[hashedGTID]) {
            component.handleStudentSwipe(inputGTID, hashedGTID);
        } else if (component.taDirectory[hashedGTID]) {
            component.handleTASwipe(hashedGTID);
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
        component.currentlyElevatedGTID = null;
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
            component.currentlyElevatedGTID = gtid;
            for (let i = taIndex; i > 0; i--) {
                const temp = component.taDutyList[i - 1];
                component.taDutyList[i - 1] = component.taDutyList[i];
                component.taDutyList[i] = temp;
            }
            component.refreshElevatedPrivileges();
        } else {
            let taToAdd = component.taDirectory[gtid];
            component.taDutyList.unshift({
                name: taToAdd.name,
                email: taToAdd.email,
                nameColor: taToAdd.nameColor,
                gtid: gtid,
                startTime: Date.now(),
                imageURL: taToAdd.imageURL,
                backgroundTint: taToAdd.backgroundTint
            });
            component.showMessage(taToAdd.name + ' is now on duty');
            if (component.trackStats) {
                component.taCheckInTimeMap[gtid] = Date.now()
            }
            if (component.taDutyList.length === component.taPictureHideLength + 1) {
                component.showTAPictures = false;
            }
        }
    }

    handleStudentSwipe(gtid: string, hashedGTID: string) {
        const component = this;
        if (component.disableAddStudents) {
            component.showMessage('Queue is currently closed - cannot add student')
        } else {
            let studentIndex = -1;
            for (let i = 0; i < component.studentQueue.length; i++) {
                if (component.studentQueue[i].gtid === hashedGTID) {
                    studentIndex = i;
                    break;
                }
            }
            if (studentIndex >= 0) {
                const removedStudent = component.studentQueue[studentIndex];
                if (Date.now() - removedStudent.startTime > component.doubleSwipeWindow) {
                    component.studentQueue.splice(studentIndex, 1);
                    component.showMessage(HashingService.getName(removedStudent.hashedName, gtid) + ' removed from queue');
                }
            } else {
                const studentName = HashingService.getName(component.studentDirectory[hashedGTID].name, gtid);
                component.studentQueue.push({
                    name: studentName,
                    hashedName: component.studentDirectory[hashedGTID].name,
                    gtid: hashedGTID,
                    startTime: Date.now()
                });
                component.showMessage(studentName + ' added to queue');
                if (component.studentQueue.length === component.studentHideLength + 1) {
                    component.showFullQueue = false;
                }
            }
            component.reNumberStudents();
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
            if (component.studentQueue.length === component.studentHideLength + 1) {
                component.showFullQueue = false;
            }
        }
        component.customStudentName = '';
        component.reNumberStudents();
    }

    addTAUsingGTID() {
        const component = this;
        component.refreshPrivilegesIfElevated();
        const manualGTID = component.taManualGTID;
        const swipeMatch = /;1570=9(\d{8})/gm.exec(manualGTID);
        if (swipeMatch) {
            component.keypressBuffer = [];
            component.keypressTimestampBuffer = [];
            const matchContents = swipeMatch[0];
            const inputGTID = matchContents.substring(6);
            component.handleSwipe(inputGTID);
        } else {
            if (component.taDirectory[HashingService.getGTIDHash(manualGTID)]) {
                component.handleSwipe(manualGTID);
            } else {
                component.showMessage('Could not find T.A. G.T.I.D.')
            }
        }
        component.taManualGTID = '';
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
                if (csvLines[0] === GenerateRosterComponent.generatedCSVHeaders.join(',')) {
                    for (let lineNum = 1; lineNum < csvLines.length; lineNum++) {
                        const line = csvLines[lineNum].replace(/"[^"]*?"/gim, "\"REPLACED\"");
                        const lineSplit = line.split(',');
                        if (/student/gim.test(lineSplit[2])) {
                            component.studentDirectory[lineSplit[1]] = {
                                name: lineSplit[0]
                            };
                        } else if (/(.*t(\.|)a(\.|)$)|(teacher)|(professor)/gim.test(lineSplit[2])) {
                            component.taDirectory[lineSplit[1]] = {
                                name: lineSplit[0],
                                email: lineSplit[3],
                                nameColor: (lineSplit[5] && lineSplit[5] !== 'NONE') ? lineSplit[5] : (
                                    /(teacher)|(professor)/gim.test(lineSplit[2]) ? '#a6a000' : (
                                        /head\s*t(\.|)a(\.|)/gim.test(lineSplit[2]) ? '#e91e63' : (
                                            /senior\s*t(\.|)a(\.|)/gim.test(lineSplit[2]) ? '#4882d6'
                                                : null
                                        )
                                    )
                                ),
                                canViewAllTimeData: /(teacher)|(professor)/gim.test(lineSplit[2]) || /head\s*t(\.|)a(\.|)/gim.test(lineSplit[2]),
                                imageURL: (lineSplit[4] && lineSplit[4] !== 'NONE') ? lineSplit[4] : null,
                                backgroundTint: (lineSplit[6] && lineSplit[6] !== 'NONE') ? lineSplit[6] : null
                            };
                            component.taCheckInTimeMap[lineSplit[1]] = 0;
                            component.taTotalTimeMap[lineSplit[1]] = 0;
                            component.taTotalResolvedStudentsMap[lineSplit[1]] = 0;
                        } else {
                            console.log('Could not classify ' + lineSplit[0] + ' as T.A. or Teacher')
                        }
                    }
                    component.appInitialized = true;
                } else {
                    component.showMessage('Roster in incorrect format - please generate a new roster');
                }
                component.isInitializing = false;
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
        this.reNumberStudents();
    }

    public moveStudentDown(index) {
        this.switchElements(this.studentQueue, index, index + 1);
        this.refreshElevatedPrivileges();
        this.reNumberStudents();
    }

    public removeStudent(index) {
        const component = this;
        if (component.hasElevatedPrivileges && component.trackStats) {
            component.taTotalResolvedStudentsMap[component.currentlyElevatedGTID] += 1;
        }
        component.studentQueue = component.removeAtIndex(component.studentQueue, index);
        component.reNumberStudents();
        component.refreshElevatedPrivileges();
    }

    public removeTA(index) {
        const component = this;
        if (component.trackStats) {
            const ta = component.taDutyList[index];
            const checkInTime = component.taCheckInTimeMap[ta.gtid];
            component.taTotalTimeMap[ta.gtid] = component.taTotalTimeMap[ta.gtid] + (Date.now() - checkInTime);
            component.taCheckInTimeMap[ta.gtid] = 0;
        }
        component.taDutyList = component.removeAtIndex(this.taDutyList, index);
        component.refreshElevatedPrivileges();
        if (component.taDutyList.length <= component.taPictureHideLength) {
            component.showTAPictures = true;
        }
    }

    public removeAtIndex(arr, index) {
        arr.splice(index, 1);
        return arr
    }

    public reNumberStudents() {
        const component = this;
        for (let i = 0; i < component.studentQueue.length; i++) {
            component.studentQueue[i].number = i + 1;
        }
    }

    public switchElements = function (arr, i1, i2) {
        const temp = arr[i1];
        arr[i1] = arr[i2];
        arr[i2] = temp;
    };

    public validateStudentHideLength() {
        let studentHideLength = this.studentHideLength;
        studentHideLength = Math.round(studentHideLength);
        studentHideLength = Math.max(10, studentHideLength);
        studentHideLength = Math.min(30, studentHideLength);
        this.studentHideLength = studentHideLength;
    }

    openTimeInfoDialog(): void {
        const component = this;
        component.refreshPrivilegesIfElevated();
        this.dialog.open(TimeInfoDialogComponent, {
            data: {
                'taCheckInTimeMap': component.taCheckInTimeMap,
                'taTotalTimeMap': component.taTotalTimeMap,
                'taTotalResolvedStudentsMap': component.taTotalResolvedStudentsMap,
                'taDirectory': component.taDirectory,
                'appStartTime': component.appStartTime,
                'currentlyElevatedGTID': component.currentlyElevatedGTID,
                'isDarkTheme': component.isDarkTheme
            }
        });
    }

    @HostListener('window:beforeunload', ['$event'])
    doSomething($event) {
        if (this.studentQueue.length > 0 || this.trackStats) $event.returnValue = 'Warning: data will be lost';
    }
}
