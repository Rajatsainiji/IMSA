require('dotenv').config();
const app = require('./app');
const { sequelize } = require('./models');
const config = require('./config/app');
const logger = require('./utils/logger');

const PORT = config.app.port;

const startServer = async () => {
  try {
    // Test database connection
    await sequelize.authenticate();
    logger.info('Database connection established successfully');

    // Sync models (use migrations in production)
    if (config.app.isDevelopment) {
      await sequelize.sync({ alter: false });
      logger.info('Database models synchronized');
    }

    const server = app.listen(PORT, () => {
      logger.info(`Server running in ${config.app.env} mode on port ${PORT}`);
      logger.info(`API Base URL: http://localhost:${PORT}/api/v1`);
    });

    // Graceful shutdown
    const gracefulShutdown = async (signal) => {
      logger.info(`${signal} received. Starting graceful shutdown...`);
      server.close(async () => {
        try {
          await sequelize.close();
          logger.info('Database connections closed');
          process.exit(0);
        } catch (err) {
          logger.error('Error during shutdown:', err);
          process.exit(1);
        }
      });
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
    });

    // Handle uncaught exceptions
    process.on('uncaughtException', (err) => {
      logger.error('Uncaught Exception:', err);
      process.exit(1);
    });

  } catch (error) {
    logger.error('Unable to start server:', error);
    process.exit(1);
  }
};

startServer();
