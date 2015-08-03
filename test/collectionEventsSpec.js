describe('Collection Events', function () {
    "use strict";

    var database;
    var users, blogs, posts;

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

        users = database.createCollection('users');
        blogs = database.createCollection('blogs', {
            owner: users.name
        });
        posts = database.createCollection('posts', {
            author: users.name,
            blog: blogs.name
        });

        blogs.put([blog1, blog2, blog3]);
        posts.put([post1, post2, post3]);

    });

    it('should trigger a delete event', function () {
        var triggered = false;
        posts.on('delete', function () {
            triggered = true;
        });
        posts.delete(post1.id);
        expect(triggered).toBe(true);
    });

    it('should use events to delete all posts when a blog is deleted', function () {

        blogs.on('delete', function (blog) {
            posts.deleteWhere({ 'blog.id': blog.id });
        });

        blogs.delete(blog1.id);

        expect(posts.getAll()).toEqual([post3]);

    });

});