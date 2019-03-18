var indexedDB = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB,
IDBTransaction = window.IDBTransaction || window.webkitIDBTransaction || window.msIDBTransaction,
baseName = "DartsForge";

function logerr(err){
    console.log(err);
}
function connectDB(tableName, f){
    try {
        var request = indexedDB.open(baseName);
        request.onerror = logerr;
        request.onsuccess = function(){
            f(request.result);
        }   
    }catch(e) {
        keyboardKeys.currentView = -1;
    }
}
function CreateObjectStore(storeName, f) {
    try {
        var request = indexedDB.open(baseName);
        request.onsuccess = function (e){
            var database = e.target.result;
            var version =  parseInt(database.version);
            database.close();
            var secondRequest = indexedDB.open(baseName, version + 1);
            secondRequest.onerror = function() {};
            secondRequest.onupgradeneeded = function (e) {
                var database = e.target.result;
                if(!database.objectStoreNames.contains(storeName))
                    var objectStore = database.createObjectStore(storeName, { keyPath: "key" });
            };
            secondRequest.onsuccess = function (e) {
                e.target.result.close();
                f();
            }
        }
    }catch(e) {
        keyboardKeys.currentView = -1;
    }
}
function getLastRecord(tableName, f){
    connectDB(tableName, function(db){
        var request = db.transaction([tableName], "readonly").objectStore(tableName).openCursor(null, 'prev');
        request.onerror = function() {
            logerr;
            f();
        }
        request.onsuccess = function(e) {
            var cursor = e.target.result;
            if(cursor)
                f(cursor.value.data);
            else
                f();
        }
    });
}
function getRecord(tableName, key, f){
    connectDB(tableName, function(db){
        var request = db.transaction([tableName], "readonly").objectStore(tableName).openCursor(IDBKeyRange.only(key));
        request.onerror = function() {
            logerr;
            f();
        }
        request.onsuccess = function(e) {
            var cursor = e.target.result;
            if(cursor)
                f(cursor.value.data);
            else
                f();
        }
    });
}
function formatDate(date) {
    var d = new Date(date),
        minute = '' + (d.getMinutes() + 1),
        hour = '' + (d.getHours() + 1),
        month = '' + (d.getMonth() + 1),
        day = '' + d.getDate(),
        year = d.getFullYear();

    if (minute.length < 2) minute = '0' + minute;
    if (hour.length < 2) hour = '0' + hour;
    if (month.length < 2) month = '0' + month;
    if (day.length < 2) day = '0' + day;

    return [year, month, day].join('-') + ' ' + hour + ':' + minute;
}
function getAllRecords(tableName, f) {
    connectDB(tableName, function(db){
        var rows = [];
        var request = db.transaction([tableName], "readonly").objectStore(tableName).openCursor();
        request.onerror = logerr;
        request.onsuccess = function(e){
            var cursor = e.target.result;
            if(cursor) {
                var r = JSON.parse(cursor.value.data);
                rows = rows.concat(r);
                cursor.continue();
            }
            else {
                f(rows);
            }
        }
    });
}
function getRecords(tableName, start, end, f) {
    connectDB(tableName, function(db){
        var rows = [];
        var request = db.transaction([tableName], "readonly").objectStore(tableName).openCursor(IDBKeyRange.bound(start, end, true, false));
        request.onerror = logerr;
        request.onsuccess = function(e){
            var cursor = e.target.result;
            if(cursor) {
                var r = JSON.parse(cursor.value.data);
                r.startTime = formatDate(r.timeStamp);
                rows = rows.concat(r);
                cursor.continue();
            }
            else {
                f(rows);
            }
        }
    });
}
function setRecord(tableName, key, data) {
    connectDB(tableName, function(db) {
        var request = db.transaction([tableName], "readwrite").objectStore(tableName).put({ key: key, data: data });
        request.onerror = logerr;
        request.onsuccess = function(){
        }
    });
}
function deleteRecord(tableName, key) {
    connectDB(tableName, function(db) {
        var request = db.transaction([tableName], "readwrite").objectStore(tableName).openCursor(IDBKeyRange.only(key))
        request.onerror = logerr;
        request.onsuccess = function(){
            var cursor = request.result;
            if (cursor) {
                cursor.delete();
                cursor.continue();
            }	
        }
    });
}
function deleteAll(tableName) {
    connectDB(tableName, function(db) {
        var request = db.transaction([tableName], "readwrite").objectStore(tableName).openCursor();
        request.onerror = logerr;
        request.onsuccess = function(){
            var cursor = request.result;
            if (cursor) {
                cursor.delete();
                cursor.continue();
            }	
        }
    });
}
