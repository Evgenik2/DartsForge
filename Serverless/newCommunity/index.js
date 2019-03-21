var AWS = require('aws-sdk'),
    Game501 = require('Game501'),
    flags = [ 'AD', 'AE', 'AF', 'AG', 'AI', 'AL', 'AM', 'AN', 'AO', 'AQ', 'AR', 'AS', 'AT', 'AU', 'AW', 'AX', 'AZ', 'BA', 
                    'BB', 'BD', 'BE', 'BF', 'BG', 'BH', 'BI', 'BJ', 'BL', 'BM', 'BN', 'BO', 'BR', 'BS', 'BT', 'BV', 'BW', 'BY', 'BZ', 'CA', 
                    'CC', 'CD', 'CF', 'CG', 'CH', 'CI', 'CK', 'CL', 'CM', 'CN', 'CO', 'CR', 'CU', 'CV', 'CX', 'CY', 'CZ', 'DE', 'DJ', 'DK', 
                    'DM', 'DO', 'DZ', 'EC', 'EE', 'EG', 'EH', 'ER', 'ES-CE', 'ES-ML', 'ES', 'ET', 'EU', 'FI', 'FJ', 'FK', 'FM', 'FO', 'FR', 
                    'GA', 'GB', 'GD', 'GE', 'GF', 'GG', 'GH', 'GI', 'GL', 'GM', 'GN', 'GP', 'GQ', 'GR', 'GS', 'GT', 'GU', 'GW', 'GY', 'HK', 
                    'HM', 'HN', 'HR', 'HT', 'HU', 'IC', 'ID', 'IE', 'IL', 'IM', 'IN', 'IO', 'IQ', 'IR', 'IS', 'IT', 'JE', 'JM', 'JO', 'JP', 
                    'KE', 'KG', 'KH', 'KI', 'KM', 'KN', 'KP', 'KR', 'KW', 'KY', 'KZ', 'LA', 'LB', 'LC', 'LI', 'LK', 'LR', 'LS', 
                    'LT', 'LU', 'LV', 'LY', 'MA', 'MC', 'MD', 'ME', 'MF', 'MG', 'MH', 'MK', 'ML', 'MM', 'MN', 'MO', 'MP', 'MQ', 'MR', 'MS', 
                    'MT', 'MU', 'MV', 'MW', 'MX', 'MY', 'MZ', 'NA', 'NC', 'NE', 'NF', 'NG', 'NI', 'NKR', 'NL', 'NO', 'NP', 'NR', 'NU', 'NZ',
                    'OM', 'PA', 'PE', 'PF', 'PG', 'PH', 'PK', 'PL', 'PM', 'PN', 'PR', 'PS', 'PT', 'PW', 'PY', 'QA', 'RE', 'RO', 'RS', 'RU', 
                    'RW', 'SA', 'SB', 'SC', 'SD', 'SE', 'SG', 'SH', 'SI', 'SJ', 'SK', 'SL', 'SM', 'SN', 'SO', 'SR', 'SS', 
                    'ST', 'SV', 'SY', 'SZ', 'TC', 'TD', 'TF', 'TG', 'TH', 'TJ', 'TK', 'TL', 'TM', 'TN', 'TO', 'TR', 'TT', 'TV', 'TW', 'TZ', 
                    'UA', 'UG', 'UM', 'US', 'UY', 'UZ', 'VA', 'VC', 'VE', 'VG', 'VI', 'VN', 'VU', 'WF', 'WS', 'YE', 'YT', 'ZA', 'ZM', 'ZW'],
    documentClient = new AWS.DynamoDB.DocumentClient(); 

