# GT Office Hours Queue

This web application was designed to streamline the process of keeping track of students during office hours, using a Buzzcard scanner.

Created by Deb ⋅ Made with ♥

## FERPA Notice

The application is completely FERPA compliant, but as such has a few limitations, such as the roster needing to be reloaded whenever the application is refreshed. No student information is stored in cookies or remotely. As a side effect of this, the application is completely static and requires no internet access. The only student information required by the application is the name and GTID, but depending on where you get the roster from, it may contain extra information - it is recommended that you replace this information with empty strings. **Warning:** Be extremely careful while modifying the application and make sure no information is stored remotely or in cookies.

## Sample Roster

A sample roster can be found in the root of the repository. (`sample-roster.csv`) Make sure the roster you use matches this format, though not all of the information is required. (see the note about unnecessary information under _FERPA Notice_) You can probably grab the roster from canvas, though you'll have to do some modifications to add in pictures of the T.A.s, etc.

## Using the App

You'll need to connect a Buzzcard scanner to the computer you're running the app on - after that it's a simple matter of opening the web page, so you should be good to go from there.

A deployed version can be found at [oh.debkbanerji.com](https://oh.debkbanerji.com)

If the computer you're using to run the app doesn't have access to the internet, you can either build your own version of the app using `npm` (the scripts in `package.json` should be fairly self explanatory) or grab a built version from [releases](https://github.com/debkbanerji/office-hours-queue/releases).

A side effect of running the app locally is that without access to the internet, links in the roster to pictures of the T.A.s won't work. You can get around this issue by placing these images directly in the `assets` folder and linking directly to these in the roster.
