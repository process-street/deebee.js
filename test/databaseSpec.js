describe('Database', function () {
    "use strict";

    it('should create new database with no collections', function () {
        var database = new Deebee.Database();
        expect(database.getAllCollections().length).toBe(0);
    });

    it('should create a new collection', function () {
        var database = new Deebee.Database();
        var collection = database.createCollection('gadgets');
        expect(collection).toBeDefined();
    });

    it('should not allow the same collection name to be created twice', function () {
        var database = new Deebee.Database();
        database.createCollection('gadgets');
        expect(function () {
            database.createCollection('gadgets');
        }).toThrowError(Error);
    });

    it('should report that the database has 1 collection', function () {
        var database = new Deebee.Database();
        database.createCollection('gadgets');
        expect(database.getAllCollections().length).toBe(1);
    });

    it('should retrieve a collection', function () {
        var database = new Deebee.Database();
        var collection = database.createCollection('gadgets');
        expect(database.getCollection('gadgets')).toBe(collection);
    });

    it('should throw an Error when attempting to retrieve a collection that does not exist', function () {
        var database = new Deebee.Database();
        expect(function () {
            database.getCollection('gadgets');
        }).toThrowError(Error);
    });

    it('should delete all the collections', function () {
        var database = new Deebee.Database();
        database.createCollection('gadgets');
        expect(database.getAllCollections().length).toBe(1);
        database.deleteCollections();
        expect(database.getAllCollections().length).toBe(0);
    });

    it('should customize the model clone method to not clone fields that start with $', function () {
        var database = new Deebee.Database({
            modelClone: function (model) {
                return JSON.parse(JSON.stringify(model, function (key, value) {
                    return key.charAt(0) !== '$' ? value : undefined;
                }));
            }
        });
        var gadgets = database.createCollection('gadgets');
        gadgets.put({ id: 1, public: 'abc', $private: 'xyz' });
        var gadget = gadgets.get(1);
        expect(gadget).toEqual({ id: 1, public: 'abc' });
    });

});