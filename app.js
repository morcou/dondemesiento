const girlsListEl = document.getElementById("girlsList");
const girlTemplate = document.getElementById("girlTemplate");
const carEl = document.getElementById("car");
const statusEl = document.getElementById("status");

const randomizeBtn = document.getElementById("randomizeBtn");
const motionBtn = document.getElementById("motionBtn");

const SEATS = [
  { key: "back-left", label: "Atras izquierda (sillita)", fixedName: "Panchi" },
  { key: "back-center", label: "Atras centro" },
  { key: "back-right", label: "Atras derecha" },
  { key: "third-left", label: "3ra fila izquierda" },
  { key: "third-right", label: "3ra fila derecha" }
];

const girls = ["Panchi", "Toña", "Bruna", "Aida", "Clara"].map((name) => ({
  id: crypto.randomUUID(),
  name,
  photo: ""
}));

let motionEnabled = false;
let lastShakeTime = 0;
let currentAssignment = [];

function setStatus(text) {
  statusEl.textContent = text;
}

function readFileAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function renderGirls() {
  girlsListEl.innerHTML = "";

  girls.forEach((girl) => {
    const node = girlTemplate.content.firstElementChild.cloneNode(true);
    const nameInput = node.querySelector(".name-input");
    const photoInput = node.querySelector(".photo-input");

    nameInput.value = girl.name;

    photoInput.addEventListener("change", async (e) => {
      const [file] = e.target.files;
      if (!file) return;

      try {
        girl.photo = await readFileAsDataURL(file);
        setStatus(`Foto cargada para ${girl.name}.`);
        renderCar(currentAssignment);
      } catch (err) {
        setStatus("No pude leer la foto.");
      }
    });

    girlsListEl.appendChild(node);
  });
}

function shuffle(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function randomizeSeats(trigger = "manual") {
  const panchi = girls.find((g) => g.name.toLowerCase() === "panchi");
  const others = girls.filter((g) => g !== panchi);

  const shuffledOthers = shuffle(others);
  currentAssignment = SEATS.map((seat) => {
    if (seat.fixedName === "Panchi") {
      return { seat, girl: panchi };
    }
    return { seat, girl: shuffledOthers.shift() || null };
  });

  renderCar(currentAssignment);
  carEl.classList.remove("shake");
  void carEl.offsetWidth;
  carEl.classList.add("shake");

  const source = trigger === "shake" ? "Shake detectado" : "Lista mezclada";
  setStatus(`${source}. Panchi queda fija en la sillita.`);
}

function renderCar(assignment = []) {
  carEl.innerHTML = "";

  const backRow = document.createElement("div");
  backRow.className = "seat-row seat-row-back";

  const thirdRow = document.createElement("div");
  thirdRow.className = "seat-row seat-row-third";

  assignment.forEach(({ seat, girl }, index) => {
    const seatNode = createSeat(seat.label, girl);
    if (index < 3) {
      backRow.appendChild(seatNode);
    } else {
      thirdRow.appendChild(seatNode);
    }
  });

  carEl.appendChild(backRow);
  carEl.appendChild(thirdRow);
}

function createSeat(label, girl) {
  const seat = document.createElement("article");
  seat.className = "seat";

  const seatLabel = document.createElement("p");
  seatLabel.className = "seat-label";
  seatLabel.textContent = label;
  seat.appendChild(seatLabel);

  if (!girl) {
    const empty = document.createElement("p");
    empty.className = "empty";
    empty.textContent = "Libre";
    seat.appendChild(empty);
    return seat;
  }

  const img = document.createElement("img");
  img.className = "avatar";
  img.alt = `Foto de ${girl.name}`;
  img.src = girl.photo || "";
  if (!girl.photo) {
    img.style.visibility = "hidden";
  }

  const name = document.createElement("p");
  name.className = "name";
  name.textContent = girl.name;

  seat.appendChild(img);
  seat.appendChild(name);
  return seat;
}

function handleMotion(event) {
  const acc = event.accelerationIncludingGravity;
  if (!acc) return;

  const threshold = 22;
  const magnitude = Math.abs(acc.x) + Math.abs(acc.y) + Math.abs(acc.z);
  const now = Date.now();

  if (magnitude > threshold && now - lastShakeTime > 1100) {
    lastShakeTime = now;
    randomizeSeats("shake");
  }
}

async function enableMotion() {
  if (typeof DeviceMotionEvent === "undefined") {
    setStatus("Este navegador no soporta detector de shake.");
    return;
  }

  try {
    if (typeof DeviceMotionEvent.requestPermission === "function") {
      const response = await DeviceMotionEvent.requestPermission();
      if (response !== "granted") {
        setStatus("Permiso de movimiento rechazado.");
        return;
      }
    }

    if (!motionEnabled) {
      window.addEventListener("devicemotion", handleMotion);
      motionEnabled = true;
      setStatus("Shake activo. Sacudi el celu para randomizar.");
      motionBtn.textContent = "Shake activo";
    }
  } catch (err) {
    setStatus("No pude activar el detector de shake.");
  }
}

randomizeBtn.addEventListener("click", () => randomizeSeats("manual"));
motionBtn.addEventListener("click", enableMotion);

renderGirls();
randomizeSeats("manual");
