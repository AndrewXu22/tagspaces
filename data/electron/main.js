'use strict';

const electron = require('electron');
const app = electron.app;  // Module to control application life.
const BrowserWindow = electron.BrowserWindow;  // Module to create native browser window.
const ipcMain = require('electron').ipcMain;
const Menu = require('electron').Menu;
const Tray = require('electron').Tray;
const globalShortcut = electron.globalShortcut;
const dialog = electron.dialog;

var debugMode;
var startupFilePath;
var trayIcon = null;
var ocrImageWindow;

//handling start parameter
//console.log(JSON.stringify(process.argv));
process.argv.forEach(function(arg, count) {
  if (arg.toLowerCase() === '-d' || arg.toLowerCase() === '--debug') {
    debugMode = true;
  } else if (arg.toLowerCase() === '-p' || arg.toLowerCase() === '--portable') {
    app.setPath('userData', process.cwd() + '/tsprofile'); // making the app portable
  } else if (arg === '.' || count === 0) { // ignoring the first argument
    //Ignore these argument
  } else if (arg.length > 2) {
    console.log("Opening file: " + arg);
    startupFilePath = arg;
  }
});

ipcMain.on('quit-application', function(event, arg) {
  app.quit();
});

var path = require('path');
// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
var mainWindow = null;

// Quit when all windows are closed.
app.on('window-all-closed', function() {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  //if (process.platform != 'darwin') {
  app.quit();
  //}
});

app.on('will-quit', function() {
  // Unregister all shortcuts.
  globalShortcut.unregisterAll();
});

app.on('ready', function(event) {
  //console.log(app.getLocale());
  //console.log(app.getAppPath());
  mainWindow = new BrowserWindow({width: 1280, height: 768});

  //var indexPath = 'file://' + __dirname + '/index.html';
  var startupParameter = "";
  if (startupFilePath) {
    startupParameter = "?open=" + encodeURIComponent(startupFilePath);
  }
  var indexPath = 'file://' + path.dirname(__dirname) + '/index.html' + startupParameter;

  mainWindow.setMenu(null);
  mainWindow.loadURL(indexPath);

  if (debugMode) {
    mainWindow.webContents.openDevTools();
  }

  // Emitted when the window is closed.
  mainWindow.on('closed', function() {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow = null;
  });

  mainWindow.webContents.on('crashed', function() {
    const options = {
      type: 'info',
      title: 'Renderer Process Crashed',
      message: 'This process has crashed.',
      buttons: ['Reload', 'Close']
    };
    dialog.showMessageBox(mainWindow, options, function(index) {
      mainWindow.hide();
      if (index === 0) {
        mainWindow.reload();
      } else {
        mainWindow.close();
      }
    });
  });

  var trayIconPath;
  if (process.platform === 'darwin') {
    trayIconPath = 'Contents/Resources/app/assets/trayicon.png';
  } else if (process.platform === 'win32') {
    trayIconPath = 'resources/app/assets/trayicon.png';
  } else {
    trayIconPath = 'resources/app/assets/trayicon.png';
  }

  if (debugMode) {
    trayIconPath = 'assets/trayicon.png';
  }

  trayIcon = new Tray(trayIconPath);

  var trayMenuTemplate = [
    {
      label: 'Show TagSpaces',
      click: showTagSpaces
    },
    {
      type: 'separator'
    },
    {
      label: 'New Text File',
      click: newTextFile
    },
    {
      label: 'New HTML File',
      click: newHTMLFile
    },
    {
      label: 'New Markdown File',
      click: newMDFile
    },
    {
      label: 'New Audio File',
      click: newAudioFile
    },
    {
      type: 'separator'
    },
    {
      label: 'Open Next File',
      click: getNextFile
    },
    {
      label: 'Open Previous File',
      click: getPreviousFile
    },
    {
      type: 'separator'
    },
    {
      label: 'Pause/Resume Playback',
      sublabel: 'Ctrl+Alt+P',
      click: resumePlayback
    },
    {
      type: 'separator'
    },
    {
      label: 'Quit TagSpaces',
      click: function() {
        app.quit();
      }
    }
  ];

  trayIcon.on('click', function() {
    mainWindow.show();
    //mainWindow.isVisible() ? mainWindow.hide() : mainWindow.show();
  });

  var title = 'TagSpaces App';
  var trayMenu = Menu.buildFromTemplate(trayMenuTemplate);
  trayIcon.setToolTip(title);
  trayIcon.setTitle(title);
  trayIcon.setContextMenu(trayMenu);

  globalShortcut.register('CommandOrControl+Alt+P', resumePlayback);

  globalShortcut.register('CommandOrControl+Alt+N', newTextFile);

  globalShortcut.register('CommandOrControl+Alt+W', getNextFile);

  globalShortcut.register('CommandOrControl+Alt+Q', getPreviousFile);

  globalShortcut.register('CommandOrControl+Alt+S', showTagSpaces);

  function showTagSpaces() {
    mainWindow.show();
    //mainWindow.webContents.send("showing-tagspaces", "tagspaces");
  }

  function newTextFile() {
    mainWindow.show();
    mainWindow.webContents.send("new-file", "text");
  }

  function newHTMLFile() {
    mainWindow.show();
    mainWindow.webContents.send("new-file", "html");
  }

  function newMDFile() {
    mainWindow.show();
    mainWindow.webContents.send("new-file", "markdown");
  }

  function newAudioFile() {
    mainWindow.show();
    mainWindow.webContents.send("new-file", "audio");
  }

  function getNextFile() {
    mainWindow.show();
    mainWindow.webContents.send("next-file", "next");
  }

  function getPreviousFile() {
    mainWindow.show();
    mainWindow.webContents.send("previous-file", "previous");
  }

  function resumePlayback() {
    //mainWindow.show();
    mainWindow.webContents.send('play-pause', true);
  }
});

function ocrWindow() {
  ocrImageWindow = new BrowserWindow({
    'width': 800,
    'height': 560
    //'index' : indexPath
  });

  var startupParameter = "";
  if (startupFilePath) {
    startupParameter = "?open=" + encodeURIComponent(startupFilePath);
  }
  var indexPath = 'file://' + path.dirname(__dirname) + '/pro/templates/OcrImage.html' + startupParameter;

  ocrImageWindow.webContents.openDevTools();

  ocrImageWindow.setMenu(null);
  ocrImageWindow.loadURL(indexPath);
  return ocrImageWindow;
}

var fileArg;
ipcMain.on('ocrImageWindow', function(event, arg) {
  ocrImageWindow = ocrWindow();
  ocrImageWindow.show();
  fileArg = arg;
  //ocrImage.setOption('index', feedHTML);
});

ipcMain.on('ocr-message', function(event, arg) {
  event.sender.send('ocr-reply', fileArg);
});

process.on('uncaughtException', function(error) {
  if (error.stack) {
    console.error('error:', error.stack);
  }
  mainWindow.reload();
  // Handle the error
  /*if (error) {
   const options = {
   type: 'info',
   title: 'Renderer Process Crashed',
   message: 'This process has crashed.',
   buttons: ['Reload', 'Close']
   };
   dialog.showMessageBox(mainWindow, options, function(index) {
   if (index === 0) {
   mainWindow.reload();
   } else {
   mainWindow.close();
   }
   });
   }*/
});