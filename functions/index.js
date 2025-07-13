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

/** ————————————————
 * 1) Fórmula de puntos
 * ———————————————— */
function calcularPuntos(valor, pesoUsuario, pesoReferencia, valorMaximo, multiplicador = 1) {
  const valorNormalizado = valor <= valorMaximo
    ? valor / valorMaximo
    : 1 + 0.1 * Math.log(valor / valorMaximo);

  const ratio = pesoUsuario / pesoReferencia;
  let factorPeso;
  if (ratio <= 0.8) {
    factorPeso = 0.85 + 0.15 * (ratio / 0.8);
  } else if (ratio <= 1.2) {
    factorPeso = 1 - 0.1 * Math.abs(ratio - 1);
  } else {
    factorPeso = 1 + 0.15 * Math.log(ratio);
  }

  return Math.round(valorNormalizado * 100 * factorPeso * multiplicador);
}

/** ————————————————————————————————
 * 2) Helpers comunes para cada reto
 * ———————————————————————————————— */
/**
 * Lee la configuración del reto y sus participantes.
 * @returns { activity, refWeight, participantsSnap }
 */
async function loadChallenge(chId) {
  const challengeSnap = await db.collection("challenges").doc(chId).get();
  if (!challengeSnap.exists) throw new Error("Reto no existe");
  const { activity, refWeight = 0 } = challengeSnap.data();
  const participantsSnap = await db
    .collection("challenges")
    .doc(chId)
    .collection("participants")
    .get();
  return { activity, refWeight, participantsSnap };
}

/**
 * 2.a) Recalcula refWeight (promedio de pesos) y lo almacena.
 */
async function recalcRefWeight(chId) {
  const { participantsSnap } = await loadChallenge(chId);
  const totalW = participantsSnap.docs
    .map(d => d.data().weight || 0)
    .reduce((sum, w) => sum + w, 0);
  const avg   = participantsSnap.size ? totalW / participantsSnap.size : 0;
  await db.doc(`challenges/${chId}`).update({ refWeight: avg });
  console.log(`refWeight ${chId} → ${avg.toFixed(2)}`);
}

/**
 * 2.b) Recalcula TODOS los puntos de un reto (entries + totalPoints).
 */
async function recalcAllPoints(chId) {
  const { activity, refWeight, participantsSnap } = await loadChallenge(chId);
  const { valorMaximo = 1, multiplier = 1 } = activity;

  const batch = db.batch();
  for (const partDoc of participantsSnap.docs) {
    const uid = partDoc.id;
    let totalPts = 0;

    // Relee entradas de este usuario
    const entriesSnap = await db
      .collection("challenges").doc(chId)
      .collection("entries")
      .where("userId", "==", uid)
      .get();

    entriesSnap.forEach(eDoc => {
      const { value, unit, multiplier: m } = eDoc.data();
      const pts = calcularPuntos(
        value,
        partDoc.data().weight,
        refWeight,
        valorMaximo,
        m ?? multiplier
      );
      batch.update(eDoc.ref, { points: pts });
      totalPts += pts;
    });

    // Actualiza totalPoints del participante
    batch.update(partDoc.ref, { totalPoints: totalPts });
  }

  await batch.commit();
  console.log(`Recalculados puntos completos en reto ${chId}`);
}

/** ————————————————————————————————
 * 3) Triggers
 * ———————————————————————————————— */

/**
 * Al crear una entry: recálculo puntual + sumo totalPoints
 */
exports.onNewEntry = onDocumentCreated(
  "challenges/{chId}/entries/{eId}",
  async event => {
    const { chId, eId } = event.params;
    const data = event.data.data();
    // recalc puntual
    const partDoc = await db
      .collection("challenges").doc(chId)
      .collection("participants").doc(data.userId)
      .get();
    if (!partDoc.exists) return null;

    const challengeSnap = await db.collection("challenges").doc(chId).get();
    const { activity, refWeight = partDoc.data().weight } = challengeSnap.data();

    const newPts = calcularPuntos(
      data.value,
      partDoc.data().weight,
      refWeight,
      activity.valorMaximo,
      activity.multiplier
    );

    const batch = db.batch();
    batch.update(event.data.ref, { points: newPts });
    batch.update(
      db.collection("challenges").doc(chId)
        .collection("participants").doc(data.userId),
      { totalPoints: FieldValue.increment(newPts) }
    );
    await batch.commit();
    console.log(`Entry ${eId} → ${newPts}pts`);
  }
);

/**
 * Cada vez que cambia ANY DE ESTOS:
 *  • participants/{uid}  → recalcRefWeight
 *  • challenges/{chId}   → recalcAllPoints si cambió refWeight
 */
exports.recalcOnCreate = onDocumentCreated("challenges/{chId}/participants/{uid}", recalcRefWeight);
exports.recalcOnUpdate = onDocumentUpdated("challenges/{chId}/participants/{uid}", recalcRefWeight);
exports.recalcOnDelete = onDocumentDeleted("challenges/{chId}/participants/{uid}", recalcRefWeight);

exports.recalcPointsOnRefWeightChange = onDocumentUpdated(
  "challenges/{chId}",
  async event => {
    const before = event.data.before.data(), after = event.data.after.data();
    if (before.refWeight !== after.refWeight) {
      await recalcAllPoints(event.params.chId);
    }
  }
);

/**
 * Cuando cambia weight en users/{uid}:
 *  • Actualiza weight en TODOS sus participants/
 *  • Para cada reto único: recalcRefWeight + recalcAllPoints
 */
exports.onUserWeightChange = onDocumentUpdated(
  "users/{uid}",
  async event => {
    const before = event.data.before.data(), after = event.data.after.data();
    if (before.weight === after.weight) return null;
    const uid = event.params.uid, newW = after.weight;

    // 1) actualiza participants.weight
    const partsSnap = await db
      .collectionGroup("participants")
      .where("uid","==",uid)
      .get();
    if (partsSnap.empty) return null;

    const batch = db.batch();
    const retos = new Set();
    partsSnap.forEach(ps => {
      batch.update(ps.ref, { weight: newW });
      retos.add(ps.ref.parent.parent.id);
    });
    await batch.commit();

    // 2) para cada reto: recalcRefWeight + recalcAllPoints
    for (const chId of retos) {
      await recalcRefWeight(chId);
      await recalcAllPoints(chId);
    }
  }
);

exports.onUserNameDelete = onDocumentUpdated(
  'users/{uid}',
  async (event) => {
    const before = event.data.before.data()
    const after  = event.data.after.data()
    const { uid } = event.params

    // solo si antes había name y ahora no…
    if (before.name && !after.name) {
      // borra el displayName de Auth
      await admin.auth().updateUser(uid, { displayName: null })
    }
  }
)