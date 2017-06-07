/* Copyright (c) 2012-present The TagSpaces Authors. All rights reserved.
 * Use of this source code is governed by a AGPL3 license that
 * can be found in the LICENSE file. */

define((require, exports, module) => {
  'use strict';

  console.log('Loading perspective.manager.js ...');

  let perspectives;
  const TSCORE = require('tscore');

  class TSPerspectiveManager {

    static initPerspective(extPath) {
      return new Promise((resolve, reject) => {
        require([extPath], (perspective) => {
          perspectives.push(perspective);

          // Creating perspective's toolbar
          $('#viewToolbars').append($('<div>', {
            id: perspective.ID + 'Toolbar',
            class: 'btn-toolbar'
          }).hide());
          // Creating perspective's container
          $('#viewContainers').append($('<div>', {
            id: perspective.ID + 'Container',
            style: 'width: 100%; height: 100%'
          }).hide());
          // Creating perspective's footer
          $('#viewFooters').append($('<div>', {
            id: perspective.ID + 'Footer'
          }).hide());
          //TODO: return init as promise
          perspective.init();
          resolve(true);
        }); // jshint ignore:line
      });
    }

    static initPerspectives() {
      perspectives = [];
      $('#viewSwitcher').empty();
      $('#viewContainers').empty();
      this._initWelcomeScreen();

      let extensions = TSCORE.Config.getActivatedPerspectives();
      let promises = [];
      for (let i = 0; i < extensions.length; i++) {
        let extPath = TSCORE.Config.getExtensionPath() + '/' + extensions[i].id + '/extension.js';
        promises.push(initPerspective(extPath));
      }

      return Promise.all(promises).then(() => {
        TSCORE.IO.checkAccessFileURLAllowed ? TSCORE.IO.checkAccessFileURLAllowed() : true;

        this._initPerspectiveSwitcher();
        // Opening last saved location by the start of the application
        let lastLocation = TSCORE.Config.getLastOpenedLocation();
        if (TSCORE.Config.getUseDefaultLocation()) {
          lastLocation = TSCORE.Config.getDefaultLocation();
        }

        let startupFilePath = TSCORE.Utils.getURLParameter("open");
        if (startupFilePath && startupFilePath.length) {
          startupFilePath = decodeURIComponent(startupFilePath);
          TSCORE.FileOpener.openFileOnStartup(startupFilePath);
        } else if (lastLocation && lastLocation.length >= 1) {
          TSCORE.openLocation(lastLocation);
        }

        TSCORE.fireDocumentEvent(TSCORE.createDocumentEvent("initApp"));
        $("#viewContainers").removeClass("appBackgroundTile");
        $('#loading').hide();
        if (isElectron) {
          TSCORE.IO.showMainWindow();
        }
        return true;
      });
    }

    static _initWelcomeScreen() {

      $('#viewContainers').append('<div id="welcomeScreen"></div>');
    }

    static _initPerspectiveSwitcher() {
      let extensions = TSCORE.Config.getActivatedPerspectives();
      let $perspectiveSwitcher = $('#perspectiveSwitcher');

      $perspectiveSwitcher.empty();
      $perspectiveSwitcher.append($('<li>', {
          class: 'dropdown-header',
          text: $.i18n.t('ns.common:perspectiveSwitch')
        }).prepend("<button class='close'>&times;</button>")
      );

      for (let i = 0; i < extensions.length; i++) {
        let curPers;

        // Finding the right perspective 
        perspectives.forEach((value) => {
          if (value.ID === extensions[i].id) {
            curPers = value;
          }
        }); // jshint ignore:line

        $perspectiveSwitcher.append($('<li>', {}).append($('<a>', {
          'viewid': curPers.ID,
          'title': curPers.ID,
          'id': curPers.ID + 'Button',
          'text': curPers.Title
        }).prepend($('<i>', {
          'class': curPers.Icon + ' fa-lg',
          'style': 'margin-right: 15px'
        }))));

        // Adding event listener & icon to the radio button
        $('#' + curPers.ID + 'Button').click(() => {
          changePerspective($(this).attr('viewid'));
        }); // jshint ignore:line
      }
    }

    static redrawCurrentPerspective() {
      this.clearSelectedFiles();
      for (let i = 0; i < perspectives.length; i++) {
        if (perspectives[i].ID === TSCORE.currentPerspectiveID) {
          try {
            perspectives[i].load();
            break;
          } catch (e) {
            console.warn("Error while executing 'redrawCurrentPerspective' on " + perspectives[i].ID + ' ' + e);
          }
        }
      }
    }

    static removeFileUI(filePath) {
      console.log('Removing file from perspectives');
      for (let i = 0; i < perspectives.length; i++) {
        try {
          perspectives[i].removeFileUI(filePath);
        } catch (e) {
          console.warn("Error while executing 'removeFileUI' on " + perspectives[i].ID + ' ' + e);
        }
      }
    }

    /*function removeAllFiles() {
    console.log('Removing file from perspectives');
    if (TSCORE.fileList && TSCORE.fileList.length > 0) {
    TSCORE.fileList = [];
    redrawCurrentPerspective();
    }
    }*/

    static updateFileUI(oldFilePath, newFilePath) {
      console.log('Updating file in perspectives');

      if (TSCORE.FileOpener.getOpenedFilePath() === oldFilePath && !TSCORE.FileOpener.isFileEdited()) {
        TSCORE.FileOpener.openFile(newFilePath);
      }

      for (let i = 0; i < perspectives.length; i++) {
        try {
          perspectives[i].updateFileUI(oldFilePath, newFilePath);
        } catch (e) {
          console.warn("Error while executing 'updateFileUI' on " + perspectives[i].ID + ' ' + e);
        }
      }
    }

    static getNextFile(filePath) {
      for (let i = 0; i < perspectives.length; i++) {
        if (perspectives[i].ID === TSCORE.currentPerspectiveID) {
          try {
            return perspectives[i].getNextFile(filePath);
          } catch (e) {
            console.warn("Error while executing 'getNextFile' on " + perspectives[i].ID + ' ' + e);
          }
        }
      }
    }

    static getPrevFile(filePath) {
      for (let i = 0; i < perspectives.length; i++) {
        if (perspectives[i].ID === TSCORE.currentPerspectiveID) {
          try {
            return perspectives[i].getPrevFile(filePath);
          } catch (e) {
            console.warn("Error while executing 'getPrevFile' on " + perspectives[i].ID + ' ' + e);
          }
        }
      }
    }

    static selectFile(filePath) {
      for (let i = 0; i < perspectives.length; i++) {
        if (perspectives[i].ID === TSCORE.currentPerspectiveID) {
          try {
            return perspectives[i].selectFile(filePath);
          } catch (e) {
            console.warn("Error while executing 'selectFile' on " + perspectives[i].ID + ' ' + e);
          }
        }
      }
    }

    static updateFileBrowserData(dirList, isSearchResult) {
      console.log('Updating the file browser data...');
      TSCORE.fileList = [];
      TSCORE.showLoadingAnimation();
      if (!isSearchResult) { // TODO tmp solution for not hiding the loading dialog on search
        TSCORE.showWaitingDialog("Loading metadata and thumbnails");
      }

      let metaDataLoadingPromises = [];
      let tags, ext, title, fileSize, fileLMDT, path, filename, entry, thumbPath, metaObj;

      for (let i = 0; i < dirList.length; i++) {
        // Considering Unix HiddenEntries (. in the beginning of the filename)
        if (TSCORE.Config.getShowUnixHiddenEntries() || !TSCORE.Config.getShowUnixHiddenEntries() && (dirList[i].name.length && dirList[i].name[0] != '.')) {
          filename = dirList[i].name.replace(/(<([^>]+)>)/gi, ''); // sanitizing filename
          path = dirList[i].path.replace(/(<([^>]+)>)/gi, ''); // sanitizing filepath
          title = TSCORE.TagUtils.extractTitle(filename);
          ext = TSCORE.TagUtils.extractFileExtension(filename);
          tags = TSCORE.TagUtils.extractTags(path);

          if (dirList[i].size) {
            fileSize = dirList[i].size;
          } else {
            fileSize = "";
          }

          if (dirList[i].lmdt) {
            fileLMDT = dirList[i].lmdt;
          } else {
            fileLMDT = '';
          }

          if (dirList[i].thumbPath) {
            thumbPath = dirList[i].thumbPath;
          } else {
            thumbPath = '';
          }

          metaObj = {
            thumbnailPath: thumbPath,
            metaData: null
          };

          entry = {
            "extension": ext,
            "title": title,
            "tags": tags,
            "size": fileSize,
            "lmdt": fileLMDT,
            "path": path,
            "name": filename,
            "isDirectory": !dirList[i].isFile,
            "meta": metaObj
          };
          TSCORE.fileList.push(entry);
          metaDataLoadingPromises.push(TSCORE.Meta.loadMetaFileJsonPromise(entry));

          if (!dirList[i].isFile) {
            entry = {
              "path": path,
              "name": filename,
              "isDirectory": true,
            };
            TSCORE.subDirsList.push(entry);
          }
        }
      }

      let loadAllHandler = () => {
        TSCORE.hideLoadingAnimation();
        TSCORE.hideWaitingDialog();
        this.redrawCurrentPerspective();
        if (TSCORE.PRO && !isSearchResult && TSCORE.Config.getUseTextExtraction()) {
          TSCORE.showLoadingAnimation();
          //TSCORE.showWaitingDialog("Extracting text content");
          TSCORE.PRO.extractTextContentFromFilesPromise(TSCORE.fileList).then(() => {
            console.log("Text extraction completed!");
            TSCORE.hideLoadingAnimation();
            TSCORE.hideWaitingDialog();
          }).catch((e) => {
            console.log("Text extraction failed!");
            TSCORE.hideLoadingAnimation();
            TSCORE.hideWaitingDialog();
          });
        }
      };

      Promise.all(metaDataLoadingPromises).then((result) => {
        console.log("MetaData loaded / Creating thumbs finished!");
        this._loadAllHandler();
      }).catch((e) => {
        console.warn("MetaData loading / Creating thumbs failed: " + e);
        this._loadAllHandler();
      });
    }

    static refreshFileListContainer() {
      // TODO consider search view
      TSCORE.IO.listDirectoryPromise(TSCORE.currentPath).then((entries) => {
        TSCORE.PerspectiveManager.updateFileBrowserData(entries);
        TSCORE.updateSubDirs(entries);      
      }).catch((err) => {
        // Normalazing the paths
        let dir1 = TSCORE.TagUtils.cleanTrailingDirSeparator(TSCORE.currentLocationObject.path);
        let dir2 = TSCORE.TagUtils.cleanTrailingDirSeparator(TSCORE.currentPath);
        // Close the current location if the its path could not be opened
        if (dir1 === dir2) {
          TSCORE.showAlertDialog($.i18n.t('ns.dialogs:errorOpeningLocationAlert'));
          TSCORE.closeCurrentLocation();
        } else {
          TSCORE.showAlertDialog($.i18n.t('ns.dialogs:errorOpeningPathAlert'));
        }      
        console.warn("Error listing directory" + err);
      });
    }

    static hideAllPerspectives() {
      $('#welcomeScreen').hide();
      for (let i = 0; i < perspectives.length; i++) {
        $('#' + perspectives[i].ID + 'Container').hide();
        $('#' + perspectives[i].ID + 'Toolbar').hide();
      }
    }

    static changePerspective(viewType) {
      console.log('Change to ' + viewType + ' perspective.');
      TSCORE.showLoadingAnimation();
      // Loading first perspective by default
      if (viewType === undefined) {
        TSCORE.currentPerspectiveID = perspectives[0].ID;
      } else {
        //Setting the current view
        TSCORE.currentPerspectiveID = viewType;
      }
      if (TSCORE.currentPerspectiveID === undefined) {
        TSCORE.showAlertDialog('No Perspectives found', '');
        return false;
      }
      this.hideAllPerspectives();
      for (let i = 0; i < perspectives.length; i++) {
        if (perspectives[i].ID === viewType) {
          let $currentPerspectitveIcon = $('#currentPerspectitveIcon');
          $currentPerspectitveIcon.removeClass();
          $currentPerspectitveIcon.addClass(perspectives[i].Icon);
          $currentPerspectitveIcon.addClass('fa-lg');

          let $currentPerspectitveName = $('#currentPerspectitveName');
          $currentPerspectitveName.removeAttr("data-i18n");
          $currentPerspectitveName.text(' ' + perspectives[i].Title);
          $currentPerspectitveName.attr('title', perspectives[i].ID);

          perspectives[i].load();
          $('#' + perspectives[i].ID + 'Container').show();
        }
      }
      // Clear the list with the selected files    
      this.clearSelectedFiles();
      // Enabled the main toolbar e.g. search functionality
      TSCORE.enableTopToolbar();
    }

    static clearSelectedFiles() {
      // Clear selected files
      TSCORE.selectedFiles = [];
      if (perspectives) {
        for (let i = 0; i < perspectives.length; i++) {
          try {
            perspectives[i].clearSelectedFiles();
          } catch (e) {
            console.error('Error while executing \'clearSelectedFiles\' on ' + perspectives[i].ID + ' - ' + e);
          }
        }
      }
    }

    static setReadOnly(filePath) {
      for (let i = 0; i < perspectives.length; i++) {
        try {
          perspectives[i].setReadOnly(filePath);
        } catch (e) {
          console.warn("Error while executing 'setReadOnly' on " + perspectives[i].ID + ' ' + e);
        }
      }
    }
  }

  exports.TSPerspectiveManager = TSPerspectiveManager;
  //exports.removeAllFiles = removeAllFiles;
});
