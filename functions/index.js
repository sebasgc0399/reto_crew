const functions = require("firebase-functions");
const admin = require("firebase-admin");

admin.initializeApp();
const db = admin.firestore();
const FieldValue = admin.firestore.FieldValue;

/**
 * Trigger que se ejecuta cada vez que se crea una nueva entry
 * en challenges/{chId}/entries/{eId}, y suma puntos al participante.
 */
exports.onNewEntry = functions
  .region("us-central1")
  .firestore.document("challenges/{chId}/entries/{eId}")
  .onCreate(async (snapshot, context) => {
    const entryData = snapshot.data();
    const { points, userId } = entryData;
    const chId = context.params.chId;

    const participantRef = db
      .collection("challenges")
      .doc(chId)
      .collection("participants")
      .doc(userId);

    try {
      await participantRef.update({
        totalPoints: FieldValue.increment(points),
      });
      console.log(
        `Se agregaron ${points} puntos a ${userId} en el reto ${chId}.`
      );
    } catch (error) {
      console.error(
        `Error actualizando totalPoints para ${userId} en reto ${chId}:`,
        error
      );
    }
  });
