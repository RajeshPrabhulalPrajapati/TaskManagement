const { autoUpdater } = require('electron-updater');
const { app, BrowserWindow, globalShortcut, Tray, Menu, MenuItem, dialog, ipcMain, systemPreferences,session } = require('electron');
const os = require('os');
systemPreferences.getMediaAccessStatus("microphone");

// const Mic  = require('node-microphone');

const sqlite3 = require('@journeyapps/sqlcipher').verbose();
// require('update-electron-app')({
//   repo: 'https://github.com/RajeshPrabhulalPrajapati/EmployeeManagementElectronApp'
// })
//console.log("before sql init");
//const sqlite = require('sqlite-cipher');
//console.log("after sql init");
const platforms = {
  WINDOWS: 'WINDOWS',
  MAC: 'MAC',
  LINUX: 'LINUX',
  SUN: 'SUN',
  OPENBSD: 'OPENBSD',
  ANDROID: 'ANDROID',
  AIX: 'AIX',
};

const platformsNames = {
  win32: platforms.WINDOWS,
  darwin: platforms.MAC,
  linux: platforms.LINUX,
  sunos: platforms.SUN,
  openbsd: platforms.OPENBSD,
  android: platforms.ANDROID,
  aix: platforms.AIX,
};

const currentPlatform = platformsNames[os.platform()];
const url = require("url");
const path = require("path");
const notifier = require('node-notifier');
let mainWindow;
let iconPath = path.join(__dirname, `/src/assets/note-icon.jpg`);
let tray;
console.log(iconPath);
let db;

async function createWindow() {

  console.log("before connection");
  // const connection = await createConnection({
  //   type: 'sqlite',
  //   synchronize: true,
  //   logging: true,
  //   logger: 'simple-console',
  //   database: 'C:/Users/Rajesh.Prajapati/Desktop/Rajesh Prajapati/SqLite/electron.sqlite',
  //   entities: [ Emp ],
  // });   
  db = new sqlite3.Database(path.join(app.getPath('userData'), `/myDB`));
  db.run("PRAGMA cipher_compatibility = 4");
  db.run("PRAGMA key = 'Prabhulal'");
  //sqlite.connect(path.join(__dirname, `/dist/assets/myDB.db`),'myPass','aes-256-ctr');
  db.run("CREATE TABLE IF NOT EXISTS Notes (NoteId uniqueidentifier primary key,Title varchar(100),Content varchar(1000),Todo varchar(200),Priority varchar(20),NotificationDateTime datetime,Notification bit);");
  //sqlite.run("CREATE TABLE IF NOT EXISTS Emp (EmpId uniqueidentifier primary key,EmpName varchar(50),EmpDepartment varchar(50),EmpPhoneNo varchar(50));")
  // const empRepo = connection.getRepository(Emp);



  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true,
      webSecurity: false
    }
  });



  // mainWindow.loadFile(
  //     path.join(__dirname, `/src/index.html`)      
  // );

  // mainWindow.loadURL(
  //     url.format({
  //         pathname: path.join("C:/Users/Rajesh.Prajapati/Desktop/EmployeeManagementElectronApp", `/dist/index.html`),
  //         protocol: "file:",
  //         slashes: true
  //     })       
  // );  

  var pathArr = __dirname.split("\\");
  pathArr.splice(pathArr.length - 3, 3);

  mainWindow.loadURL(
    url.format({
      pathname: path.join(__dirname, `/index.html`),
      protocol: "file:",
      slashes: true
    })
  );


  // Open the DevTools.
  //mainWindow.webContents.openDevTools();

  mainWindow.on('closed', function () {
    mainWindow = null
  });

  mainWindow.on('close', function (event) {
    const choice = dialog.showMessageBoxSync(this,
      {
        type: 'question',
        buttons: ['Yes', 'No'],
        title: 'Confirm',
        message: 'Are you sure you want to quit?'
      });
    if (choice === 1) {
      event.preventDefault();
    }
  });

  // let mic = new Mic();

  // ipcMain.on('startRecording', () => {
  //   let micStream = mic.startRecording();
  //   //micStream.pipe( myWritableStream );
  // });

  // ipcMain.on('endRecording', () => {
  //   mic.stopRecording();
  // });

  // mic.on('info', (info) => {
  //   mainWindow.webContents.send("info",info); 
  // });

  // mic.on('error', (error) => {
  //   mainWindow.webContents.send("err",error); 
  // });
  ipcMain.on('showNotification', (event,title) => {
    notifier.notify({
      title: 'Hello ',
      message: `Now time to start  the task "${title}"`,
      icon: path.join(__dirname, `/src/assets/smily.png`),
      sound: true,
    }, function (err, response) {

    });

  });
  ipcMain.on('restart_app', () => {
    autoUpdater.quitAndInstall();
  });

  ipcMain.on('get-notes', async (event, _item) => {
    try {
      console.log("in Get notes..");
      db.all("select * from Notes", (err, rows) => {
        if (err) {
          return console.log(err.message);
        }
        console.log("Notes", rows)
        mainWindow.webContents.send("noteList", rows);
      });
    } catch (err) {
      throw err;
    }
  });

  ipcMain.on('add-note', async (event, _item) => {
    try {
      db.run(`INSERT INTO Notes (NoteId,Title,Content,Todo,Priority,NotificationDateTime,Notification) VALUES(?,?,?,?,?,?,?)`, [_item.noteId, _item.title, _item.content, _item.todo, _item.priority,_item.notificationDateTime,_item.notification], function (err) {
        if (err) {
          return console.log(err.message);
        }
        console.log(`A Note has been inserted with noteid ${_item.noteId}`);
      });
    } catch (err) {
      throw err;
    }
  });
  ipcMain.on('update-note', async (event, _item) => {
    try {
      db.run(`update Notes SET Title=?, Content=?, Todo=?, Priority=?, NotificationDateTime=?,Notification=? where NoteId =?`, [_item.title, _item.content, _item.todo, _item.priority,_item.notificationDateTime,_item.notification, _item.noteId], function (err) {
        if (err) {
          return console.log(err.message);
        }
        console.log(`A Note has been updated with noteid ${_item.noteId}`);
      });

    } catch (err) {
      throw err;
    }
  });

  ipcMain.on('delete-note', async (event, noteId) => {
    try {
      db.run(`delete from Notes where NoteId =?`, [noteId], function (err) {
        if (err) {
          return console.log(err.message);
        }
        console.log(`A Note has been deleted with noteid ${noteId}`);
      });

    } catch (err) {
      throw err;
    }
  });


  defineShortCuts();
  defineContextMenu();
  defineTray();

  function defineShortCuts() {
    globalShortcut.register("CTRL + Up", () => {
      mainWindow.webContents.send("zoomIn", "");
    });

    globalShortcut.register("CTRL + Down", () => {
      mainWindow.webContents.send("zoomOut", "");
    });
  }

  function defineContextMenu() {
    const contextMenuOnRightCLick = new Menu();
    // Build menu one item at a time, unlike
    contextMenuOnRightCLick.append(new MenuItem({
      label: 'System info.',
      click() {

        notifier.notify({
          title: 'Welcome',
          message: `Hello ${currentPlatform} user ! You are using ${currentPlatform} system.`,
          icon: path.join(__dirname, `/src/assets/smily.png`),
          sound: true,

        }, function (err, response) {

        });

      }
    }
    ));

    contextMenuOnRightCLick.append(new MenuItem({
      label: 'Context menu demo',
      click() {
        const options = {
          type: 'question',
          buttons: ['Ok'],
          defaultId: 2,
          title: 'Context menu demo',
          message: 'Hello user !',
          detail: 'This is an example of context Menu .',
          //checkboxLabel: 'Remember my answer',
          // checkboxChecked: true,
        };

        dialog.showMessageBox(null, options, (response, checkboxChecked) => {
          console.log(response);
          console.log(checkboxChecked);
        });
      }
    }
    ));

    mainWindow.webContents.on('context-menu', () => {
      contextMenuOnRightCLick.popup();
    });

    mainWindow.once('ready-to-show', () => {
      mainWindow.webContents.send('test', '0');
     // mainWindow.webContents.send('test',app.getPath('userData'));
      //mainWindow.webContents.send('test','in app ready');
      autoUpdater.checkForUpdatesAndNotify();
    });
  }

  function defineTray() {

    tray = new Tray(iconPath);
    tray.setToolTip("Todo app");

    tray.on("click", () => {
      mainWindow.show();
    });

    const contextMenu = Menu.buildFromTemplate([
      {
        label: 'Quit', click: function () {
          app.isQuiting = true;
          app.quit();
          db.close();
        }
      }
    ]);
    tray.setContextMenu(contextMenu);
  }

}

