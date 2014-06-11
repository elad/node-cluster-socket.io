node-cluster-socket.io
======================

Socket.IO doesn't work out of the box with a node.js cluster. This is a writeup based on [sticky-session](https://github.com/indutny/sticky-session) and the Socket.IO [multiple node documentation](http://socket.io/docs/using-multiple-nodes/) that explains how to make them play nice if you don't feel like wrapping your server code with it.

This is a brief explanation of how this is done with heavily commented code that will make it easy for you to integrate with your project.

I use Node.js + Express.js + Socket.IO + cluster intentionally to show how it works with all those pieces.

#### Assumptions:

  * Socket.IO 1.0 or above - so we can use the adapter API
  * Node.js 0.10.27 or above - a file descriptor passing fix is included in this release
  * Redis
  * [socket.io-redis adapter](https://github.com/automattic/socket.io-redis):
  
	```
	$ npm install socket.io-redis
	```

#### What we need to do

  * Proxy connections from the master to the workers, making sure that connections originating from the same IP address end up in the same worker
  * Persistent storage (redis instead of memory)

#### How does it work

Say your server runs on port 3000:

```
var express = require('express'),
    cluster = require('cluster'),
    net = require('net'),
    sio = require('socket.io'),
    sio_redis = require('socket.io-redis');

var port = 3000,
    num_processes = require('os').cpus().length;

if (cluster.isMaster) {
	for (var i = 0; i < num_processes; i++) {
		cluster.fork();
	}
} else {
	var app = new express();
	
	// Here you might use middleware, attach routes, etc.
	
	var server = app.listen(port),
	    io = sio(server);
}
```

Instead of starting the node.js server on that port and listening in each worker, we need to introduce a tiny proxy layer to make sure that connections from the same host end up in the same worker.

The way to do this is to create a single server listening on port 3000 and consistently map source IP addresses to our workers. We then pass the connection to the worker, which emits a `connection` event on its server. Processing then proceeds as normal:

```
var express = require('express'),
    cluster = require('cluster'),
    net = require('net'),
    sio = require('socket.io'),
    sio_redis = require('socket.io-redis');

var port = 3000,
    num_processes = require('os').cpus().length;

if (cluster.isMaster) {
	// This stores our workers. We need to keep them to be able to reference
	// them based on source IP address. It's also useful for auto-restart,
	// for example.
	var workers = [];
	
	// Helper function for spawning worker at index 'i'.
	var spawn = function(i) {
		workers[i] = cluster.fork();

		// Optional: Restart worker on exit
		workers[i].on('exit', function(worker, code, signal) {
			console.log('respawning worker', i);
			spawn(i);
		});
    };
    
    // Spawn workers.
	for (var i = 0; i < num_processes; i++) {
		spawn(i);
	}
	
	// Helper function for getting a worker index based on IP address.
	// This is a hot path so it should be really fast. The way it works
	// is by converting the IP address to a number by removing the dots,
	// then compressing it to the number of slots we have.
	//
	// Compared against "real" hashing (from the sticky-session code) and
	// "real" IP number conversion, this function is on par in terms of
	// worker index distribution only much faster.
	var worker_index = function(ip, len) {
		var s = '';
		for (var i = 0, _len = ip.length; i < _len; i++) {
			if (ip[i] !== '.') {
				s += ip[i];
			}
		}

		return Number(s) % len;
	};
	
	// Create the outside facing server listening on our port.
	var server = net.createServer(function(connection) {
		// We received a connection and need to pass it to the appropriate
		// worker. Get the worker for this connection's source IP and pass
		// it the connection.
		var worker = workers[worker_index(c.remoteAddress, num_processes)];
		worker.send('sticky-session:connection', connection);
	}).listen(port);
} else {
    // Note we don't use a port here because the master listens on it for us.
	var app = new express();
	
	// Here you might use middleware, attach routes, etc.

	var server = app.listen(),
		io = sio(server);
	
	// Tell Socket.IO to use the redis adapter. By default, the redis
	// server is assumed to be on localhost:6379. You don't have to
	// specify them explicitly unless you want to change them.
	io.adapter(sio_redis({ host: 'localhost', port: 6379 }));

	// Listen to messages sent from the master. Ignore everything else.
	process.on('message', function(message, connection) {
		if (message !== 'sticky-session:connection') {
			return;
		}
		
		// Emulate a connection event on the server by emitting the
		// event with the connection the master sent us.
		server.emit('connection', connection);
	});
}
```

That should do it. Please let me know if this doesn't work or if you have any comments.
