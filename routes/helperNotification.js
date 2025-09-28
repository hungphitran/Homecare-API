const router = require('express').Router();
const helperNotificationController = require('../controller/helperNotificationController');

// Helper notification endpoints
router.post('/register', helperNotificationController.registerToken);
router.post('/send/token', helperNotificationController.sendToToken);
router.post('/send/phone', helperNotificationController.sendToHelperPhone);
router.post('/send/helper-id', helperNotificationController.sendToHelperId);
router.post('/send/topic', helperNotificationController.sendToTopic);
router.post('/subscribe', helperNotificationController.subscribe);
router.post('/unsubscribe', helperNotificationController.unsubscribe);

// Test và kiểm tra helper notification
router.post('/test', helperNotificationController.testNotification);
router.get('/check/:identifier', helperNotificationController.checkTokenStatus); // Có thể check by phone or helper_id với query param type
router.get('/health', helperNotificationController.healthCheck);

module.exports = router;