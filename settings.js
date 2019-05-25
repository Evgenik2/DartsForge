let resolutionList = [{x:1920, y:1080}, {x:1366, y:768}, {x:1280, y:720}, {x:1136, y:640}, {x:1024, y:576}, {x:854, y:480}, {x:640, y:360}];
function fillOpt(element, arr, h, v, d) {
    var r = document.getElementById(element);
    if(!r) return;
    r.innerHTML = "";
    for (i = r.options.length - 1; i >= 0 ; i--)
        r.options[i] = null;
    if(d) {
        let opt = document.createElement('option');
        opt.innerHTML = d;
        opt.value = d;
        r.appendChild(opt);
    }
    for (let i = 0; i < arr.length; i++) {
        let opt = document.createElement('option');
        opt.innerHTML = h(i);
        opt.value = v(i);
        r.appendChild(opt);
    }
}
function tos(i) {
    if(!i)
        return 0;
    return i;
}
function round1(i) {
    return Math.round(tos(i) * 10) / 10;
}
function round2(i) {
    return Math.round(tos(i) * 100) / 100;
}

function download(filename, text) {
    var element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
    element.setAttribute('download', filename);
  
    element.style.display = 'none';
    document.body.appendChild(element);
  
    element.click();
  
    document.body.removeChild(element);
}
function downloadBlob(filename, blob) {
    var element = document.createElement('a');
    element.setAttribute('href', window.URL.createObjectURL(blob));
    element.setAttribute('download', filename);
  
    element.style.display = 'none';
    document.body.appendChild(element);
  
    element.click();
  
    document.body.removeChild(element);
}
async function GetToken() {
    return await new Promise(function(resolve, reject) {
        auth.userhandler = {
            onSuccess: function(result) {
                resolve(result.getIdToken().getJwtToken());
            },
            onFailure: function(err) {
                reject("Error!" + err);
            }
        };
        if(!auth.username)
            setTimeout(function() {
                auth.getSession();
            }, 2000);
        else
            auth.getSession();
    });
}
async function sendWS(data) {
    if(keyboardKeys.userName) {
        data.userName = keyboardKeys.userName;
        data.token = await GetToken();
    }
    if(!data.community)
        data.community = keyboardKeys.community;
    ws.send(JSON.stringify(data));
}
async function DartsPublicApi(action, communityName, eventName) {
    try {
        keyboardKeys.wait = true;
        var response = await fetch('https://iua4civobg.execute-api.us-east-2.amazonaws.com/dev?action='+action+
            (communityName?"&communityName="+communityName:"") +
            (eventName ? "&eventName=" + eventName:""), {
            headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            },
            method: "GET"
        });
        if (response.status !== 200)  
            throw 'Looks like there was a problem. ' + JSON.stringify(response);
        return await response.json();  
    } catch(e) {  
        console.log('Darts Api Error: ', e);  
    }
    finally {
        keyboardKeys.wait = false;
    }
}
async function DartsApi(request) {
    try {
        keyboardKeys.wait = true;

        var response = await fetch('https://iua4civobg.execute-api.us-east-2.amazonaws.com/dev', {
            headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Authorization': await GetToken()
            },
            method: "POST",
            body: JSON.stringify(request)
        });
        if (response.status == 401)
            keyboardKeys.logOut(); 
        if (response.status !== 200)  
            throw 'Looks like there was a problem. ' + JSON.stringify(response);
        return JSON.parse(await response.json());  
    } catch(e) {  
        console.log('Darts Api Error: ', e);  
    }
    finally {
        keyboardKeys.wait = false;
    }
}
async function DartsApiProfile() {
    let profile = await DartsApi({ action: 'userProfile' });
    if(!profile.OwnedCommunities)
        profile.OwnedCommunities = [];
    if(!profile.JoinedCommunities)
        profile.JoinedCommunities = [];
    if(!profile.Courts)
        profile.Courts = [];
    return profile;
}
async function CommunityData(communityName) {
    let community = await DartsPublicApi('getCommunity', communityName);
    if(!community.Referees)
        community.Referees = [];
    return community;
}
var settings = {
    userName: "",
    newSetLength: 1,
    newLegLength: 2,
    newGameLength: 501,
    communities: [],
    newNoStartSwap: false,
    endings: "Default",
    language: "en",
    portraitTop: 0,
    portraitLeft: 0,
    portraitScale: 1, 
    targetTop: 0,
    targetLeft: 0,
    targetScale: 1, 
    resolutionX: resolutionList[0].x,
    resolutionY: resolutionList[0].y,
    getEnding: function(value, defaultValue) { 
        var e = endings[this.endings]; 
        return e[value] ? e[value] : defaultValue;
    },
    store: function() {
        setRecord("Settings", "settings", JSON.stringify(this));
    },
    restore: async function() {
        await new Promise(function(resolve, reject) {
            getRecord("Settings", "settings", function(data) {
                if(!data) {
                    keyboardKeys.userName = settings.userName;
                    settings.store();
                } else {
                    var r = JSON.parse(data);
                    settings.endings = r.endings == undefined ? "Default" : r.endings;
                    settings.language = r.language == undefined ? "en" : r.language;
                    keyboardKeys.newSetLength = settings.newSetLength = r.newSetLength;
                    keyboardKeys.newLegLength = settings.newLegLength = r.newLegLength;
                    keyboardKeys.newGameLength = settings.newGameLength = r.newGameLength;
                    keyboardKeys.newNoStartSwap = settings.newNoStartSwap = r.newNoStartSwap;
                    keyboardKeys.userName = settings.userName;
                    if(r.communities) keyboardKeys.communities = settings.communities = r.communities;
                    if(r.community) keyboardKeys.community = settings.community = r.community;
                    if(r.eventHistoryItemLegs) keyboardKeys.eventHistoryItemLegs = settings.eventHistoryItemLegs = r.eventHistoryItemLegs;
                    if(r.eventHistoryItemList) keyboardKeys.eventHistoryItemList = settings.eventHistoryItemList = r.eventHistoryItemList;
                    if(r.eventData) keyboardKeys.eventData = settings.eventData = r.eventData;
                    if(r.eventName) keyboardKeys.eventName = settings.eventName = r.eventName;
                    if(r.eventHistory) keyboardKeys.eventHistory = settings.eventHistory = r.eventHistory;
                    keyboardKeys.targetNumber = settings.targetNumber = r.targetNumber;
                    if(keyboardKeys.currentView == 13 || keyboardKeys.currentView == 14)
                        keyboardKeys.updateEventHistoryData(keyboardKeys.eventData);
                    if(keyboardKeys.community && r.communityData && r.communityData.Rating)
                        keyboardKeys.communityData = settings.communityData = r.communityData;
                    keyboardKeys.requestCommunitiesList();
                    keyboardKeys.updateChangeCommunityList();
                    if(!keyboardKeys.userName && keyboardKeys.currentView != 10 && keyboardKeys.currentView != 13 && keyboardKeys.currentView != 14) {
                        keyboardKeys.changeView(keyboardKeys.community ? 8 : 7);
                    }
                    keyboardKeys.audioDeviceId = settings.audioDeviceId = r.audioDeviceId;
                    keyboardKeys.portraitDeviceId = settings.portraitDeviceId = r.portraitDeviceId;
                    keyboardKeys.targetDeviceId = settings.targetDeviceId = r.targetDeviceId;
                    settings.portraitTop = r.portraitTop;
                    settings.portraitLeft = r.portraitLeft;
                    settings.portraitScale = r.portraitScale;
                    settings.targetTop = r.targetTop;
                    settings.targetLeft = r.targetLeft;
                    settings.targetScale = r.targetScale;
                    settings.resolutionX = r.resolutionX ? r.resolutionX : resolutionList[0].x;
                    settings.resolutionY = r.resolutionY ? r.resolutionY : resolutionList[0].y;
                    game.updateAll();
                }
                resolve();
            });
        });
    }
};

