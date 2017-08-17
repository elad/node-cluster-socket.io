const farmhash = require('farmhash');
const randomIpv6 = require('random-ipv6');

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


// IPv4
//

// Generate a lot of random IPs.
var num_ips = 1000000,
    ipsv4 = [];
    ipsv6 = [];

console.log('Generating ' + num_ips + ' IPs (IPv4)...');
for (var i = 0; i < num_ips; i++) {
    ipsv4[i] = random_ip();
}
console.log('Generating ' + num_ips + ' IPs (IPv6)...');
for (var i = 0; i < num_ips; i++) {
    ipsv6[i] = randomIpv6();
}
console.log('');

// How many slots are available to us.
var len = parseInt(process.argv[2]);

// Random seed for "int31" hashing. Done once so not taken in account.
var seed = ~~(Math.random() * 1e9);

// Scattering results and timing.
var scatter_int31 = {},
    scatter_numeric_real = {},
    scatter_numeric_simple_regex = {},
    scatter_numeric_simple_loop = {},
    scatter_numeric_farmhash = {};

var t1, t2;

console.log('IPv4');
console.log('----------')

console.log('benchmarking int31...');
t1 = new Date();
for (var i = 0; i < ipsv4.length; i++) {
    var index = hash_int31((ipsv4[i] || '').split(/\./g), seed) % len;
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
for (var i = 0; i < ipsv4.length; i++) {
    var index = hash_numeric_real(ipsv4[i]) % len;
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
for (var i = 0; i < ipsv4.length; i++) {
    var index = hash_simple_regex(ipsv4[i]) % len;
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
for (var i = 0; i < ipsv4.length; i++) {
    var index = hash_simple_loop(ipsv4[i]) % len;
    if (!scatter_numeric_simple_loop.hasOwnProperty(index)) {
        scatter_numeric_simple_loop[index] = 1;
    } else {
        scatter_numeric_simple_loop[index]++;
    }
}
t2 = new Date();
console.log('  time (ms):', t2 - t1);
console.log('  scatter:', scatter_numeric_simple_loop);

console.log('benchmarking farmhash...');
t1 = new Date();
for (var i = 0; i < ipsv4.length; i++) {
    var index = farmhash.fingerprint32(ipsv4[i]) % len;
    if (!scatter_numeric_farmhash.hasOwnProperty(index)) {
        scatter_numeric_farmhash[index] = 1;
    } else {
        scatter_numeric_farmhash[index]++;
    }
}
t2 = new Date();
console.log('  time (ms):', t2 - t1);
console.log('  scatter:', scatter_numeric_farmhash);

console.log('\n')

// IPv6
//
scatter_int31 = {},
    scatter_numeric_real = {},
    scatter_numeric_simple_regex = {},
    scatter_numeric_simple_loop = {},
    scatter_numeric_farmhash = {};

console.log('IPv6');
console.log('----------');

console.log('benchmarking int31...');
t1 = new Date();
for (var i = 0; i < ipsv6.length; i++) {
    var index = hash_int31((ipsv6[i] || '').split(/\./g), seed) % len;
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
for (var i = 0; i < ipsv6.length; i++) {
    var index = hash_numeric_real(ipsv6[i]) % len;
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
for (var i = 0; i < ipsv6.length; i++) {
    var index = hash_simple_regex(ipsv6[i]) % len;
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
for (var i = 0; i < ipsv6.length; i++) {
    var index = hash_simple_loop(ipsv6[i]) % len;
    if (!scatter_numeric_simple_loop.hasOwnProperty(index)) {
        scatter_numeric_simple_loop[index] = 1;
    } else {
        scatter_numeric_simple_loop[index]++;
    }
}
t2 = new Date();
console.log('  time (ms):', t2 - t1);
console.log('  scatter:', scatter_numeric_simple_loop);

console.log('benchmarking farmhash...');
t1 = new Date();
for (var i = 0; i < ipsv6.length; i++) {
    var index = farmhash.fingerprint32(ipsv6[i]) % len;
    if (!scatter_numeric_farmhash.hasOwnProperty(index)) {
        scatter_numeric_farmhash[index] = 1;
    } else {
        scatter_numeric_farmhash[index]++;
    }
}
t2 = new Date();
console.log('  time (ms):', t2 - t1);
console.log('  scatter:', scatter_numeric_farmhash);