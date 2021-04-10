const { Schema, model, Types } = require('mongoose');

const ReactionsSchema = new Schema(
  {
    reactionId: {
      type: Schema.Types.ObjectId,
      default: () => new Types.ObjectId()
    },
    reactionBody: {
      type: String,
      required: true,
      trim: true
    },
    username: {
      type: String,
      required: true
    },
    createdAt: {
      type: Date,
      default: Date.now,
      get: createdAtVal => dateFormat(createdAtVal)
    }
  },
  {
    toJSON: {
      getters: true
    }
  }
);

const ThoughtSchema = new Schema(
  {
    thoughtText: {
      type: String,
      required: true
    },
    createdAt: {
      type: Date,
      default: Date.now,
      get: createdAtVal => dateFormat(createdAtVal)
    },
    username: {
      type: String,
      required: true
    },
    reactions: [ReactionsSchema]
  },
  {
    toJSON: {
      virtuals: true,
      getters: true
    }
  }
);

ReactionsSchema.path('reactionBody').validate(function(reactionBody) {
  return reactionBody.length <= 280;
}, 'reactionBody must be no more than 280 characters');

ThoughtSchema.path('thoughtText').validate(function(thoughtText) {
  return thoughtText >= 1 && thoughtText.length <= 280;
}, 'thoughtText must be between 1 to 280 characters');

const Thought = model('Thought', ThoughtSchema);

module.exports = Thought;