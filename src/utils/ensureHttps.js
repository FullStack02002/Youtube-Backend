const ensureHttps = (url) => {
    if (url.startsWith('http://')) {
      return url.replace('http://', 'https://');
    }
    return url;
  };

  export {ensureHttps}