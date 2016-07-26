function random_ip() {
	return Math.round(Math.random()*255) + '.' +
	       Math.round(Math.random()*255) + '.' +
	       Math.round(Math.random()*255) + '.' +
	       Math.round(Math.random()*255);
}

// Hash IP address using "Int31" algorithm from sticky-sessions.
function hash_int31(ip, seed) {
	var hash = ip.reduce(function(r, num) {
		r += parseInt(num, 10);
		r %= 2147483648;
		r += (r << 10)
		r %= 2147483648;
		r ^= r >> 6;
		return r;
	}, seed);

	hash += hash << 3;
	hash %= 2147483648;
	hash ^= hash >> 11;
	hash += hash << 15;
	hash %= 2147483648;

	return hash >>> 0;
}

// Convert IP address to true decimal representation.
function hash_numeric_real(dot)  {
	var d = dot.split('.');
	return ((((((+d[0])*256)+(+d[1]))*256)+(+d[2]))*256)+(+d[3]);
}

// Simple numeric representation, using a regex.
function hash_simple_regex(ip) {
	return Number(ip.replace(/\./g, ''));
};

// Simple numeric representation, using a loop.
function hash_simple_loop(ip) {
	var s = '';
	for (var i = 0, _len = ip.length; i < _len; i++) {
		if (!isNaN(ip[i])) {
			s += ip[i];
		}
	}
	return Number(s);
};

// Generate a lot of random IPs.
var num_ips = 1000000,
    ips = [];
for (var i = 0; i < num_ips; i++) {
	ips[i] = random_ip();
}

// How many slots are available to us.
var len = parseInt(process.argv[2]);

// Random seed for "int31" hashing. Done once so not taken in account.
var seed = ~~(Math.random() * 1e9);

// Scattering results and timing.
var scatter_int31 = {},
    scatter_numeric_real = {},
    scatter_numeric_simple_regex = {},
    scatter_numeric_simple_loop = {};

var t1, t2;

console.log('benchmarking int31...');
t1 = new Date();
for (var i = 0; i < ips.length; i++) {
	var index = hash_int31((ips[i] || '').split(/\./g), seed) % len;
	if (!scatter_int31.hasOwnProperty(index)) {
		scatter_int31[index] = 1;
	} else {
		scatter_int31[index]++;
	}
}
t2 = new Date();
console.log('  time (ms):', t2 - t1);
console.log('  scatter:', scatter_int31);

console.log('benchmarking numeric_real...');
t1 = new Date();
for (var i = 0; i < ips.length; i++) {
	var index = hash_numeric_real(ips[i]) % len;
	if (!scatter_numeric_real.hasOwnProperty(index)) {
		scatter_numeric_real[index] = 1;
	} else {
		scatter_numeric_real[index]++;
	}
}
t2 = new Date();
console.log('  time (ms):', t2 - t1);
console.log('  scatter:', scatter_numeric_real);

console.log('benchmarking simple_regex...');
t1 = new Date();
for (var i = 0; i < ips.length; i++) {
	var index = hash_simple_regex(ips[i]) % len;
	if (!scatter_numeric_simple_regex.hasOwnProperty(index)) {
		scatter_numeric_simple_regex[index] = 1;
	} else {
		scatter_numeric_simple_regex[index]++;
	}
}
t2 = new Date();
console.log('  time (ms):', t2 - t1);
console.log('  scatter:', scatter_numeric_simple_regex);

console.log('benchmarking simple_loop...');
t1 = new Date();
for (var i = 0; i < ips.length; i++) {
	var index = hash_simple_loop(ips[i]) % len;
	if (!scatter_numeric_simple_loop.hasOwnProperty(index)) {
		scatter_numeric_simple_loop[index] = 1;
	} else {
		scatter_numeric_simple_loop[index]++;
	}
}
t2 = new Date();
console.log('  time (ms):', t2 - t1);
console.log('  scatter:', scatter_numeric_simple_loop);
