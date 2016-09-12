describe('Collection', function () {
    "use strict";

    var database;

    beforeEach(function() {
        database = new Deebee.Database();
    });

    it('should not put a model in the collection if the id is undefined', function () {
        var collection = database.createCollection('benders');
        var avatar = { name: 'Korra', nation: 'Water Tribe' };
        expect(function () {
            collection.put(avatar);
        }).toThrowError(Error);
    });

    it('should not put a model in the collection if the id is null', function () {
        var collection = database.createCollection('benders');
        var avatar = { id: null, name: 'Korra', nation: 'Water Tribe' };
        expect(function () {
            collection.put(avatar);
        }).toThrowError(Error);
    });

    it('should put a model in the collection', function () {
        var collection = database.createCollection('benders');
        var avatar = { id: 42, name: 'Korra', nation: 'Water Tribe' };
        collection.put(avatar);
        expect(collection.count()).toBe(1);
    });

    it('should retrieve a model from the collection with the same id', function () {
        var collection = database.createCollection('benders');
        var avatar = { id: 42, name: 'Korra', nation: 'Water Tribe' };
        collection.put(avatar);
        expect(collection.get(42)).toEqual(avatar);
    });

    it('should replace a model in the collection if the ids match', function () {
        var collection = database.createCollection('benders');
        var avatar1 = { id: 42, name: 'Korra', nation: 'Water Tribe' };
        var avatar2 = { id: 42, name: 'Aang', nation: 'Air Nation' };
        collection.put(avatar1);
        collection.put(avatar2);
        expect(collection.count()).toBe(1);
        expect(collection.get(42).name).toBe('Aang');
    });

    it('should put multiple models in the collection if an array is passed', function () {
        var collection = database.createCollection('benders');
        var avatar1 = { id: 42, name: 'Korra', nation: 'Water Tribe' };
        var avatar2 = { id: 43, name: 'Aang', nation: 'Air Nation' };
        collection.put([avatar1, avatar2]);
        expect(collection.count()).toBe(2);
    });

    it('should put model relations in their collections', function () {
        var nationCollection = database.createCollection('nations');
        var benderCollection = database.createCollection('benders', {
            nation: nationCollection.name
        });
        var avatar = {
            id: 42,
            name: 'Korra',
            nation: {
                id: 1,
                name: 'Water Tribe'
            }
        };
        benderCollection.put(avatar);
        expect(benderCollection.count()).toBe(1);
        expect(benderCollection.get(42)).toEqual({
            id: 42,
            name: 'Korra',
            nation: { id: 1 }
        });
        expect(nationCollection.count()).toBe(1);
        expect(nationCollection.get(1)).toEqual({
            id: 1,
            name: 'Water Tribe'
        });
    });

    it('should get a model with joined includes', function () {
        var nationCollection = database.createCollection('nations');
        var benderCollection = database.createCollection('benders', {
            nation: nationCollection.name
        });
        var avatar = {
            id: 42,
            name: 'Korra',
            nation: {
                id: 1,
                name: 'Water Tribe'
            }
        };
        benderCollection.put(avatar);
        expect(benderCollection.get(42, ['nation'])).toEqual(avatar);
    });

    it('should get a model with 2 levels of joined includes', function () {
        var elementCollection = database.createCollection('elements');
        var nationCollection = database.createCollection('nations', {
            element: elementCollection.name
        });
        var benderCollection = database.createCollection('benders', {
            nation: nationCollection.name
        });
        var avatar = {
            id: 42,
            name: 'Korra',
            nation: {
                id: 1,
                name: 'Water Tribe',
                element: {
                    id: 1,
                    name: 'Water'
                }
            }
        };
        benderCollection.put(avatar);
        expect(benderCollection.get(42, ['nation.element'])).toEqual(avatar);
    });

    it('should get a model with 2 joined includes', function () {
        var elementCollection = database.createCollection('elements');
        var nationCollection = database.createCollection('nations');
        var benderCollection = database.createCollection('benders', {
            nation: nationCollection.name,
            mostUsedElement: elementCollection.name
        });
        var avatar = {
            id: 42,
            name: 'Korra',
            nation: {
                id: 1,
                name: 'Water Tribe'
            },
            mostUsedElement: {
                id: 1,
                name: 'Water'
            }
        };
        benderCollection.put(avatar);
        expect(benderCollection.get(42, ['nation', 'mostUsedElement'])).toEqual(avatar);
    });

    it('should replace model relation and add it to the proper collection', function () {

        var nationCollection = database.createCollection('nations');
        var benderCollection = database.createCollection('benders', {
            nation: nationCollection.name
        });

        var avatar1 = {
            id: 42,
            name: 'Korra',
            nation: {
                id: 1,
                name: 'Water Tribe'
            }
        };
        benderCollection.put(avatar1);

        var avatar2 = {
            id: 42,
            name: 'Korra',
            nation: {
                id: 2,
                name: 'Fire Nation'
            }
        };
        benderCollection.put(avatar2);

        expect(benderCollection.get(42, ['nation'])).toEqual(avatar2);
        expect(nationCollection.count()).toBe(2);
        expect(nationCollection.get(1)).toEqual({ id: 1, name: 'Water Tribe' });
        expect(nationCollection.get(2)).toEqual({ id: 2, name: 'Fire Nation' });

    });

    it('should throw an Error if an "includes" relationship is not defined', function () {
        var benderCollection = database.createCollection('benders');
        var avatar = {
            id: 42,
            name: 'Korra',
            nation: {
                id: 1,
                name: 'Water Tribe'
            }
        };
        benderCollection.put(avatar);
        expect(function () {
            benderCollection.get(42, ['nation']);
        }).toThrowError(Error);
    });

    it('should throw an Error if an "includes" relationship is not found', function () {
        var nationCollection = database.createCollection('nations');
        var benderCollection = database.createCollection('benders', {
            nation: nationCollection.name
        });
        var avatar = {
            id: 42,
            name: 'Korra',
            nation: { id: 1 }
        };
        benderCollection.put(avatar);
        expect(function () {
            benderCollection.get(42, ['nation']);
        }).toThrowError(Error);
    });

    it('should not have un-asked for relations', function () {

        var nationCollection = database.createCollection('nations');
        var benderCollection = database.createCollection('benders', {
            nation: nationCollection.name
        });
        var avatar = {
            id: 42,
            name: 'Korra',
            nation: {
                id: 1,
                name: 'Water Tribe'
            }
        };
        benderCollection.put(avatar);

        var avatarWithNation = benderCollection.get(42, ['nation']);
        expect(avatarWithNation.nation.name).toBe(avatar.nation.name);

        var avatarWithoutNation = benderCollection.get(42);
        expect(avatarWithoutNation.nation.name).toBeUndefined();

    });

    it('should return the proper count with no predicate', function () {

        var nationCollection = database.createCollection('nations');
        nationCollection.put({ id: 1, name: 'Water Tribe', floating: false });
        nationCollection.put({ id: 2, name: 'Fire Nation', floating: false });
        nationCollection.put({ id: 3, name: 'Earth Empire', floating: false });
        nationCollection.put({ id: 4, name: 'Air Nation', floating: true });

        expect(nationCollection.count()).toBe(4);

    });

    it('should return the proper count with no predicate', function () {

        var nationCollection = database.createCollection('nations');
        nationCollection.put({ id: 1, name: 'Water Tribe', floating: false });
        nationCollection.put({ id: 2, name: 'Fire Nation', floating: false });
        nationCollection.put({ id: 3, name: 'Earth Empire', floating: false });
        nationCollection.put({ id: 4, name: 'Air Nation', floating: true });

        expect(nationCollection.count({ floating: false })).toBe(3);

    });

});
