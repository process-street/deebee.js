'use strict';

var Deebee = require('./deebee.js').Deebee;
var database = new Deebee.Database();

// Setup trees

var trees = database.createCollection('trees');
trees.put({ id: 0 });
trees.put({ id: 1 });

// Setup apples

var MAX_APPLES = 100000;

var apples = database.createCollection('apples', { tree: '*trees' });

for (var i = 0; i < MAX_APPLES; i++) {
    apples.put({ id: i, tree: { id: i % 2 } });
}

// Benchmarks

var randomAppleId = parseInt(MAX_APPLES * Math.random());
console.log('random apple id = %d', randomAppleId);

console.time('get');
apples.get(randomAppleId);
console.timeEnd('get');

console.time('find');
apples.find(function (apple) {
    return apple.id === randomAppleId;
});
console.timeEnd('find');

console.time('some');
apples.some(function (apple) {
    return apple.tree.id === 1;
});
console.timeEnd('some');

console.time('filter');
apples.filter(function (apple) {
    return apple.tree.id === 1;
});
console.timeEnd('filter');

console.time('getAllBy');
apples.getAllBy('tree', 1);
console.timeEnd('getAllBy');

console.time('filter with include');
apples.filter(function (apple) {
    return apple.tree.id === 1;
}, ['tree']);
console.timeEnd('filter with include');

console.time('getAllBy with include');
apples.getAllBy('tree', 1, ['tree']);
console.timeEnd('getAllBy with include');

