// Correctly import the class from the 'default' export
const PayOS = require('@payos/node')

// Now, the 'PayOS' variable holds the actual constructor
const payos = new PayOS.PayOS(
  process.env.PAYOS_CLIENT_ID,
  process.env.PAYOS_API_KEY,
  process.env.PAYOS_CHECKSUM_KEY
);




module.exports = payos;