var userProfile = async function(userName) {
    let userData = await documentClient.get({ Key: { "Name" : userName }, TableName : process.env.UsersTableName }).promise();
    let userItem = !userData.Item ? { Name: userName, OwnedCommunities: [], JoinedCommunities: [], RefereeCommunities: [] }
                                  : { Name: userName, 
                                      OwnedCommunities: userData.Item.OwnedCommunities ? userData.Item.OwnedCommunities.values : [], 
                                      JoinedCommunities: userData.Item.JoinedCommunities ? userData.Item.JoinedCommunities.values : [], 
                                      RefereeCommunities: userData.Item.RefereeCommunities ? userData.Item.RefereeCommunities.values : [] };

    let c = {};
    let keys = undefined;
    if(userItem.OwnedCommunities.length > 0 || userItem.RefereeCommunities.length > 0) {
        let index = 0;
        userItem.OwnedCommunities.forEach(function(value) {
            index++;
            let ck = ":titlevalue"+index;
            c[ck.toString()] = value;
        });
        userItem.RefereeCommunities.forEach(function(value) {
            index++;
            let ck = ":titlevalue"+index;
            c[ck.toString()] = value;
        });
        keys = Object.keys(c).toString();
    }
    c[':userName'] = userName;
    let invitesData = await documentClient.scan({ 
        FilterExpression: "UserName = :userName" + (keys ? " or CommunityName in (" + keys + ")" : ""), 
        ExpressionAttributeValues : c, 
        TableName : process.env.InvitesTableName }).promise();
    if(invitesData.Items) {
        userItem.Courts = invitesData.Items.filter(e => e.UserName == userName);
        userItem.Joins =  invitesData.Items.filter(e => e.UserName != userName);
    } 
    if(!userItem.Courts)
        userItem.Courts = [];
    if(!userItem.Joins)
        userItem.Joins = [];
    let worldRating = await documentClient.get({ 
        Key: {"UserName": userName }, 
        TableName : process.env.WorldRatingTableName }).promise();
    userItem.WorldRating = worldRating.Item;
    let wr = await documentClient.query({ 
        KeyConditionExpression: "UserName = :userName",
        ExpressionAttributeValues: { ":userName": userName }, 
        TableName : process.env.UserWeeklyRatingTableName }).promise();
    userItem.WeeklyRating = wr.Items;
    return userItem;
};
var updateProfile = async function(item) {
    item.Courts = undefined;
    item.WorldRating = undefined;
    item.WeeklyRating = undefined;
    item.Joins = undefined;
    item.OwnedCommunities = item.OwnedCommunities.length>0 ? documentClient.createSet(item.OwnedCommunities) : undefined;
    item.JoinedCommunities = item.JoinedCommunities.length>0 ? documentClient.createSet(item.JoinedCommunities) : undefined;
    item.RefereeCommunities = item.RefereeCommunities.length>0 ? documentClient.createSet(item.RefereeCommunities) : undefined;
  	await documentClient.put({ Item : item, TableName : process.env.UsersTableName }).promise();
};
var getCommunities = async function() {
    return (await documentClient.scan({ TableName : process.env.CommunitiesTableName }).promise()).Items;
};
var communityData = async function(communityName) {
    let community = (await documentClient.get({ Key: { "Name" : communityName }, TableName : process.env.CommunitiesTableName }).promise()).Item; 
    community.Referees = community.Referees ? community.Referees.values : [];
    return community;
};
var getCommunity = async function(communityName) {
    if(!communityName) throw 'Community name is not defined';
    let community = await communityData(communityName);
    let communityRating = await documentClient.query({ 
        KeyConditionExpression: "CommunityName = :communityName",
        ExpressionAttributeValues: { ":communityName": communityName }, 
        TableName : process.env.CommunityRatingTableName }).promise();
    if(communityRating.Items)
        community.Rating = communityRating.Items.map(e=> {e.IsReferee = community.Referees.includes(e.UserName); e.IsOwner = community.Owner == e.UserName; return e; }).sort((a, b) => a.Rating - b.Rating);
    let communityEvents = await documentClient.query({ 
        KeyConditionExpression: "CommunityName = :communityName",
        ExpressionAttributeValues: { ":communityName": communityName }, 
        TableName : process.env.GameEventsTableName }).promise();
    if(communityEvents.Items)
        community.Events = communityEvents.Items;
    return community;
};
var changePlayerStatus = async function(userName, communityName, playerName, status) {
    if(!communityName) throw 'Community name is not defined';
    let community = await getCommunity(communityName);
    if(community.Owner != userName) throw 'Only owner can change player status';
    if(status == "Referee" && !community.Referees.includes(playerName))
        community.Referees.push(playerName);
    if(status == "Player")
        community.Referees = community.Referees.filter(v => v != playerName);
    community.Rating = undefined;
    community.Events = undefined;
    community.Referees = community.Referees.length>0 ? documentClient.createSet(community.Referees) : undefined;
    await documentClient.put({ Item : community, TableName : process.env.CommunitiesTableName }).promise();
};
var newCommunityEvent = async function(userName, communityName, eventName) {
    if(!communityName) throw 'Community name is not defined';
    var cd = await getCommunity(communityName);
  	if(!cd) throw "The community '" + communityName + "' doesn't exists";
  	if(!cd.Referees.includes(userName) && cd.Owner != userName)
  	    throw "User can't change the community '" + communityName;

  	if(!eventName) throw 'Event name is not defined';
  	if(eventName.length > 20) throw 'Event name should be less than 20 characters';
  	if(cd.Events.find(e=>e.EventName == eventName)) throw 'Event already exists';
  	let ct = new Date(Date.now());
  	if(cd.Events) {
  	    let cnt = cd.Events.reduce((a, e) => {
  	            let cct = new Date(e.CreationDate);
  	            return a + (cct.getFullYear() == ct.getFullYear() && cct.getMonth() == ct.getMonth() && cct.getDay() == ct.getDay() ? 1 : 0);
  	        }, 0);
  	    if(cnt > 3) throw "You can't create more than 4 events in a day";
  	}
    await documentClient.put({ Item : { CommunityName : communityName, CreationDate: ct.toISOString(), EventName : eventName, Active : true }, TableName : process.env.GameEventsTableName }).promise();
    return { message: "Community " + communityName +" event " + eventName + " created by " + userName };
};
var activateCommunityEvent = async function(userName, communityName, eventName, active) {
    if(!communityName) throw 'Community name is not defined';
    var cd = await getCommunity(communityName);
  	if(!cd) throw "The community '" + communityName + "' doesn't exists";
  	if(!cd.Referees.includes(userName) && cd.Owner != userName)
  	    throw "User can't change the community '" + communityName;
  	if(!eventName) throw 'Event name is not defined';
  	if(eventName.length > 20) throw 'Event name should be less than 20 characters';
  	let ev = cd.Events.find(e=>e.EventName == eventName);
    if(!ev) throw "Event doesn't exists";
  	await documentClient.put({ Item : { CommunityName : communityName, CreationDate : ev.CreationDate, EventName : eventName, Active : active }, TableName : process.env.GameEventsTableName }).promise();
    return { message: "Community " + communityName +" event " + eventName + " activated by " + userName };
};
var courtCommunity = async function(userName, communityName) {
    if(!communityName) throw 'Community name is not defined';
    var cd = await communityData(communityName);
  	if(!cd) throw "The community '" + communityName + "' doesn't exists";
    let p = await userProfile(userName);
    if(p.OwnedCommunities.includes(communityName)) throw "User "+ userName +" own the community " + communityName;
    if(p.JoinedCommunities.includes(communityName)) throw "User "+ userName +" joined the community " + communityName;
    if(p.Courts.find(c=>c.CommunityName == communityName)) throw "User "+ userName +" already courted the community " + communityName;
    if(p.OwnedCommunities.length + p.JoinedCommunities.length + p.Courts.length > 32) throw "User "+ userName +" exceeded 32 communities limit. Contact us if you ned more.";
    await documentClient.put({ Item : { CommunityName : communityName, UserName : userName, ttl: Math.floor(Date.now() / 1000) + 60 * 60 * 24 }, TableName : process.env.InvitesTableName }).promise();
    return { message: "Community " + communityName +" courted by " + userName };
};
var getCourties = async function(userName, communityName) {
    if(communityName == undefined) throw 'Community name is not defined';
    let p = await userProfile(userName);
    if(!p.OwnedCommunities.includes(communityName) && !p.RefereeCommunities.includes(communityName)) throw "User " + userName + " doesn't own or referee the community " + communityName;
    let invitesData = await documentClient.query({ 
        KeyConditionExpression: "CommunityName = :communityName",
        ExpressionAttributeValues: { ":communityName": communityName },
        TableName : process.env.InvitesTableName }).promise();
    return invitesData.Items;
};
var rejectCourt = async function(userName, communityName) {
    if(!communityName) throw { error: 'Community name is not defined' };
    await documentClient.delete({ 
        Key: {"CommunityName": communityName, "UserName": userName},
        TableName : process.env.InvitesTableName }).promise();
    return { message: "Ok" };
};
var rejectJoin = async function(userName, communityName, courtName) {
    if(!communityName) throw { error: 'Community name is not defined' };
    let p = await userProfile(userName);
    if(!p.OwnedCommunities.includes(communityName) && !p.RefereeCommunities.includes(communityName))
        throw "User " + userName + " doesn't own or referee the community " + communityName;
    await documentClient.delete({ 
        Key: {"CommunityName": communityName, "UserName": courtName},
        TableName : process.env.InvitesTableName }).promise();
    return { message: "Ok" };
};
var newCommunity = async function(userName, communityName, regionName, cityName) {
  	if(!communityName) throw 'Community name is not defined';
  	if(communityName.length < 3) throw 'Community name should be more than 3 characters';
  	if(communityName.length > 20) throw 'Community name should be less than 20 characters';
  	if(!cityName) throw 'City is not defined';
   	if(cityName.length > 20) throw 'City name should be less than 20 characters';
  	if(!flags.includes(regionName)) throw 'Region is undefined or is not in list of acceptable regions "' + regionName + '"';
    var communityData = await documentClient.get({ Key: { "Name" : communityName }, TableName : process.env.CommunitiesTableName }).promise();
  	if(communityData.Item) throw "The community '" + communityName + "' already exists";
  	let p = await userProfile(userName);
  	if(p.OwnedCommunities.length > 0) throw 'User already owns the community ' + p.OwnedCommunities[0];
    p.OwnedCommunities.push(communityName);
    await updateProfile(p);
  	await documentClient.put({ Item : { "Name" : communityName, "Region" : regionName, "City" : cityName, "Owner" : userName, "Created": new Date().toISOString() }, TableName : process.env.CommunitiesTableName }).promise();
    await documentClient.put({ Item : { "CommunityName" : communityName, "UserName" : userName, "Rating" : 1600 }, TableName : process.env.CommunityRatingTableName }).promise();
    return { message: "Community created" };
};
var joinCommunity = async function(userName, communityName, courtName) {
    if(!communityName) throw 'Community name is not defined';
    let p = await userProfile(userName);
    if(!p.OwnedCommunities.includes(communityName) && !p.RefereeCommunities.includes(communityName))
        throw "User " + userName + " doesn't own or referee the community " + communityName;
    let invitesData = await documentClient.query({ 
        KeyConditionExpression: "CommunityName = :communityName and UserName = :userName",
        ExpressionAttributeValues: { ":communityName": communityName, ":userName": courtName },
        TableName : process.env.InvitesTableName }).promise();
    if(invitesData.Items.length < 1)
        throw "User " + courtName + " doesn't court the community " + communityName;
    await documentClient.delete({ 
        Key: {"CommunityName": communityName, "UserName": courtName},
        TableName : process.env.InvitesTableName }).promise();
    let courtP = await userProfile(courtName);
    if(courtP.OwnedCommunities.includes(communityName) || courtP.RefereeCommunities.includes(communityName))
        throw "User " + courtName + " already owns or joined the community " + communityName;
    courtP.JoinedCommunities.push(communityName);
    await updateProfile(courtP);
    await documentClient.put({ Item : { "CommunityName" : communityName, "UserName" : courtName, "Rating" : 1600 }, TableName : process.env.CommunityRatingTableName }).promise();
    return { message: "Ok" };
};
var mergeStats = function(player, baseStats, stats) {
    baseStats.LastUpdate = new Date().toISOString();
    if(!baseStats.t60) baseStats.t60 = 0;
    baseStats.t60 += stats["60+"][player];
    
    if(!baseStats.t100) baseStats.t100 = 0;
    baseStats.t100 += stats["100+"][player];
    
    if(!baseStats.t140) baseStats.t140 = 0;
    baseStats.t140 += stats["140+"][player];
    
    if(!baseStats.t180) baseStats.t180 = 0;
    baseStats.t180 += stats["180"][player];
   
    if(!baseStats.HC) baseStats.HC = 0;
    baseStats.HC = Math.max(baseStats.HC, stats["HC"][player]);
    
    if(!baseStats.BestLeg || baseStats.BestLeg < 9) baseStats.BestLeg = 10000;
    if(stats.Best[player] > 8 && stats["Best"][player] > 8) baseStats.BestLeg = Math.min(baseStats.BestLeg, stats["Best"][player]);
    if(baseStats.BestLeg > 9999) baseStats.BestLeg = 0;
    
    if(!baseStats.LWAT) baseStats.LWAT = 0;
    baseStats.LWAT += stats["LWAT"][player];
    
    if(!baseStats.WonLegs) baseStats.WonLegs = 0;
    baseStats.WonLegs += stats["WonLegs"][player];
    
    if(!baseStats.WonSets) baseStats.WonSets = 0;
    baseStats.WonSets += stats["WonSets"][player];
    
    if(!baseStats.WonGames) baseStats.WonGames = 0;
    baseStats.WonGames += stats["WonGames"][player];
    
    if(!baseStats.LooseGames) baseStats.LooseGames = 0;
    baseStats.LooseGames += stats["LooseGames"][player];
    
    if(!baseStats.DrawGames) baseStats.DrawGames = 0;
    baseStats.DrawGames += stats["DrawGames"][player];  
    
    if(!baseStats.DoubleThrows) baseStats.DoubleThrows = 0;
    baseStats.DoubleThrows += stats["DoubleThrows"][player]; 
    
    if(!baseStats.DoubleSuccess) baseStats.DoubleSuccess = 0;
    baseStats.DoubleSuccess += stats["DoubleSuccess"][player]; 
    
    if(!baseStats.ThrowCount) baseStats.ThrowCount = 0;
    baseStats.ThrowCount += stats["ThrowCount"][player]; 
    
    if(!baseStats.ThrowTotal) baseStats.ThrowTotal = 0;
    baseStats.ThrowTotal += stats["ThrowTotal"][player]; 
};
var deleteStats = function(player, baseStats, stats) {
    baseStats.LastUpdate = new Date().toISOString();
    if(baseStats.t60) baseStats.t60 -= stats["60+"][player];
    if(baseStats.t60 < 0) baseStats.t60 = 0;
    if(baseStats.t100) baseStats.t100 -= stats["100+"][player];
    if(baseStats.t100 < 0) baseStats.t100 = 0;
    if(baseStats.t140) baseStats.t140 -= stats["140+"][player];
    if(baseStats.t140 < 0) baseStats.t140 = 0;
    if(baseStats.t180) baseStats.t180 -= stats["180"][player];
    if(baseStats.t180 < 0) baseStats.t180 = 0;
    if(baseStats.HC && baseStats.HC <= stats["HC"][player]) baseStats.HC = 0;
    if(baseStats.BestLeg && baseStats.BestLeg >= stats["Best"][player]) baseStats.BestLeg = 0;
    if(baseStats.LWAT) baseStats.LWAT -= stats["LWAT"][player];
    if(baseStats.LWAT < 0) baseStats.LWAT = 0;
    if(baseStats.WonLegs) baseStats.WonLegs -= stats["WonLegs"][player];
    if(baseStats.WonLegs < 0) baseStats.WonLegs = 0;
    if(baseStats.WonSets) baseStats.WonSets -= stats["WonSets"][player];
    if(baseStats.WonSets < 0) baseStats.WonSets = 0;
    if(baseStats.WonGames) baseStats.WonGames -= stats["WonGames"][player];
    if(baseStats.WonGames < 0) baseStats.WonGames = 0;
    if(baseStats.LooseGames) baseStats.LooseGames -= stats["LooseGames"][player];
    if(baseStats.LooseGames < 0) baseStats.LooseGames = 0;
    if(baseStats.DrawGames) baseStats.DrawGames -= stats["DrawGames"][player];
    if(baseStats.DrawGames < 0) baseStats.DrawGames = 0;
    if(baseStats.DoubleThrows) baseStats.DoubleThrows -= stats["DoubleThrows"][player]; 
    if(baseStats.DoubleThrows < 0) baseStats.DoubleThrows = 0;
    if(baseStats.DoubleSuccess) baseStats.DoubleSuccess -= stats["DoubleSuccess"][player]; 
    if(baseStats.DoubleSuccess < 0) baseStats.DoubleSuccess = 0;
    if(baseStats.ThrowCount) baseStats.ThrowCount -= stats["ThrowCount"][player]; 
    if(baseStats.ThrowCount < 0) baseStats.ThrowCount = 0;
    if(baseStats.ThrowTotal) baseStats.ThrowTotal -= stats["ThrowTotal"][player]; 
    if(baseStats.ThrowTotal < 0) baseStats.ThrowTotal = 0;

};
var mergeGroupStats = function(baseStats, stats, gameData) {
    baseStats.LastUpdate = new Date().toISOString();
    if(!baseStats.t60) baseStats.t60 = 0;
    baseStats.t60 += stats["60+"].player1 + stats["60+"].player2;

    if(!baseStats.t100) baseStats.t100 = 0;
    baseStats.t100 += stats["100+"].player1 + stats["100+"].player2;
    if(!baseStats.t140) baseStats.t140 = 0;
    baseStats.t140 += stats["140+"].player1 + stats["140+"].player2;
    if(!baseStats.t180) baseStats.t180 = 0;
    baseStats.t180 += stats["180"].player1 + stats["180"].player2;
    if(!baseStats.HC) baseStats.HC = 0;
    if(stats.HC.player1 > baseStats.HC) {
        baseStats.HC = stats.HC.player1;
        baseStats.HCPlayer = gameData.player1;
    }
    if(stats.HC.player2 > baseStats.HC) {
        baseStats.HC = stats.HC.player2;
        baseStats.HCPlayer = gameData.player2;
    }
    if(!baseStats.BestLeg || baseStats.BestLeg < 9) baseStats.BestLeg = 10000;
    if(stats.Best.player1 > 8 && stats.Best.player1 < baseStats.BestLeg) {
        baseStats.BestLeg = stats.Best.player1;
        baseStats.BestLegPlayer = gameData.player1;
    }
    if(stats.Best.player2 > 8 && stats.Best.player2 < baseStats.BestLeg) {
        baseStats.BestLeg = stats.Best.player2;
        baseStats.BestLegPlayer = gameData.player2;
    }
    if(baseStats.BestLeg > 9999) baseStats.BestLeg = 0;
    if(!baseStats.ThrowCount) baseStats.ThrowCount = 0;
    baseStats.ThrowCount += stats["ThrowCount"].player1 + stats["ThrowCount"].player2;  
    if(!baseStats.ThrowTotal) baseStats.ThrowTotal = 0;
    baseStats.ThrowTotal += stats["ThrowTotal"].player1 + stats["ThrowTotal"].player2; 
    return "Ok";
};
var deleteGroupStats = function(baseStats, stats, gameData) {
    baseStats.LastUpdate = new Date().toISOString();
    if(baseStats.t60) baseStats.t60 -= stats["60+"].player1 + stats["60+"].player2;
    if(baseStats.t60 < 0) baseStats.t60 = 0;
    if(baseStats.t100) baseStats.t100 -= stats["100+"].player1 + stats["100+"].player2;
    if(baseStats.t100 < 0) baseStats.t100 = 0;
    if(baseStats.t140) baseStats.t140 -= stats["140+"].player1 + stats["140+"].player2;
    if(baseStats.t140 < 0) baseStats.t140 = 0;
    if(baseStats.t180) baseStats.t180 -= stats["180"].player1 + stats["180"].player2;
    if(baseStats.t180 < 0) baseStats.t180 = 0;
    if(baseStats.HC && (stats.HC.player1 >= baseStats.HC || stats.HC.player2 >= baseStats.HC)) {
        baseStats.HC = 0;
        baseStats.HCPlayer = undefined;
    }
    if(baseStats.BestLeg && (stats.Best.player1 <= baseStats.BestLeg || stats.Best.player2 <= baseStats.BestLeg)) {
        baseStats.BestLeg = 0;
        baseStats.BestLegPlayer = undefined;
    }
    if(baseStats.ThrowCount) baseStats.ThrowCount -= stats["ThrowCount"].player1 + stats["ThrowCount"].player2;  
    if(baseStats.ThrowCount < 0) baseStats.ThrowCount = 0;
    if(baseStats.ThrowTotal) baseStats.ThrowTotal -= stats["ThrowTotal"].player1 + stats["ThrowTotal"].player2; 
    if(baseStats.ThrowTotal < 0) baseStats.ThrowTotal = 0;
    return "Ok";
};
var eloChange = (points, ratinga, ratingb) => {
    return 16 * (points - 1.0 / (1.0 + Math.pow(10, (ratingb - ratinga) / 400.0)));
};
var updateCommunityRating = async function(communityName, gameData, stats) {
    let fp = (await documentClient.get({ Key: { "CommunityName" : communityName, "UserName" : gameData.player1 }, TableName : process.env.CommunityRatingTableName }).promise()).Item; 
    if(!fp) fp = {"CommunityName" : communityName, "UserName" : gameData.player1, "Rating" : 1600};
    let sp = (await documentClient.get({ Key: { "CommunityName" : communityName, "UserName" : gameData.player2 }, TableName : process.env.CommunityRatingTableName }).promise()).Item; 
    if(!sp) sp = {"CommunityName" : communityName, "UserName" : gameData.player2, "Rating" : 1600};
    if(!fp.Rating) fp.Rating = 1600;
    if(!sp.Rating) sp.Rating = 1600;
    let e = eloChange(stats.WonGames.player1 + stats.DrawGames.player1 * 0.5, fp.Rating, sp.Rating);
    fp.Rating += e;
    sp.Rating -= e;
    mergeStats("player1", fp, stats);
    mergeStats("player2", sp, stats);
    await documentClient.put({ Item : fp, TableName : process.env.CommunityRatingTableName }).promise();
    await documentClient.put({ Item : sp, TableName : process.env.CommunityRatingTableName }).promise();
    return  { FirstPlayerRating: fp.Rating, SecondPlayerRating: sp.Rating, RatingChange: e };
};
var updateCommunityStats = async function(communityName, gameData, stats) {
    let baseStats = (await documentClient.get({ Key: { "Name" : communityName }, TableName : process.env.CommunitiesTableName }).promise()).Item; 
    mergeGroupStats(baseStats, stats, gameData);
    await documentClient.put({ Item : baseStats, TableName : process.env.CommunitiesTableName }).promise();
};
var updateEventStats = async function(communityName, eventName, gameData, stats) {
    let baseStats = (await documentClient.scan({ 
        FilterExpression: "CommunityName = :communityName and EventName = :eventName",
        ExpressionAttributeValues: { ":communityName": communityName, ":eventName": eventName },
        TableName : process.env.GameEventsTableName }).promise()).Items[0]; 
    mergeGroupStats(baseStats, stats, gameData);
    await documentClient.put({ Item : baseStats, TableName : process.env.GameEventsTableName }).promise();
    return "Ok";
};
var updateRegionRating = async function(region, gameData, stats) {
    let fp = (await documentClient.get({ Key: { "Region" : region, "UserName" : gameData.player1 }, TableName : process.env.RegionRatingTableName }).promise()).Item; 
    if(!fp) fp = {"Region" : region, "UserName" : gameData.player1, "Rating" : 1600};
    let sp = (await documentClient.get({ Key: { "Region" : region, "UserName" : gameData.player2 }, TableName : process.env.RegionRatingTableName }).promise()).Item; 
    if(!sp) sp = {"Region" : region, "UserName" : gameData.player2, "Rating" : 1600};
    if(!fp.Rating) fp.Rating = 1600;
    if(!sp.Rating) sp.Rating = 1600;
    let e = eloChange(stats.WonGames.player1 + stats.DrawGames.player1 * 0.5, fp.Rating, sp.Rating);
    fp.Rating += e;
    sp.Rating -= e;
    mergeStats("player1", fp, stats);
    mergeStats("player2", sp, stats);
    await documentClient.put({ Item : fp, TableName : process.env.RegionRatingTableName }).promise();
    await documentClient.put({ Item : sp, TableName : process.env.RegionRatingTableName }).promise();
    return  { FirstPlayerRating: fp.Rating, SecondPlayerRating: sp.Rating, RatingChange: e };
};
var updateWorldRating = async function(gameData, stats) {
    let fp = (await documentClient.get({ Key: { "UserName" : gameData.player1 }, TableName : process.env.WorldRatingTableName }).promise()).Item; 
    if(!fp) fp = {"UserName" : gameData.player1, "Rating" : 1600};
    let sp = (await documentClient.get({ Key: { "UserName" : gameData.player2 }, TableName : process.env.WorldRatingTableName }).promise()).Item; 
    if(!sp) sp = {"UserName" : gameData.player2, "Rating" : 1600};
    if(!fp.Rating) fp.Rating = 1600;
    if(!sp.Rating) sp.Rating = 1600;
    let e = eloChange(stats.WonGames.player1 + stats.DrawGames.player1 * 0.5, fp.Rating, sp.Rating);
    fp.Rating += e;
    sp.Rating -= e;
    mergeStats("player1", fp, stats);
    mergeStats("player2", sp, stats);
    await documentClient.put({ Item : fp, TableName : process.env.WorldRatingTableName }).promise();
    await documentClient.put({ Item : sp, TableName : process.env.WorldRatingTableName }).promise();
    return  { FirstPlayerRating: fp.Rating, SecondPlayerRating: sp.Rating, RatingChange: e };
};
var getWeekNumber = function(cd) {
    var d = new Date(Date.UTC(cd.getFullYear(), cd.getMonth(), cd.getDate()));
    var dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    var yearStart = new Date(Date.UTC(d.getUTCFullYear(),0,1));
    return Math.ceil((((d - yearStart) / 86400000) + 1)/7);
};
var updateWeeklyRating = async function(communityName, gameData, stats, cr, rr, wr) {
    var cd = new Date(gameData.timeStamp);
    let week = cd.getFullYear() + '_' + getWeekNumber(cd);
    let fp = (await documentClient.get({ Key: { "UserName" : gameData.player1, "Week": week }, TableName : process.env.UserWeeklyRatingTableName }).promise()).Item; 
    if(!fp) fp = {"UserName" : gameData.player1, "Week": week};
    fp["Community" + communityName + "Rating"] = cr.FirstPlayerRating;
    fp.RegionRating = rr.FirstPlayerRating;
    fp.WorldRating = wr.FirstPlayerRating;
    let sp = (await documentClient.get({ Key: { "UserName" : gameData.player2, "Week": week }, TableName : process.env.UserWeeklyRatingTableName }).promise()).Item; 
    if(!sp) sp = {"UserName" : gameData.player2, "Week": week};
    sp["Community" + communityName + "Rating"] = cr.SecondPlayerRating;
    sp.RegionRating = rr.SecondPlayerRating;
    sp.WorldRating = wr.SecondPlayerRating;
    mergeStats("player1", fp, stats);
    mergeStats("player2", sp, stats);
    await documentClient.put({ Item : fp, TableName : process.env.UserWeeklyRatingTableName }).promise();
    await documentClient.put({ Item : sp, TableName : process.env.UserWeeklyRatingTableName }).promise();
    return "Ok";
};
var getEvent = async function(userName, communityName, eventName) {
    let wr = await documentClient.query({ 
        KeyConditionExpression: "CommunityEvent = :communityEvent",
        ExpressionAttributeValues: { ":communityEvent": communityName + '_' + eventName }, 
        TableName : process.env.GamesTableName }).promise();
    return wr.Items;
};
var deleteEvent = async function(userName, communityName, eventName) {
    let community = await getCommunity(communityName);
    if(community.Owner != userName && !community.Referees.includes(userName))
        throw 'User '+userName+' is not able to change community ' + communityName;
    let event = await getEvent(userName, communityName, eventName);
    if(event.length > 0)
        throw 'Only empty event can be deleted';
    let e = community.Events.find(r => r.EventName == eventName);
    if(!e)
        throw 'Event '+eventName+' is not found in community ' + communityName;
    await documentClient.delete({ 
        Key: {"CommunityName": communityName, "CreationDate": e.CreationDate},
        TableName : process.env.GameEventsTableName }).promise();
    return "Deleted";
};
var deleteCommunity = async function(userName, communityName) {
    let community = await getCommunity(communityName);
    if(community.Owner != userName)
        throw 'User '+userName+' is not owner of the community ' + communityName;
    if(community.Events.length > 0)
        throw 'Delete all events and games before';
    if(community.Referees.length > 0)
        throw 'Delete all referees before';
    for(let i = 0; i < community.Rating.length; i++) {
        let u = community.Rating[i];
        await documentClient.delete({ 
                Key: {"CommunityName": communityName, "UserName": u.UserName},
                TableName : process.env.CommunityRatingTableName }).promise();
        let user = await userProfile(u.UserName);
        if(user.JoinedCommunities.length > 0)
            user.JoinedCommunities = user.JoinedCommunities.filter(c => c != communityName);
        if(user.OwnedCommunities.length > 0)
            user.OwnedCommunities = user.OwnedCommunities.filter(c => c != communityName);
        await updateProfile(user);
    }
    await documentClient.delete({ 
        Key: {"Name": communityName},
        TableName : process.env.CommunitiesTableName }).promise();
    return "Deleted";
};
var deleteCommunityStats = async function(communityName, player, pn,  stats) {
    let fp = (await documentClient.get({ Key: { "CommunityName" : communityName, "UserName" : player }, TableName : process.env.CommunityRatingTableName }).promise()).Item; 
    if(fp) {
        deleteStats("player" + pn, fp, stats);
        await documentClient.put({ Item : fp, TableName : process.env.CommunityRatingTableName }).promise();
    }
};
var deleteRegionStats = async function(region, player, pn,  stats) {
    let fp = (await documentClient.get({ Key: { "Region" : region, "UserName" : player }, TableName : process.env.RegionRatingTableName }).promise()).Item; 
    if(fp) {
        deleteStats("player" + pn, fp, stats);
        await documentClient.put({ Item : fp, TableName : process.env.RegionRatingTableName }).promise();
    }
};
var deleteWorldStats = async function(player, pn,  stats) {
    let fp = (await documentClient.get({ Key: { "UserName" : player }, TableName : process.env.WorldRatingTableName }).promise()).Item; 
    if(fp) {
        deleteStats("player" + pn, fp, stats);
        await documentClient.put({ Item : fp, TableName : process.env.WorldRatingTableName }).promise();
    }
};
var deleteWeeklyStats = async function(gameData, player, pn,  stats) {
    var cd = new Date(gameData.timeStamp);
    let week = cd.getFullYear() + '_' + getWeekNumber(cd);
    let fp = (await documentClient.get({ Key: { "UserName" : player, "Week" : week }, TableName : process.env.UserWeeklyRatingTableName }).promise()).Item; 
    if(fp) {
        deleteStats("player" + pn, fp, stats);
        await documentClient.put({ Item : fp, TableName : process.env.UserWeeklyRatingTableName }).promise();
    }
};
var deleteCommunityGroupStats = async function(communityName, gameData, stats) {
    let baseStats = (await documentClient.get({ Key: { "Name" : communityName }, TableName : process.env.CommunitiesTableName }).promise()).Item; 
    deleteGroupStats(baseStats, stats, gameData);
    await documentClient.put({ Item : baseStats, TableName : process.env.CommunitiesTableName }).promise();
};
var deleteEventStats = async function(communityName, eventName, gameData, stats) {
    let baseStats = (await documentClient.scan({ 
        FilterExpression: "CommunityName = :communityName and EventName = :eventName",
        ExpressionAttributeValues: { ":communityName": communityName, ":eventName": eventName },
        TableName : process.env.GameEventsTableName }).promise()).Items[0]; 
    deleteGroupStats(baseStats, stats, gameData);
    await documentClient.put({ Item : baseStats, TableName : process.env.GameEventsTableName }).promise();
    return "Ok";
};
var deleteGame = async function(userName, communityName, eventName, refereeTimestamp) {
    let community = await getCommunity(communityName);
    if(community.Owner != userName)
        throw 'User '+userName+' is not owner of the community ' + communityName;
    let gameData = (await documentClient.get({ Key: { "CommunityEvent" : communityName + '_' + eventName, "RefereeTimestamp" : refereeTimestamp }, TableName : process.env.GamesTableName }).promise()).Item;
    let stats = Game501.Verify(gameData);
    await deleteCommunityStats(communityName, gameData.player1, 1, stats);
    await deleteCommunityStats(communityName, gameData.player2, 2, stats);
    await deleteRegionStats(community.Region, gameData.player1, 1, stats);
    await deleteRegionStats(community.Region, gameData.player2, 2, stats);
    await deleteWorldStats(gameData.player1, 1, stats);
    await deleteWorldStats(gameData.player2, 2, stats);
    await deleteWeeklyStats(gameData, gameData.player1, 1, stats);
    await deleteWeeklyStats(gameData, gameData.player2, 2, stats);
    await deleteCommunityGroupStats(communityName, gameData, stats);
    await deleteEventStats(communityName, eventName, gameData, stats);
    await documentClient.delete({ Key: { "CommunityEvent" : communityName + '_' + eventName, "RefereeTimestamp" : refereeTimestamp }, TableName : process.env.GamesTableName }).promise();
    return "Deleted";
};
var storeGame = async function(userName, communityName, region, eventName, gameData, stats) {
    await documentClient.put({ Item : { 
        "CommunityEvent" : communityName + '_' + eventName, 
        "RefereeTimestamp" : gameData.timeStamp + '_' + userName,
        "FirstPlayer" : gameData.player1,
        "SecondPlayer" : gameData.player2,
        "Opened": gameData.timeStamp,
        "Published": new Date().toISOString(),
		"EventName": gameData.eventName,
		"SetLength": gameData.setLength,
		"LegLength": gameData.legLength,
		"GameLength": gameData.gameLength,
		"GameType": gameData.gameType,
		"NoStartSwap": gameData.noStartSwap,
		"Game": JSON.stringify(gameData.game)
    },
    ConditionExpression: 'attribute_not_exists(CommunityEvent) AND attribute_not_exists(RefereeTimestamp)',
    TableName : process.env.GamesTableName }).promise();
    let cr = await updateCommunityRating(communityName, gameData, stats);
    let rr = await updateRegionRating(region, gameData, stats);
    let wr = await updateWorldRating(gameData, stats);
    await updateWeeklyRating(communityName, gameData, stats, cr, rr, wr);
    await updateCommunityStats(communityName, gameData, stats);
    await updateEventStats(communityName, eventName, gameData, stats);
    return { CommunityRating: cr, RegionRating: rr, WorldRating: wr };
};
var gameFinished = async function(userName, communityName, region, eventName, gameData) {
    if(!communityName) throw 'Community name is not defined';
    if(!eventName) throw 'Event name is not defined';
    if(!gameData.player1) throw 'First player name is not defined';
    if(!gameData.player2) throw 'Second player name is not defined';
    if(!gameData) throw 'Game data is not defined';
    let community = await getCommunity(communityName);
    if(!community) throw { error: 'Community is not found' };
    if(!community.Rating.find( r=>r.UserName == userName))
        throw 'User '+userName+' is not found in community ' + communityName;
    if(!community.Events.find( r=>r.EventName == eventName && r.Active))
        throw 'Event '+eventName+' is not found in community ' + communityName;
    if(!community.Rating.find( r=>r.UserName == gameData.player1))
        throw 'User '+gameData.player1+' is not found in community ' + communityName;
    if(!community.Rating.find( r=>r.UserName == gameData.player2))
        throw 'User '+gameData.player2+' is not found in community ' + communityName;
    if(gameData.player1 == gameData.player2)
        throw 'Players should be different';
    let stats = Game501.Verify(gameData);
    let res = await storeGame(userName, communityName, region, eventName, gameData, stats);
    
    return { message: "Ok", value: res };
};
exports.newCommunity = async function(event, context) {
    try {
    	let action = event['body-json'].action;
    	let userName = event.context.cognitoUser;
    	let communityName = event['body-json'].name;
      	if(userName == undefined) throw 'User is not defined';
  		switch(action) {
  		    case 'getCommunity':
      	        return JSON.stringify(await getCommunity(communityName));
  		    case 'getCommunities':
      	        return JSON.stringify(await getCommunities());
      	    case 'userProfile':
      	        return JSON.stringify(await userProfile(userName));
      	    case 'courtCommunity':
      	        return JSON.stringify(await courtCommunity(userName, communityName));
      	    case 'getCourties':
      	        return JSON.stringify(await getCourties(userName, communityName));
      	    case 'newCommunity':
      	        return JSON.stringify(await newCommunity(userName, communityName, event['body-json'].region, event['body-json'].city));
      	    case 'joinCommunity':
      	        return JSON.stringify(await joinCommunity(userName, communityName, event['body-json'].courtName));
      	    case 'rejectJoin':
      	        return JSON.stringify(await rejectJoin(userName, communityName, event['body-json'].courtName));
      	    case 'rejectCourt':
      	        return JSON.stringify(await rejectCourt(userName, communityName));
      	    case 'changePlayerStatus':
      	        return JSON.stringify(await changePlayerStatus(userName, communityName, event['body-json'].playerName, event['body-json'].status));       
            case 'newCommunityEvent':
                return JSON.stringify(await newCommunityEvent(userName, communityName, event['body-json'].eventName));
            case 'activateCommunityEvent':
                return JSON.stringify(await activateCommunityEvent(userName, communityName, event['body-json'].eventName, event['body-json'].active));
            case 'gameFinished':
                return JSON.stringify(await gameFinished(userName, communityName, event['body-json'].region, event['body-json'].eventName, JSON.parse(event['body-json'].gameData)));
            case "getEvent":
                return JSON.stringify(await getEvent(userName, communityName, event['body-json'].eventName));
            case "deleteEvent":
                return JSON.stringify(await deleteEvent(userName, communityName, event['body-json'].eventName));
            case "deleteCommunity":
                return JSON.stringify(await deleteCommunity(userName, communityName));
            case "deleteGame":
                return JSON.stringify(await deleteGame(userName, communityName, event['body-json'].eventName,  event['body-json'].refereeTimestamp));
            default:
      	        return JSON.stringify({ action: action, message: 'Command not recognized' });
  		}
    } catch (e) {
 	    return JSON.stringify({ error: e, message: 'Something goes wrong' });
    }
};