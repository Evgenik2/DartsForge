async function DartsApi(request) {
    try {
        keyboardKeys.wait = true;
        var token = await new Promise(function(resolve, reject) {
            auth.userhandler = {
                onSuccess: function(result) {
                    resolve(result.getIdToken().getJwtToken());
                },
                onFailure: function(err) {
                    reject("Error!" + err);
                }
            };
            auth.getSession();
        });
        var response = await fetch('https://iua4civobg.execute-api.us-east-2.amazonaws.com/dev', {
            headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Authorization': token
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
    let community = await DartsApi({
        action: 'getCommunity',
        name: communityName
    });
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
    getEnding: function(value, defaultValue) { 
        var e = endings[this.endings]; 
        return e[value] ? e[value] : defaultValue;
    },
    store: function() {
        setRecord("Settings", "settings", JSON.stringify(this));
    },
    restore: function() {
        getRecord("Settings", "settings", function(data) {
            if(!data) {
                keyboardKeys.userName = settings.userName;
                settings.store();
            } else {
                var r = JSON.parse(data);
                settings.endings = r.endings == undefined ? "Default" : r.endings;
                settings.language = r.language == undefined ? "en" : r.language;
                banner.language = languages[settings.language];
                keyboardKeys.newSetLength = settings.newSetLength = r.newSetLength;
                keyboardKeys.newLegLength = settings.newLegLength = r.newLegLength;
                keyboardKeys.newGameLength = settings.newGameLength = r.newGameLength;
                keyboardKeys.newNoStartSwap = settings.newNoStartSwap = r.newNoStartSwap;
                keyboardKeys.userName = settings.userName;
                keyboardKeys.communities = settings.communities = r.communities;
                keyboardKeys.community = settings.community = r.community;
                keyboardKeys.eventName = settings.eventName = r.eventName;
                keyboardKeys.markerView = settings.markerView = r.markerView;
                if(keyboardKeys.community && r.communityData && r.communityData.Rating)
                    keyboardKeys.communityData = settings.communityData = r.communityData;
                if(keyboardKeys.communities)
                    keyboardKeys.fillCommunitiesList();
                else
                    keyboardKeys.requestCommunitiesList();
                updateAll();
            }
        });
    }
};

function initCognitoSDK() {
    var hostUrl = document.URL.split("/DartsForge/")[0];
    var domain = hostUrl.split("//")[1];
    var authData = {
        ClientId : '2l9l4t5o41uenmn9sg0ohre60d',
        AppWebDomain : "dartsforge.auth.us-east-2.amazoncognito.com",
        TokenScopesArray : ['openid','email'],
        RedirectUriSignIn : hostUrl + "/DartsForge/",
        RedirectUriSignOut : hostUrl + "/DartsForge/",
        IdentityProvider : 'COGNITO', 
        UserPoolId : 'us-east-2_GFcVOejW2', 
        AdvancedSecurityDataCollectionFlag : false
    };
    var auth = new AmazonCognitoIdentity.CognitoAuth(authData);
    // You can also set state parameter 
    // auth.setState(<state parameter>);  

    // The default response_type is "token", uncomment the next line will make it be "code".
    // auth.useCodeGrantFlow();
    return auth;
}
var auth = initCognitoSDK();
var curUrl = window.location.href;
auth.userhandler = {
    onSuccess: function(result) {
    },
    onFailure: function(err) {
    }
};
auth.parseCognitoWebResponse(curUrl);


if(curUrl.indexOf("token") != -1)
    window.location.replace('/DartsForge/');
settings.userName = auth.username;
