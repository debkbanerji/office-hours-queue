import {Component, Inject} from '@angular/core';
import {MatDialogRef, MAT_DIALOG_DATA} from '@angular/material';

@Component({
    selector: 'app-time-info-dialog',
    templateUrl: './time-info-dialog.component.html',
    styleUrls: ['./time-info-dialog.component.css']
})
export class TimeInfoDialogComponent {

    constructor(
        public dialogRef: MatDialogRef<TimeInfoDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public data: any) {
    }

    onNoClick(): void {
        this.dialogRef.close();
    }

}
