var AWS = require('aws-sdk'),
    flags = [ 'ABKHAZIA', 'AD', 'AE', 'AF', 'AG', 'AI', 'AL', 'AM', 'AN', 'AO', 'AQ', 'AR', 'AS', 'AT', 'AU', 'AW', 'AX', 'AZ', 'BA', 
                    'BB', 'BD', 'BE', 'BF', 'BG', 'BH', 'BI', 'BJ', 'BL', 'BM', 'BN', 'BO', 'BR', 'BS', 'BT', 'BV', 'BW', 'BY', 'BZ', 'CA', 
                    'CC', 'CD', 'CF', 'CG', 'CH', 'CI', 'CK', 'CL', 'CM', 'CN', 'CO', 'CR', 'CU', 'CV', 'CX', 'CY', 'CZ', 'DE', 'DJ', 'DK', 
                    'DM', 'DO', 'DZ', 'EC', 'EE', 'EG', 'EH', 'ER', 'ES-CE', 'ES-ML', 'ES', 'ET', 'EU', 'FI', 'FJ', 'FK', 'FM', 'FO', 'FR', 
                    'GA', 'GB', 'GD', 'GE', 'GF', 'GG', 'GH', 'GI', 'GL', 'GM', 'GN', 'GP', 'GQ', 'GR', 'GS', 'GT', 'GU', 'GW', 'GY', 'HK', 
                    'HM', 'HN', 'HR', 'HT', 'HU', 'IC', 'ID', 'IE', 'IL', 'IM', 'IN', 'IO', 'IQ', 'IR', 'IS', 'IT', 'JE', 'JM', 'JO', 'JP', 
                    'KE', 'KG', 'KH', 'KI', 'KM', 'KN', 'KOSOVO',  'KP', 'KR', 'KW', 'KY', 'KZ', 'LA', 'LB', 'LC', 'LI', 'LK', 'LR', 'LS', 
                    'LT', 'LU', 'LV', 'LY', 'MA', 'MC', 'MD', 'ME', 'MF', 'MG', 'MH', 'MK', 'ML', 'MM', 'MN', 'MO', 'MP', 'MQ', 'MR', 'MS', 
                    'MT', 'MU', 'MV', 'MW', 'MX', 'MY', 'MZ', 'NA', 'NC', 'NE', 'NF', 'NG', 'NI', 'NKR', 'NL', 'NO', 'NP', 'NR', 'NU', 'NZ',
                    'OM', 'PA', 'PE', 'PF', 'PG', 'PH', 'PK', 'PL', 'PM', 'PN', 'PR', 'PS', 'PT', 'PW', 'PY', 'QA', 'RE', 'RO', 'RS', 'RU', 
                    'RW', 'SA', 'SB', 'SC', 'SD', 'SE', 'SG', 'SH', 'SI', 'SJ', 'SK', 'SL', 'SM', 'SN', 'SO', 'SOUTH-OSSETIA', 'SR', 'SS', 
                    'ST', 'SV', 'SY', 'SZ', 'TC', 'TD', 'TF', 'TG', 'TH', 'TJ', 'TK', 'TL', 'TM', 'TN', 'TO', 'TR', 'TT', 'TV', 'TW', 'TZ', 
                    'UA', 'UG', 'UM', 'US', 'UY', 'UZ', 'VA', 'VC', 'VE', 'VG', 'VI', 'VN', 'VU', 'WF', 'WS', 'YE', 'YT', 'ZA', 'ZM', 'ZW'],
    documentClient = new AWS.DynamoDB.DocumentClient(); 

exports.newCommunity = function(event, context, callback) {
	//console.log(event.requestContext.authorizer.claims);
	var action =  event['body-json'].action;
	var userName = event.context.cognitoUser;
	var communityName = event['body-json'].name;
	var userItem = {};
	if(action == 'newCommunity') {
    	var item = {
      					"Name" : communityName,
      					"Region" : event['body-json'].region,
      					"City" : event['body-json'].city,
      					"Owner" : userName
      				};
      			
      	if(communityName == undefined) {
      		callback(null, JSON.stringify({error: 'Community name is not defined'}));
          	return;
      	}
      	if(item.Owner == undefined) {
      		callback(null, JSON.stringify({error: 'User is not defined'}));
          	return;
      	}
      	if(item.City == undefined) {
      	    callback(null, JSON.stringify({error: 'City is not defined'}));
          	return;
      	}
      	if(!flags.includes(item.Region)) {
      	    callback(null, JSON.stringify({error: 'Region is undefined or is not in list of acceptable regions "' + item.Region + '"'}));
          	return;
      	}
      	
    
      	documentClient.get({ Key: { "Name" : userName }, TableName : process.env.UsersTableName }, function(err1, data1) {
    	    var userOwnedCommunities = [];
    	    userItem = data1.Item;
      	    if(data1.Item != undefined) {
      	        userOwnedCommunities = JSON.parse(data1.Item.OwnedCommunities);
      	    } else {
      	        userItem = { Name: userName };
      	    }
          	if(userOwnedCommunities.length > 0) {
      	        callback(null, JSON.stringify({error: 'User already owns the community ' + userOwnedCommunities[0]}));
          	    return;
      	    }
      	    userOwnedCommunities.push(communityName);
      	    userItem.OwnedCommunities = JSON.stringify(userOwnedCommunities);
      	    documentClient.get({ Key: { "Name" : communityName }, TableName : process.env.CommunitiesTableName }, function(err, data) {
          		if(data.Item != undefined) {
          		    callback(err, JSON.stringify({error: "The community exists"}));
                 	return;
      	        }
      			documentClient.put({ Item : userItem, TableName : process.env.UsersTableName }, function(err, data) {
              		documentClient.put({ Item : item, TableName : process.env.CommunitiesTableName }, function(err, data) {
      			        callback(err, JSON.stringify({message: "Community created"}));
          			});
			    });
          	});
      	});	
  	} else
  	    callback(null, JSON.stringify({action: action, event: event}));
};