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
 * Nueva fórmula de puntos, idéntica a utils/points.js
 */
function calcularPuntos(valor, pesoUsuario, pesoReferencia, valorMaximo, multiplicador = 1) {
  // Paso 1: Normalizar valor
  let valorNormalizado;
  if (valor <= valorMaximo) {
    valorNormalizado = valor / valorMaximo;
  } else {
    valorNormalizado = 1 + (0.1 * Math.log(valor / valorMaximo));
  }

  // Paso 2: Calcular factor de peso
  const ratio = pesoUsuario / pesoReferencia;
  let factorPeso;
  if (ratio <= 0.8) {
    factorPeso = 0.85 + (0.15 * (ratio / 0.8));
  } else if (ratio <= 1.2) {
    factorPeso = 1.0 - (0.1 * Math.abs(ratio - 1));
  } else {
    factorPeso = 1.0 + (0.15 * Math.log(ratio));
  }

  // Paso 3: Escalar a base 100 y aplicar multiplicador
  const puntosBase  = valorNormalizado * 100;
  const puntosFinal = puntosBase * factorPeso * multiplicador;

  return Math.round(puntosFinal);
}

/**
 * 1) Cuando creas una entrada, recálculo server-side y sumo totalPoints
 */
exports.onNewEntry = onDocumentCreated(
  "challenges/{chId}/entries/{eId}",
  async (event) => {
    const snap = event.data;        
    const data = snap.data();       
    const { chId } = event.params;

    // 1) Lectura de pesoUsuario y pesoReferencia y config de reto
    const [ challengeSnap, partSnap ] = await Promise.all([
      db.collection("challenges").doc(chId).get(),
      db.collection("challenges").doc(chId)
        .collection("participants").doc(data.userId).get()
    ]);
    if (!challengeSnap.exists || !partSnap.exists) return null;

    const challenge = challengeSnap.data();
    const activity  = challenge.activity || {};
    const pesoUsuario    = partSnap.data().weight;
    const pesoReferencia = challenge.refWeight || pesoUsuario;
    const valorMaximo    = activity.valorMaximo || 1;
    const multiplicador  = activity.multiplier  || 1;

    // 2) Recalcular puntos con la nueva fórmula
    const newPoints = calcularPuntos(
      data.value,
      pesoUsuario,
      pesoReferencia,
      valorMaximo,
      multiplicador
    );

    // 3) Actualizar entry (opcional) y sumar al totalPoints
    const entryRef = snap.ref;
    const partRef  = db
      .collection("challenges").doc(chId)
      .collection("participants").doc(data.userId);

    const batch = db.batch();
    batch.update(entryRef,      { points: newPoints });
    batch.update(partRef, {
      totalPoints: FieldValue.increment(newPoints)
    });

    await batch.commit();
    console.log(`Entry ${event.params.eId} recalc a ${newPoints} pts`);
    return null;
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

exports.recalcOnCreate = onDocumentCreated(
  "challenges/{chId}/participants/{uid}", recalcRefWeight
);
exports.recalcOnUpdate = onDocumentUpdated(
  "challenges/{chId}/participants/{uid}", recalcRefWeight
);
exports.recalcOnDelete = onDocumentDeleted(
  "challenges/{chId}/participants/{uid}", recalcRefWeight
);

/**
 * 5) Al cambiar refWeight, recálculo **todos** los puntos con la nueva fórmula
 */
exports.recalcPointsOnRefWeightChange = onDocumentUpdated(
  "challenges/{chId}", 
  async (event) => {
    const before = event.data.before.data();
    const after  = event.data.after.data();
    const { chId } = event.params;
    if (before.refWeight === after.refWeight) return null;

    const refWeight = after.refWeight;
    // Leer config de actividad del reto
    const challengeSnap = await db.collection("challenges").doc(chId).get();
    const activity      = challengeSnap.data().activity || {};
    const valorMaximo   = activity.valorMaximo || 1;
    const multiplicador = activity.multiplier  || 1;

    // Batch para actualizar entradas y participantes
    const batch = db.batch();

    // Recalcular para cada participante
    const partsSnap = await db
      .collection("challenges").doc(chId)
      .collection("participants").get();

    for (const partDoc of partsSnap.docs) {
      const uid         = partDoc.id;
      const pesoUsuario = partDoc.data().weight;

      // 1) Releer entradas
      const entriesSnap = await db
        .collection("challenges").doc(chId)
        .collection("entries")
        .where("userId", "==", uid)
        .get();

      let nuevoTotal = 0;
      entriesSnap.forEach(eDoc => {
        const d = eDoc.data();
        const pts = calcularPuntos(
          d.value,
          pesoUsuario,
          refWeight,
          valorMaximo,
          multiplicador
        );
        batch.update(eDoc.ref, { points: pts });
        nuevoTotal += pts;
      });

      // 2) Actualizar totalPoints del participante
      batch.update(partDoc.ref, { totalPoints: nuevoTotal });
    }

    await batch.commit();
    console.log(`Recalculados puntos en reto ${chId} con nuevo refWeight`);
    return null;
  }
);
