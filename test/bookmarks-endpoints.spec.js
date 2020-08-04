const expect = require('chai').expect;
const knex = require('knex');
const app = require('../src/app');
const supertest = require('supertest');
const { makeBookmarksArray } = require('./bookmarks.fixtures');

describe.only('Bookmarks endpoints', () => {
  let db;

  before('make knex instance', () => {
    db = knex({
      client: 'pg',
      connection: process.env.TEST_DB_URL
    });
    app.set('db', db);
  });

  after('disconnect from db', () => db.destroy());

  before('clean the table', () => db('bookmarks').truncate());

  afterEach('cleanup', () => db('bookmarks').truncate());

  describe('GET /bookmarks', () => {
    context('Given there are no bookmarks in the database', () => {
      it('responds with 200 and an empty list', () => {
        supertest(app)
          .get('/bookmarks')
          .expect(200, []);
      });
    });

    context('Given there are bookmarks in the database', () => {
      const testBookmarks = makeBookmarksArray();

      beforeEach('insert bookmarks', () => {
        return db
          .into('bookmarks')
          .insert(testBookmarks);
      });
      
      it('responds with 200 and all of the bookmarks', () => {
        supertest(app)
          .get('/bookmarks')
          .expect(200, testBookmarks);
      })
    });
  });

  describe('GET /bookmarks/:id', () => {
    context('Given there are no bookmarks in the database', () => {
      it('responds with 404', () => {
        const bookmarkId = 123456;
        supertest(app)
          .get(`/bookmarks/${bookmarkId}`)
          .expect(404, { error: { message: `Bookmark doesn't exist` } });
      });
    });

    context('Given there are bookmarks in the database', () => {
      const testBookmarks = makeBookmarksArray();

      beforeEach('insert bookmarks', () => {
        return db
          .into('bookmarks')
          .insert(testBookmarks);
      });

      it('responds with 200 and the specified bookmark', () => {
        const bookmarkId = '1c701582-665e-4d9e-8007-c976d7b387de'
        const expectedBookmark = testBookmarks.find(bookmark => bookmark.id === bookmarkId);
        return supertest(app)
          .get(`/bookmarks/${bookmarkId}`)
          .set('Authorization', `bearer ${process.env.API_TOKEN}`)
          .expect(200, expectedBookmark);
      });
    });
  });
});