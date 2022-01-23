const mqtt = require('mqtt')
const ipfs = require('ipfs')
const ipfsClient = require('ipfs-http-client')
const crypto = require('crypto')

const username = 'ahmed';
const password = 'ahmed';
const bridgeId =  crypto.randomUUID();
console.log("Connecting ....");
const mqtt_client  = mqtt.connect({
  host: 'localhost',
  port: '1883',
  username: username,
  password: password,
  clientId: bridgeId
})
ipfs_topic  = crypto.createHmac('sha256', username + ":" + password).digest('hex');


const ipfs_client = ipfsClient.create({
  host: "localhost", port:  "5001", protocol: 'http'
})

ipfs_client.pubsub.subscribe(ipfs_topic, function(msg) {
  //Message recieve from remote queue or current queue
  // if message received from remote queue -> publish it here
  // if message recieve from current queue -> ignore
  ipfs_message = JSON.parse(new TextDecoder("utf-8").decode(msg.data));
  console.log(ipfs_message.message.data);
  if (ipfs_message.bridgeId !== bridgeId) {
    console.log("Recieved message from peer broker");
    console.log("Informing current broker: " + ipfs_message.topic);
    buffer = new Buffer(ipfs_message.message.data);

    console.log(buffer);
    mqtt_client.publish(ipfs_message.topic, buffer);
  }
  console.log(new TextDecoder("utf-8").decode(msg.data));
})
mqtt_client.on('connect', function () {
  mqtt_client.subscribe('#', function (err) {
    if (!err) {
      console.log("subscription successful");
    }
  })
})

mqtt_client.on('message', function (topic, message) {
  console.log(message.toString())
  packet = {
    topic: topic,
    message: message,
    bridgeId: bridgeId
  }
  // recieve the message and publsih it on ipfs pubsub ipfs_topic
  // ipfs_topic is constructed based on the username
  // and password using to authenticate to mqtt for simplicity,
  // a more sophisticated use case can be established
  ipfs_client.pubsub.publish(ipfs_topic, Buffer.from(JSON.stringify(packet)));
})
