# GT Office Hours Queue

This web application was designed to streamline the process of keeping track of students during office hours, using a Buzzcard scanner.

Created by Deb ⋅ Made with ♥

## FERPA Notice

The application is completely FERPA compliant, but as such has a few limitations, such as the roster needing to be reloaded whenever the application is refreshed. No student information is stored in cookies or remotely. As a side effect of this, the application is completely static and requires no internet access. The only student information required by the application are names and GTIDs, the latter of which are stored using SHA-512 cryptographic hashes.

## Importing the Roster

A sample roster, matching the Canvas format can be found in the root of the repository. (`sample-roster.xlsx`) Make sure the roster you use matches this format, though not all of the information is required. You can get the roster from Canvas, under _GaTech Roster -> Export Roster_. Feeding this roster into the application's roster generation utility will generate a new roster with encrypted GTIDs, in a format which can then be used by the application. Once you do this, is is **highly** recommended that you delete the local copy of your Canvas roster. You only need to carry out the roster generation step once per class.

## Using the App

After you've converted the roster file, using the application should be fairly self explanatory. Note that you'll have to connect a Buzzcard scanner to use the scanning features.

A deployed version can be found at [oh.debkbanerji.com](https://oh.debkbanerji.com)

If the computer you're using to run the app doesn't have access to the internet, you can either build your own version of the app using `npm` (the scripts in `package.json` should be fairly self explanatory) or grab a built version from [releases](https://github.com/debkbanerji/office-hours-queue/releases).

A side effect of running the app locally is that without access to the internet, links in the roster to pictures of the T.A.s won't work. You can get around this issue by placing these images directly in the `assets` folder and linking directly to these while choosing image links in the roster generation utility.
