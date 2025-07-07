# 🏋️‍♂️ RetoCrew

**RetoCrew** es una aplicación web colaborativa para crear y participar en retos deportivos (flexiones, dominadas, sentadillas, carreras, etc.), registrar entradas diarias y comparar el progreso mediante un sistema de puntos normalizado.

---

## 📌 Características

- **Autenticación** con Google (Firebase Auth).
- **CRUD** de retos:
  - Crear / editar retos con título, descripción, fechas y tipo de actividad.
  - Selector de actividad (flexiones, dominadas, sentadillas, carrera) con unidad y normalización por peso.
- **Inscripción** de participantes a retos:
  - Auto‐inscripción del creador al crear un reto.
  - Opción para que otros usuarios se unan ingresando su peso.
- **Registro de entradas**:
  - Formulario dinámico que adapta etiqueta, unidad y fórmula según la actividad.
  - Cálculo de puntos proporcional al esfuerzo (reps × multiplicador × (peso / refWeight)).
- **Dashboard de reto** en tiempo real:
  - Leaderboard con actualización instantánea (`onSnapshot`).
  - Tabla de entradas recientes con nombre de usuario, actividad, valor, puntos y fecha.
- **Dashboard personal**:
  - Selección de reto activo entre los que ch participe.
  - Visualización de puntos totales y posición en ese reto.
- **UI reutilizable**:
  - Componente `<Loader />`, `<ProtectedRoute />`, `<PublicRoute />`, campos de formulario genéricos, tooltips, etc.
- **Seguridad**:
  - Reglas de Firestore que limitan lectura/ escritura según `auth.uid` y validan esquemas.
  - Cloud Functions para llevar el acumulado de `totalPoints` y recalcular `refWeight` dinámicamente.

---

## 🛠️ Tecnologías

- **Front‐end**: React (Vite / Create React App / Craco), React Router v6, Context API.
- **UI**: CSS modular, componentes reutilizables, React Datepicker, Tippy.js para tooltips.
- **Back‐end**: Firebase
  - **Auth**: Google Sign‐In  
  - **Firestore**: `challenges`, `participants`, `entries`, `users`  
  - **Cloud Functions**: triggers `onCreate` y `onWrite` para lógica de puntos y refWeight
- **Herramientas**: ESLint, Prettier, Git, VSCode.


---

## 🚀 Instalación y desarrollo

1.  **Clonar el repositorio**

    ```bash
    git clone [https://github.com/sebasgc0399/reto_crew](https://github.com/sebasgc0399/reto_crew)
    cd retocrew
    ```

2.  **Instalar dependencias**

    ```bash
    npm install
    # o
    yarn install
    ```

3.  **Configurar Firebase**

    Crea un proyecto en [Firebase Console](https://console.firebase.google.com/).

    Habilita Authentication (Google), Firestore, Functions.

    Copia tus credenciales en `src/firebaseConfig.js`.

4.  **Ejecutar localmente**

    ```bash
    npm start
    # o
    yarn start
    ```

    Abre `http://localhost:3000`.

5.  **Deploy a Firebase Hosting + Functions**

    ```bash
    firebase deploy --only hosting,functions
    ```

---

## ⚙️ Scripts útiles

-   `npm start`: Inicia la app en modo desarrollo.
-   `npm run build`: Genera la versión de producción en `build/`.
-   `firebase deploy --only functions`: Despliega solo las Cloud Functions.
-   `firebase deploy --only hosting`: Despliega solo la parte web.

---

## 🤝 Contribuciones

¡Las contribuciones son bienvenidas!

1.  Haz un fork.
2.  Crea una branch: `git checkout -b feature/nueva-funcionalidad`.
3.  Haz commit de tus cambios: `git commit -m 'Agrega nueva característica'`.
4.  Envía un pull request.

---

## 📄 Licencia

Este proyecto está bajo la licencia MIT. Consulta el archivo LICENSE para más detalles.

