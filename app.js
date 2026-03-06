const carEl = document.getElementById("car");
const randomizeBtn = document.getElementById("randomizeBtn");

const FALLBACK_AVATAR =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140' viewBox='0 0 140 140'%3E%3Crect width='140' height='140' fill='%23cbd5e1'/%3E%3Ccircle cx='70' cy='52' r='26' fill='%2394a3b8'/%3E%3Crect x='32' y='88' width='76' height='40' rx='20' fill='%2394a3b8'/%3E%3C/svg%3E";

const FRONT_SEATS = [
  { key: "driver", label: "Conductor", fixedText: "Vos" },
  { key: "copilot", label: "Acompanante", fixedText: "Libre" }
];

const SEATS = [
  { key: "back-left", label: "Atras izquierda (sillita)", fixedName: "Panchi" },
  { key: "back-center", label: "Atras centro" },
  { key: "back-right", label: "Atras derecha" },
  { key: "third-left", label: "3ra fila izquierda" },
  { key: "third-right", label: "3ra fila derecha" }
];

const girls = [
  { name: "Panchi", photo: "./photos/panchi.jpg" },
  { name: "Toña", photo: "./photos/tona.jpg" },
  { name: "Bruna", photo: "./photos/bruna.jpg" },
  { name: "Aida", photo: "./photos/aida.jpg" },
  { name: "Clara", photo: "./photos/clara.jpg" }
];

let motionEnabled = false;
let lastShakeTime = 0;
let currentAssignment = [];

function shuffle(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function randomizeSeats() {
  const panchi = girls.find((g) => g.name === "Panchi");
  const others = girls.filter((g) => g.name !== "Panchi");

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
}

function renderCar(assignment = []) {
  carEl.innerHTML = "";

  const shell = document.createElement("section");
  shell.className = "car-shell";

  const frontRow = document.createElement("div");
  frontRow.className = "seat-row seat-row-front";
  FRONT_SEATS.forEach((seat) => {
    frontRow.appendChild(createFixedSeatCard(seat));
  });

  const middleRow = document.createElement("div");
  middleRow.className = "seat-row seat-row-middle";

  const thirdRow = document.createElement("div");
  thirdRow.className = "seat-row seat-row-third";

  assignment.forEach(({ seat, girl }) => {
    if (seat.key.startsWith("back-")) {
      middleRow.appendChild(createPassengerSeatCard(seat, girl));
      return;
    }
    thirdRow.appendChild(createPassengerSeatCard(seat, girl));
  });

  shell.appendChild(frontRow);
  shell.appendChild(middleRow);
  shell.appendChild(thirdRow);
  carEl.appendChild(shell);
}

function createFixedSeatCard(seat) {
  const card = document.createElement("article");
  card.className = "seat seat-front";

  const seatLabel = document.createElement("p");
  seatLabel.className = "seat-label";
  seatLabel.textContent = seat.label;
  card.appendChild(seatLabel);

  const text = document.createElement("p");
  text.className = "name";
  text.textContent = seat.fixedText;
  card.appendChild(text);

  return card;
}

function createPassengerSeatCard(seat, girl) {
  const card = document.createElement("article");
  card.className = "seat";
  if (seat.fixedName) {
    card.classList.add("seat-fixed");
  }

  const seatLabel = document.createElement("p");
  seatLabel.className = "seat-label";
  seatLabel.textContent = seat.label;
  card.appendChild(seatLabel);

  if (!girl) {
    const empty = document.createElement("p");
    empty.className = "empty";
    empty.textContent = "Libre";
    card.appendChild(empty);
    return card;
  }

  const img = document.createElement("img");
  img.className = "avatar";
  img.alt = `Foto de ${girl.name}`;
  img.src = girl.photo;
  img.onerror = () => {
    img.src = FALLBACK_AVATAR;
  };

  const name = document.createElement("p");
  name.className = "name";
  name.textContent = girl.name;

  card.appendChild(img);
  card.appendChild(name);
  return card;
}

function handleMotion(event) {
  const acc = event.accelerationIncludingGravity;
  if (!acc) return;

  const threshold = 22;
  const magnitude = Math.abs(acc.x) + Math.abs(acc.y) + Math.abs(acc.z);
  const now = Date.now();

  if (magnitude > threshold && now - lastShakeTime > 1100) {
    lastShakeTime = now;
    randomizeSeats();
  }
}

async function enableMotion() {
  if (motionEnabled || typeof DeviceMotionEvent === "undefined") {
    return;
  }

  try {
    if (typeof DeviceMotionEvent.requestPermission === "function") {
      const response = await DeviceMotionEvent.requestPermission();
      if (response !== "granted") {
        return;
      }
    }

    window.addEventListener("devicemotion", handleMotion);
    motionEnabled = true;
  } catch (_err) {
    // Ignore: some browsers block motion events.
  }
}

randomizeBtn.addEventListener("click", async () => {
  await enableMotion();
  randomizeSeats();
});

randomizeSeats();
