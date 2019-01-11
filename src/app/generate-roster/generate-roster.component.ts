import {Component, OnInit} from '@angular/core';
import {ActivatedRoute, Router} from "@angular/router";

const generatedCSVHeaders = ['Name', 'Hashed GTID', 'Role', 'Image-URL', 'Text Color Override'];

// TODO: Test and add background tint

@Component({
    selector: 'app-generate-roster',
    templateUrl: './generate-roster.component.html',
    styleUrls: ['./generate-roster.component.css']
})
export class GenerateRosterComponent implements OnInit {

    rosterInputted: boolean = false;
    isLoading: boolean = false;
    useImages: boolean = false;
    useLocalImages: boolean = false;
    isDarkTheme: boolean = false;

    constructor(
        private router: Router,
        private route: ActivatedRoute
    ) {
    }


    ngOnInit() {
        const component = this;
        component.route.queryParams.subscribe(params => {
            component.isDarkTheme = (params['dark-mode'] == 'true');
        });
    }


    openHomeRosterPage() {
        this.router.navigate(['/'], {queryParams: {'dark-mode': this.isDarkTheme}});
    }

    onDarkModeChange() {
        this.router.navigate(['/generate-roster'], {queryParams: {'dark-mode': this.isDarkTheme}});
    }
}
