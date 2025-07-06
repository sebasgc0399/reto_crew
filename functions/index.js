// functions/index.js
const admin = require("firebase-admin");
const {
  onDocumentCreated,
  onDocumentUpdated,
  onDocumentDeleted,
} = require("firebase-functions/v2/firestore");

admin.initializeApp();
const db = admin.firestore();
const FieldValue = admin.firestore.FieldValue;

/**
 * 1) Cuando creas una entrada, incrementa totalPoints
 */
exports.onNewEntry = onDocumentCreated(
  "challenges/{chId}/entries/{eId}",
  async (event) => {
    const snap = event.data;                       // Snapshot de la nueva entry
    const { points, userId } = snap.data();        // extrae puntos y uid
    const { chId } = event.params;

    const partRef = db
      .collection("challenges")
      .doc(chId)
      .collection("participants")
      .doc(userId);

    try {
      await partRef.update({
        totalPoints: FieldValue.increment(points),
      });
      console.log(`+${points} pts a ${userId} en reto ${chId}`);
    } catch (err) {
      console.error(`Error incrementando pts:`, err);
    }
  }
);

/**
 * Función común que recalcula refWeight = promedio de todos los pesos
 */
async function recalcRefWeight(event) {
  const { chId } = event.params;
  const partsSnap = await db
    .collection(`challenges/${chId}/participants`)
    .get();

  if (partsSnap.empty) {
    // Si ya no hay participantes
    await db.doc(`challenges/${chId}`).update({ refWeight: 0 });
    console.log(`refWeight ${chId} → 0 (sin participantes)`);
    return null;
  }

  let totalW = 0;
  partsSnap.forEach(d => {
    const w = d.data().weight;
    totalW += (typeof w === "number" ? w : 0);
  });
  const avgW = totalW / partsSnap.size;

  await db.doc(`challenges/${chId}`).update({ refWeight: avgW });
  console.log(`refWeight ${chId} → ${avgW.toFixed(2)}`);
  return null;
}

/**
 * 2) Recalcula al crear participante
 */
exports.recalcOnCreate = onDocumentCreated(
  "challenges/{chId}/participants/{uid}",
  recalcRefWeight
);

/**
 * 3) Recalcula al actualizar participante
 */
exports.recalcOnUpdate = onDocumentUpdated(
  "challenges/{chId}/participants/{uid}",
  recalcRefWeight
);

/**
 * 4) Recalcula al borrar participante
 */
exports.recalcOnDelete = onDocumentDeleted(
  "challenges/{chId}/participants/{uid}",
  recalcRefWeight
);
