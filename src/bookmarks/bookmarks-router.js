const path = require('path');
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
    const bookmark = { id: uuid(), title, url, description, rating };

    for (const [key, value] of Object.entries(bookmark)) {
      if (value == null) {
        return res.status(400).json({
          error: { message: `${key} is required` }
        });
      }
    }

    if (bookmark.rating < 1 || bookmark.rating > 5) {
      return res.status(400).json({
        error: { message: `Rating must be between 1 and 5`}
      });
    }

    BookmarksService.insertBookmark(knexInstance, bookmark)
      .then(bookmark => {
        logger.info(`Bookmark with id ${bookmark.id} created`);
        res
          .status(201)
          .location(path.posix.join(req.originalUrl, `/${bookmark.id}`))
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
  })
  .patch(bodyParser, (req, res, next) => {
    const { title, url, description, rating } = req.body;
    const bookmarkToUpdate = { title, url, description, rating };

    const numberOfValues = Object.values(bookmarkToUpdate).filter(Boolean).length;
    if (numberOfValues === 0) {
      return res.status(400).json({
        error: {
          message: `Request body must contain either 'title', 'url', 'description', or 'rating'`
        }
      });
    }

    BookmarksService.updateBookmark(
      req.app.get('db'),
      req.params.id,
      bookmarkToUpdate
    )
    .then(bookmark => {
      logger.info(`Bookmark with id ${bookmark.id} updated`);
      res
        .status(200)
        .location(path.posix.join(req.originalUrl, `/${bookmark.id}`))
        .json(sanitizeBookmark(bookmark));
    })
      .catch(next);
  });

module.exports = bookmarksRouter;