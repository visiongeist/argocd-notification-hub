require('dotenv').config();

const express = require('express');
const app = express();

const k8s = require('@kubernetes/client-node');
const kc = new k8s.KubeConfig();
kc.loadFromDefault();


async function ingestEvent(data) {

  let payload = {
    "specversion": "1.0",
    "source": "argocd",
    "type": "argocd.event",
    "dataschema": "http://dynatrace.com/schema/bizevents/generic/1.0",
    "data": data
  };

  const options = {
    method: 'POST',
    headers: {
      Accept: 'application/json; charset=utf-8',
      'Content-Type': 'application/json',
      Authorization: `Api-Token ${process.env.DTTOKEN}`
    },
    body: JSON.stringify(payload)
  };

  await fetch(process.env.DTURL, options)
    .then(res => res.json())
    .then(json => console.log(json))
    .catch(err => console.error('error:' + err));

  console.log('event digested');
}

const startEventListener = async () => {
  try {
    const watch = new k8s.Watch(kc);
    watch.watch('/api/v1/namespaces/argocd/events', // path where the resource resides
      // optional query parameters can go here.
      {},
      // callback function for when a change happens
      (type, apiObj, watchObj) => {
        if (apiObj?.source?.component == 'argocd-application-controller') { // argoCD event
          const relevantData = {
            argoApplication: apiObj.involvedObject?.name,
            timestamp: apiObj.lastTimestamp,
            eventType: apiObj.reason,
            eventDetail: apiObj.message
          };

          console.log(relevantData);
          ingestEvent(relevantData);
        }
      },
      // callback function for when the watch ends
      (err) => {
        console.log(err);
      },
    );
  } catch (err) {
    console.error(err);
  }
};

startEventListener();

// dummy server
app.set('port', (process.env.PORT || 8000));
app.get('/', function (request, response) {
  response.send('Hello World!')
});
app.listen(app.get('port'), function () {
  console.log(`Server running at ${app.get('port')}`);
});

