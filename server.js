const express = require('express');
let server = express();
const port = process.env.PORT || 3003;
server.use(express.static('dist'));

server = server.listen(port, function() {
  const port = server.address().port;
  console.log('Server started on port: localhost:%s', port);
});
