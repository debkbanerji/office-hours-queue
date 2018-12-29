import {Component, Inject} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material';

@Component({
    selector: 'app-time-info-dialog',
    templateUrl: './time-info-dialog.component.html',
    styleUrls: ['./time-info-dialog.component.css']
})
export class TimeInfoDialogComponent {

    timeInfoTable = [];
    displayedColumns: string[];
    appStartString: string;

    constructor(
        public dialogRef: MatDialogRef<TimeInfoDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public data: any) {
        const component = this;
        const appStartDate = new Date();
        appStartDate.setTime(data.appStartTime);
        component.appStartString = appStartDate.toTimeString();
        const currentTime = Date.now();
        const gtids = Object.keys(data.taDirectory);
        for (let i = 0; i < gtids.length; i++) {
            const gtid = gtids[i];
            let totalTime = data.taTotalTimeMap[gtid];
            if (data.taCheckInTimeMap[gtid] !== 0) {
                totalTime += currentTime - data.taCheckInTimeMap[gtid];
            }
            totalTime = Math.floor(totalTime / 1000);
            const seconds = totalTime % 60;
            totalTime = Math.floor(totalTime / 60);
            const minutes = totalTime % 60;
            totalTime = Math.floor(totalTime / 60);
            let row = {
                'gtid': gtid,
                'name': data.taDirectory[gtid]['name'],
                'seconds': seconds,
                'minutes': minutes,
                'hours': totalTime,
                'currentlyOnDuty': data.taCheckInTimeMap[gtid] !== 0
            };
            component.timeInfoTable.push(row)
        }
        component.displayedColumns = ['name', 'timeOnDuty', 'currentlyOnDuty'];
    }

    onNoClick(): void {
        this.dialogRef.close();
    }

}
