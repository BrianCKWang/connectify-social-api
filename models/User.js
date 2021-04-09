const { Schema, model, Types } = require('mongoose');
// const dateFormat = require('../utils/dateFormat');

const UserSchema = new Schema(
  {
    username: {
      type: String,
      unique: true,
      required: true,
      trim: true
    },
    email: {
      type: String,
      unique: true,
      required: true
    },
    thoughts: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Thought'
      }
    ],
    friends: [UserSchema]
  },
  {
    toJSON: {
      virtuals: true,
      getters: true
    },
    id: false
  }
);

UserSchema.path('email').validate(function (email) {
  var emailRegex = /^([\w-\.]+@([\w-]+\.)+[\w-]{2,4})?$/;
  return emailRegex.test(email.text); // Assuming email has a text attribute
}, 'The e-mail field cannot be empty.');

UserSchema.virtual('friendCount').get(function() {
  return this.friends.length;
});

const User = model('User', UserSchema);

module.exports = User;