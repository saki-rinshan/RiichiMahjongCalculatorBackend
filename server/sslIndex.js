var app = require('express')();
var fs = require('fs');
var fs = require('fs-extra');
var path = require('path');
var mkdirp = require('mkdirp');
const { exec } = require('child_process');

const darkflow = "~/darkflow/flow";
const imgDir = "~/server/";
const pb = "~/models/mahjong10000.pb";
const meta = "~/models/mahjong10000.meta";

const rotateScript = "~/scripts/rotateScript.sh";
const mobileNet = "~/predict/labelAll.py";

const port = 4001;

var https = require('https');
const options = { 

				cert: fs.readFileSync(__dirname + '/cert/cert.pem'),
				key: fs.readFileSync(__dirname + '/cert/key.pem'),
}
var server = https.createServer(options, app);
var io = require('socket.io')(server);

io.on('connection', function(socket) {
	var addressX = socket.handshake.address;
	var address = addressX.replace("::ffff:", "");
  	console.log('New connection from ' + address);
	var lastSentTime;
	socket.on('Img', function(data) {
		console.log("uploaded a file:: ");
		var image = data['Data'];
		var date = new Date();
		var name = data['Name'] + "-" +  date.getTime();
		var bitmap = new Buffer(image, 'base64');
		console.log("Writing a file");

		if(lastSentTime) {
			console.log("entered if");
			console.log(date.getTime() +  " :: " + lastSentTime);
			if(date.getTime() - lastSentTime <= 1000) {
				console.log("disconnect");
				var ipOrig = socket.handshake.address + '';
				var ip = ipOrig.replace("::ffff:", '');
				exec('sudo ufw deny from ' + ip + ' to any port ' + port, (err) => {
					if(err) {
						console.log('err');
					}
					console.log("firewall updated to block " + ip);
				});
				socket.disconnect();
			}
		}

		console.log(bitmap.length/1024);
		if(bitmap.length > 100000000) {
			console.log("file too big");
			return;
		}	
		(function(folderPath) {
			mkdirp(folderPath, function(err) {
				if(err) {
					console.log(err);
					return;
				}
				fs.writeFile(folderPath + '/' +  name + ".jpeg", bitmap, function(err) {

					if (err) {
						console.log(err);
						return;
					}
  					console.log('The file ' + 'a'  + ' has been saved! at ' + folderPath + '/' +  name);
					console.log("Executing darkflow");
					exec('python3 ' + darkflow +  ' --imgdir ' + imgDir + folderPath + ' --pbLoad ' + pb + ' --metaLoad ' +  meta, function(err, data) {
 						if(err) {
							console.log(err);
							console.log("not a valid image");
							//remove(folderPath + '/' + name);
							return;
						}
						console.log("Executing mobilenet");
						console.log(data);
						exec(rotateScript + ' ' +  imgDir + folderPath + '/out', function(err, data) {
							console.log(data);
							if(err) {
								console.log(err);
								console.log("no valid tiles detected");
								remove(folderPath);
								return;
							}
							exec('python3 ' + mobileNet + ' --idir=' + imgDir + folderPath +'/out ' + '--graph=aug --labels=aug', function(err, data) {
								if(err) {
									console.log("mobilenet err");
									remove(folderPath + '/out/');
									return;
								}
									var results = data.split("\n");
									//console.log(data);
									var firstResults = [];
									for(var i = 0; i < results.length - 1; i++) {
										var line = results[i].split(" ");
										var prediction = line[0];
										var percentage = line[1]; 
										console.log(prediction +  " :: " + percentage);
										if(percentage === "aka") {
											firstResults.push(prediction + " " + percentage);
										} else {
											firstResults.push(prediction);
										}
									}
									//console.log(JSON.stringify(firstResults));
									var formattedResults = { results: firstResults };
									
									//socket.emit("message", JSON.stringify(formattedResults));
									socket.emit("message", firstResults);
									remove(folderPath + '/out/');
								});
							});
						})
					});
				});
			})(("tmp/" + address + "/" + name).trim());
	});
	socket.on('disconnect', () => {
		console.log("disconnected");
	});	
});


function remove(path) {
	fs.remove(path, err => {
		if(err) {
			console.log(err);
			return;
		}
		console.log("removed " + path);
	});
}

app.get('/', function(req, res) {
	res.send('Hello world');
});

server.listen(port, function() {
	console.log("listening on *:" + port);
});
