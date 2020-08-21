const knex = require('knex');
const app = require('../src/app');
const { makeBookmarksArray, makeMaliciousBookmark } = require('./bookmarks.fixtures');
const BookmarksService = require('../src/bookmarks/bookmarks-service');
const supertest = require('supertest');
const { expect } = require('chai');
const { get } = require('../src/bookmarks/bookmarks-router');

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

  describe('GET /api/bookmarks', () => {
    context('Given there are no bookmarks in the database', () => {
      it('responds with 200 and an empty list', () => {
        return supertest(app)
          .get('/api/bookmarks')
          .set('Authorization', `bearer ${process.env.API_TOKEN}`)
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
        return supertest(app)
          .get('/api/bookmarks')
          .set('Authorization', `bearer ${process.env.API_TOKEN}`)
          .expect(200, testBookmarks);
      })
    });

    context('Given an XSS attack bookmark', () => {
      const { maliciousBookmark, expectedBookmark } = makeMaliciousBookmark();

      beforeEach('insert malcious bookmark', () => {
        return db
          .into('bookmarks')
          .insert([ maliciousBookmark ]);
      });

      it('removes XSS attack content', () => {
        return supertest(app)
          .get(`/api/bookmarks`)
          .set('Authorization', `bearer ${process.env.API_TOKEN}`)
          .expect(200)
          .expect(res => {
            expect(res.body[0].title).to.eql(expectedBookmark.title);
            expect(res.body[0].description).to.eql(expectedBookmark.description);
          });
      });
    });
  });

  describe('GET /api/bookmarks/:id', () => {
    context('Given there are no bookmarks in the database', () => {
      it('responds with 404', () => {
        const bookmarkId = '88ca5b54-83ec-4582-b493-da102a2e7d8a';
        return supertest(app)
          .get(`/api/bookmarks/${bookmarkId}`)
          .set('Authorization', `bearer ${process.env.API_TOKEN}`)
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
          .get(`/api/bookmarks/${bookmarkId}`)
          .set('Authorization', `bearer ${process.env.API_TOKEN}`)
          .expect(200, expectedBookmark);
      });
    });

    context('Given an XSS attack bookmark', () => {
      const { maliciousBookmark, expectedBookmark } = makeMaliciousBookmark();

      beforeEach('insert malcious bookmark', () => {
        return db
          .into('bookmarks')
          .insert([ maliciousBookmark ]);
      });

      it('removes XSS attack content', () => {
        return supertest(app)
          .get(`/api/bookmarks/${maliciousBookmark.id}`)
          .set('Authorization', `bearer ${process.env.API_TOKEN}`)
          .expect(200)
          .expect(res => {
            expect(res.body.title).to.eql(expectedBookmark.title);
            expect(res.body.description).to.eql(expectedBookmark.description);
          });
      });
    });
  });

  describe('POST /api/bookmarks', () => {
    it('creates a bookmark, responding with 201 and the bookmark', () => {
      const newBookmark = {
        title: 'New test bookmark',
        url: 'https://www.newtestbookmark.com',
        description: 'New test bookmark description...',
        rating: 4
      };

      return supertest(app)
        .post('/api/bookmarks')
        .set('Authorization', `bearer ${process.env.API_TOKEN}`)
        .send(newBookmark)
        .expect(201)
        .expect(res => {
          expect(res.body).to.have.property('id');
          expect(res.body.title).to.eql(newBookmark.title);
          expect(res.body.url).to.eql(newBookmark.url);
          expect(res.body.description).to.eql(newBookmark.description);
          expect(res.body.rating).to.eql(newBookmark.rating);
          expect(res.headers.location).to.eql(`/api/bookmarks/${res.body.id}`);
        })
        .then(res =>
          supertest(app)
            .get(`/api/bookmarks/${res.body.id}`)
            .set('Authorization', `bearer ${process.env.API_TOKEN}`)
            .expect(res.body)
        );
    });

    const requiredFields = ['title', 'url', 'rating'];

    requiredFields.forEach(field => {
      const newBookmark = {
        title: 'New test bookmark',
        url: 'https://www.newtestbookmark.com',
        description: 'New test bookmark description...',
        rating: 4
      };

      it(`responds with 400 and an error message when the '${field}' is missing`, () => {
        delete newBookmark[field];
        return supertest(app)
          .post('/api/bookmarks')
          .set('Authorization', `bearer ${process.env.API_TOKEN}`)
          .send(newBookmark)
          .expect(400, {
            error: { message: `${field} is required` }
          });
      });
    });
    
    const rating = [0, 6];

    rating.forEach(rating => {
      const newBookmark = {
        id: '0b7eeee7-2517-42bf-8a50-bae8b0c10722',
        title: 'New test bookmark',
        url: 'https://www.newtestbookmark.com',
        description: 'New test bookmark description...',
        rating: rating
      };

      it(`responds with 400 and an error message when the 'rating' is less than 1 or greater than 5`, () => {
        return supertest(app)
          .post('/api/bookmarks')
          .set('Authorization', `bearer ${process.env.API_TOKEN}`)
          .send(newBookmark)
          .expect(400, {
            error: { message: `Rating must be between 1 and 5` }
          });
      });
    });

    it('removes XSS attack content from response', () => {
      const { maliciousBookmark, expectedBookmark } = makeMaliciousBookmark();
      return supertest(app)
        .post('/api/bookmarks')
        .set('Authorization', `bearer ${process.env.API_TOKEN}`)
        .send(maliciousBookmark)
        .expect(201)
        .expect(res => {
          expect(res.body.title).to.eql(expectedBookmark.title);
          expect(res.body.description).to.eql(expectedBookmark.description);
        });
    });
  });

  describe('DELETE /api/bookmarks/:id', () => {
    context('Given there are bookmarks in the database', () => {
      const testBookmarks = makeBookmarksArray();

      beforeEach('insert bookmarks', () => {
        return db
          .into('bookmarks')
          .insert(testBookmarks);
      });

      it('responds with 204 and removes the bookmark', () => {
        const idToRemove = '1c701582-665e-4d9e-8007-c976d7b387de';
        const expectedBookmarks = testBookmarks.filter(bookmark => bookmark.id !== idToRemove);
        return supertest(app)
          .delete(`/api/bookmarks/${idToRemove}`)
          .set('Authorization', `bearer ${process.env.API_TOKEN}`)
          .expect(204)
          .then(res =>
            supertest(app)
              .get('/api/bookmarks')
              .set('Authorization', `bearer ${process.env.API_TOKEN}`)
              .expect(expectedBookmarks)
          )
      });
    });

    context('Given there are no bookmarks in the database', () => {
      it('responds with 404', () => {
        const bookmarkId = '80c7cb6b-7a2a-42fb-b045-11b3a333a5e6';
        return supertest(app)
          .delete(`/api/bookmarks/${bookmarkId}`)
          .set('Authorization', `bearer ${process.env.API_TOKEN}`)
          .expect(404, { error: { message: `Bookmark doesn't exist` } });
      });
    });
  });

  describe.only(`PATCH /api/bookmarks/:id`, () => {
    context(`Given there are no bookmarks in the database`, () => {
      it(`responds with 404`, () => {
        const bookmarkId = '7f6c8edc-e06b-4229-a42f-84cb0efada71';
        return supertest(app)
          .patch(`/api/bookmarks/${bookmarkId}`)
          .set('Authorization', `bearer ${process.env.API_TOKEN}`)
          .expect(404, { error: { message: `Bookmark doesn't exist` } });
      });
    });

    context(`Given there are bookmarks in the database`, () => {
      const testBookmarks = makeBookmarksArray();

      beforeEach(`insert bookmarks`, () => {
        return db
          .into('bookmarks')
          .insert(testBookmarks);
      });

      it(`responds with 204 and upates the bookmark`, () => {
        const idToUpdate = '1c701582-665e-4d9e-8007-c976d7b387de';
        const updateBookmark = {
          title: `updated bookmark title`,
          url: `https://updatedurl.com`,
          description: `updated bookmark description`,
          rating: 3
        };
        const expectedBookmark = {
          ...testBookmarks[testBookmarks.findIndex(bookmark => bookmark.id === idToUpdate)],
          ...updateBookmark
        };

        return supertest(app)
          .patch(`/api/bookmarks/${idToUpdate}`)
          .set('Authorization', `bearer ${process.env.API_TOKEN}`)
          .send(updateBookmark)
          .expect(204)
          .then(res =>
            supertest(app)
              .get(`/api/bookmarks/${idToUpdate}`)
              .set('Authorization', `bearer ${process.env.API_TOKEN}`)
              .expect(expectedBookmark)  
          );
      });

      it(`responds with 400 when no required fields supplied`, () => {
        const idToUpdate = '1c701582-665e-4d9e-8007-c976d7b387de';
        return supertest(app)
          .patch(`/api/bookmarks/${idToUpdate}`)
          .set('Authorization', `bearer ${process.env.API_TOKEN}`)
          .send({ irrelevantField: 'foo' })
          .expect(400, {
            error: {
              message: `Request body must contain either 'title', 'url', 'description', or 'rating'`
            }
          });
      });

      it(`responds with 204 when updating only a subset of fields`, () => {
        const idToUpdate = '1c701582-665e-4d9e-8007-c976d7b387de';
        const updateBookmark = {
          title: `updated bookmark title`
        };
        const expectedBookmark = {
          ...testBookmarks[testBookmarks.findIndex(bookmark => bookmark.id === idToUpdate)],
          ...updateBookmark
        };

        return supertest(app)
          .patch(`/api/bookmarks/${idToUpdate}`)
          .set('Authorization', `bearer ${process.env.API_TOKEN}`)
          .send({
            ...updateBookmark,
            fieldToIgnore: `should not be in GET response`
          })
          .expect(204)
          .then(res =>
            supertest(app)
              .get(`/api/bookmarks/${idToUpdate}`)
              .set('Authorization', `bearer ${process.env.API_TOKEN}`)
              .expect(expectedBookmark)
          );
      });
    });
  });
});