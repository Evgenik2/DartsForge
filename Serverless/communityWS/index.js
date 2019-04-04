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
let send = async function(event, community, message) {
    try {
        let connections = await collectConnections(community);
        let apigwManagementApi = getApigwManagementApi(event);
        await Promise.all(connections.Items.map(async function(connection) {
            try {
                await apigwManagementApi.postToConnection({ ConnectionId: connection.connectionId, Data: JSON.stringify(message) }).promise();
            } catch (e) {
                if (e.statusCode === 410) {
                    await documentClient.delete({
                        TableName: 'ConnectionTable',
                        Item: { community: community, connectionId : event.requestContext.connectionId }
                    }).promise();
                } else {
                    throw e;
                }
            }
        }));
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
            Item: { community: body.community, connectionId : event.requestContext.connectionId }
        }).promise();
        return { statusCode: 200 };
    } else {
        let body = JSON.parse(event.body);
        let message = body.message;
        let action = body.action;
        let community = body.community;
        switch(action) {
            case "join":
                await documentClient.put({
                    TableName: 'ConnectionTable',
                    Item: { connectionId : event.requestContext.connectionId, community: community, ttl: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7 }
                }).promise();
                break;
            case "newCommunityEvent":
                return await send(event, community, {
                    action: action,
                    community: community,
					eventName: body.eventName,
					userName: body.userName 
                });
            default:
                return await send(event, community, message);
        }
        return {};
    }
};
