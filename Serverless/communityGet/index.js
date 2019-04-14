var AWS = require('aws-sdk'),
    documentClient = new AWS.DynamoDB.DocumentClient(); 

var getCommunities = async function() {
    return (await documentClient.scan({ TableName : "Communities" }).promise()).Items;
};
var communityData = async function(communityName) {
    let community = (await documentClient.get({ Key: { "Name" : communityName }, TableName : "Communities" }).promise()).Item; 
    community.Referees = community.Referees ? community.Referees.values : [];
    return community;
};
var getCommunity = async function(communityName) {
    if(!communityName) throw 'Community name is not defined';
    let community = await communityData(communityName);
    let communityRating = await documentClient.query({ 
        KeyConditionExpression: "CommunityName = :communityName",
        ExpressionAttributeValues: { ":communityName": communityName }, 
        TableName : "CommunityRating" }).promise();
    if(communityRating.Items)
        community.Rating = communityRating.Items.map(e=> {e.IsReferee = community.Referees.includes(e.UserName); e.IsOwner = community.Owner == e.UserName; return e; }).sort((a, b) => a.Rating - b.Rating);
    let communityEvents = await documentClient.query({ 
        KeyConditionExpression: "CommunityName = :communityName",
        ExpressionAttributeValues: { ":communityName": communityName }, 
        TableName : "GameEvents" }).promise();
    if(communityEvents.Items)
        community.Events = communityEvents.Items;
    return community;
};

var getEvent = async function(communityName, eventName) {
    let wr = await documentClient.query({ 
        KeyConditionExpression: "CommunityEvent = :communityEvent",
        ExpressionAttributeValues: { ":communityEvent": communityName + '_' + eventName }, 
        TableName : "Games" }).promise();
    return wr.Items;
};

exports.handler = async function(event, context) {
    try {
        
    	let action;
    	let communityName;
    	let eventName;
        if (event.queryStringParameters && event.queryStringParameters.action)
            action = event.queryStringParameters.action;
        if (event.queryStringParameters && event.queryStringParameters.communityName)
            communityName = event.queryStringParameters.communityName; 
        if (event.queryStringParameters && event.queryStringParameters.eventName)
            eventName = event.queryStringParameters.eventName;
        
  		switch(action) {
  		    case 'getCommunity':
      	        return {statusCode: 200, headers: {"Access-Control-Allow-Origin": "*"}, body: JSON.stringify(await getCommunity(communityName))};
  		    case 'getCommunities':
      	        return {statusCode: 200, headers: {"Access-Control-Allow-Origin": "*"}, body: JSON.stringify(await getCommunities())};
            case "getEvent":
                return {statusCode: 200, headers: {"Access-Control-Allow-Origin": "*"}, body: JSON.stringify(await getEvent(communityName, eventName))};
            default:
      	        return {statusCode: 200, headers: {"Access-Control-Allow-Origin": "*"}, body: JSON.stringify({ action: action, message: 'Command not recognized' })};
  		}
    } catch (e) {
 	    return {statusCode: 200 ,headers: {"Access-Control-Allow-Origin": "*"}, body: JSON.stringify({ error: e, message: 'Something goes wrong' })};
    }
};