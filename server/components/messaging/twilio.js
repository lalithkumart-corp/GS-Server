const accountSid = 'AC18c9c801e4dbc1835c7308055b10aac7'; // process.env.TWILIO_ACCOUNT_SID;
const authToken = '046fe77bd3b3005358801de49eaae98f'; // process.env.TWILIO_AUTH_TOKEN;
const client = require('twilio')(accountSid, authToken);

client.messages
      .create({
         from: 'whatsapp:+918148588004',
         body: 'Hello there!',
         to: 'whatsapp:+919841367357'
       })
      .then(message => console.log(message.sid));