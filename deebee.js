(function(window) {

    function Database() {
        this._collectionMap = new Map();
    }

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
        return this._collectionMap.get(name);
    };

    Database.prototype.deleteCollections = function () {
        this._collectionMap.clear();
    };

    function Collection(database, name, relationships) {

        this._modelMap = new Map();

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

            if (model.id === undefined || model.id === null) {
                throw new Error('model requires an id: ' + JSON.stringify(model));
            }

            // We don't want our changes here to affect the originals, so we need to clone them
            var clonedModel = objectClone(model);

            // Collection relations first
            Object.keys(self.relationships).forEach(function (key) {

                var collectionName = self.relationships[key];

                var relation = clonedModel[key];
                if (!relation) {
                    throw new Error('non-existent relation "' + key + '" on ' + JSON.stringify(clonedModel));
                }

                // Don't store references
                if (!isReference(relation)) {
                    self.database.getCollection(collectionName).put(relation);
                }

                // As you store them, strip them down to id references
                clonedModel[key] = { id: relation.id };

            });

            //console.log('put a model into %s: %s', self.name, JSON.stringify(model));
            self._modelMap.set(clonedModel.id, clonedModel);

        });

    };

    Collection.prototype.get = function (id, includes) {

        var self = this;

        includes = includes || [];

        var model = self._modelMap.get(id);
        return model && self._join(model, includes);

    };

    Collection.prototype.getAll = function (includes) {
        return this.filter(undefined, includes);
    };

    Collection.prototype.filter = function (f, includes) {

        var self = this;

        if (f) {
            f = isFunction(f) ? f : generatePredicate(f);
        } else {
            f = function () { return true; };
        }

        includes = includes || [];

        var results = [];
        self._modelMap.forEach(function (model) {
            var joinedModel = self._join(model, includes);
            if (f(joinedModel)) {
                results.push(joinedModel);
            }
        });

        return results;

    };

    Collection.prototype.count = function (f, includes) {
        if (f) {
            return this.filter(f, includes).length;
        } else {
            return this._modelMap.size;
        }
    };

    Collection.prototype.some = function (f, includes) {
        return this.count(f, includes) > 0;
    };

    Collection.prototype.find = function (f, includes) {
        return this.filter(f, includes)[0];
    };

    Collection.prototype.delete = function (id) {
        return this._modelMap.delete(id);
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

    // Private

    Collection.prototype._join = function (model, includes) {

        var self = this;

        var clonedModel = objectClone(model);

        includes.forEach(function (include) {

            var keys = include.split('.');
            var key = keys[0];

            var collectionName = self.relationships[key];
            var collection = self.database.getCollection(collectionName);
            var relation = collection.get(clonedModel[key].id);

            if (!relation) {
                throw new Error('could not join key: ' + key);
            }

            clonedModel[key] = keys.length > 1 ? collection._join(relation, keys.slice(1)) : relation;

        });

        return clonedModel;

    };

    // Helpers

    function generatePredicate(object) {
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

    function objectClone(model) {
        // The default object clone method, suitable for JSON data
        // Does not handle complex objects like Date and RegExp
        return JSON.parse(JSON.stringify(model));
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
            define(function() {
                return {
                    Deebee: Deebee
                }
            });
        }
    }

})(typeof window === "undefined" ? this : window);