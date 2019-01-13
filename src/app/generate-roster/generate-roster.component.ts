import {Component, OnInit} from '@angular/core';
import {ActivatedRoute, Router} from "@angular/router";

const generatedCSVHeaders = ['Name', 'Hashed GTID', 'Role', 'Image-URL', 'Text Color Override'];

// TODO: Test and add background tint
declare let XLSX: any;

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
    errorMessage: string = null;
    sheetData: any;

    students = [];
    tas = [];

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

    loadCanvasRoster(filesInput: FileList) {
        const component = this;
        component.errorMessage = null;
        const inputRosterFile = filesInput[0];
        component.isLoading = true;
        if (inputRosterFile && /.*\.xlsx$/gim.test(inputRosterFile.name)) {
            const onSheetLoaded = function (json) {
                console.log(json);
                component.isLoading = false;
                component.rosterInputted = true;
            };

            component.DropSheet({
                file: inputRosterFile,
                on: {
                    sheet: onSheetLoaded,
                },
                errors: {
                }
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
