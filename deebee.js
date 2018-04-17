(function (window) {

    function Database(options) {

        options = options || {};

        this._collectionMap = new Map();

        // Two options:
        // - throw: throw an exception
        // - log: log it to console
        this._joinErrorMode = options.joinErrorMode || 'throw';

        this._modelClone = options.modelClone || function (model) {
            // The default object clone method, suitable for JSON data
            // Does not handle complex objects like Date and RegExp
            return JSON.parse(JSON.stringify(model));
        };

    }

    /**
     * Creates a new collection.
     *
     * @param name The name of the collection (must be unique within the database)
     * @param relationships A map of field names to other collections
     * @returns {Collection} A new collection
     * @throws {Error} if a collection with `name` already exists
     */
    Database.prototype.createCollection = function (name, relationships) {

        if (this._collectionMap.has(name)) {
            throw new Error('collection already exists: ' + name);
        }

        var collection = new Collection(this, name, relationships);
        this._collectionMap.set(name, collection);
        return collection;

    };

    Database.prototype.getAllCollections = function () {
        var collections = [];
        this._collectionMap.forEach(function (collection) {
            collections.push(collection);
        });
        return collections;
    };

    Database.prototype.getCollection = function (name) {
        if (!this._collectionMap.has(name)) {
            throw new Error('collection does not exist: ' + name);
        }
        return this._collectionMap.get(name);
    };

    Database.prototype.deleteCollections = function () {
        this._collectionMap.clear();
    };

    function Collection(database, name, relationships) {

        this._modelMap = new Map();
        this._eventListenerMap = new Map();

        Object.defineProperties(this, {
            database: {
                enumerable: true,
                value: database
            },
            name: {
                enumerable: true,
                value: name
            },
            relationships: {
                enumerable: true,
                value: relationships || {}
            }
        });

    }

    Collection.prototype.put = function (object) {

        var self = this;

        var models = Array.isArray(object) ? object : [object];

        models.forEach(function (model) {

            // We don't want our changes here to affect the originals, so we need to clone them
            var clonedModel = self.database._modelClone(model);

            self._putOne(clonedModel);

        });

    };

    Collection.prototype._putOne = function (model) {

        var self = this;

        if (model.id === undefined || model.id === null) {
            throw new Error('model requires an id: ' + JSON.stringify(model));
        }

        // Collection relations first
        Object.keys(self.relationships).forEach(function (key) {

            var collectionName = self.relationships[key];

            var relation = model[key];
            if (!relation) {
                throw new Error('non-existent relation "' + key + '" on ' + JSON.stringify(model));
            }

            // Don't store references
            if (!isReference(relation)) {
                self.database.getCollection(collectionName)._putOne(relation);
            }

            // As you store them, strip them down to id references
            model[key] = { id: relation.id };

        });

        //console.log('put a model into %s: %s', self.name, JSON.stringify(model));
        self.trigger('put', model);
        self._modelMap.set(model.id, model);

    };

    Collection.prototype.get = function (id, includes) {

        var self = this;

        includes = includes || [];

        var model = self._modelMap.get(id);
        var joinedModel;
        try {
            joinedModel = model && self._join(model, includes);
        } catch (error) {
            this._error(error);
        }
        return joinedModel && self.database._modelClone(joinedModel);

    };

    Collection.prototype.getAll = function (includes) {
        return this.filter(undefined, includes);
    };

    Collection.prototype.filter = function (f, includes) {

        var self = this;

        var pred = f ? generatePredicate(f) : alwaysTrue;

        includes = includes || [];

        var results = [];
        self._modelMap.forEach(function (model) {
            try {
                var joinedModel = self._join(model, includes);
                if (pred(joinedModel)) {
                    results.push(self.database._modelClone(joinedModel));
                }
            } catch (error) {
                this._error(error);
            }
        });

        return results;

    };

    Collection.prototype.count = function (f, includes) {

        var self = this;

        if (f) {

            var pred = f ? generatePredicate(f) : alwaysTrue;

            includes = includes || [];

            var count = 0;
            self._modelMap.forEach(function (model) {
                try {
                    var joinedModel = self._join(model, includes);
                    if (pred(joinedModel)) {
                        count++;
                    }
                } catch (error) {
                    this._error(error);
                }
            });

            return count;

        } else {

            return self._modelMap.size;

        }

    };

    Collection.prototype.find = function (f, includes) {

        var self = this;

        var pred = f ? generatePredicate(f) : alwaysTrue;

        includes = includes || [];

        var result;
        for (var it = self._modelMap.values(), o = it.next(); !o.done; o = it.next()) {
            var model = o.value;
            try {
                var joinedModel = self._join(model, includes);
                if (pred(joinedModel)) {
                    result = self.database._modelClone(joinedModel);
                }
            } catch (error) {
                this._error(error);
            }
            if (result) {
                break;
            }
        }

        return result;

    };

    Collection.prototype.some = function (f, includes) {
        return !!this.find(f, includes);
    };

    Collection.prototype.delete = function (id) {
        var model = this.get(id);
        this._modelMap.delete(id);
        this.trigger('delete', model);
        return model;
    };

    Collection.prototype.deleteWhere = function (f, includes) {

        var self = this;

        var models = self.filter(f, includes);
        return models.map(function (model) {
            return self.delete(model.id);
        });

    };

    Collection.prototype.clear = function () {
        this._modelMap.clear();
    };

    // Events

    Collection.prototype.on = function (name, f) {

        if (!this._eventListenerMap.has(name)) {
            this._eventListenerMap.set(name, []);
        }

        this._eventListenerMap.get(name).push(f);
        return this.off.bind(this, name, f);

    };

    Collection.prototype.off = function (name, f) {

        if (this._eventListenerMap.has(name)) {
            var map = this._eventListenerMap.get(name);
            var index = map.indexOf(f);
            if (index >= 0) {
                map.splice(index, 1);
            }
        }

    };

    Collection.prototype.trigger = function (name, model) {
        var self = this;
        if (self._eventListenerMap.has(name)) {
            self._eventListenerMap.get(name).forEach(function (f) {
                f.call(self, model);
            });
        }
    };

    // Private

    Collection.prototype._join = function (model, includes) {

        var self = this;

        // Deference all relationships that might have been set in a previous join
        Object.keys(self.relationships).forEach(function (key) {
            model[key] = { id: model[key].id };
        });

        includes.forEach(function (include) {

            var keys = include.split('.');
            var key = keys[0];

            var collectionName = self.relationships[key];
            var collection = self.database.getCollection(collectionName);

            if (!collection) {
                throw new Error('could not find collection: ' + collectionName);
            }

            var relation = collection._modelMap.get(model[key].id);

            if (!relation) {
                var id = model[key] && model[key].id;
                throw new Error('could not join key "' + key + '" with id: ' + id);
            }

            model[key] = keys.length > 1 ? collection._join(relation, keys.slice(1)) : relation;

        });

        return model;

    };

    Collection.prototype._error = function (error) {

        switch (this.database._joinErrorMode) {
        case 'throw':
            throw error;
        case 'log':
        default:
            console.error(error.message);
        }

    };

    // Helpers

    function generatePredicate(object) {
        if (isFunction(object)) {
            return object;
        } else {
            var keys = Object.keys(object);
            return function (model) {
                var result = true;
                var len = keys.length;
                for (var i = 0; i < len; i++) {
                    result = result && elvis(model, keys[i]) === object[keys[i]];
                    if (!result) break;
                }
                return result;
            };
        }
    }

    function alwaysTrue() {
        return true;
    }

    function elvis(object, path) {
        return path.split('.').reduce(function (subObject, key) {
            return subObject && subObject[key];
        }, object);
    }

    function isFunction(object) {
        return !!(object && object.constructor && object.call && object.apply);
    }

    function isReference(model) {
        var keys = Object.keys(model);
        return keys.length === 1 && model.id !== undefined && model.id !== null;
    }

    var Deebee = {
        Database: Database
    };

    // Allow library to be used in browser or node.js
    if (typeof exports !== "undefined") {
        exports.Deebee = Deebee;
    }
    else {
        window.Deebee = Deebee;

        if (typeof define === "function" && define.amd) {
            define(function () {
                return {
                    Deebee: Deebee
                }
            });
        }
    }

})(typeof window === "undefined" ? this : window);
