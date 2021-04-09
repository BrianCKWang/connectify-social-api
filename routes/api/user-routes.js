const router = require('express').Router();
const {
  getAllUser,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  addUserFriend,
  deleteUserFriend
} = require('../../controllers/user-controller');

router
  .route('/')
  .get(getAllUser)
  .post(createUser);

router
  .route('/:id')
  .get(getUserById)
  .put(updateUser)
  .delete(deleteUser);

router
  .route('/:id/friends/:friendId')
  .post(addUserFriend)
  .delete(deleteUserFriend);

module.exports = router;