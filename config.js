module.exports = {
    port: 5015,
    database: {
      host: 'localhost',
      user: 'user_name',
      password: 'password',
      database: 'database_name',
    },
    jwtConfig: {
      jwtSecret: 'your-secret-key',
      jwtExpiration: '1h',
    },
  };
  