function initCognitoSDK() {
    var hostUrl = document.URL.split("?")[0];
    var domain = hostUrl.split("//")[1];
    var authData = {
        ClientId : '2l9l4t5o41uenmn9sg0ohre60d',
        AppWebDomain : "dartsforge.auth.us-east-2.amazoncognito.com",
        TokenScopesArray : ['openid','email'],
        RedirectUriSignIn : hostUrl,
        RedirectUriSignOut : hostUrl,
        IdentityProvider : 'COGNITO', 
        UserPoolId : 'us-east-2_GFcVOejW2', 
        AdvancedSecurityDataCollectionFlag : false
    };
    var auth = new AmazonCognitoIdentity.CognitoAuth(authData);
//    auth.getFQDNSignOut = function() {
//      var uri = auth.getCognitoConstants().DOMAIN_SCHEME.concat(auth.getCognitoConstants().COLONDOUBLESLASH, auth.getAppWebDomain(), auth.getCognitoConstants().SLASH, auth.getCognitoConstants().DOMAIN_PATH_SIGNOUT, auth.getCognitoConstants().QUESTIONMARK, auth.getCognitoConstants().DOMAIN_QUERY_PARAM_REDIRECT_URI, auth.getCognitoConstants().EQUALSIGN, encodeURIComponent(auth.RedirectUriSignOut), auth.getCognitoConstants().AMPERSAND, auth.getCognitoConstants().DOMAIN_QUERY_PARAM_RESPONSE_TYPE, auth.getCognitoConstants().EQUALSIGN, auth.responseType, auth.getCognitoConstants().AMPERSAND, auth.getCognitoConstants().CLIENT_ID, auth.getCognitoConstants().EQUALSIGN, auth.getClientId());
//      return uri;
//    }
    // You can also set state parameter 
    // auth.setState(<state parameter>);  

    // The default response_type is "token", uncomment the next line will make it be "code".
    auth.useCodeGrantFlow();
    return auth;
}
var auth;
async function initCognito() { 
    await new Promise(function(resolve, reject) {
        var curUrl = window.location.href;
        auth = initCognitoSDK();
        auth.userhandler = {
            onSuccess: function(result) {
                if(curUrl.indexOf("token") != -1 || curUrl.indexOf("code") != -1)
                    window.location.replace('/');
                if(auth.username)
                    settings.userName = decodeURIComponent(auth.username.split('').map(x => '%' + x.charCodeAt(0).toString(16)).join(''));
                resolve();
            },
            onFailure: function(err) {
                console.log("Error! " + err);
                reject();
            }
        };
        auth.parseCognitoWebResponse(curUrl);
        if(auth.username)
            settings.userName = decodeURIComponent(auth.username.split('').map(x => '%' + x.charCodeAt(0).toString(16)).join(''));
        if(curUrl.indexOf("code=") < 0) 
            resolve();
    });
}
var ws;
function startWebSocket() {
    ws = new WebSocket("wss://5me0v9emlj.execute-api.us-east-2.amazonaws.com/dev");
    ws.onopen = function() { 
        ws.send(JSON.stringify({ "action": "join", "community": settings.community, "userName": keyboardKeys.userName, target: keyboardKeys.userName || keyboardKeys.targetNumber < 0 ? undefined : keyboardKeys.targetNumber }));
        console.log("Connection opened...") 
    };
    ws.onerror = function(e) {
        console.log(JSON.stringify(e));
    },
    ws.onmessage = async function(evt) {
        let data = JSON.parse(evt.data);
        if(data.error) {
            alert(evt.data);
            return;
        }
        let t = data.game && keyboardKeys.targetNumber > 0 && data.game.target == keyboardKeys.targetNumber && !keyboardKeys.userName;
        switch(data.action) {
            case "target": 
                if(keyboardKeys.targets.indexOf(-1) < 0)
                    keyboardKeys.targets.push(-1);
                if(keyboardKeys.targets.indexOf(data.target) < 0)
                    keyboardKeys.targets.push(data.target);
                fillOpt("target", keyboardKeys.targets, i => keyboardKeys.targets[i] > 0 ? keyboardKeys.targets[i] : "No", i => keyboardKeys.targets[i]);
                break;
            case "courtCommunity":
                if(keyboardKeys.community == data.community && keyboardKeys.communityData.changeable &&
                    !keyboardKeys.profile.Joins.find(e=>e.CommunityName == data.community && e.UserName == data.userName)) {
                        keyboardKeys.alert(data.userName + keyboardKeys.language.joinMessage1 + data.community);
                        keyboardKeys.profile.Joins.push({CommunityName: data.community, UserName: data.userName, language: keyboardKeys.language});
                        keyboardKeys.waitingJoining = keyboardKeys.profile.Joins;
                    }
                    break;
            case "rejectCourt":
                if(keyboardKeys.community == data.community && keyboardKeys.communityData.changeable) {
                    keyboardKeys.alert(data.userName + keyboardKeys.language.messageReject3 + data.community);
                    keyboardKeys.profile.Joins = keyboardKeys.profile.Joins.filter(e=>!(e.CommunityName == data.community && e.UserName == data.userName));
                    keyboardKeys.waitingJoining = keyboardKeys.profile.Joins;
                }
                break;
            case "rejectJoin":
                if(data.userName == keyboardKeys.userName || (keyboardKeys.community == data.community && keyboardKeys.communityData.changeable)) {
                    keyboardKeys.alert(data.userName + keyboardKeys.language.messageReject1 + data.community + keyboardKeys.language.messageReject2);
                    keyboardKeys.profile.Joins = keyboardKeys.profile.Joins.filter(e=>!(e.CommunityName == data.community && e.UserName == data.userName));
                    keyboardKeys.waitingJoining = keyboardKeys.profile.Joins;
                    keyboardKeys.profile.Courts = keyboardKeys.profile.Courts.filter(e=>!(e.CommunityName == data.community && e.UserName == data.userName));
                    keyboardKeys.waitingAgreement = keyboardKeys.profile.Courts;
                }
                break;
            case "joinCommunity":
                keyboardKeys.alert(data.userName + keyboardKeys.language.messageJoin + data.community);
                await keyboardKeys.refreshProfile();
                break;
            case "deleteEvent":
                if(keyboardKeys.community == data.community) {
                    keyboardKeys.alert(data.eventName + keyboardKeys.language.messageEventDeleted);
                    await keyboardKeys.updateCommunityData();
                }
                break;
            case "newCommunityEvent":
                if(keyboardKeys.community == data.community) {
                    keyboardKeys.alert(data.eventName + keyboardKeys.language.messageEventCreated);
                    await keyboardKeys.updateCommunityData();
                }
                break;
            case "gipStart":
                if(t)
                    restartRecord();
            case "gipUpdate":
                if(keyboardKeys.community == data.community) {
                    let s = Game501.Verify(data.game);
                    data.game.lastUpdated = new Date();
                    data.game.legs = Game501.GetLegs(data.game);
                    data.game.wonLegs1 = s.WonLegs.player1;
                    data.game.wonLegs2 = s.WonLegs.player2;
                    data.game.stats = [s["100+"], s["140+"], s["180"], s["Av"], s["HC"], s["Dbls"], s["%"], s["Best"], s["LWAT"]];
                    keyboardKeys.gip = keyboardKeys.gip.filter(e=>e.refereeTimestamp != data.game.refereeTimestamp);
                    keyboardKeys.gip.push(data.game);
                    if(t && !recorder)
                        startRecord();
                    keyboardKeys.gip.sort((a,b)=>b.refereeTimestamp.localeCompare(a.refereeTimestamp));
                    if( t || (keyboardKeys.eventHistoryItemList[0].refereeTimestamp == data.game.refereeTimestamp && game.refereeTimestamp != data.game.refereeTimestamp))
                        keyboardKeys.showEventHistoryItem(data.game.timeStamp, t);
                }
                break;
            case "gipFinished":
                if(keyboardKeys.community == data.community) {
                    data.game = keyboardKeys.gip.find(e=>e.refereeTimestamp == data.refereeTimestamp);
                    keyboardKeys.gip = keyboardKeys.gip.filter(e=>e.refereeTimestamp != data.refereeTimestamp);
                    keyboardKeys.gip.sort((a,b)=>a.refereeTimestamp.localeCompare(b.refereeTimestamp));
                    await keyboardKeys.updateCommunityData();
                    if(data.game && keyboardKeys.eventName == data.game.eventName) {
                        keyboardKeys.eventHistory.push(data.game);
                        keyboardKeys.eventHistory.sort((a, b) => b.timeStamp.localeCompare(a.timeStamp));
                        settings.eventHistory = keyboardKeys.eventHistory;
                        settings.store();
                    }
                    if(data.game.player1 == keyboardKeys.userName || data.game.player2 == keyboardKeys.userName)
                        keyboardKeys.refreshProfile();
                    let t = keyboardKeys.targetNumber > 0 && data.game.target == keyboardKeys.targetNumber && !keyboardKeys.userName;
                    if(t && recorder)
                        finishRecord();
                    if(keyboardKeys.currentView == 13)
                        keyboardKeys.showEventHistory(keyboardKeys.eventData);
                    else if(t || keyboardKeys.eventHistoryItemList[0].refereeTimestamp == data.game.refereeTimestamp && game.refereeTimestamp != data.game.refereeTimestamp)
                        keyboardKeys.showEventHistoryItem(data.game.timeStamp, t);
                }
                break;
        }
    };
    ws.onclose = function(){
        // Try to reconnect in 5 seconds
        setTimeout(startWebSocket, 5000);
    };
}
    