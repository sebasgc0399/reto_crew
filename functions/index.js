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

exports.recalcPointsOnRefWeightChange = onDocumentUpdated(
  "challenges/{chId}",
  async (event) => {
    const before = event.data.before.data();
    const after  = event.data.after.data();
    const { chId } = event.params;

    // 1) Sólo nos interesa si cambió refWeight
    if (before.refWeight === after.refWeight) return null;

    // Si quieres usar el *nuevo* refWeight como denominador:
    const ref = after.refWeight;
    // Si en cambio quieres usar el *anterior*:
    // const ref = before.refWeight;

    // 2) Leemos todos los participantes
    const partsSnap = await db
      .collection("challenges")
      .doc(chId)
      .collection("participants")
      .get();

    // Preparamos un batch
    const batch = db.batch();

    // 3) Por cada participante:
    for (const partDoc of partsSnap.docs) {
      const uid    = partDoc.id;
      const { weight } = partDoc.data();

      // 3.1) Leemos sus entradas
      const entriesSnap = await db
        .collection("challenges")
        .doc(chId)
        .collection("entries")
        .where("userId", "==", uid)
        .get();

      let newTotal = 0;

      // 3.2) Por cada entry, recalculamos y la marcamos en el batch
      entriesSnap.forEach(eDoc => {
        const d = eDoc.data();
        const newPoints = d.value * d.multiplier * (weight / ref);

        // Actualiza el campo points de la entry
        batch.update(eDoc.ref, { points: newPoints });

        newTotal += newPoints;
      });

      // 3.3) Finalmente actualiza el totalPoints del participante
      batch.update(partDoc.ref, { totalPoints: newTotal });
    }

    // 4) Ejecuta todo de una
    await batch.commit();
    console.log(`Recalculados puntos en entradas y totales de participantes de ${chId}`);
    return null;
  }
);