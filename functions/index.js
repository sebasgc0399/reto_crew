const { onDocumentCreated } = require("firebase-functions/v2/firestore");
const admin = require("firebase-admin");

admin.initializeApp();
const db = admin.firestore();
const FieldValue = admin.firestore.FieldValue;

exports.onNewEntry = onDocumentCreated(
  "challenges/{chId}/entries/{eId}",
  async (event) => {
    // event.data es un DocumentSnapshot en v2
    const snapshot = event.data;
    const { points, userId } = snapshot.data();
    const { chId } = event.params;

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
        `Se agregaron ${points} pts a ${userId} en el reto ${chId}`
      );
    } catch (error) {
      console.error(
        `Error actualizando totalPoints para ${userId} en ${chId}:`,
        error
      );
    }
  }
);
