const express = require(`express`);
const { v4: uuid } = require(`uuid`);
const logger = require("../logger");
const xss = require('xss');
const BookmarksService = require('../bookmarks/bookmarks-service');

const bookmarksRouter = express.Router();
const bodyParser = express.json();

const sanitizeBookmark = bookmark => ({
  id: bookmark.id,
  title: xss(bookmark.title),
  url: bookmark.url,
  description: xss(bookmark.description),
  rating: bookmark.rating
});

bookmarksRouter
  .route(`/`)
  .get((req, res, next) => {
    const knexInstance = req.app.get('db');
    BookmarksService.getAllBookmarks(knexInstance)
    .then(bookmarks => {
      res.json(bookmarks.map(bookmark => sanitizeBookmark(bookmark)));
    })
    .catch(next);
  })
  .post(bodyParser, (req, res, next) => {
    const knexInstance = req.app.get('db');
    const { title, url, description = ``, rating } = req.body;
    const bookmark = { title, url, description, rating };

    for (const [key, value] of Object.entries(bookmark)) {
      if (value == null) {
        return res.status(400).json({
          error: { message: `${key} is required` }
        });
      }
    }

    if (rating < 1 || rating > 5) {
      logger.error(`Rating is lower than 1 or higher than 5`);
      return res
        .status(400)
        .json({
          error: { message: `Rating must be between 1 and 5` }
        });
    }

    bookmark.id = uuid();

    BookmarksService.insertBookmark(knexInstance, bookmark)
      .then(bookmark => {
        logger.info(`Bookmark with id ${bookmark.id} created`);
        res
          .status(201)
          .location(`/bookmarks/${bookmark.id}`)
          .json(sanitizeBookmark(bookmark));
      })
      .catch(next);
  });

bookmarksRouter
  .route(`/:id`)
  .all((req, res, next) => {
    const knexInstance = req.app.get('db');
    BookmarksService.getBookmarkById(knexInstance, req.params.id)
      .then(bookmark => {
        if (!bookmark) {
          logger.error(`Bookmark with id ${req.params.id} not found`);
          return res
            .status(404)
            .json({ error: { message: `Bookmark doesn't exist` } });
        }
        res.bookmark = bookmark;
        next();
      })
      .catch(next);
  })
  .get((req, res, next) => {
    res.json(sanitizeBookmark(res.bookmark));
  })
  .delete((req, res, next) => {
    const knexInstance = req.app.get('db');
    BookmarksService.deleteBookmark(knexInstance, req.params.id)
      .then(() => {
        logger.info(`Bookmark with id ${req.params.id} deleted`);
        res.status(204).end();
      })
      .catch(next);
  });

module.exports = bookmarksRouter;