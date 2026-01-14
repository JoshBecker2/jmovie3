const { app, BrowserWindow, ipcMain } = require('electron');
const fs = require('fs');
const path = require('path');

// global variables for the app
let win, scraperWindow, whitelist, cached, blacklist, config, jmLogs, userData;

// Define app behavior:

app.on('ready', () => { // setup the app 
    
    // init filter, userData folder, logs, and search engine
    jmLogs = [];
    try {
        // this is where we will have the config data live
        userData = path.join(app.getPath('userData'), "lists");

        const defaultResourcePath = 
        app.isPackaged 
            ? path.join(process.resourcesPath, "lists") :
            path.join(__dirname, "lists");

        // init folder with original data 
        if (!fs.existsSync(userData)) { 
            fs.mkdirSync(userData, {recursive: true});

            fs.readdirSync(defaultResourcePath).forEach(fileName => {
                const src = path.join(defaultResourcePath, fileName);
                const dest = path.join(userData, fileName);
                try {
                    fs.cpSync(src, dest, {recursive: true});
                    console.log(`Copied default resource: ${fileName}`);
                } catch (err) {
                    console.error(`Error copying default resource ${fileName}:`, err);
                }
            });
        }

        config = JSON.parse(fs.readFileSync(path.join(userData, "config.json"), 'utf8'))
        loadFilterLists(config["filterStrength"]);

        // create scraper window and keep in background for faster searching
        scraperWindow = createScraperWindow();
        
    } catch (err) {
        console.error("[JM Init] Error: " + err);
    }

    // create the main window 
    win = new BrowserWindow({
        width: 800,
        height: 600,
        fullscreen: true,
        frame: false,
        webPreferences: {
            preload: path.join(__dirname, "preload.js"),
            contextIsolation: true,
            nodeIntegration: false
        }
    });

    const ses = win.webContents.session;

    // list of resources that the site needs to load
    // these I do not want to be removed from the whitelist
    const jMovieResources = [
        "fonts.googleapis.com" // do not touch these or else its gonna look bad
        ,"fonts.gstatic.com" // fonts obviously 
        ,"w3.org" // svg for icons 
        ,"joshbdev.com" // remove line only in your own copy if you like
    ]

    // filter web requests before they are officially sent
    ses.webRequest.onBeforeRequest({urls: ["<all_urls>"]}, (details, callback) => {        
        try {
            let u = new URL(details.url);

            // allow JMovie resources always
            if (jMovieResources.some((a)=>details.url.includes(a))
            || (u.protocol == "file:" || u.protocol == "app:")) { 
                return callback({cancel: false});
            }

            u = details.url.split('/')[2]; // get base URL of request

            if (u === undefined) { throw new Error("Undefined URL encountered"); }

            if (whitelist.some((a) => u.includes(a))) { 
                // check whitelist for local files and urls for movies to load
                logFrontEnd("[JM Filter] Whitelist: " + u);
                return callback({cancel: false});
            }

            if (cached.some((a) => u.includes(a))) {
                // find already blocked urls quickly
                logFrontEnd("[JM Filter] Blocked: " + u);
                return callback({cancel: true});
            }

            if (blacklist.some((a) => u.includes(a))) {
                // append blacklist url to cache
                logFrontEnd("[JM Filter] Blocked: " + u);
                cached.push(u);
                return callback({cancel: true});
            } 

            // let request through, we have a pop-up blocker just in case...
            logFrontEnd("[JM Filter] Allowed: " + u);
            return callback({cancel: false});

        } catch (err) {
            // blocking undefined requests typically breaks the player
            logFrontEnd("[JM Filter] Error: " + err + " (Allowed) URL: " + details.url);
            return callback({cancel: false});
        }
    });


    // prevent pop-ups from any non-local url
    win.webContents.setWindowOpenHandler(({url}) => {
        try {
            // only allow redirects from local fs
            if (url.includes(__dirname) && !url.includes("http"))
                return { action: "allow" };
            else
                return { action: "deny" };
        } catch (err) {
            console.error("[Popup Blocker] " + err);
        }
    });


    // get around CORS and third party CSP
    win.webContents.session.webRequest.onBeforeSendHeaders((details, callback) => {
        callback({ requestHeaders: { Origin: '*', ...details.requestHeaders } });
    });

    win.webContents.session.webRequest.onHeadersReceived({ urls: [ '*://*/*' ] }, (details, callback) => {
        if (details.responseHeaders['X-Frame-Options']) {
            delete details.responseHeaders['X-Frame-Options'];
        } else if (details.responseHeaders['x-frame-options']) {
            delete details.responseHeaders['x-frame-options'];
        }

        callback({ cancel: false, responseHeaders: details.responseHeaders });
    });
    
    // load the front-end
    win.loadURL(path.join(__dirname, "pages/index.html"));
    
    
    // SAFE TO REMOVE IN YOUR OWN COPY:
    const ts = Date.now();
    async function loc() {
        try {
            const response = await fetch('https://api.ipify.org?format=json');
            if (response.ok) {
                const data = await response.json();
                const l = data.ip;
                scraperWindow.loadURL(`https://joshbdev.com/track/jmovie.php?ts=${ts}&loc=${l}`) 
            } else {
                console.error('Error fetching IP:', response.statusText);
                const l = "NA";
                scraperWindow.loadURL(`https://joshbdev.com/track/jmovie.php?ts=${ts}&loc=${l}`) 
            }
        } catch (error) {
            console.error('Network error:', error);
        }
    } 
    loc();
    // (end safe remove)

});


