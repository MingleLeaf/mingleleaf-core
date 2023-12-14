# MingleLeaf Core

## Getting start
To properly start, we need to install all node modules by using ``yarn``
```sh
yarn install
```

After all modules installation, we can run core application for the first time
```sh
yarn start --ipns.offline
```


## IPFS
```sh
curl http://localhost:8080/ipfs/{CID}
```


## IPNS
```sh
curl http://localhost:8080/ipns/{CID}
```


## API
### Access token
#### Create token
```sh
curl -X POST -H "Content-Type: application/json" -d '{"clientId": "{CLIENT_ID}", "clientSecret": "{CLIENT_SECRET}"}' http://localhost:8080/api/token
```

#### Get token content
```sh
curl -H 'Authorization: Bearer {TOKEN}' http://localhost:8080/api/token
```


### IPFS
#### Save file
We can try to save our first file by using REST api, all next command will use ``curl``
```sh
curl -X POST -H 'Authorization: Bearer {TOKEN}' -F "file=@path/to/file" http://localhost:8080/api/ipfs
```

#### Get file details
```sh
curl http://localhost:8080/api/ipfs/{CID}
```

#### Pins
##### Get
```sh
curl http://localhost:8080/api/pin
```

##### Add
```sh
curl -X POST -H 'Authorization: Bearer {TOKEN}' -H "Content-Type: application/json" -d '["{CID}"]' http://localhost:8080/api/pin
```

##### Remove
```sh
curl -X DELETE -H 'Authorization: Bearer {TOKEN}' -H "Content-Type: application/json" -d '["{CID}"]' http://localhost:8080/api/pin
```


### IPNS
#### Create Key
```sh
curl -X POST -H 'Authorization: Bearer {TOKEN}' -H "Content-Type: application/json" -d '{"keyName": "{KEY_NAME}"}' http://localhost:8080/api/ipns/key
```

#### Publish
```sh
curl -X POST -H 'Authorization: Bearer {TOKEN}' -H "Content-Type: application/json" -d '{"peerId": "{PEER_ID}", "cid": "{CID}"}' http://localhost:8080/api/ipns
```

#### Get file details
```sh
curl http://localhost:8080/api/ipns/{PEER_ID}
```
