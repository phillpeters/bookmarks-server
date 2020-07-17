const express = require(`express`);
const { v4: uuid } = require(`uuid`);
const logger = require("../logger");

const bookmarksRouter = express.Router();
const bodyParser = express.json();

const bookmarks = [
  {
      id: "a8691d50-88e9-4b4c-a43e-dd3483a0ae0f",
      title: "Thinkful",
      url: "https://www.thinkful.com",
      description: "Think outside the classroom",
      rating: 5
  },
  {
      id: "1c20da88-4adb-4b7d-9880-fc90d49824dc",
      title: "Google",
      url: "https://www.google.com",
      description: "Where we find everything else",
      rating: 4
  },
  {
      id: "09743b16-b7d0-4e62-a6c0-6412514a3273 ",
      title: "MDN",
      url: "https://developer.mozilla.org",
      description: "The only place to find web documentation",
      rating: 5
  },
  {
      id: "5a01f8f7-a047-41d8-871a-f56fb9c8c137",
      title: "Realest Blog",
      url: "http://realestblog.com/",
      description: "The best real estate blog.",
      rating: 5
  }
];

bookmarksRouter
  .route(`/bookmarks`)
  .get((req, res) => {
    res.json(bookmarks);
  })
  .post(bodyParser, (req, res) => {
    const { title, url, description = ``, rating } = req.body;

    if (!title) {
      logger.error(`Title is required`);
      return res
        .status(400)
        .send(`Invalid data`);
    }

    if (!url) {
      logger.error(`Url is required`);
      return res
        .status(400)
        .send(`Invalid data`);
    }

    if (!rating) {
      logger.error(`Rating is required`);
      return res
        .status(400)
        .send(`Invalid data`);
    }

    const id = uuid();
    const bookmark = {
      id,
      title,
      url,
      description,
      rating
    };

    bookmarks.push(bookmark);

    logger.info(`Bookmark with id ${id} created`);

    res
      .status(201)
      .location(`http://localhost:8000/bookmarks/${id}`)
      .json(bookmark);
  });

bookmarksRouter
  .route(`/bookmarks/:id`)
  .get((req, res) => {
    const { id } = req.params;
    const bookmark = bookmarks.find(bookmark => bookmark.id === id);

    if (!bookmark) {
      logger.error(`Bookmark with id ${id} not found`);
      return res
        .status(400)
        .send(`Bookmark not found`);
    }

    res.json(bookmark);
  })
  .delete((req, res) => {
    const { id } = req.params;
    const bookmarkIndex = bookmarks.findIndex(bookmark => bookmark.id === id);

    if (!bookmarkIndex === -1) {
      logger.error(`Bookmark with id ${id} not found`);
      return res
        .status(404)
        .send(`Not found`);
    }

    bookmarks.splice(bookmarkIndex, 1);

    logger.info(`Bookmark with id ${id} deleted`);

    res
      .status(204)
      .end();
  });

  module.exports = bookmarksRouter;