var express = require('express');
var server = express();
var port = process.env.PORT || 3003;
server.use(express.static('public'));

var server = server.listen(port, function() {
  const port = server.address().port;
  console.log('Server started on port: localhost:%s', port);
});
