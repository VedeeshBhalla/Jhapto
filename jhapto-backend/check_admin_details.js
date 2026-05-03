const db = require('./config/db');

async function checkAdmin() {
  try {
    const [admins] = await db.query('SELECT * FROM Admin');
    console.log('Admins:', admins);

    const [procs] = await db.query('SHOW PROCEDURE STATUS WHERE Db = DATABASE()');
    console.log('Procedures:', procs.map(p => p.Name));

    const [views] = await db.query('SHOW FULL TABLES IN ' + process.env.DB_NAME + ' WHERE TABLE_TYPE LIKE "VIEW"');
    console.log('Views:', views);
    
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}
checkAdmin();
