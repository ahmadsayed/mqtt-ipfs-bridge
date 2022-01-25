const mqtt = require('mqtt')
const ipfs = require('ipfs')
const ipfsClient = require('ipfs-http-client')
const crypto = require('crypto')



var args = process.argv

console.log(args);
//startAedes(args[2], args[3]);
const username = args[2];
const password = args[3];
const bridgeId = crypto.randomUUID();
console.log("Connecting ....");

const mqtt_client = mqtt.connect({
  host: 'localhost',
  port: '1883',
  username: username,
  password: password,
  clientId: bridgeId
})
ipfs_topic = crypto.createHmac('sha256', password)
  .update(username)
  .digest('hex');

ipfs_encryption_key =  crypto.createHmac('sha256', username)
  .update(password)
  .digest('hex');
console.log(ipfs_topic);
console.log(ipfs_encryption_key);
const cipher = crypto.createCipher('aes192', ipfs_encryption_key);

const ipfs_client = ipfsClient.create({
  host: "localhost", port: "5001", protocol: 'http'
})

ipfs_client.pubsub.subscribe(ipfs_topic, function (msg) {
  //Message recieve from remote queue or current queue
  // if message received from remote queue -> publish it here
  // if message recieve from current queue -> ignore
  ipfs_message = JSON.parse(new TextDecoder("utf-8").decode(msg.data));
  console.log(ipfs_message.message.data);
  if (ipfs_message.bridgeId !== bridgeId) {
    console.log("Recieved message from peer broker");
    console.log("Informing current broker: " + ipfs_message.topic);
    console.log(ipfs_message.message.data);
    buffer = new TextDecoder("utf-8").decode(Buffer.from(ipfs_message.message.data));
    console.log(buffer);
    console.log('-------------------');
    message = Buffer.from(buffer.split('.')[0]).toString('ascii');
    console.log(message);
    mqtt_client.publish(ipfs_message.topic, Buffer.from(message, 'base64'));
  }
  console.log(new TextDecoder("utf-8").decode(msg.data));
})
mqtt_client.on('connect', function () {
  mqtt_client.subscribe('/ipfs/#', function (err) {
    if (!err) {
      console.log("subscription successful");
    }
  })
})

mqtt_client.on('message', function (topic, message) {
  base64_message = Buffer.from(message).toString('base64');

  hashed_base64_message = crypto.createHash('sha256').update(base64_message).digest('hex');
  signature = cipher.update(hashed_base64_message,  'utf8', 'hex');
  ipfs_signed_message = base64_message + "." + signature;

  packet = {
    topic: topic.split('/')[2],
    message: new Buffer(ipfs_signed_message),
    bridgeId: bridgeId
  }
  // recieve the message and publsih it on ipfs pubsub ipfs_topic
  // ipfs_topic is constructed based on the username
  // and password using to authenticate to mqtt for simplicity,
  // a more sophisticated use case can be established
  ipfs_client.pubsub.publish(ipfs_topic, Buffer.from(JSON.stringify(packet)));
})