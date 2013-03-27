/*global jQuery, MM, _*/
MM.OfflineAdapter = function (storage) {
	'use strict';
	this.description = 'OFFLINE';
	this.recognises = function (mapId) {
		return mapId && mapId[0] === 'o';
	};
	this.loadMap = function (mapId) {
		var result = jQuery.Deferred(),
			map = storage.load(mapId);
		if (map) {
			result.resolve(map, mapId, 'application/json');
		} else {
			result.reject('not-found');
		}
		return result.promise();
	};
	this.saveMap = function (mapInfo) {
		var result = jQuery.Deferred(),
			resultMapInfo = _.clone(mapInfo);
		try {
			if (!this.recognises(mapInfo.mapId)) {
				resultMapInfo.mapId = storage.saveNew(resultMapInfo.idea);
			} else {
				storage.save(resultMapInfo.mapId, resultMapInfo.idea);
			}
		} catch (e) {
			console.log('e', e);
			return result.reject('local-storage-failed', e.toString()).promise();
		}
		return result.resolve(resultMapInfo).promise();
	};
};
MM.OfflineFallback = function (storage) {
	'use strict';
	var localStoragePrefix = 'fallback-';
	this.saveMap = function (mapId, map) {
		storage.setItem(localStoragePrefix + mapId, { map: map });
	};
	this.loadMap = function (mapId) {
		var entry = storage.getItem(localStoragePrefix + mapId);
		return entry && entry.map;
	};
	this.remove = function (mapId) {
		storage.remove(localStoragePrefix + mapId);
	};
};
MM.OfflineMapStorage = function (storage, keyPrefix) {
	'use strict';
	keyPrefix = keyPrefix || 'offline';
	var keyName = keyPrefix + '-maps';
	var newFileInformation = function (fileDescription) {
			return {d: fileDescription, t: Math.round(+new Date() / 1000)};
		},
		newFileId = function (nextFileNumber) {
			return keyPrefix + '-map-' + nextFileNumber;
		},
		storedFileInformation = function () {
			var files = storage.getItem(keyName) || { nextMapId: 1, maps: {}};
			files.maps = files.maps || {};
			return files;
		},
		store = function (fileId, fileContent, files) {
			files.maps[fileId] = newFileInformation(fileContent.title);
			storage.setItem(fileId, {map: fileContent});
			storage.setItem(keyName, files);
		};
	this.save = function (fileId, fileContent) {
		var files = storedFileInformation();
		store(fileId, fileContent, files);
	};
	this.saveNew = function (fileContent) {
		var files = storedFileInformation(),
			fileId = newFileId(files.nextMapId);
		files.nextMapId++;
		store(fileId, fileContent, files);
		return fileId;
	};
	this.remove = function (fileId) {
		var files = storedFileInformation();
		storage.remove(fileId);
		delete files.maps[fileId];
		storage.setItem(keyName, files);
	};
	this.list = function () {
		return storedFileInformation().maps;
	};
	this.load = function (fileId) {
		var item = storage.getItem(fileId);
		return item && item.map;
	};
	return this;
};