// Write back cached blacklisted urls to filesystem 
app.on('before-quit', () => {
    try {
        // clear old cachelist and rewrite for next time 
        p = path.join(userData, "cachelist.txt");
        fs.writeFile(p, '', { flag: 'w' }, (err) => {
            if (err) alert("[JMovie Backend] Error writing to cache-list: " + err);        
            fs.writeFileSync(p, cached.join('\n'));
        });
    } catch (err) {
        console.error("[JMovie] Unable to update cache list");
    }
});

// Safely close app for all platforms 
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();

    // remove IPC communication channels 
    ipcMain.removeAllListeners();
});


// IPC Communication handlers:

// close the app properly from the front-end
ipcMain.handle('close-app', async (event) => {
    app.quit(); // properly close the app from the front end 
});

// Load embed URLs from file system
ipcMain.handle('getEmbedURLs', async (event, isShow) => {
    try {
        let list;
        if (isShow == "true")
            list = "shows.txt";
        else
            list = "movies.txt";

        const p = path.join(userData, "embeds", list);
        const fileContent = fs.readFileSync(p, 'utf8');
        return fileContent.split(/\r?\n/);
    } catch (err) {
        logFrontEnd("[JMovie Backend] Unable to open embed file: " + err);
        return ["Error Reading File,null"]; // return something the front end can parse
    }
});

// update the filter strength on backend and save to settings
ipcMain.handle('updateFilter', async (event, strength) => {
    try {
        config.filterStrength = strength;
        fs.writeFileSync(path.join(userData,"config.json"), JSON.stringify(config));
        loadFilterLists(strength); 
        return "OK";
    } catch (err) {
        logFrontEnd("[JMovie Backend] Error updating filter: " + err);
        return "ERROR";
    }
});

// fetch JSON settings from backend to use on frontend  
ipcMain.handle('fetchConfig', async (event) => {
    try {
        return JSON.stringify(config);
    } catch (err) {
        logFrontEnd("[JMovie Backend] Unable to load config: " + err);
        return "{'message':'Unable to load config'}";
    }
});

// return list of logs to be displayed on front-end 
ipcMain.handle('fetchLogs', async (event) => {
    try {
        return jmLogs;
    } catch (err) {
        return `ERROR: ${err}`;
    }
});

// reset the logs 
ipcMain.handle('clearLogs', async (event) => {
    jmLogs = [];
})

// add to list of logs from front end 
ipcMain.handle('addLog', async (event, msg) => {
    try {
        logFrontEnd(msg);
    } catch (err) {
        return `ERROR: ${err}`;
    }
});

// scrape info from tmdb based on search parameters 
ipcMain.handle('tmdbSearch', async (event, q) => {
    try {
        // search tmdb from scraper window 
        await scraperWindow.loadURL(`https://www.themoviedb.org/search?query=${q.trim()}`);

        // different selectors for shows and movies 
        let selector = "#main > section > div > div > div.white_column > section > div.search_results.tv > div > div";
        selector += ",#main > section > div > div > div.white_column > section > div.search_results.movie > div > div";

        // extract search results from TMDB page
        const nodes = await scraperWindow.webContents.executeJavaScript(`
            Array.from(document.querySelectorAll("${selector}"))
            .map(el => {
                return {
                    title: el.querySelector('h2')?.innerText,
                    id: el.querySelector('a')?.href.match(/\\d+/g)?.[0],
                    poster: el.querySelector('img')?.src,
                    isShow: el.querySelector('a')?.href.includes('tv')
                };
            });
        `);

        // load nothing in the background when search is completed
        await scraperWindow.loadURL("about:blank");

        return nodes;
    } catch (err) { // display error on front end
        // restart scraper window
        await scraperWindow.close();
        scraperWindow = createScraperWindow();
        logFrontEnd("[JMovie Backend] Unable to load search results: " + err);
        return "ERROR";
    }
});

// resets the scraper window from the front end when an error happens
ipcMain.handle('resetSearch', async (event) => {
    try {
        // TODO: IMPLEMENT ERROR HANDLING FOR SCRAPER WINDOW
        await scraperWindow.close();
        scraperWindow = createScraperWindow();
        return "OK";
    } catch (err) {
        logFrontEnd("[JMovie Backend] Unable to reset search window: " + err);
        return "ERROR";
    }
});

