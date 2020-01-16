# Sea Ice Animation Project
This webapp animates sea ice from NSIDC's geoserver of sea ice data. The webapp takes in some configuration information, like the starting and end dates and whether or not extent or concentration of sea ice is requested, and uses this to animate through the requested dates to view the changes in sea ice.

# Design
The site currently uses a simple express server defined in `server.js` to render in the `public/index.html` file. The main logic for the animation is found in `public/script.js`, which is loaded in by the html file.

# Steps to Build/Start Application
### Prerequisites
This application runs on NodeJS and NPM, so those must both be installed before running the application.

### Build Steps
To install the dependencies listed in `package.json`, run `npm install` inside the project directory. This will install the dependencies like OpenLayers and JQuery. 

### Steps to Run the Application
To run the application, run `npm start` or `node server.js` inside the project directory. This will open the project on `localhost:3003` (which can be changed if needed inside `server.js`), and going to that page on a web browser will show the application.

### Restart in Case of a Crash
The application runs on an express server (`server.js`) which shouldn't ever crash due to the simplicity of it. However, there might be an issue with `script.js` for some reason. This should be able to be fixed by a simple reload of the page, but if it doesn't, stopping and restarting `server.js` should solve any issues.
