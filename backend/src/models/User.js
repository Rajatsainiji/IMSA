const bcrypt = require('bcryptjs');

module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define('User', {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        notEmpty: { msg: 'Name is required' },
        len: { args: [2, 100], msg: 'Name must be between 2 and 100 characters' }
      }
    },
    email: {
      type: DataTypes.STRING(150),
      allowNull: false,
      unique: { msg: 'Email address already in use' },
      validate: {
        isEmail: { msg: 'Must be a valid email address' },
        notEmpty: { msg: 'Email is required' }
      }
    },
    password: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        notEmpty: { msg: 'Password is required' },
        len: { args: [6, 255], msg: 'Password must be at least 6 characters' }
      }
    },
    role: {
      type: DataTypes.ENUM('admin', 'manager', 'staff'),
      allowNull: false,
      defaultValue: 'staff'
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    lastLoginAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    refreshToken: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  }, {
    tableName: 'users',
    timestamps: true,
    hooks: {
      beforeCreate: async (user) => {
        if (user.password) {
          user.password = await bcrypt.hash(user.password, 12);
        }
      },
      beforeUpdate: async (user) => {
        if (user.changed('password')) {
          user.password = await bcrypt.hash(user.password, 12);
        }
      }
    },
    defaultScope: {
      attributes: { exclude: ['password', 'refreshToken'] }
    },
    scopes: {
      withPassword: { attributes: {} },
      withToken: { attributes: {} }
    }
  });

  // Instance methods
  User.prototype.validatePassword = async function (candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
  };

  User.prototype.toSafeObject = function () {
    const { password, refreshToken, ...safeUser } = this.toJSON();
    return safeUser;
  };

  // Associations
  User.associate = (db) => {
    User.hasMany(db.Order, { foreignKey: 'userId', as: 'orders' });
    User.hasMany(db.StockHistory, { foreignKey: 'userId', as: 'stockHistories' });
  };

  return User;
};
