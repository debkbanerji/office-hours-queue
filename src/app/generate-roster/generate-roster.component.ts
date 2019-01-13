import {Component, OnInit} from '@angular/core';
import {ActivatedRoute, Router} from "@angular/router";
import {HashingService} from "../hashing.service";

declare let XLSX: any;

@Component({
    selector: 'app-generate-roster',
    templateUrl: './generate-roster.component.html',
    styleUrls: ['./generate-roster.component.css']
})
export class GenerateRosterComponent implements OnInit {

    static generatedCSVHeaders = ['Name', 'Hashed GTID', 'Role', 'Email', 'Image-URL', 'Text Color Override', 'Background Tint'];
    static backgroundTintMap = {
        'None': 'blank-background',
        'Red': 'red-background',
        'Blue': 'blue-background',
        'Green': 'green-background',
        'Yellow': 'yellow-background',
        'Orange': 'orange-background',
        'Pink': 'pink-background',
        'Purple': 'purple-background',
        'Lime': 'lime-background'
    };

    backgroundTintMap = GenerateRosterComponent.backgroundTintMap;
    backgroundTintKeys = Object.keys(GenerateRosterComponent.backgroundTintMap);


    rosterInputted: boolean = false;
    isLoading: boolean = false;
    generatedRoster: boolean = false;
    useImages: boolean = false;
    useBackgroundTint: boolean = false;
    useLocalImages: boolean = false;
    isDarkTheme: boolean = false;
    errorMessage: string = null;
    sheetData: any;

    students = [];
    tas = [];

    processedRoster: string = null;
    taRoles = ['Teacher', 'Head T.A.', 'Senior T.A.', 'T.A.'];

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

    openHomePage() {
        this.router.navigate(['/'], {queryParams: {'dark-mode': this.isDarkTheme}});
    }

    onDarkModeChange() {
        this.router.navigate(['/generate-roster'], {queryParams: {'dark-mode': this.isDarkTheme}});
    }

    generateRoster() {
        const component = this;
        const rows = [];
        rows.push(GenerateRosterComponent.generatedCSVHeaders.join(','));
        for (let i = 0; i < component.tas.length; i++) {
            const ta = component.tas[i];
            const row = [
                ta['name'],
                ta['hashedGtid'],
                ta['role'],
                ta['email'],
                component.useImages ? (component.useLocalImages ? 'assets/' : '') + ta['imageURL'] : 'NONE',
                'NONE',
                component.useBackgroundTint ? (ta.backgroundTint) : 'NONE'
            ];
            rows.push(row.join(','));
        }
        for (let i = 0; i < component.students.length; i++) {
            const student = component.students[i];
            const row = [
                student['name'],
                student['hashedGtid'],
                'student',
                '',
                '',
                '',
                ''
            ];
            rows.push(row.join(','));
        }
        component.processedRoster = rows.join('\n');
        component.generatedRoster = true;
        component.downloadRoster();
    }

    downloadRoster() {
        const component = this;
        const blob = new Blob([component.processedRoster], {type: 'text/csv'});
        const dataURL = window.URL.createObjectURL(blob);

        // IE doesn't allow using a blob object directly as link href
        // instead it is necessary to use msSaveOrOpenBlob
        if (window.navigator && window.navigator.msSaveOrOpenBlob) {
            window.navigator.msSaveOrOpenBlob(blob);

        }

        const link = document.createElement('a');
        link.href = dataURL;
        link.download = 'Office Hours Roster.csv';
        link.click();

        setTimeout(() => {

            // For Firefox it is necessary to delay revoking the ObjectURL
            window.URL.revokeObjectURL(dataURL);
        }, 100);
    }

