describe('Collection: getAllBy', function () {
    'use strict';

    var database;
    var usersColl, blogsColl, postsColl;

    var blog1 = {
        id: 1,
        owner: { id: 1, name: 'Korra' },
        name: 'State of the Avatar'
    };
    var blog2 = {
        id: 2,
        owner: { id: 2, name: 'Bolin' },
        name: 'Bowlin\' for Bolin'
    };
    var blog3 = {
        id: 3,
        owner: { id: 3, name: 'Zuko' },
        name: 'Who has time to blog?'
    };

    var post1 = {
        id: 1,
        author: { id: 1 },
        blog: { id: 1 },
        title: 'Equalism considered harmful',
        content: 'Amon is a bad dude.'
    };
    var post2 = {
        id: 2,
        author: { id: 1 },
        blog: { id: 1 },
        title: 'What Every Avatar Must Know!',
        content: 'This post was just clickbait.'
    };
    var post3 = {
        id: 3,
        author: { id: 2 },
        blog: { id: 2 },
        title: 'How to Care for Your Fire Ferret',
        content: 'Feed them.'
    };

    beforeEach(function () {

        database = new Deebee.Database();

        usersColl = database.createCollection('users');
        blogsColl = database.createCollection('blogs', {
            owner: usersColl.name
        });
        postsColl = database.createCollection('posts', {
            author: '*' + usersColl.name,
            blog: blogsColl.name
        });

        blogsColl.put([blog1, blog2, blog3]);
        postsColl.put([post1, post2, post3]);

    });

    it('should filter all posts that have the given author', function () {
        var posts = postsColl.getAllBy('author', 1);
        expect(posts).toEqual([post1, post2]);
    });

});