// autoUpdater.on('update-downloaded', (event, releaseNotes, releaseName) => {
//   console.log('updated-downloaded.....');
//   const dialogOpts = {
//       type: 'info',
//       buttons: ['Restart', 'Not Now. On next Restart'],
//       title: 'Update',
//       message: process.platform === 'win32' ? releaseNotes : releaseName,
//       detail: 'A New Version has been Downloaded. Restart Now to Complete the Update.'
//   }

//   dialog.showMessageBox(dialogOpts).then((returnValue) => {
//       if (returnValue.response === 0) autoUpdater.quitAndInstall()
//   })
// })

autoUpdater.on('error', message => {
  console.error('There was a problem updating the application')
  console.error(message);
})

autoUpdater.on("checking-for-update", () => {
  //your code
  mainWindow.webContents.send('test', '1');
  console.log('checking-for-update.....');
});

/*No updates available*/
autoUpdater.on("update-not-available", info => {
  //your code
  mainWindow.webContents.send('test', '2');
  console.log('update-not-available.....');
});


autoUpdater.on('update-available', () => {
  mainWindow.webContents.send('update_available');
});

autoUpdater.on('update-downloaded', () => {
  mainWindow.webContents.send('update_downloaded');
});

/*New Update Available*/
// autoUpdater.on("update-available", info => {
//   //your code
//   console.log('update-available.....');

// });

app.on("ready", function () {
  createWindow();
  session.fromPartition("default").setPermissionRequestHandler((webContents, permission, callback) => {
    let allowedPermissions = ["audioCapture"]; // Full list here: https://developer.chrome.com/extensions/declare_permissions#manifest

    if (allowedPermissions.includes(permission)) {
        callback(true); // Approve permission request
    } else {
        console.error(
            `The application tried to request permission for '${permission}'. This permission was not whitelisted and has been blocked.`
        );

        callback(false); // Deny
    }
});
});

app.on('before-quit', (event) => {
  //console.log('before exit ....');
  mainWindow.webContents.send('test','in before-quit');
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();db.close();
})

app.on('activate', function () {
  if (mainWindow === null) createWindow()
})