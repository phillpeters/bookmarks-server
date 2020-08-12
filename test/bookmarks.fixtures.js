function makeBookmarksArray() {
  return [
    {
      id: '54e8f551-4387-4239-85cd-c6bef50f7dad',
      title: "Thinkful",
      url: "https://www.thinkful.com",
      description: "Think outside the classroom",
      rating: 5
    },
    {
      id: '1c701582-665e-4d9e-8007-c976d7b387de',
      title: "Google",
      url: "https://www.google.com",
      description: "Where we find everything else",
      rating: 4
    },
    {
      id: 'fef98b65-f9a1-4e9a-82de-14b47574a202',
      title: "MDN",
      url: "https://developer.mozilla.org",
      description: "The only place to find web documentation",
      rating: 5
    },
    {
      id: '4149b0f6-2654-4a94-be5a-60c200ceccf5',
      title: "Realest Blog",
      url: "http://realestblog.com/",
      description: "The best real estate blog.",
      rating: 3
    }
  ];
}

function makeMaliciousBookmark() {
  const maliciousBookmark = {
      id: '3e450003-4e58-4283-8527-8c61166fdaba',
      title: 'Naughty naughty very naughty <script>alert("xss");</script>',
      url: 'http://maliciouswebsite.com',
      description: `Bad image <img src="https://url.to.file.which/does-not.exist" onerror="alert(document.cookie);">. But not <strong>all</strong> bad.`,
      rating: 2
    };
  const expectedBookmark = {
    id: '3e450003-4e58-4283-8527-8c61166fdaba',
    title: 'Naughty naughty very naughty &lt;script&gt;alert(\"xss\");&lt;/script&gt;',
    url: 'http://maliciouswebsite.com',
    description: `Bad image <img src="https://url.to.file.which/does-not.exist">. But not <strong>all</strong> bad.`,
    rating: 2
  };
  return {
    maliciousBookmark,
    expectedBookmark
  };
}

module.exports = {
  makeBookmarksArray,
  makeMaliciousBookmark
};