    loadCanvasRoster(filesInput: FileList) {
        const component = this;
        component.errorMessage = null;
        const inputRosterFile = filesInput[0];
        component.isLoading = true;
        if (inputRosterFile && /.*\.xlsx$/gim.test(inputRosterFile.name)) {
            const onSheetLoaded = function (rows) {
                const nameIndex = 0;
                const emailIndex = 1;
                const gtidIndex = 2;
                const roleIndex = 5;
                for (let i = 1; i < rows.length; i++) {
                    const row = rows[i];
                    if (/student/gim.test(row[roleIndex])) {
                        component.students.push({
                            name: row[nameIndex],
                            hashedGtid: HashingService.getHash(row[gtidIndex]),
                        });
                    } else {
                        component.tas.push({
                            name: row[nameIndex],
                            hashedGtid: HashingService.getHash(row[gtidIndex]),
                            role: /ta/gim.test(row[roleIndex]) ? 'T.A.' : 'Teacher',
                            email: row[emailIndex],
                            imageURL: '',
                            backgroundTint: component.backgroundTintKeys[Math.floor(Math.random() * component.backgroundTintKeys.length)]
                        });
                    }
                }
                component.isLoading = false;
                component.rosterInputted = true;
            };

            component.DropSheet({
                file: inputRosterFile,
                on: {
                    sheet: onSheetLoaded,
                },
                errors: {}
            })
        } else {
            component.isLoading = false;
            component.errorMessage = 'Please select the roster xlsx file';
        }
    }

    DropSheet = function DropSheet(opts) {
        if (!opts) opts = {};
        const nullfunc = function () {
        };
        if (!opts.errors) opts.errors = {};
        if (!opts.errors.badfile) opts.errors.badfile = nullfunc;
        if (!opts.errors.pending) opts.errors.pending = nullfunc;
        if (!opts.errors.failed) opts.errors.failed = nullfunc;
        if (!opts.errors.large) opts.errors.large = nullfunc;
        if (!opts.on) opts.on = {};
        if (!opts.on.workstart) opts.on.workstart = nullfunc;
        if (!opts.on.workend) opts.on.workend = nullfunc;
        if (!opts.on.sheet) opts.on.sheet = nullfunc;
        if (!opts.on.wb) opts.on.wb = nullfunc;

        const rABS = typeof FileReader !== 'undefined' && FileReader.prototype && FileReader.prototype.readAsBinaryString;
        const pending = false;

        function fixdata(data) {
            let o = "", l = 0, w = 10240;
            for (; l < data.byteLength / w; ++l)
                o += String.fromCharCode.apply(null, new Uint8Array(data.slice(l * w, l * w + w)));
            o += String.fromCharCode.apply(null, new Uint8Array(data.slice(o.length)));
            return o;
        }

        let last_wb;

        function to_json(workbook) {
            let result = {};
            workbook.SheetNames.forEach(function (sheetName) {
                const roa = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], {raw: false, header: 1});
                if (roa.length > 0) result[sheetName] = roa;
            });
            return result;
        }

        function choose_sheet(sheetidx) {
            process_wb(last_wb, sheetidx);
        }

        function process_wb(wb, sheetidx) {
            last_wb = wb;
            const sheet = wb.SheetNames[sheetidx || 0];
            const json = to_json(wb)[sheet];
            opts.on.sheet(json, wb.SheetNames, choose_sheet);
        }

        function handleFile(f) {
            const component = this;
            if (pending) return opts.errors.pending();
            const reader = new FileReader();
            reader.onload = function (e) {
                let data = e.target['result'];
                let wb, arr;
                let readType = {type: rABS ? 'binary' : 'base64'};
                if (!rABS) {
                    arr = fixdata(data);
                    data = btoa(arr);
                }

                function doit() {
                    try {
                        wb = XLSX.read(data, readType);
                        process_wb(wb, null);
                    } catch (e) {
                        component.isLoading = false;
                        component.errorMessage = 'Error processing xlsx file';
                    }
                }

                doit();
            };
            if (rABS) reader.readAsBinaryString(f);
            else reader.readAsArrayBuffer(f);
        }

        handleFile(opts.file);
    };

}
