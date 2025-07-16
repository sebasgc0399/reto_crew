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

// XP necesaria para llegar al nivel N
function xpForLevel(n) {
  return 100 * n * n;
}
// Nivel a partir de XP total
function levelFromXp(xp) {
  return Math.floor(Math.sqrt(xp / 100));
}

// Helper para recalcular nivel de usuario
async function recalcUserLevel(userRef) {
  const snap = await userRef.get();
  const xp = snap.data().xp || 0;
  const newLevel = levelFromXp(xp);
  if (snap.data().level !== newLevel) {
    await userRef.update({ level: newLevel });
    console.log(`Usuario ${userRef.id} → nivel ${newLevel}`);
  }
}

async function loadChallenge(chId) {
  const challengeSnap = await db.collection("challenges").doc(chId).get();
  if (!challengeSnap.exists) throw new Error(`Reto ${chId} no existe`);
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
  const avg = participantsSnap.size ? totalW / participantsSnap.size : 0;
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
    const entriesSnap = await db
      .collection("challenges").doc(chId)
      .collection("entries")
      .where("userId", "==", uid)
      .get();

    entriesSnap.forEach(eDoc => {
      const { value, multiplier: m } = eDoc.data();
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

    batch.update(
      db.doc(`challenges/${chId}/participants/${uid}`),
      { totalPoints: totalPts }
    );
  }
  await batch.commit();
  console.log(`Recalculados puntos completos en reto ${chId}`);
}

/** ————————————————————————————————
 * 3) Triggers
 * ———————————————————————————————— */

// 3.a) Inicializar usuario al crearlo
exports.onUserCreate = onDocumentCreated(
  "users/{uid}",
  async event => {
    const userRef = db.doc(`users/${event.params.uid}`);
    try {
      await userRef.set({
        xp: 0,
        level: 0,
        completedChallenges: 0,
        bests: {},
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      }, { merge: true });
      console.log(`Usuario ${event.params.uid} inicializado`);
    } catch (err) {
      console.error("Error en onUserCreate:", err);
    }
  }
);

// 3.b) Al crear una entry: recálculo puntual + totalPoints + XP + nivel
exports.onNewEntry = onDocumentCreated(
  "challenges/{chId}/entries/{eId}",
  async event => {
    const { chId } = event.params;
    const data = event.data.data();
    const userId = data.userId;
    const entryRef = event.data.ref;
    const userRef = db.doc(`users/${userId}`);

    try {
      // 1) carga participante y reto
      const [partSnap, chSnap] = await Promise.all([
        db.doc(`challenges/${chId}/participants/${userId}`).get(),
        db.doc(`challenges/${chId}`).get()
      ]);
      if (!partSnap.exists || !chSnap.exists) return null;

      const weight = partSnap.data().weight;
      const { activity: { valorMaximo, multiplier: defMul }, refWeight } = chSnap.data();
      const pts = calcularPuntos(data.value, weight, refWeight, valorMaximo, data.multiplier ?? defMul);

      // 2) Batch atómico
      const batch = db.batch();
      batch.update(entryRef, { points: pts });
      batch.update(
        db.doc(`challenges/${chId}/participants/${userId}`),
        { totalPoints: FieldValue.increment(pts) }
      );
      batch.update(userRef, { xp: FieldValue.increment(pts) });
      await batch.commit();

      // 3) Recalcula nivel
      await recalcUserLevel(userRef);
    } catch (err) {
      console.error("Error en onNewEntry:", err);
    }
  }
);

// 3.c) Al borrar una entry: resta XP y nivel
exports.onDeleteEntry = onDocumentDeleted(
  "challenges/{chId}/entries/{eId}",
  async event => {
    const data = event.data.data();
    const userId = data.userId;
    const oldPts = data.points || 0;
    if (oldPts === 0) return null;
    const userRef = db.doc(`users/${userId}`);

    try {
      // Atómico
      const batch = db.batch();
      batch.update(userRef, { xp: FieldValue.increment(-oldPts) });
      await batch.commit();
      await recalcUserLevel(userRef);
    } catch (err) {
      console.error("Error en onDeleteEntry:", err);
    }
  }
);

// 3.d) Resto de triggers de retos...
exports.recalcOnCreate = onDocumentCreated(
  "challenges/{chId}/participants/{uid}",
  async event => { try { await recalcRefWeight(event.params.chId); } catch(e){console.error(e);} }
);
exports.recalcOnUpdate = onDocumentUpdated(
  "challenges/{chId}/participants/{uid}",
  async event => { try { await recalcRefWeight(event.params.chId); } catch(e){console.error(e);} }
);
exports.onParticipantDeleted = onDocumentDeleted(
  "challenges/{chId}/participants/{uid}",
  async event => {
    const { chId, uid } = event.params;
    try {
      const entries = await db.collection(`challenges/${chId}/entries`)
        .where("userId","==",uid).get();
      const batch = db.batch();
      entries.forEach(e => batch.delete(e.ref));
      await recalcRefWeight(chId);
      await batch.commit();
    } catch(e){ console.error(e); }
  }
);

exports.onChallengeEnd = onDocumentUpdated(
  "challenges/{chId}",
  async event => {
    const before = event.data.before.data();
    const after  = event.data.after.data();
    const chRef  = event.data.ref;
    const nowMs  = admin.firestore.Timestamp.now().toMillis();

    // 1) Sólo si tiene endDate y aún no lo procesamos
    if (!after.endDate || after.processedCompleted) return null;

    const endBefore = before.endDate?.toMillis?.() || 0;
    const endAfter  = after.endDate.toMillis();

    // 2) Que el reto efectivamente acabe (por cambio de fecha o que ya esté pasado)
    //    - Si endDate cambió, o si endDate ya está en el pasado
    if (endAfter === endBefore && endAfter > nowMs) return null;

    // 3) Leemos participantes y hacemos batch de incrementos
    const partsSnap = await db
      .collection("challenges")
      .doc(event.params.chId)
      .collection("participants")
      .get();

    const batch = db.batch();
    partsSnap.docs.forEach(part => {
      // sólo cuenta si realmente participó (p. ej. totalPoints > 0)
      if ((part.data().totalPoints || 0) > 0) {
        const userRef = db.doc(`users/${part.id}`);
        batch.update(userRef, {
          completedChallenges: FieldValue.increment(1)
        });
      }
    });

    // 4) Marcamos el reto como procesado
    batch.update(chRef, { processedCompleted: true });

    return batch.commit();
  }
);

exports.recalcPointsOnRefWeightChange = onDocumentUpdated(
  "challenges/{chId}",
  async event => {
    const before = event.data.before.data();
    const after  = event.data.after.data();
    if (before.refWeight !== after.refWeight) {
      await recalcAllPoints(event.params.chId);
    }
  }
);

exports.onUserWeightChange = onDocumentUpdated(
  "users/{uid}",
  async event => {
    const before = event.data.before.data();
    const after  = event.data.after.data();
    if (before.weight === after.weight) return null;
    const uid = event.params.uid, newW = after.weight;
    // actualiza todos sus participants.weight + recalc refs/points...
    const parts = await db.collectionGroup("participants")
      .where("uid","==",uid).get();
    const batch = db.batch();
    const retos = new Set();
    parts.forEach(ps => {
      batch.update(ps.ref, { weight: newW });
      retos.add(ps.ref.parent.parent.id);
    });
    await batch.commit();
    for (let chId of retos) {
      await recalcRefWeight(chId);
      await recalcAllPoints(chId);
    }
  }
);

/**
 * Cuando se borra una entry, si era la marca mejor para esa actividad,
 * recalcula el siguiente mejor valor (o elimina la clave si ya no hay entradas).
 */
exports.onEntryDeletedUpdateBests = onDocumentDeleted(
  "challenges/{chId}/entries/{eId}",
  async (event) => {
    const data = event.data.data();
    const userId = data.userId;
    const activityKey = data.activityKey;
    const deletedValue = data.value;

    const userRef = db.doc(`users/${userId}`);
    const userSnap = await userRef.get();
    if (!userSnap.exists()) return null;

    const bests = userSnap.data().bests || {};
    // Si la entry borrada NO coincide con la mejor marca actual, no hacemos nada
    if (bests[activityKey] !== deletedValue) return null;

    // Buscamos la siguiente mejor marca
    const entriesSnap = await db
      .collectionGroup("entries")
      .where("userId", "==", userId)
      .where("activityKey", "==", activityKey)
      .orderBy("value", "desc")
      .limit(1)
      .get();

    if (entriesSnap.empty) {
      // Ya no hay marcas para esa actividad: borramos la clave
      await userRef.update({
        [`bests.${activityKey}`]: FieldValue.delete(),
      });
    } else {
      // Actualizamos al siguiente valor más alto
      const newBest = entriesSnap.docs[0].data().value;
      await userRef.update({
        [`bests.${activityKey}`]: newBest,
      });
    }
  }
);

/**
 * Cuando se elimina un participante de un reto, borramos todas sus entries
 * (ya lo haces) y luego recalculamos *todas* sus mejores marcas desde cero.
 */
exports.onParticipantDeletedRecalcBests = onDocumentDeleted(
  "challenges/{chId}/participants/{uid}",
  async (event) => {
    const userId = event.params.uid;
    const userRef = db.doc(`users/${userId}`);

    // 1) Obtenemos *todas* las entries de ese usuario
    const entriesSnap = await db
      .collectionGroup("entries")
      .where("userId", "==", userId)
      .get();

    // 2) Agrupamos valor máximo por activityKey
    const newBests = {};
    entriesSnap.docs.forEach((docSnap) => {
      const { activityKey, value } = docSnap.data();
      if (
        newBests[activityKey] == null ||
        value > newBests[activityKey]
      ) {
        newBests[activityKey] = value;
      }
    });

    // 3) Actualizamos el campo bests completo
    await userRef.update({ bests: newBests });
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