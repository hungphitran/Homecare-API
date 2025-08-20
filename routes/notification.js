const router = require('express').Router();
const notificationController = require('../controller/notificationController');

// Public endpoints (you may add auth middleware later)
router.post('/register', notificationController.registerToken);
router.post('/send/token', notificationController.sendToToken);
router.post('/send/topic', notificationController.sendToTopic);
router.post('/subscribe', notificationController.subscribe);
router.post('/unsubscribe', notificationController.unsubscribe);

// Test và kiểm tra notification
router.post('/test', notificationController.testNotification);
router.get('/check/:phone', notificationController.checkTokenStatus);
router.get('/health', notificationController.healthCheck);

module.exports = router;
