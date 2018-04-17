# deebee.js

A JavaScript in-memory database.  

## Installation

In a browser:

```html
<script src="deebee.js"></script>
```

## Tests

```
npm install
./node_modules/karma/bin/karma start
```

## Notes

Deebee uses the [ES6 Map object](https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/Map) to
store data. 

The ES6 Map object is available in Chrome 38, Firefox 13, Internet Explorer 11 and Safari 7.1. 
If you need support in earlier versions, you can use a polyfill like [es6-collections](https://github.com/WebReflection/es6-collections).

This method will provides a global Deebee object. That means that once you include it, you can use it like this:

```javascript
var database = new Deebee.Database();
var elements = database.createCollection('elements');
var avatars = database.createCollection('avatars', {
    element: 'elements'
});
var avatar = {
    id: 42,
    name: 'Korra',
    element: { id: 1, name: 'Water' }
};
avatars.put(avatar);

var water = elements.get(1);
// = { id: 1, name: 'Water' }

var partialAvatar = avatars.get(42);
// = { id: 42, name: 'Korra', element: { id: 1 } }

var fullAvatar = avatars.get(42, ['element']);
// = { id: 42, name: 'Korra', element: { id: 1, name: 'Water' } }
```

Deebee is in maintenance mode and won't have any new features.


## License

This library is available under the [MIT](http://opensource.org/licenses/mit-license.php) license.
