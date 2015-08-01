# deebee.js

An JavaScript in-memory database.  

## Installation

In a browser:

```html
<script src="deebee.js"></script>
```

## Notes

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
}l
avatars.put(avatar);

var water = elements.get(1);
// = { id: 1, name: 'Water' }

var avatar = avatars.get(42);
// = { id: 42, name: 'Korra', element: { id: 1 } }

var fullAvatar = avatars.get(42, ['element']);
// = { id: 42, name: 'Korra', element: { id: 1, name: 'Water' } }
```

Deebee has many more features that will be documented in the near future. In the meantime, take a look at the source.

## Author

| [![twitter/cdmckay](https://gravatar.com/avatar/b181c028e6b51d408450e12ab68bf25c?s=70)](https://twitter.com/cdmckay "Follow @cdmckay on Twitter") |
|---|
| [Cameron McKay](https://cdmckay.org/) |

## License

This library is available under the [MIT](http://opensource.org/licenses/mit-license.php) license.
