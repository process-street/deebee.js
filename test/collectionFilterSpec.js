describe('Collection Filters', function () {
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

    it('should filter all models if no filter predicate is provided', function () {
        var models = posts.filter();
        expect(models).toEqual(posts.getAll());
    });

    it('should filter no models if a false predicate function is provided', function () {
        var models = posts.filter(function () {
            return false;
        });
        expect(models).toEqual([]);
    });

    it('should filter all models with blog id 1 using a predicate function', function () {
        var models = posts.filter(function (post) {
            return post.blog.id === 1;
        });
        expect(models).toEqual([post1, post2]);
    });

    it('should filter all models with owner id 1 using includes', function () {

        var models = posts.filter(function (post) {
            return post.blog.owner.id === 1;
        }, ['blog']);

        var clonedBlog = JSON.parse(JSON.stringify(blog1));
        clonedBlog.owner = { id: 1 };
        var clonedPost1 = JSON.parse(JSON.stringify(post1));
        clonedPost1.blog = clonedBlog;
        var clonedPost2 = JSON.parse(JSON.stringify(post2));
        clonedPost2.blog = clonedBlog;

        expect(models).toEqual([clonedPost1, clonedPost2]);

    });

    it('should filter all models if an empty predicate object is provided', function () {
        var models = posts.filter({});
        expect(models).toEqual(posts.getAll());
    });

    it('should filter all models with blog id 1 using a predicate object', function () {
        var models = posts.filter({ 'blog.id': 1 });
        expect(models).toEqual([post1, post2]);
    });

    it('should filter all models with blog id 1 using a predicate object', function () {
        var models = posts.filter({ 'blog.id': 1 });
        expect(models).toEqual([post1, post2]);
    });

});