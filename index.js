const express = require('express');
const app = express();

app.set('port', (process.env.PORT || 8000));

app.get('/', function (request, response) {
  response.send('Hello World!')
});

app.listen(app.get('port'), function () {
  console.log(`Server running at ${app.get('port')}`);
});
