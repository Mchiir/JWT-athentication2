module.exports = {
    port: 5015,
    database: {
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'test',
    },
    jwtConfig: {
      jwtSecret: 'keep_it_secret',
      jwtExpiration: '1h',
    },
  };
  