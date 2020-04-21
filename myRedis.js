var redis = require('redis');
var client = redis.createClient({url: "//redis.staging.localdomain"});

var MyRedis = function () {
};

client.on("error",function(err){
	console.log("Error" + err);
});

client.on("connect",function(err,info){
	console.log("redis connected success listen on", info);
});

MyRedis.prototype.getToken= function(code,callback) {
	//get a value
	client.get(code,function(error,reply){
		callback(error,reply);
	});
}

MyRedis.prototype.setCode = function(code,token) {
	// set a value
	client.set(code,token,function(error,reply){
		console.log("repy from redis set a value" + reply);
	})
	client.expire(code,60 * 60 * 24)
}

module.exports = new MyRedis();