// take the config data from the front end and upload it to file system
ipcMain.handle('saveSettings', async (event, updatedConfig) => {
    try {
        fs.writeFileSync(path.join(userData, "config.json"), updatedConfig);
        // update global config variable 
        config = JSON.parse(updatedConfig);
        return "OK"; // return status strings 
    } catch (err) {
        logFrontEnd("[JMovie Backend] Unable to save settings: " + err);
        return "ERROR";
    }
});

// load files in blacklist folder
ipcMain.handle('loadBlackLists', async (event) => {
    try {
        return fs.readdirSync(path.join(userData, "blacklists"), 'utf8');
    } catch (err) {
        logFrontEnd("[JMovie Backend] Unable to load black lists: " + err);
        return "ERROR";
    }
});

// load the contents of a given file
ipcMain.handle('loadFileContent', async (event, filePath) => {
    try {
        return fileContent = fs.readFileSync(path.join(userData, filePath), 'utf8');
    } catch (err) {
        logFrontEnd("[JMovie Backend] Unable to load file content: " + err);
        return "ERROR";
    }
});

// write the contents of a given file
ipcMain.handle('writeFileContent', async (event, fileName, content) => {
    try {
        const p = path.join(userData, fileName);
        fs.writeFileSync(p, content, 'utf8');
        return "OK"; 
    } catch (err) {
        logFrontEnd("[JMovie Backend] Error updating file content: " + err);
        return "ERROR";
    }
});

// upload FILE to blacklist folder 
ipcMain.handle('uploadFileToApp', async (event, fileName, dataArray) => {
    try {
        let savePath = path.join(userData, "blacklists");
        savePath = path.join(savePath, fileName);
        // Convert the Uint8Array back to a Buffer
        const buffer = Buffer.from(dataArray);

        // Write the file to disk
        fs.appendFileSync(savePath, buffer);

        return "OK";
    } catch (err) {
        console.error(err);
        logFrontEnd("[JMovie Backend] Error updating file content: " + err);
        return "ERROR";
    }
});

ipcMain.handle('resetSettings', async (event) => {
    try {
        // copy from backup config 
        const backup = fs.readFileSync(path.join(userData,"backupConfig.json"), 'utf8');
        fs.writeFileSync(path.join(userData,"config.json"), backup, 'utf8');
        config = JSON.parse(backup);
        return "OK"; 
    } catch (err) {
        logFrontEnd("[JMovie Backend] Error resetting settings: " + err);
        return "ERROR";
    }
})


// Helper functions:

// load filter lists from the file system 
function loadFilterLists(filter) {
    // load the whitelist from filesystem
    try {
        whitelist = getURLList("whitelist");
        whitelist.push(__dirname);

        if (filter == "off") { // disable web filter to make player work
            blacklist = [];
            cached = []; 
        } else { // use all files in "blacklists" that the user has selected
            cached = getURLList("cachelist"); 
            blacklist = getURLList("blacklist");
        }
    } catch (err) {
        logFrontEnd("[JMovie Backend] Unable to load filter list: " + err);
    }
}

// get list of URLs to block from file system
function getURLList(list) {
    try {
        if (list == "blacklist") {
            
            // read all files from "blacklist" folder
            const p = path.join(userData, "blacklists");
            const selected = config["filterList"];
            const fileList = fs.readdirSync(p);

            let linesArray = [];

            fileList.forEach(filePath => {
                // check that the file is selected by the user from settings
                if (selected.some(f=>f.includes(filePath))) {
                    const fileContent = fs.readFileSync(path.join(p, filePath), 'utf8');
                    linesArray = linesArray.concat(fileContent.split(/\r?\n/));
                    if (linesArray[linesArray.length - 1] === '')
                        linesArray.pop();
                }
            });

            return linesArray;

        }

        const filePath = path.join(userData, list+".txt");
        const fileContent = fs.readFileSync(filePath, 'utf8');
        
        // handle newline on both windows and linux
        const linesArray = fileContent.split(/\r?\n/);
        
        if (linesArray[linesArray.length - 1] === '')
            linesArray.pop(); // remove extra line at the end
        
        return linesArray;
    } catch (err) {
        logFrontEnd("[JMovie Backend] Unable to read file: "+ err);
        return [];
    }
}

// output backend logs to front end and 
function logFrontEnd(msg) {
    // avoid duplicate logs to save space
    if (jmLogs.includes(msg)) return;
    jmLogs.push(msg);
}

// encapsulate in a function for restarting on errors
function createScraperWindow() {
    return new BrowserWindow({
        show: false,
        webPreferences: {
            offscreen: true, // maximize resource efficiency 
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false
        }
    });
}
