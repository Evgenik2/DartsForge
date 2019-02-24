
var {verify} = require('./verifyToken');

var AWS = require('aws-sdk'),
documentClient = new AWS.DynamoDB.DocumentClient(); 

exports.newCommunity = function(event, context, callback) {
	verify(event.AuthorizationToken).then(function(user) {
		if(!user.authenticated) {
		  	callback(null, { error: "Unauthorized" });
		} else {
  		documentClient.get({ Key: { "Name" : event.name }, TableName : process.env.CommunitiesTableName }, function(err, data) {
  			if(err != undefined || data.Item == undefined) {
  				var params = {
  					Item : {
  						"Name" : event.name,
  						"Region" : event.region,
  						"City" : event.city,
  						"Owner" : user["cognito:username"]
  					},
  					TableName : process.env.CommunitiesTableName
  				};
  				documentClient.put(params, function(err, data){
  					callback(err, data);
  				});
  	
  			} else {
  				callback(err, {error: "The community exists"});
  			}
  		});
		}
	}, function(err) {
		callback(err, {error: "Unauthorized"});
	});
};