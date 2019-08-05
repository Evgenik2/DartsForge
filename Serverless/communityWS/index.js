var AWS = require('aws-sdk'),
    documentClient = new AWS.DynamoDB.DocumentClient(); 
require('./patch.js');
let getApigwManagementApi = function(event) {
    return new AWS.ApiGatewayManagementApi({
        apiVersion: '2018-11-29',
        endpoint: event.requestContext.domainName + '/' + event.requestContext.stage
    });
};
let collectConnections = async function(community) {
    return await documentClient.query({ 
        KeyConditionExpression: "community = :communityName",
        ExpressionAttributeValues: { ":communityName": community }, 
        TableName: 'ConnectionTable',
    }).promise();
};
let sendUser = async function(event, community, message) {
    try {
        let connections = await documentClient.scan({ 
            FilterExpression: "userName = :userName",
            ExpressionAttributeValues: { ":userName": message.userName }, 
            TableName: 'ConnectionTable',
        }).promise();
        let apigwManagementApi = getApigwManagementApi(event);
        message.count = connections.Items.length;
        await Promise.all(connections.Items.map(async function(connection) {
            try {
                await apigwManagementApi.postToConnection({ ConnectionId: connection.connectionId, Data: JSON.stringify(message) }).promise();
            } catch (e) {
                if (e.statusCode === 410) {
                    await documentClient.delete({
                        TableName: 'ConnectionTable',
                        Key: { community: community, connectionId : connection.connectionId }
                    }).promise();
                } else {
                    throw e;
                }
            }
        }));
        return {};
    } catch (e) {
        return { statusCode: 500, body: e.stack };
    }  
};
let send = async function(event, community, message) {
    try {
        let connections = await collectConnections(community);
        let apigwManagementApi = getApigwManagementApi(event);
        message.count = connections.Items.length;
        await Promise.all(connections.Items.map(async function(connection) {
            try {
                //if(connection.connectionId != event.requestContext.connectionId)
                    await apigwManagementApi.postToConnection({ ConnectionId: connection.connectionId, Data: JSON.stringify(message) }).promise();
            } catch (e) {
                if (e.statusCode === 410) {
                    await documentClient.delete({
                        TableName: 'ConnectionTable',
                        Key: { community: community, connectionId : connection.connectionId }
                    }).promise();
                } else {
                    throw e;
                }
            }
        }));
        return {};
    } catch (e) {
        return { statusCode: 500, body: e.stack };
    }  
};
module.exports.handler = async function(event, context) {
    if (event.requestContext.eventType === "CONNECT") {
//        await documentClient.put({
//            TableName: 'ConnectionTable',
//            Item: { connectionId : event.requestContext.connectionId }
//        }).promise();
        return { statusCode: 200 };
    } else if (event.requestContext.eventType === "DISCONNECT") {
        let body = JSON.parse(event.body);
        await documentClient.delete({
            TableName: 'ConnectionTable',
            Key: { community: body.community, connectionId : event.requestContext.connectionId }
        }).promise();
        return { statusCode: 200 };
    } else {
        let body = JSON.parse(event.body);
        let message = body.message;
        let action = body.action;
        let community = body.community;
//                await documentClient.put({
//                    TableName: 'Logs',
//                    Item: { timestamp: "" + Math.floor(Date.now() / 1000), action: action, TTL: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7 }
//                }).promise();
        switch(action) {
            case "join":
                let i = { connectionId : event.requestContext.connectionId, community: community, TTL: Math.floor(Date.now() / 1000) + 60 * 60 * 8 };
                if(body.userName)
                    i.userName = body.userName;
                if(body.target)
                    i.target = body.target;
                await documentClient.put({
                    TableName: 'ConnectionTable',
                    Item: i
                }).promise();
  
              //  try {
                let gip = await documentClient.query({
                    TableName: 'GIP',
                    KeyConditionExpression: "Community = :community",
                    ExpressionAttributeValues: { ":community": community },
                    Key: { Community: community }
                }).promise();
                if(gip.Items && gip.Items.length > 0) {
                    let apigwManagementApi = getApigwManagementApi(event);
                    for(const i of gip.Items) {
                        await apigwManagementApi.postToConnection({ ConnectionId: event.requestContext.connectionId, Data: JSON.stringify({
                            action: "gipUpdate",
                            community: community,
                            userName: body.userName,
        					game: JSON.parse(i.Game) 
                        }) }).promise();
       
                    }
                }
                if(body.target)
                    await send(event, community, {
                        action: "target",
                        community: community,
    					target: body.target 
                    }); 
                break;
            case "courtCommunity":
                return await send(event, community, {
                    action: action,
                    community: community,
					userName: body.userName 
                });  
            case "acceptJoin":
            case "rejectJoin":
                await sendUser(event, community, {
                    action: action,
                    community: community,
					userName: body.courtName 
                }); 
                return await send(event, community, {
                    action: action,
                    community: community,
					userName: body.courtName 
                }); 
            case "rejectCourt":
                return await send(event, community, {
                    action: action,
                    community: community,
					userName: body.courtName 
                });
            case "deleteEvent":
            case "newCommunityEvent":
                return await send(event, community, {
                    action: action,
                    community: community,
					eventName: body.eventName,
					userName: body.userName 
                });
            case "gipUpdate":
                await documentClient.put({
                    TableName: 'GIP',
                    Item: { Community : community, RefereeTimestamp: body.game.refereeTimestamp, Game: JSON.stringify(body.game), TTL: Math.floor(Date.now() / 1000) + 60 * 15 }
                }).promise();
                return await send(event, community, {
                    action: action,
                    community: community,
					game: body.game 
                });
            case "gipFinished":
                await documentClient.delete({
                    TableName: 'GIP',
                    Key: { Community: community, RefereeTimestamp: body.refereeTimestamp }
                }).promise();
                return await send(event, community, {
                    action: action,
                    community: community,
					refereeTimestamp: body.refereeTimestamp 
                });

            default:
                return await send(event, community, message);
        }
        return {};
    }
};
