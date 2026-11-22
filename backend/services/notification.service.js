
export const createNotification = async (db, userId, complaintId, message) => {
  const result = await db.query(
    `INSERT INTO notifications(user_id,complaint_id,message)
     VALUES($1,$2,$3) RETURNING *`,
    [userId, complaintId, message]
  );

  await db.query(
    "SELECT pg_notify('new_notification',$1)",
    [JSON.stringify(result.rows[0])]
  );

  return result.rows[0];
};

export const notifyAdmins = async (db, complaintId, message) => {
  const result = await db.query(
    `INSERT INTO notifications(user_id,complaint_id,message)
     SELECT id,$1,$2 FROM users WHERE role='admin'
     RETURNING *`,
    [complaintId, message]
  );

  for (const notification of result.rows) {
    await db.query(
      "SELECT pg_notify('new_notification',$1)",
      [JSON.stringify(notification)]
    );
  }
};
