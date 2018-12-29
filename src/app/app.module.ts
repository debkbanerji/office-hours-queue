import {BrowserModule} from '@angular/platform-browser';
import {NgModule} from '@angular/core';
import {AppComponent} from './app.component';
import {RouterModule, Routes} from "@angular/router";
import {HomeComponent} from './home/home.component';
import {
    MatButtonModule,
    MatCardModule, MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatSlideToggleModule,
    MatSnackBarModule,
    MatTableModule,
    MatTooltipModule
} from "@angular/material";
import {FormsModule} from "@angular/forms";
import {BrowserAnimationsModule} from "@angular/platform-browser/animations";

import 'hammerjs';
import {TimeInfoDialogComponent} from './dialogs/time-info-dialog/time-info-dialog.component';

const routes: Routes = [
    {path: '', component: HomeComponent},
    {path: '**', redirectTo: '', pathMatch: 'full'} // Default route
];

@NgModule({
    declarations: [
        AppComponent,
        HomeComponent,
        TimeInfoDialogComponent
    ],
    imports: [
        BrowserModule,
        BrowserAnimationsModule,
        FormsModule,
        MatButtonModule,
        MatCardModule,
        MatDialogModule,
        MatFormFieldModule,
        MatProgressSpinnerModule,
        MatInputModule,
        MatSlideToggleModule,
        MatSnackBarModule,
        MatTableModule,
        MatTooltipModule,
        RouterModule.forRoot(routes)
    ],
    entryComponents: [
        TimeInfoDialogComponent
    ],
    providers: [],
    bootstrap: [AppComponent]
})
export class AppModule {
}
